from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field
import pandas as pd
import joblib
from app.ml.optimizer.scheduler import generate_schedule

# ==============================
# KALM STORM ML + OR-Tools router
# ==============================
# Mounted under /ml in app/main.py. This module was originally a
# standalone FastAPI app (Kalm Storm project) - converted to an
# APIRouter so it can be merged into the main railway backend
# alongside auth + maintenance.

router = APIRouter(
    prefix="/ml",
    tags=["AI / ML / OR-Tools"]
)


# ==============================
# Load trained models
# ==============================

BASE_DIR = Path(__file__).resolve().parent
risk_model = joblib.load(BASE_DIR / "xgboost_risk_model.pkl")
priority_model = joblib.load(BASE_DIR / "random_forest_priority_model.pkl")
anomaly_model = joblib.load(BASE_DIR / "isolation_forest_model.pkl")
delay_model = joblib.load(BASE_DIR / "delay_prediction_model.pkl")


# ==============================
# Input data structure
# ==============================

class RiskInput(BaseModel):
    asset_age_years: float
    recent_defects: float
    historical_failures: float
    maintenance_overdue_days: float
    days_since_last_maintenance: float
    traffic_intensity: float
    asset_criticality: float
    failure_frequency: float
    maintenance_frequency: float
    load_factor: float
    environmental_risk: float
    weather_risk: float
    anomaly_score: float


class PriorityInput(BaseModel):
    risk_score: float
    asset_criticality: float
    recent_defects: float
    historical_failures: float
    maintenance_overdue_days: float
    days_since_last_maintenance: float
    traffic_intensity: float
    failure_frequency: float
    load_factor: float
    environmental_risk: float
    weather_risk: float
    anomaly_score: float

class MaintenanceAnalysisInput(BaseModel):
    asset_age_years: float
    recent_defects: float
    historical_failures: float
    maintenance_overdue_days: float
    days_since_last_maintenance: float
    traffic_intensity: float
    asset_criticality: float
    failure_frequency: float
    maintenance_frequency: float
    load_factor: float
    environmental_risk: float
    weather_risk: float

    maintenance_duration_min: float
    affected_trains: float
    congestion_level: float

class AnomalyInput(BaseModel):
    asset_age_years: float
    recent_defects: float
    historical_failures: float
    maintenance_overdue_days: float
    days_since_last_maintenance: float
    traffic_intensity: float
    asset_criticality: float
    failure_frequency: float
    maintenance_frequency: float
    load_factor: float
    environmental_risk: float
    weather_risk: float


class DelayInput(BaseModel):
    maintenance_duration_min: float
    affected_trains: float
    congestion_level: float
    traffic_intensity: float
    load_factor: float
    weather_risk: float

class ScheduleTask(BaseModel):
    id: str
    asset_id: str
    department: str
    section_id: str 

    # ML input features
    asset_age_years: float = 0.0
    recent_defects: float = 0.0
    historical_failures: float = 0.0
    maintenance_overdue_days: float = 0.0
    days_since_last_maintenance: float = 0.0
    traffic_intensity: float = 0.0
    asset_criticality: float = 0.0
    failure_frequency: float = 0.0
    maintenance_frequency: float = 0.0
    load_factor: float = 0.0
    environmental_risk: float = 0.0
    weather_risk: float = 0.0

    # Delay prediction inputs
    maintenance_duration_min: float = 60.0
    affected_trains: float = 0.0
    congestion_level: float = 0.0




class TrainSchedule(BaseModel):
    train_id: str
    section_id: str
    start_minute: int
    end_minute: int


class TimetableScheduleInput(BaseModel):
    tasks: list[ScheduleTask]
    trains: list[TrainSchedule] = Field(default_factory=list)

def time_overlap(start1, end1, start2, end2):
    return start1 < end2 and start2 < end1
class WhatIfScheduleInput(BaseModel):
    tasks: list[ScheduleTask]
    trains: list[TrainSchedule]
    unavailable_blocks: list[str] = []
class StormIncidentInput(BaseModel):
    incident_type: str
    section_id: str
    tasks: list[ScheduleTask]
    trains: list[TrainSchedule]
    previous_schedule: list[dict] = []


