from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api import router as api_router
from backend.core.config import get_settings
from backend.core.database import Base, SessionLocal, engine
from backend.utils.paths import ensure_data_dirs
from backend.services.users import ensure_admin
from backend.scheduler import init_scheduler, shutdown_scheduler

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 路由必须在静态文件挂载之前注册，并使用 /api 前缀
app.include_router(api_router, prefix="/api")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


# 静态前端托管（Mode A: 单容器，FastAPI 提供静态文件）
# 必须放在最后，避免覆盖 API 路由
app.mount(
    "/",
    StaticFiles(directory="/web", html=True),
    name="frontend",
)


@app.on_event("startup")
def on_startup() -> None:
    ensure_data_dirs(settings)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        ensure_admin(db)
    init_scheduler()


@app.on_event("shutdown")
def on_shutdown() -> None:
    shutdown_scheduler()

