import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


# User Schemas
class UserCreate(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", v):
            raise ValueError("Invalid email format")
        return v.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


# Task Schemas
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: str = Field("", max_length=500)
    completed: bool = False

    @field_validator("title")
    @classmethod
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError("Title must not be empty or blank space")
        return v.strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v):
        return v.strip()


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    completed: bool
    user_id: int

    class Config:
        from_attributes = True