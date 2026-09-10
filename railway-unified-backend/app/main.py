from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes.auth import router as auth_router
from app.routes.maintenance import router as maintenance_router
from app.ml.routes import router as ml_router


app = FastAPI(
    title="Railway Block Planning API",
    description=(
        "Unified backend for the Automatic Block Planning system: "
        "MongoDB-backed auth + maintenance requests/blocks (rule-based "
        "priority + compatibility engine), plus the KALM Storm AI/ML "
        "layer (XGBoost risk, Random Forest priority, Isolation Forest "
        "anomaly detection, delay prediction, and OR-Tools schedule "
        "optimization) mounted under /ml."
    ),
    version="1.0"
)

# ==============================
# CORS
# ==============================
# Needed so the Vite frontend (running on a different origin/port, e.g.
# http://localhost:5173) can call this API from the browser. Neither of
# the two original backends had this configured at all, which would have
# silently blocked every request from the frontend with a CORS error.

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(maintenance_router)
app.include_router(ml_router)


@app.get("/")
def home():
    return {
        "message": "Railway Maintenance Planning API is running",
        "modules": {
            "auth": "/auth",
            "maintenance": "/maintenance",
            "ai_ml_or_tools": "/ml"
        },
        "docs": "/docs"
    }
