from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
import app.models  # Ensures all models are registered before init_db runs


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure PostgreSQL tables exist
    print(f"[{settings.APP_NAME}] Initializing database tables...")
    try:
        await init_db()
        print(f"[{settings.APP_NAME}] Database initialized successfully.")
        
        # Apply user request: Sync Indian personas and clear all demo work items cleanly
        from app.cleanup_demo_data import sync_indian_personas_and_clear_demo_items
        await sync_indian_personas_and_clear_demo_items()
    except Exception as e:
        print(f"[{settings.APP_NAME}] Database initialization error: {e}")
    yield
    # Shutdown logic (if any)
    print(f"[{settings.APP_NAME}] Shutting down...")


app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="Operational Work Management & Coordination Engine with Optimistic Concurrency Control, Server-Enforced RBAC, and Immutable Audit Trails.",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Domain Routers
from app.routers import auth_router, teams_router, work_items_router, audit_router
app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(work_items_router)
app.include_router(audit_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV
    }


@app.get("/api/v1/health", tags=["Health"])
async def api_health():
    return {
        "status": "healthy",
        "version": "1.0.0"
    }
