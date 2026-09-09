"""Credentials must be explicit; configuration errors must not expose values."""
import os
import unittest
from unittest.mock import patch

from app.core.config import Settings


class SecurityConfigTests(unittest.TestCase):
    def config(self, env):
        with patch.dict(os.environ, env, clear=True):
            return Settings()

    def test_missing_database_url_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "DATABASE_URL must be set"):
            self.config({"SECRET_KEY": "x" * 48})

    def test_missing_secret_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "SECRET_KEY must be set"):
            self.config({"DATABASE_URL": "sqlite://"})

    def test_blank_values_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "DATABASE_URL must be set"):
            self.config({"DATABASE_URL": "  ", "SECRET_KEY": "x" * 48})

    def test_weak_secret_rejected_without_echo(self):
        for key in ["dev_secret", "short-test-value"]:
            with self.subTest(key=key):
                with self.assertRaises(RuntimeError) as error:
                    self.config({"DATABASE_URL": "sqlite://", "SECRET_KEY": key})
                self.assertNotIn(key, str(error.exception))

    def test_explicit_settings_preserved(self):
        settings = self.config({"DATABASE_URL": "sqlite://", "SECRET_KEY": "x" * 48})
        self.assertEqual(settings.DATABASE_URL, "sqlite://")
        self.assertEqual(settings.SECRET_KEY, "x" * 48)
