from datetime import datetime

from pydantic import BaseModel, Field
from typing import Literal
from app.models.user import Department


class MaintenanceRequestCreate(BaseModel):
    department: Department
    assetId: str
    description: str
    urgency: Literal["low", "medium", "high","urgent"]
    estimatedDuration: int = Field(gt=0)
    deadline: datetime | None = None