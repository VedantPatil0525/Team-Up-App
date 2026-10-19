import json
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Team-Up"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000

    # Supabase PostgreSQL connection string
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # Optional Google OAuth 2.0 Client ID for validating Google Identity tokens
    GOOGLE_CLIENT_ID: Optional[str] = None

    # Optional Gemini API key for AI-assisted triage
    GEMINI_API_KEY: Optional[str] = None

    # CORS origins for frontend communication
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        """
        Ensures Supabase postgresql:// or postgres:// connection strings
        are automatically converted to the postgresql+asyncpg:// dialect.
        """
        if not v:
            return v
        v = v.strip()
        if v.startswith("postgres://"):
            return "postgresql+asyncpg://" + v[len("postgres://"):]
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return "postgresql+asyncpg://" + v[len("postgresql://"):]
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
