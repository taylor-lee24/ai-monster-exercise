import re
from pydantic import BaseModel, EmailStr, Field, field_validator, field_serializer
from typing import Optional
from datetime import datetime


# --- Auth ---
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None

    @field_validator('password')
    @classmethod
    def strong_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[^a-zA-Z0-9]', v):
            raise ValueError('Password must contain at least one symbol')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# --- User ---
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    industry: Optional[str] = None
    experience_level: Optional[str] = None
    pronouns: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    industry: Optional[str] = None
    experience_level: Optional[str] = None
    pronouns: Optional[str] = None
    avatar: Optional[str] = None
    profile_completed: bool
    created_at: datetime

    @field_serializer("created_at")
    def serialize_utc(self, dt: datetime, _info):
        return dt.isoformat() + "Z"

    class Config:
        from_attributes = True


# --- Chat ---
class ChatRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    @field_serializer("created_at")
    def serialize_utc(self, dt: datetime, _info):
        return dt.isoformat() + "Z"

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    reply: str
    messages: list[ChatMessageResponse]
    profile_updated: bool = False
    updated_fields: list[str] = []


# --- Articles & Recommendations ---
class TagResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ArticleResponse(BaseModel):
    id: int
    title: str
    summary: str
    url: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    tags: list[TagResponse]

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    articles: list[ArticleResponse]
    reasoning: str
