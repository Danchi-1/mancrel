from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "a_very_secret_key"  # In production, load this from env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        case_sensitive = True

settings = Settings()
