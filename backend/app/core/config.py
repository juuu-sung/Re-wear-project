import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://DB_USER:DB_PASSWORD@localhost:5432/rewear_db"
    )

settings = Settings()
