from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_current_user
from app.Schemas.auth import RegisterRequest, LoginRequest
from app.service.auth_service import login_user, register_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest):


    user = register_user(
        name=data.name,
        email=data.email,
        password=data.password,
        role=data.role,
        department=data.department
    )

    if user is None:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

 
    return user


@router.post("/login")
def login(data: LoginRequest):

    result = login_user(
        email=data.email,
        password=data.password
    )

    if result is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return result

@router.get("/me")
def get_me(current_user=Depends(get_current_user)):

    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "department": current_user.get("department")
    }