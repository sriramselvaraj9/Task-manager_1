from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..controllers.auth_controller import AuthController
from ..limiter import limiter
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_AUTH)
def register(
    request: Request,
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    controller = AuthController(db)
    return controller.register(user_in)


@router.post("/login", response_model=schemas.Token)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and retrieve token.
    Supports standard OAuth2 Form flow or custom JSON payload.
    """
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON body"
            )
    else:
        try:
            form = await request.form()
            username = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid form data"
            )

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )

    controller = AuthController(db)
    return controller.login(username, password)