from app.routers.auth import router as auth_router
from app.routers.teams import router as teams_router
from app.routers.work_items import router as work_items_router
from app.routers.audit import router as audit_router

__all__ = [
    "auth_router",
    "teams_router",
    "work_items_router",
    "audit_router",
]
