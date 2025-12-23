from fastapi import APIRouter

from backend.api.routes import accounts, auth, events, tasks

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
router.include_router(events.router, prefix="/events", tags=["events"])