@router.post("/predict-delay")
def predict_delay(data: DelayInput):
    input_data = pd.DataFrame([{
        "maintenance_duration_min": data.maintenance_duration_min,
        "affected_trains": data.affected_trains,
        "congestion_level": data.congestion_level,
        "traffic_intensity": data.traffic_intensity,
        "load_factor": data.load_factor,
        "weather_risk": data.weather_risk
    }])

    predicted_delay = max(0.0, float(delay_model.predict(input_data)[0]))

    return {
        "system": "KALM STORM",
        "prediction": {
            "expected_delay_minutes": round(predicted_delay, 2)
        }
    }

# ==============================
# Home endpoint
# ==============================

# ==============================
# Risk Prediction
# ==============================

@router.post("/predict-risk")
def predict_risk(data: RiskInput):
    input_data = pd.DataFrame([{
        "asset_age_years": data.asset_age_years,
        "recent_defects": data.recent_defects,
        "historical_failures": data.historical_failures,
        "maintenance_overdue_days": data.maintenance_overdue_days,
        "days_since_last_maintenance": data.days_since_last_maintenance,
        "traffic_intensity": data.traffic_intensity,
        "asset_criticality": data.asset_criticality,
        "failure_frequency": data.failure_frequency,
        "maintenance_frequency": data.maintenance_frequency,
        "load_factor": data.load_factor,
        "environmental_risk": data.environmental_risk,
        "weather_risk": data.weather_risk,
        "anomaly_score": data.anomaly_score
    }])

    risk_score = float(risk_model.predict(input_data)[0])
    risk_score = max(0.0, min(1.0, risk_score))
    risk_percentage = round(risk_score * 100, 2)

    if risk_score <= 0.30:
        risk_level = "LOW"
    elif risk_score <= 0.55:
        risk_level = "MEDIUM"
    elif risk_score <= 0.75:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    return {
        "risk_score": round(risk_score, 4),
        "risk_percentage": risk_percentage,
        "risk_level": risk_level
    }


@router.post("/predict-priority")
def predict_priority(data: PriorityInput):
    input_data = pd.DataFrame([{
        "risk_score": data.risk_score,
        "asset_criticality": data.asset_criticality,
        "recent_defects": data.recent_defects,
        "historical_failures": data.historical_failures,
        "maintenance_overdue_days": data.maintenance_overdue_days,
        "days_since_last_maintenance": data.days_since_last_maintenance,
        "traffic_intensity": data.traffic_intensity,
        "failure_frequency": data.failure_frequency,
        "load_factor": data.load_factor,
        "environmental_risk": data.environmental_risk,
        "weather_risk": data.weather_risk,
        "anomaly_score": data.anomaly_score
    }])

    priority_number = int(priority_model.predict(input_data)[0])
    priority_mapping = {
        0: "LOW",
        1: "MEDIUM",
        2: "HIGH",
        3: "CRITICAL"
    }
    priority = priority_mapping.get(priority_number, "UNKNOWN")

    return {
        "priority": priority,
        "priority_code": priority_number
    }




