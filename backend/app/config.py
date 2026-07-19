import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/taskdb")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # CORS Origins (comma-separated string in env, parsed as list)
    CORS_ALLOWED_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:5175,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5175,http://127.0.0.1:3000"
        ).split(",")
    ]
    
    # Rate Limits
    RATE_LIMIT_AUTH: str = os.getenv("RATE_LIMIT_AUTH", "5/minute")
    RATE_LIMIT_TASKS: str = os.getenv("RATE_LIMIT_TASKS", "60/minute")

settings = Settings()
