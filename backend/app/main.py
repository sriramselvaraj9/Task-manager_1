from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from .database import Base, engine
from .config import settings
from .limiter import limiter
from .auth_router import router as auth_router
from .tasks_router import router as tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they do not exist; keep existing data intact across restarts.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Task Manager API",
    description="Secure, production-ready Task Manager backend API",
    version="1.0.0",
    lifespan=lifespan
)

# Connect global rate limiter to the application state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS dynamically from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "frame-ancestors 'none'; "
        "object-src 'none';"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Root status endpoint
@app.get("/")
def root():
    return {
        "message": "Task Manager API is running",
        "status": "healthy"
    }


# Include sub-routers
app.include_router(auth_router)
app.include_router(tasks_router)