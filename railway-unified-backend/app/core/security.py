import bcrypt
import jwt

from datetime import datetime, timedelta, timezone

from app.core.config import settings


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")

    hashed_password = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed_password.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    password_bytes = password.encode("utf-8")
    hashed_password_bytes = hashed_password.encode("utf-8")

    return bcrypt.checkpw(
        password_bytes,
        hashed_password_bytes
    )


def create_access_token(user_id: str) -> str:
    expire_time = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "exp": expire_time
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return token


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM]
    )

    return payload