@router.post("/analyze-maintenance")
def analyze_maintenance(data: MaintenanceAnalysisInput):

    # ==========================================
    # 1. ISOLATION FOREST - ANOMALY DETECTION
    # ==========================================

    anomaly_input = pd.DataFrame([{
        "asset_age_years": data.asset_age_years,
        "recent_defects": data.recent_defects,
        "historical_failures": data.historical_failures,
        "maintenance_overdue_days": data.maintenance_overdue_days,
        "days_since_last_maintenance": data.days_since_last_maintenance,
        "traffic_intensity": data.traffic_intensity,
        "asset_criticality": data.asset_criticality,
        "failure_frequency": data.failure_frequency,
        "maintenance_frequency": data.maintenance_frequency,
        "load_factor": data.load_factor,
        "environmental_risk": data.environmental_risk,
        "weather_risk": data.weather_risk
    }])

    anomaly_prediction = anomaly_model.predict(anomaly_input)[0]
    decision_score = anomaly_model.decision_function(anomaly_input)[0]

    anomaly_score = max(
        0.0,
        min(1.0, 0.5 - float(decision_score))
    )

    if anomaly_prediction == -1:
        anomaly_status = "ANOMALY DETECTED"
    else:
        anomaly_status = "NORMAL"


    # ==========================================
    # 2. XGBOOST - RISK PREDICTION
    # ==========================================

    risk_input = pd.DataFrame([{
        "asset_age_years": data.asset_age_years,
        "recent_defects": data.recent_defects,
        "historical_failures": data.historical_failures,
        "maintenance_overdue_days": data.maintenance_overdue_days,
        "days_since_last_maintenance": data.days_since_last_maintenance,
        "traffic_intensity": data.traffic_intensity,
        "asset_criticality": data.asset_criticality,
        "failure_frequency": data.failure_frequency,
        "maintenance_frequency": data.maintenance_frequency,
        "load_factor": data.load_factor,
        "environmental_risk": data.environmental_risk,
        "weather_risk": data.weather_risk,
        "anomaly_score": anomaly_score
    }])

    risk_score = float(risk_model.predict(risk_input)[0])

    risk_score = max(0.0, min(1.0, risk_score))

    risk_percentage = round(risk_score * 100, 2)

    if risk_score <= 0.30:
        risk_level = "LOW"
    elif risk_score <= 0.55:
        risk_level = "MEDIUM"
    elif risk_score <= 0.75:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"


    # ==========================================
    # 3. RANDOM FOREST - PRIORITY PREDICTION
    # ==========================================

    priority_input = pd.DataFrame([{
        "risk_score": risk_score,
        "asset_criticality": data.asset_criticality,
        "recent_defects": data.recent_defects,
        "historical_failures": data.historical_failures,
        "maintenance_overdue_days": data.maintenance_overdue_days,
        "days_since_last_maintenance": data.days_since_last_maintenance,
        "traffic_intensity": data.traffic_intensity,
        "failure_frequency": data.failure_frequency,
        "load_factor": data.load_factor,
        "environmental_risk": data.environmental_risk,
        "weather_risk": data.weather_risk,
        "anomaly_score": anomaly_score
    }])

    priority_number = int(
        priority_model.predict(priority_input)[0]
    )

    priority_mapping = {
        0: "LOW",
        1: "MEDIUM",
        2: "HIGH",
        3: "CRITICAL"
    }

    priority = priority_mapping.get(
        priority_number,
        "UNKNOWN"
    )


    # ==========================================
    # 4. DELAY PREDICTION
    # ==========================================

    delay_input = pd.DataFrame([{
        "maintenance_duration_min": data.maintenance_duration_min,
        "affected_trains": data.affected_trains,
        "congestion_level": data.congestion_level,
        "traffic_intensity": data.traffic_intensity,
        "load_factor": data.load_factor,
        "weather_risk": data.weather_risk
    }])

    predicted_delay = float(
        delay_model.predict(delay_input)[0]
    )

    predicted_delay = max(0.0, predicted_delay)


    # ==========================================
    # FINAL RESPONSE
    # ==========================================

    return {
        "system": "KALM STORM",

        "analysis": {

            "anomaly": {
                "status": anomaly_status,
                "is_anomaly": bool(anomaly_prediction == -1),
                "anomaly_score": round(anomaly_score, 4)
            },

            "risk": {
                "risk_score": round(risk_score, 4),
                "risk_percentage": risk_percentage,
                "risk_level": risk_level
            },

            "priority": {
                "priority": priority,
                "priority_code": priority_number
            },

            "delay": {
                "expected_delay_minutes": round(
                    predicted_delay, 2
                )
            }
        }
    }


