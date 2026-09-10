from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URL: str
    DATABASE_NAME: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Comma-separated list of allowed frontend origins for CORS.
    # Defaults cover Vite's default dev port on both localhost and 127.0.0.1.
    CORS_ORIGINS_RAW: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS_RAW.split(",")
            if origin.strip()
        ]


settings = Settings()
