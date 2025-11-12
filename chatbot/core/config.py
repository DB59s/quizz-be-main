"""
Configuration settings cho toàn bộ hệ thống
"""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Cấu hình chung cho Chatbot RAG System"""

    # Project paths
    PROJECT_ROOT: Path = Path(__file__).parent.parent
    DATA_DIR: Path = PROJECT_ROOT / "data"
    INPUT_DIR: Path = DATA_DIR / "input"
    CHROMADB_DIR: Path = DATA_DIR / "chromadb"

    # Embedding Model
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-large"
    EMBEDDING_DIMENSION: int = 1024
    MAX_TOKENS: int = 512
    AVG_CHARS_PER_TOKEN: int = 4

    # ChromaDB
    COLLECTION_NAME: str = "operating_systems_textbook"

    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_RELOAD: bool = True

    # Query Settings
    DEFAULT_TOP_K: int = 10
    MAX_TOP_K: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Tạo thư mục nếu chưa có
        self.INPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.CHROMADB_DIR.mkdir(parents=True, exist_ok=True)


# Global settings instance
settings = Settings()