@router.post("/generate-schedule")
def generate_schedule_endpoint(data: TimetableScheduleInput):

    tasks_for_optimizer = []

    # =========================================================
    # ANALYZE EACH MAINTENANCE REQUEST
    # =========================================================

    for task in data.tasks:

        # -----------------------------------------------------
        # 1. ISOLATION FOREST - ANOMALY DETECTION
        # -----------------------------------------------------

        anomaly_input = pd.DataFrame([{
            "asset_age_years": task.asset_age_years,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "asset_criticality": task.asset_criticality,
            "failure_frequency": task.failure_frequency,
            "maintenance_frequency": task.maintenance_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk
        }])

        anomaly_prediction = anomaly_model.predict(
            anomaly_input
        )[0]

        decision_score = anomaly_model.decision_function(
            anomaly_input
        )[0]

        anomaly_score = max(
            0.0,
            min(1.0, 0.5 - float(decision_score))
        )

        # -----------------------------------------------------
        # 2. XGBOOST - RISK PREDICTION
        # -----------------------------------------------------

        risk_input = pd.DataFrame([{
            "asset_age_years": task.asset_age_years,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "asset_criticality": task.asset_criticality,
            "failure_frequency": task.failure_frequency,
            "maintenance_frequency": task.maintenance_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk,
            "anomaly_score": anomaly_score
        }])

        risk_score = float(
            risk_model.predict(risk_input)[0]
        )

        risk_score = max(
            0.0,
            min(1.0, risk_score)
        )

        # -----------------------------------------------------
        # 3. RANDOM FOREST - PRIORITY PREDICTION
        # -----------------------------------------------------

        priority_input = pd.DataFrame([{
            "risk_score": risk_score,
            "asset_criticality": task.asset_criticality,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "failure_frequency": task.failure_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk,
            "anomaly_score": anomaly_score
        }])

        priority_number = int(
            priority_model.predict(priority_input)[0]
        )

        # -----------------------------------------------------
        # 4. DELAY PREDICTION
        # -----------------------------------------------------

        delay_input = pd.DataFrame([{
            "maintenance_duration_min": task.maintenance_duration_min,
            "affected_trains": task.affected_trains,
            "congestion_level": task.congestion_level,
            "traffic_intensity": task.traffic_intensity,
            "load_factor": task.load_factor,
            "weather_risk": task.weather_risk
        }])

        predicted_delay = float(
            delay_model.predict(delay_input)[0]
        )

        predicted_delay = max(0.0, predicted_delay)

        # -----------------------------------------------------
        # SEND ML RESULTS TO OR-TOOLS
        # -----------------------------------------------------

        tasks_for_optimizer.append({
            "id": task.id,
            "asset_id": task.asset_id,
            "department": task.department,
            "section_id": task.section_id,
            "priority": priority_number,
            "risk": risk_score,
            "duration": task.maintenance_duration_min,
            "expected_delay": predicted_delay
        })

    # =========================================================
    # AVAILABLE BLOCKS
    # =========================================================

    blocks = [
        {
            "id": "B1",
            "start": "09:00",
            "end": "11:00",
            "start_minute": 540,
            "end_minute": 660,
            "capacity": 120
        },
        {
            "id": "B2",
            "start": "12:00",
            "end": "14:00",
            "start_minute": 720,
            "end_minute": 840,
            "capacity": 120
        },
        {
            "id": "B3",
            "start": "15:00",
            "end": "17:00",
            "start_minute": 900,
            "end_minute": 1020,
            "capacity": 120
        }
    ]

    # =========================================================
    # ATTACH TRAIN TIMETABLE CONFLICTS TO BLOCKS
    # =========================================================

    for block in blocks:
        block["trains"] = []

        for train in data.trains:
            if time_overlap(
                block["start_minute"],
                block["end_minute"],
                train.start_minute,
                train.end_minute
            ):
                block["trains"].append({
                    "train_id": train.train_id,
                    "section_id": train.section_id,
                    "start_minute": train.start_minute,
                    "end_minute": train.end_minute
                })

    # =========================================================
    # RUN OR-TOOLS OPTIMIZER
    # =========================================================

    schedule = generate_schedule(tasks_for_optimizer, blocks)

    return {
        "system": "KALM STORM",
        "message": "AI-powered maintenance schedule generated",
        "predictions": tasks_for_optimizer,
        "schedule": schedule
    }


