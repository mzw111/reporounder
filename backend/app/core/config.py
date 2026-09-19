from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    # App
    jwt_secret_key: str = "change-me-in-production"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173"

    # MySQL
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "reporounder"
    mysql_password: str = "changeme"
    mysql_db: str = "reporounder"

    # MongoDB
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "reporounder"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    @property
    def mysql_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_db}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
