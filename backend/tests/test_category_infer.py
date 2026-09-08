import base64
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import tempfile
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import AsyncMock, Mock, patch

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from app.services import category_infer


def photo():
    buffer = io.BytesIO()
    Image.new("RGB", (1200, 600), "green").save(buffer, "PNG")
    return buffer.getvalue()


def response(category="하의", **overrides):
    candidate = {"finishReason": "STOP", "content": {"parts": [{"text": json.dumps({"category": category})}]}}
    candidate.update(overrides)
    return httpx.Response(200, json={"candidates": [candidate]}, request=httpx.Request("POST", "https://example.test"))


class CategoryInferenceTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": "test-model"})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.client_patch = patch.object(category_infer.httpx, "AsyncClient")
        self.client = self.client_patch.start().return_value.__aenter__.return_value
        self.client.post.return_value = response()
        self.addCleanup(self.client_patch.stop)

    async def test_valid_category_and_image_payload(self):
        result = await category_infer.predict_category(photo())
        self.assertEqual(result, {"category": "하의", "status": "ok"})
        payload = self.client.post.call_args.kwargs["json"]
        inline = payload["contents"][0]["parts"][1]["inlineData"]
        self.assertEqual(inline["mimeType"], "image/jpeg")
        with Image.open(io.BytesIO(base64.b64decode(inline["data"]))) as image:
            self.assertEqual(image.size, (1024, 512))
            self.assertEqual(image.format, "JPEG")

    async def test_all_supported_categories(self):
        for category in category_infer.CATEGORIES:
            with self.subTest(category=category):
                self.client.post.return_value = response(category)
                result = await category_infer.predict_category(photo())
                self.assertEqual(result["category"], category)
                self.assertEqual(result["status"], "uncertain" if category == "미분류" else "ok")

    async def test_rejects_invalid_or_incomplete_model_output(self):
        outputs = [response("신발장"), response(category=["상의"]), response(finishReason="MAX_TOKENS"),
                   response(content={"parts": [{"text": "not json"}]}),
                   httpx.Response(200, json={"candidates": []})]
        for output in outputs:
            with self.subTest(output=output):
                self.client.post.return_value = output
                result = await category_infer.predict_category(photo())
                self.assertEqual(result, {"category": "미분류", "status": "unavailable"})

    async def test_timeout_and_http_errors_do_not_block_registration(self):
        for error in (httpx.ReadTimeout("timeout"), httpx.HTTPStatusError("quota", request=Mock(), response=Mock())):
            self.client.post.side_effect = error
            self.assertEqual((await category_infer.predict_category(photo()))["category"], "미분류")

    async def test_missing_key_does_not_send_photo(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            self.assertEqual((await category_infer.predict_category(photo()))["status"], "unavailable")
        self.client.post.assert_not_called()

    async def test_invalid_image_does_not_send_request(self):
        self.assertEqual((await category_infer.predict_category(b"invalid"))["category"], "미분류")
        self.client.post.assert_not_called()

    async def test_manual_and_custom_categories_bypass_ai(self):
        for category in ("상의", "출근용", "미분류"):
            self.assertEqual(await category_infer.resolve_category(category, photo()), {"category": category, "status": "manual"})
        self.client.post.assert_not_called()


class RegistrationTests(unittest.TestCase):
    """실제 등록 라우터와 multipart 요청을 검증; DB/소재 모델/인증은 대역 사용."""
    @classmethod
    def setUpClass(cls):
        def module(name, **attrs):
            value = ModuleType(name)
            value.__dict__.update(attrs)
            return value

        cls.db = Mock()
        cls.db.refresh.side_effect = lambda item: setattr(item, "id", 42)
        stubs = {
            "app.db": module("app.db", get_db=lambda: cls.db),
            "app.models.clothes": module("app.models.clothes", Clothes=SimpleNamespace),
            "app.models.user": module("app.models.user", User=SimpleNamespace),
            "app.routers.auth": module("app.routers.auth", get_current_user=lambda: SimpleNamespace(id=7)),
            "app.services.material_infer": module("app.services.material_infer", predict_bytes=lambda _: {"predicted": ["cotton"], "top5": [{"name": "cotton", "prob": 0.9}]}),
            "app.services.care_instructions": module("app.services.care_instructions", explain=Mock(), GeminiError=RuntimeError, choose_material_hybrid=lambda *a, **k: ("cotton", "")),
        }
        spec = importlib.util.spec_from_file_location("category_test_clothes_router", Path(__file__).parents[1] / "app/routers/clothes.py")
        cls.router = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, stubs):
            spec.loader.exec_module(cls.router)
        cls.temp = tempfile.TemporaryDirectory()
        cls.router.UPLOAD_DIR = cls.temp.name
        cls.app = FastAPI()
        cls.app.include_router(cls.router.router)
        cls.client = TestClient(cls.app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        cls.temp.cleanup()

    def test_registration_saves_and_returns_inferred_category_and_material(self):
        for data in ({"name": "테스트 옷", "category": "auto"}, {"name": "테스트 옷"}):
            with self.subTest(data=data), patch.object(category_infer, "predict_category", AsyncMock(return_value={"category": "원피스", "status": "ok"})):
                result = self.client.post("/clothes/add", data=data, files={"image": ("test.png", photo(), "image/png")})
                self.assertEqual(result.status_code, 200, result.text)
                self.assertEqual(result.json()["category"], "원피스")
                self.assertEqual(result.json()["ai"]["material"], "cotton")
                self.assertEqual(self.db.add.call_args.args[0].category, "원피스")

    def test_unavailable_classifier_still_saves_material_and_unclassified_category(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            result = self.client.post("/clothes/add", data={"name": "테스트", "category": "auto"}, files={"image": ("test.png", photo(), "image/png")})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["category"], "미분류")
        self.assertEqual(result.json()["ai"]["category_status"], "unavailable")
        self.assertEqual(self.db.add.call_args.args[0].material, "cotton")

    def test_registration_uses_multitask_prediction_without_external_category_call(self):
        prediction = {"name": "sweater", "label": "스웨터", "category": "스웨터", "group": "상의", "prob": 0.9}
        inference = {"predicted": ["wool"], "top5": [{"name": "wool", "prob": 0.95}], "category": prediction}
        with patch.object(self.router, "predict_bytes", return_value=inference), patch.object(category_infer, "predict_category", AsyncMock()) as gemini:
            result = self.client.post("/clothes/add", data={"name": "테스트", "category": "auto"}, files={"image": ("test.png", photo(), "image/png")})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["ai"]["category_prediction"], prediction)
        self.assertEqual(result.json()["category"], "스웨터")
        self.assertEqual(self.db.add.call_args.args[0].category, "스웨터")
        gemini.assert_not_called()

    def test_existing_manual_clients_keep_custom_category_without_ai_call(self):
        with patch.object(category_infer, "predict_category", AsyncMock()) as predict:
            result = self.client.post("/clothes/add", data={"name": "테스트", "category": "출근용"}, files={"image": ("test.png", photo(), "image/png")})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["category"], "출근용")
        self.assertEqual(self.db.add.call_args.args[0].category, "출근용")
        predict.assert_not_called()


if __name__ == "__main__":
    unittest.main()
