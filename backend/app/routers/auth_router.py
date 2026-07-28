from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import urllib.request
import json
import secrets

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


@router.post("/google", response_model=schemas.Token)
@limiter.limit(settings.RATE_LIMIT_AUTH)
async def google_auth(
    request: Request,
    auth_data: schemas.GoogleAuth,
    db: Session = Depends(get_db)
):
    """Authenticate or register user via Google OAuth ID token."""
    id_token = auth_data.credential
    if not id_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credential token is required"
        )

    # Verify ID token with Google API tokeninfo endpoint
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "FastAPI-App"})
        with urllib.request.urlopen(req, timeout=10) as response:
            token_info = json.loads(response.read().decode())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google token verification failed: {str(e)}"
        )

    # Validate audience matches our Google Client ID
    aud = token_info.get("aud")
    if aud != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token audience mismatch"
        )

    email = token_info.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address not provided in Google account"
        )

    # Check if user already exists
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Register user with random password
        dummy_password = secrets.token_hex(16)
        from ..auth import get_password_hash
        user = models.User(
            email=email,
            hashed_password=get_password_hash(dummy_password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create access token
    from ..auth import create_access_token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "email": user.email}