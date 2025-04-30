from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# ユーザー作成用スキーマ
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

# ログイン用スキーマ
class UserLogin(BaseModel):
    username: str
    password: str

# トークン用スキーマ
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# ユーザー情報出力用スキーマ
class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# ユーザー情報更新用スキーマ
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8) 