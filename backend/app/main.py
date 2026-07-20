from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import Base, engine, ensure_task_columns
from .limiter import limiter
from .auth_router import router as auth_router
from .tasks_router import router as tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    ensure_task_columns()
    yield


app = FastAPI(
    title="Task Manager API",
    description="Secure, production-ready Task Manager Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# -----------------------------
# Rate Limiter
# -----------------------------
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Security Headers Middleware
# -----------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["Referrer-Policy"] = (
        "strict-origin-when-cross-origin"
    )

    # Don't apply restrictive CSP to Swagger docs
    if request.url.path not in ["/docs", "/redoc", "/openapi.json"]:
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "frame-ancestors 'none'; "
            "object-src 'none';"
        )

    return response


# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Task Manager API is running",
        "status": "healthy",
        "version": "1.0.0"
    }


# -----------------------------
# Routers
# -----------------------------
app.include_router(auth_router)
app.include_router(tasks_router)