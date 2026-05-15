"""
core/config.py
==============
Configuration for the Mancrel Backend.
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Mancrel API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # DB
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./mancrel.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-development-only-change-in-prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # OpenRouter
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "qwen/qwen3-8b:free")

settings = Settings()
