import json
from pathlib import Path
from types import SimpleNamespace
import unittest

from app.services.alert_service import evaluate_single_cloth
from app.utils.clothing_categories import category_group


class ClothingCategoryTests(unittest.TestCase):
    def test_all_model_classes_use_the_requested_korean_labels(self):
        expected = {
            "blouse": "블라우스", "cardigan": "가디건", "coat": "코트",
            "jacket": "재킷", "jumper": "점퍼", "shirt": "셔츠",
            "sweater": "스웨터", "t-shirt": "티셔츠", "vest": "조끼",
            "bottom": "하의", "onepiece(dress)": "원피스",
            "onepiece(jumpsuite)": "점프수트",
        }
        config = Path(__file__).parents[1] / "app/models/multitask_config.json"
        categories = json.loads(config.read_text())["categories"]
        self.assertEqual([c["name"] for c in categories], list(expected))
        for category in categories:
            self.assertEqual(category["label"], expected[category["name"]])
            self.assertEqual(category["category"], expected[category["name"]])

    def test_detailed_categories_keep_existing_laundry_thresholds(self):
        for detailed, group in (("티셔츠", "상의"), ("스웨터", "상의"),
                                ("코트", "아우터"), ("가디건", "아우터"),
                                ("하의", "하의"), ("점프수트", "원피스")):
            with self.subTest(category=detailed):
                cloth = SimpleNamespace(id=1, name="테스트", material="cotton", category=group)
                old = evaluate_single_cloth(cloth, [object()] * 3)
                cloth.category = detailed
                new = evaluate_single_cloth(cloth, [object()] * 3)
                self.assertEqual(new["required"], old["required"])
                self.assertEqual(new["need_wash"], old["need_wash"])
                self.assertEqual(new["category"], detailed)

    def test_existing_and_custom_categories_remain_unchanged(self):
        for category in ("상의", "아우터", "출근용", "기타", "미분류"):
            self.assertEqual(category_group(category), category)
