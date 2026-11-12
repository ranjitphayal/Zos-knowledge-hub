from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://zsyspro:change-me@localhost:5432/zsyspro"
    jwt_secret: str = "development-only-secret-change-before-deploy-000000"
    session_secret: str = "development-only-session-secret-change-before-deploy"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    google_client_id: str | None = None
    google_client_secret: str | None = None
    microsoft_client_id: str | None = None
    microsoft_client_secret: str | None = None
    microsoft_tenant: str = "common"
    smtp_host: str | None = None
    smtp_port: int = Field(default=587, gt=0, le=65535)
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str = "ZSYSPRO HUB"
    smtp_use_ssl: bool = False
    smtp_starttls: bool = True
    allowed_origins: str = "http://localhost:3000"
    jwt_ttl_minutes: int = Field(default=720, gt=0, le=1440)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def email_password_enabled(self) -> bool:
        return all(
            (
                self.smtp_host,
                self.smtp_username,
                self.smtp_password,
                self.smtp_from_email,
            )
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