@router.post("/what-if")
def what_if_schedule(data: WhatIfScheduleInput):

    # ==========================================
    # CREATE BLOCKS
    # ==========================================

    blocks = [
        {
            "id": "B1",
            "start": "09:00",
            "end": "11:00",
            "start_minute": 540,
            "end_minute": 660,
            "capacity": 120
        },
        {
            "id": "B2",
            "start": "12:00",
            "end": "14:00",
            "start_minute": 720,
            "end_minute": 840,
            "capacity": 120
        },
        {
            "id": "B3",
            "start": "15:00",
            "end": "17:00",
            "start_minute": 900,
            "end_minute": 1020,
            "capacity": 120
        }
    ]

    # ==========================================
    # REMOVE UNAVAILABLE BLOCKS
    # ==========================================

    blocks = [
        block
        for block in blocks
        if block["id"] not in data.unavailable_blocks
    ]

    # ==========================================
    # ADD TRAIN INFORMATION
    # ==========================================

    for block in blocks:

        block["trains"] = []

        for train in data.trains:

            if time_overlap(
                block["start_minute"],
                block["end_minute"],
                train.start_minute,
                train.end_minute
            ):

                block["trains"].append({
                    "train_id": train.train_id,
                    "section_id": train.section_id,
                    "start_minute": train.start_minute,
                    "end_minute": train.end_minute
                })

    # ==========================================
    # PREPARE TASKS FOR OPTIMIZER
    # ==========================================

    tasks_for_optimizer = []

    predictions = []

    for task in data.tasks:

        # -----------------------------
        # ANOMALY
        # -----------------------------

        anomaly_features = pd.DataFrame([{
            "asset_age_years": task.asset_age_years,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "asset_criticality": task.asset_criticality,
            "failure_frequency": task.failure_frequency,
            "maintenance_frequency": task.maintenance_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk
        }])

        anomaly_prediction = anomaly_model.predict(anomaly_features)[0]
        anomaly_decision = anomaly_model.decision_function(
            anomaly_features
        )[0]

        anomaly_score = max(
            0,
            min(1, 0.5 - anomaly_decision)
        )

        # -----------------------------
        # RISK
        # -----------------------------

        risk_features = pd.DataFrame([{
            "asset_age_years": task.asset_age_years,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "asset_criticality": task.asset_criticality,
            "failure_frequency": task.failure_frequency,
            "maintenance_frequency": task.maintenance_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk,
            "anomaly_score": anomaly_score
        }])

        risk_score = float(
            risk_model.predict(risk_features)[0]
        )

        risk_score = max(
            0,
            min(1, risk_score)
        )

        # -----------------------------
        # PRIORITY
        # -----------------------------

        priority_features = pd.DataFrame([{
            "risk_score": risk_score,
            "asset_criticality": task.asset_criticality,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "failure_frequency": task.failure_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk,
            "anomaly_score": anomaly_score
        }])

        priority_prediction = priority_model.predict(
            priority_features
        )[0]

        priority_number = int(priority_prediction)

        # -----------------------------
        # DELAY
        # -----------------------------

        delay_features = pd.DataFrame([{
            "maintenance_duration_min":
                task.maintenance_duration_min,
            "affected_trains":
                task.affected_trains,
            "congestion_level":
                task.congestion_level,
            "traffic_intensity":
                task.traffic_intensity,
            "load_factor":
                task.load_factor,
            "weather_risk":
                task.weather_risk
        }])

        predicted_delay = float(
            delay_model.predict(delay_features)[0]
        )

        # -----------------------------
        # STORE PREDICTION
        # -----------------------------

        predictions.append({
            "id": task.id,
            "asset_id": task.asset_id,
            "department": task.department,
            "section_id": task.section_id,
            "priority": priority_number,
            "risk": risk_score,
            "duration": task.maintenance_duration_min,
            "expected_delay": predicted_delay
        })

        # -----------------------------
        # SEND TO OR-TOOLS
        # -----------------------------

        tasks_for_optimizer.append({
            "id": task.id,
            "asset_id": task.asset_id,
            "department": task.department,
            "section_id": task.section_id,
            "priority": priority_number,
            "risk": risk_score,
            "duration": task.maintenance_duration_min,
            "expected_delay": predicted_delay
        })

    # ==========================================
    # GENERATE WHAT-IF SCHEDULE
    # ==========================================

    schedule = generate_schedule(
        tasks_for_optimizer,
        blocks
    )

    # ==========================================
    # RESPONSE
    # ==========================================

    return {
        "system": "KALM STORM",
        "mode": "WHAT-IF SIMULATION",
        "unavailable_blocks": data.unavailable_blocks,
        "message": "Alternative maintenance schedule generated",
        "predictions": predictions,
        "schedule": schedule
    }
