from datetime import datetime, timezone

from app.db.database import db
from app.core.security import hash_password, verify_password, create_access_token


users_collection = db["users"]


def register_user(
    name: str,
    email: str,
    password: str,
    role: str,
    department: str | None = None
):
    # Check whether email already exists
    existing_user = users_collection.find_one({
        "email": email
    })

    if existing_user:
        return None

    # Hash password before storing it
    password_hash = hash_password(password)

    now = datetime.now(timezone.utc)

    user = {
        "name": name,
        "email": email,
        "passwordHash": password_hash,
        "role": role,
        "department": department,
        "createdAt": now,
        "updatedAt": now
    }

    result = users_collection.insert_one(user)

    return {
        "id": str(result.inserted_id),
        "name": name,
        "email": email,
        "role": role,
        "department": department
    }


def login_user(email: str, password: str):
    # Find user by email
    user = users_collection.find_one({
        "email": email
    })

    if not user:
        return None

    # Check password against stored hash
    if not verify_password(password, user["passwordHash"]):
        return None

    # Create JWT
    access_token = create_access_token(
        str(user["_id"])
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "department": user.get("department")
        }
    }