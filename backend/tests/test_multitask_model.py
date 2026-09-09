import io
from pathlib import Path
import unittest
from unittest.mock import AsyncMock, patch

import numpy as np
from PIL import Image

from app.services import material_infer
from app.services.category_infer import resolve_category
from app.utils.clothing_categories import CATEGORY_LABELS


class MultitaskInferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.model_dir = Path(__file__).parents[1] / 'app/models'
        cls.original_ckpt = material_infer.CKPT
        material_infer.CKPT = cls.model_dir / 'best_multitask.pt'
        material_infer.warmup()
        photo = io.BytesIO()
        Image.new('RGB', (480, 640), 'green').save(photo, format='PNG')
        cls.photo = photo.getvalue()

    @classmethod
    def tearDownClass(cls):
        material_infer.CKPT = cls.original_ckpt

    def test_new_checkpoint_returns_material_and_category_in_one_pass(self):
        result = material_infer.predict_bytes(self.photo)
        self.assertEqual(len(result['top5']), 5)
        self.assertEqual(len(result['category_top3']), 3)
        self.assertEqual(result['thresholds'], {'type': 'global', 'value': 0.5})
        self.assertIn(result['category']['category'], CATEGORY_LABELS)
        self.assertTrue(all(np.isfinite(c['prob']) and 0 <= c['prob'] <= 1 for c in result['top5'] + result['category_top3']))
        self.assertTrue(all(c['passed'] == (c['prob'] >= 0.5) for c in result['top5']))

    def test_wrong_checkpoint_metadata_rejected_before_serving_predictions(self):
        with patch.object(material_infer.hashlib, 'sha256') as digest:
            digest.return_value.hexdigest.return_value = 'mismatch'
            with self.assertRaisesRegex(RuntimeError, '체크섬'):
                material_infer.warmup()

    def test_legacy_checkpoint_remains_loadable(self):
        try:
            material_infer.CKPT = self.model_dir / 'best_ml.pt'
            material_infer.warmup()
            result = material_infer.predict_bytes(self.photo)
            self.assertNotIn('category', result)
            self.assertEqual(len(result['top5']), 5)
        finally:
            material_infer.CKPT = self.model_dir / 'best_multitask.pt'
            material_infer.warmup()


class LocalCategoryRoutingTests(unittest.IsolatedAsyncioTestCase):
    async def test_local_result_does_not_call_gemini(self):
        with patch('app.services.category_infer.predict_category', new_callable=AsyncMock) as gemini:
            result = await resolve_category('auto', b'image', {'category': {'name': 'sweater', 'label': '스웨터', 'category': '스웨터', 'group': '상의', 'prob': 0.95}})
        self.assertEqual(result['category'], '스웨터')
        self.assertEqual(result['source'], 'local_model')
        gemini.assert_not_called()

    async def test_manual_category_wins_over_local_prediction(self):
        result = await resolve_category('출근용', b'image', {'category': {'category': '상의'}})
        self.assertEqual(result, {'category': '출근용', 'status': 'manual'})
