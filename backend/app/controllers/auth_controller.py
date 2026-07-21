from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth import verify_password, get_password_hash, create_access_token


class AuthController:
    def __init__(self, db: Session):
        self.db = db

    def register(self, user_in: schemas.UserCreate) -> models.User:
        existing_user = self.db.query(models.User).filter(models.User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        new_user = models.User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user

    def login(self, email: str, password: str) -> dict:
        user = self.db.query(models.User).filter(models.User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