@router.post("/storm-mode")
def storm_mode(data: StormIncidentInput):

    # -----------------------------------------
    # 1. Define available maintenance blocks
    # -----------------------------------------
    blocks = [
        {
            "id": "B1",
            "start": "09:00",
            "end": "11:00",
            "start_minute": 540,
            "end_minute": 660,
            "capacity": 120
        },
        {
            "id": "B2",
            "start": "12:00",
            "end": "14:00",
            "start_minute": 720,
            "end_minute": 840,
            "capacity": 120
        },
        {
            "id": "B3",
            "start": "15:00",
            "end": "17:00",
            "start_minute": 900,
            "end_minute": 1020,
            "capacity": 120
        }
    ]

    # -----------------------------------------
    # 2. Identify affected trains
    # -----------------------------------------
    affected_trains = []

    for train in data.trains:

        if train.section_id == data.section_id:

            affected_trains.append({
                "train_id": train.train_id,
                "section_id": train.section_id,
                "start_minute": train.start_minute,
                "end_minute": train.end_minute
            })

    # -----------------------------------------
    # 3. Identify affected maintenance tasks
    # -----------------------------------------
    affected_tasks = []

    for task in data.tasks:

        if task.section_id == data.section_id:

            affected_tasks.append({
                "task_id": task.id,
                "asset_id": task.asset_id,
                "department": task.department,
                "section_id": task.section_id
            })

    # -----------------------------------------
    # 4. Add train conflicts to blocks
    # -----------------------------------------
    for block in blocks:

        block["trains"] = []

        for train in data.trains:

            if time_overlap(
                block["start_minute"],
                block["end_minute"],
                train.start_minute,
                train.end_minute
            ):

                block["trains"].append({
                    "train_id": train.train_id,
                    "section_id": train.section_id,
                    "start_minute": train.start_minute,
                    "end_minute": train.end_minute
                })

    # -----------------------------------------
    # 5. Run AI predictions
    # -----------------------------------------
    predictions = []
    tasks_for_optimizer = []

    for task in data.tasks:

        # Isolation Forest
        anomaly_input = pd.DataFrame([{
            "asset_age_years": task.asset_age_years,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "asset_criticality": task.asset_criticality,
            "failure_frequency": task.failure_frequency,
            "maintenance_frequency": task.maintenance_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk
        }])

        anomaly_decision = anomaly_model.decision_function(
            anomaly_input
        )[0]

        anomaly_score = max(
            0,
            min(1, 0.5 - float(anomaly_decision))
        )

        # XGBoost Risk
        risk_input = pd.DataFrame([{
            "asset_age_years": task.asset_age_years,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "asset_criticality": task.asset_criticality,
            "failure_frequency": task.failure_frequency,
            "maintenance_frequency": task.maintenance_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk,
            "anomaly_score": anomaly_score
        }])

        risk_score = float(
            risk_model.predict(risk_input)[0]
        )

        risk_score = max(
            0,
            min(1, risk_score)
        )

        # Random Forest Priority
        priority_input = pd.DataFrame([{
            "risk_score": risk_score,
            "asset_criticality": task.asset_criticality,
            "recent_defects": task.recent_defects,
            "historical_failures": task.historical_failures,
            "maintenance_overdue_days": task.maintenance_overdue_days,
            "days_since_last_maintenance": task.days_since_last_maintenance,
            "traffic_intensity": task.traffic_intensity,
            "failure_frequency": task.failure_frequency,
            "load_factor": task.load_factor,
            "environmental_risk": task.environmental_risk,
            "weather_risk": task.weather_risk,
            "anomaly_score": anomaly_score
        }])

        priority = int(
            priority_model.predict(priority_input)[0]
        )

        # Delay Prediction
        delay_input = pd.DataFrame([{
            "maintenance_duration_min": task.maintenance_duration_min,
            "affected_trains": task.affected_trains,
            "congestion_level": task.congestion_level,
            "traffic_intensity": task.traffic_intensity,
            "load_factor": task.load_factor,
            "weather_risk": task.weather_risk
        }])

        predicted_delay = max(0.0, float(
            delay_model.predict(delay_input)[0]
        ))

        predictions.append({
            "id": task.id,
            "asset_id": task.asset_id,
            "department": task.department,
            "section_id": task.section_id,
            "priority": priority,
            "risk": risk_score,
            "duration": task.maintenance_duration_min,
            "expected_delay": predicted_delay
        })

        tasks_for_optimizer.append({
            "id": task.id,
            "asset_id": task.asset_id,
            "department": task.department,
            "section_id": task.section_id,
            "priority": priority,
            "risk": risk_score,
            "duration": task.maintenance_duration_min,
            "expected_delay": predicted_delay
        })

    # -----------------------------------------
    # 6. Generate emergency schedule
    # -----------------------------------------
    emergency_schedule = generate_schedule(
        tasks_for_optimizer,
        blocks
    )

    # -----------------------------------------
    # 7. Compare previous and emergency plan
    # -----------------------------------------
    changes = []

    if data.previous_schedule:

        changes.append({
            "type": "EMERGENCY_REPLAN",
            "reason": data.incident_type,
            "section_id": data.section_id,
            "affected_tasks": len(affected_tasks),
            "affected_trains": len(affected_trains)
        })

    # -----------------------------------------
    # 8. Final response
    # -----------------------------------------
    return {
        "system": "KALM STORM",
        "mode": "STORM MODE",

        "incident": {
            "type": data.incident_type,
            "section_id": data.section_id
        },

        "affected_trains": affected_trains,

        "affected_tasks": affected_tasks,

        "previous_schedule": data.previous_schedule,

        "emergency_schedule": emergency_schedule,

        "predictions": predictions,

        "changes": changes,

        "approval_required": True,

        "message":
            "Emergency maintenance plan generated. "
            "Control Office approval required before execution."
    }