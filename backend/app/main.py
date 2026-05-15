"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.routers import auth_router, assistant_router, admin_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="OBIA ChatBot — IOAI Bolivia 2026",
    description="Educational AI assistant for the IOAI Bolivia Selection Contest",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials="*" not in origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router.router)
app.include_router(assistant_router.router)
app.include_router(admin_router.router)


@app.get("/health", tags=["health"])
def health_check():
    """Simple health check."""
    return {"status": "ok"}
