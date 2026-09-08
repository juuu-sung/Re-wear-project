"""실제 ORM과 외래키가 켜진 격리 DB에서 삭제 API를 검증한다."""
import importlib.util
from datetime import date
from pathlib import Path
import sys
import tempfile
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db import Base
from app.models import User, Clothes, LaundryBasket, ClothingActivity, Event


class ClothesDeleteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        def module(name, **attrs):
            value = ModuleType(name)
            value.__dict__.update(attrs)
            return value

        # 모델/외부 API와 인증만 대체. 삭제 라우터와 ORM은 실제 코드이다.
        stubs = {
            'app.routers.auth': module('app.routers.auth', get_current_user=lambda: SimpleNamespace(id=1)),
            'app.services.material_infer': module('app.services.material_infer', predict_bytes=Mock()),
            'app.services.care_instructions': module('app.services.care_instructions', explain=Mock(), GeminiError=RuntimeError, choose_material_hybrid=Mock()),
        }
        spec = importlib.util.spec_from_file_location('delete_test_clothes_router', Path(__file__).parents[1] / 'app/routers/clothes.py')
        cls.router = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, stubs):
            spec.loader.exec_module(cls.router)

    def setUp(self):
        self.engine = create_engine('sqlite://', poolclass=StaticPool, connect_args={'check_same_thread': False})
        @event.listens_for(self.engine, 'connect')
        def foreign_keys(connection, _):
            connection.execute('PRAGMA foreign_keys=ON')
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.db.add_all([User(id=1), User(id=2)])
        self.db.flush()
        for item_id, owner in [(1, 1), (2, 2)]:
            self.db.add(Clothes(id=item_id, user_id=owner, name='test', category='상의', image_path=f'{item_id}.jpg'))
        self.db.flush()
        for item_id, owner in [(1, 1), (2, 2)]:
            self.db.add_all([
                LaundryBasket(user_id=owner, clothes_id=item_id),
                ClothingActivity(user_id=owner, clothes_id=item_id, activity_type='WEAR', activity_date=date(2026, 9, 9)),
                ClothingActivity(user_id=owner, clothes_id=item_id, activity_type='LAUNDRY', activity_date=date(2026, 9, 9)),
                Event(user_id=owner, garment_id=item_id, type='WEAR', date=date(2026, 9, 9)),
            ])
        self.db.commit()
        self.db.expunge_all()  # 미리 로드하지 않은 관계에서도 cascade 동작 필요
        self.temp = tempfile.TemporaryDirectory()
        self.router.UPLOAD_DIR = self.temp.name
        self.photo = Path(self.temp.name) / '1.jpg'
        self.photo.write_bytes(b'test image')
        self.app = FastAPI()
        self.app.include_router(self.router.router)
        self.app.dependency_overrides[self.router.get_db] = lambda: self.db
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.db.close()
        self.engine.dispose()
        self.temp.cleanup()

    def test_deletes_linked_records_and_photo_only_for_target_clothing(self):
        result = self.client.delete('/clothes/1')
        self.assertEqual(result.status_code, 200, result.text)
        self.assertIsNone(self.db.get(Clothes, 1))
        self.assertEqual(self.db.query(LaundryBasket).filter_by(clothes_id=1).count(), 0)
        self.assertEqual(self.db.query(ClothingActivity).filter_by(clothes_id=1).count(), 0)
        self.assertEqual(self.db.query(Event).filter_by(garment_id=1).count(), 0)
        self.assertFalse(self.photo.exists())
        self.assertIsNotNone(self.db.get(Clothes, 2))
        self.assertEqual(self.db.query(LaundryBasket).filter_by(clothes_id=2).count(), 1)
        self.assertEqual(self.db.query(ClothingActivity).filter_by(clothes_id=2).count(), 2)
        self.assertEqual(self.db.query(Event).filter_by(garment_id=2).count(), 1)
        self.assertEqual(self.db.query(User).count(), 2)

    def test_foreign_key_failure_rolls_back_related_records_and_preserves_photo(self):
        # 향후 다른 참조가 추가되어 커밋이 실제로 실패하는 경우도 파일을 보존한다.
        self.db.execute(text('CREATE TABLE protected_clothes (clothes_id INTEGER REFERENCES clothes(id))'))
        self.db.execute(text('INSERT INTO protected_clothes VALUES (1)'))
        self.db.commit()
        result = self.client.delete('/clothes/1')
        self.assertEqual(result.status_code, 500)
        self.assertIsInstance(result.json()['detail'], str)
        self.assertIsNotNone(self.db.get(Clothes, 1))
        self.assertEqual(self.db.query(LaundryBasket).filter_by(clothes_id=1).count(), 1)
        self.assertEqual(self.db.query(ClothingActivity).filter_by(clothes_id=1).count(), 2)
        self.assertEqual(self.db.query(Event).filter_by(garment_id=1).count(), 1)
        self.assertTrue(self.photo.exists())

    def test_other_users_clothing_cannot_be_deleted(self):
        self.assertEqual(self.client.delete('/clothes/2').status_code, 404)
        self.assertIsNotNone(self.db.get(Clothes, 2))
        self.assertEqual(self.db.query(LaundryBasket).count(), 2)

    def test_missing_photo_does_not_prevent_deletion(self):
        self.photo.unlink()
        self.assertEqual(self.client.delete('/clothes/1').status_code, 200)
        self.assertIsNone(self.db.get(Clothes, 1))

    def test_shared_photo_is_not_deleted(self):
        self.db.get(Clothes, 2).image_path = '1.jpg'
        self.db.commit()
        self.assertEqual(self.client.delete('/clothes/1').status_code, 200)
        self.assertTrue(self.photo.exists())

    def test_cleanup_failure_does_not_report_committed_delete_as_failure(self):
        with patch.object(self.router.os, 'remove', side_effect=PermissionError('test')):
            result = self.client.delete('/clothes/1')
        self.assertEqual(result.status_code, 200, result.text)
        self.assertIsNone(self.db.get(Clothes, 1))

    def test_repeated_delete_is_not_found(self):
        self.assertEqual(self.client.delete('/clothes/1').status_code, 200)
        self.assertEqual(self.client.delete('/clothes/1').status_code, 404)
