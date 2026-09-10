from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    ADMIN = "admin"
    CONTROL_OFFICER = "control_officer"
    DEPARTMENT_USER = "department_user"


class Department(str, Enum):
    ENGINEERING = "Engineering"
    TRACTION = "Traction"
    SIGNAL_TELECOM = "Signal_Telecom"


class User(BaseModel):
    name: str
    email: EmailStr
    passwordHash: str
    role: UserRole
    department: Optional[Department] = None