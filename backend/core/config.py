from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Optional

try:
    from pydantic.v1 import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "tg-signer-panel"
    host: str = "0.0.0.0"
    port: int = 3000

    secret_key: str = "change-me"
    access_token_expire_hours: int = 12

    data_dir: Path = Path("/data")
    db_path: Optional[Path] = None
    signer_workdir: Optional[Path] = None
    session_dir: Optional[Path] = None
    logs_dir: Optional[Path] = None

    class Config:
        env_file = ".env"
        env_prefix = "APP_"
        case_sensitive = False

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.resolve_db_path()}?check_same_thread=False"

    def resolve_db_path(self) -> Path:
        return self.db_path or self.data_dir / "db.sqlite"

    def resolve_workdir(self) -> Path:
        return self.signer_workdir or self.data_dir / ".signer"

    def resolve_session_dir(self) -> Path:
        return self.session_dir or self.data_dir / "sessions"

    def resolve_logs_dir(self) -> Path:
        return self.logs_dir or self.data_dir / "logs"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

