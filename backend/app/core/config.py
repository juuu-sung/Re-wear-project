import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://rewear:rewear_pass@localhost:5432/rewear_db"
    )

settings = Settings()
