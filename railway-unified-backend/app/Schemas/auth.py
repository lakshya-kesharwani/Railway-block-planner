from pydantic import BaseModel, EmailStr

from app.models.user import UserRole, Department


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    department: Department | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    department: Department | None = None