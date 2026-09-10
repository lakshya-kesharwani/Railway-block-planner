
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

from app.Schemas.maintenance import MaintenanceRequestCreate

from app.service.maintenance_service import (
    create_maintenance_request,
    get_all_maintenance_requests,
    analyze_maintenance_request,
    create_real_block_plan,
    update_block_status,
    maintenance_requests_collection,
    get_asset_data,
)

from app.core.dependencies import get_current_user
from app.ml.routes import analyze_maintenance as ml_analyze_maintenance
from app.ml.routes import MaintenanceAnalysisInput

from bson import ObjectId


router = APIRouter(
    prefix="/maintenance",
    tags=["Maintenance"]
)


class BlockStatusUpdate(BaseModel):
    status: Literal["Approved", "Rejected"]


@router.post("/requests")
def create_request(
    data: MaintenanceRequestCreate,
    current_user=Depends(get_current_user)
):
    result = create_maintenance_request(
        department=data.department,
        asset_id=data.assetId,
        description=data.description,
        urgency=data.urgency,
        estimated_duration=data.estimatedDuration,
        deadline=data.deadline,
        created_by=current_user["_id"]
    )

    return result


@router.get("/requests")
def get_requests(
    current_user=Depends(get_current_user)
):
    return get_all_maintenance_requests()


@router.get("/analyze/{request_id}")
def analyze_request(
    request_id: str,
    current_user=Depends(get_current_user)
):
    result = analyze_maintenance_request(request_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Maintenance request not found"
        )

    return result


# ============================================================
# BLOCK PLANNING
# ============================================================

@router.get("/plan")
def generate_block_plan(
    current_user=Depends(get_current_user)
):
    return create_real_block_plan()

@router.put("/blocks/{block_id}/status")
def change_block_status(
    block_id: str,
    data: BlockStatusUpdate,
    current_user=Depends(get_current_user)
):
    try:
        result = update_block_status(
            block_id,
            data.status,
            approved_by=current_user["_id"]
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# ============================================================
# BRIDGE: real Mongo request -> KALM Storm ML pipeline
# ============================================================
# analyze_maintenance_request() above uses the original rule-based
# Priority Engine (deterministic, explainable, no training data needed).
# This endpoint takes the SAME real request/asset data and additionally
# runs it through the trained ML pipeline (Isolation Forest -> XGBoost ->
# Random Forest -> delay model), so both engines can be shown side by
# side for the same real record.
#
# IMPORTANT / HONEST LIMITATION:
# The Mongo "assets" collection (see get_asset_data in
# maintenance_service.py) only tracks criticality, age, defect severity,
# corridor, and previous-failure count. The ML models were trained on a
# richer synthetic feature set (traffic intensity, load factor,
# environmental/weather risk, congestion level, affected trains,
# maintenance/failure frequency, days since last maintenance, overdue
# days) that this Mongo schema does not capture at all. Rather than
# inventing fake telemetry, the fields below that have no real source
# are filled with the training dataset's mean value (documented in
# DEFAULTED_ML_FIELDS) - clearly separated from the fields that DO come
# from real stored data, so nobody mistakes a default for a sensor
# reading. Extend the "assets" collection schema if you want these to
# be real.

DEFAULTED_ML_FIELDS = [
    "maintenance_overdue_days",   # rule engine also stubs this to 0 today
    "days_since_last_maintenance",
    "traffic_intensity",
    "failure_frequency",
    "maintenance_frequency",
    "load_factor",
    "environmental_risk",
    "weather_risk",
    "affected_trains",
    "congestion_level",
]

# Dataset means from dataset/kalm_storm_dummy_dataset.csv, used only for
# the fields listed above.
_ML_DATASET_DEFAULTS = {
    "maintenance_overdue_days": 29.8,
    "days_since_last_maintenance": 185.3,
    "traffic_intensity": 0.55,
    "failure_frequency": 0.5,
    "maintenance_frequency": 0.5,
    "load_factor": 0.6,
    "environmental_risk": 0.5,
    "weather_risk": 0.5,
    "affected_trains": 5.0,
    "congestion_level": 0.5,
}


@router.get("/analyze-ml/{request_id}")
def analyze_request_with_ml(
    request_id: str,
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=404, detail="Maintenance request not found")

    request = maintenance_requests_collection.find_one({"_id": ObjectId(request_id)})

    if not request:
        raise HTTPException(status_code=404, detail="Maintenance request not found")

    asset_data = get_asset_data(request["assetId"])

    # ---- Fields backed by real Mongo data ----
    # NOTE: asset_criticality scales differ between the two engines -
    # the rule engine's convert_level_to_score() produces 2/5/8/10,
    # but the ML models were trained on a 1-5 scale. Rescale so the ML
    # model receives values in the range it was actually trained on.
    real_asset_criticality = max(1.0, min(5.0, asset_data["assetCriticality"] / 2))

    ml_input = MaintenanceAnalysisInput(
        asset_age_years=float(asset_data["assetAge"]),
        recent_defects=float(asset_data["defectSeverity"]),
        historical_failures=float(asset_data["previousFailures"]),
        asset_criticality=real_asset_criticality,
        maintenance_duration_min=float(request.get("estimatedDuration", 60)),

        # ---- Fields with no source in the current Mongo schema (see
        # DEFAULTED_ML_FIELDS above) ----
        maintenance_overdue_days=_ML_DATASET_DEFAULTS["maintenance_overdue_days"],
        days_since_last_maintenance=_ML_DATASET_DEFAULTS["days_since_last_maintenance"],
        traffic_intensity=_ML_DATASET_DEFAULTS["traffic_intensity"],
        failure_frequency=_ML_DATASET_DEFAULTS["failure_frequency"],
        maintenance_frequency=_ML_DATASET_DEFAULTS["maintenance_frequency"],
        load_factor=_ML_DATASET_DEFAULTS["load_factor"],
        environmental_risk=_ML_DATASET_DEFAULTS["environmental_risk"],
        weather_risk=_ML_DATASET_DEFAULTS["weather_risk"],
        affected_trains=_ML_DATASET_DEFAULTS["affected_trains"],
        congestion_level=_ML_DATASET_DEFAULTS["congestion_level"],
    )

    ml_result = ml_analyze_maintenance(ml_input)

    # Also run the original rule-based engine on the same request so both
    # results can be compared directly.
    rule_based_result = analyze_maintenance_request(request_id)

    return {
        "requestId": str(request["_id"]),
        "ruleBasedEngine": rule_based_result["priority"] if rule_based_result else None,
        "mlEngine": ml_result,
        "fieldsFromRealData": [
            "asset_age_years", "recent_defects", "historical_failures",
            "asset_criticality", "maintenance_duration_min"
        ],
        "fieldsDefaulted": DEFAULTED_ML_FIELDS,
    }