import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    APP_NAME: str = "AICTE Veritas"
    APP_VERSION: str = "1.0.0-stage1"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./data/veritas.db"

    # Document Storage
    STORAGE_DIR: str = "./data/storage"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/png",
        "image/jpeg",
    ]
    ALLOWED_EXTENSIONS: List[str] = [
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
    ]

    # Demonstration Mode
    DEMO_MODE: bool = True

settings = Settings()

# Ensure directories exist
BASE_DIR = Path(__file__).resolve().parent.parent.parent
data_path = BASE_DIR / "data"
storage_path = BASE_DIR / settings.STORAGE_DIR.replace("./", "")
data_path.mkdir(parents=True, exist_ok=True)
storage_path.mkdir(parents=True, exist_ok=True)
