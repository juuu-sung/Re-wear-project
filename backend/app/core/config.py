"""Load server credentials from the environment, without runnable defaults."""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value or not value.strip():
        raise RuntimeError(f"{name} must be set in the backend environment")
    return value


class Settings:
    def __init__(self):
        self.DATABASE_URL = required_env("DATABASE_URL")
        self.SECRET_KEY = required_env("SECRET_KEY")
        if len(self.SECRET_KEY) < 32 or self.SECRET_KEY.lower() in {
            "dev_secret", "change_me", "replace_with_a_random_secret_key",
        }:
            raise RuntimeError("SECRET_KEY must be a unique random secret of at least 32 characters")


settings = Settings()
