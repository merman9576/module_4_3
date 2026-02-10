from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    """회원가입 요청 스키마"""
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)

class UserLogin(BaseModel):
    """로그인 요청 스키마"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """사용자 정보 응답 스키마 (비밀번호 제외)"""
    id: int
    email: str
    username: str
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}
