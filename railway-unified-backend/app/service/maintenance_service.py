from datetime import datetime, timezone

from bson import ObjectId

from app.db.database import db
from app.priority.priority_engine import calculate_priority
from app.planner.block_planner import create_block_plan
maintenance_blocks_collection = db["maintenanceBlocks"]
approvals_collection = db["approvals"]

maintenance_requests_collection = db["maintenenceRequests"]
assets_collection = db["assets"]
maintenance_history_collection = db["maintenanceHistory"]


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def calculate_days_until_deadline(deadline):

    if not deadline:
        return 30

    now = datetime.now(timezone.utc)

    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    return max(
        0,
        (deadline - now).days
    )


def convert_level_to_score(level):

    """
    Convert database text levels into numerical values
    required by the Priority Engine.
    """

    if not level:
        return 5

    level = level.lower()

    if level == "low":
        return 2

    if level == "medium":
        return 5

    if level == "high":
        return 8

    if level == "critical":
        return 10

    return 5


def find_asset(asset_id):

    """
    Find an asset using the assetId stored
    inside the maintenance request.
    """

    # First try string assetId
    asset = assets_collection.find_one({
        "assetId": asset_id
    })

    if asset:
        return asset

    # If assetId is actually a MongoDB ObjectId
    try:
        object_id = ObjectId(asset_id)

        asset = assets_collection.find_one({
            "_id": object_id
        })

        return asset

    except Exception:
        return None


def get_asset_data(asset_id):

    """
    Fetch asset information and maintenance history.
    """

    asset = find_asset(asset_id)

    # If asset does not exist, use safe prototype defaults
    if not asset:

        return {
            "assetCriticality": 5,
            "assetAge": 0,
            "defectSeverity": 5,
            "corridorId": None,
            "previousFailures": 0
        }

    # ---------------------------------
    # Asset information
    # ---------------------------------

    asset_criticality = convert_level_to_score(
        asset.get("criticality")
    )

    asset_age = asset.get(
        "age",
        0
    )

    defect_severity = convert_level_to_score(
        asset.get("defectSeverity")
    )

    # ---------------------------------
    # Corridor
    # ---------------------------------

    corridor_id = asset.get(
        "corridorId"
    )

    if corridor_id is not None:
        corridor_id = str(corridor_id)

    # ---------------------------------
    # Maintenance history
    # ---------------------------------

    history_query = {}

    # History normally references asset _id
    if asset.get("_id") is not None:
        history_query["assetId"] = asset["_id"]

    history_records = list(
        maintenance_history_collection.find(
            history_query
        )
    ) if history_query else []

    previous_failures = 0

    for history in history_records:

        if history.get(
            "failureOccurred",
            False
        ):
            previous_failures += 1

    return {
        "assetCriticality": asset_criticality,
        "assetAge": asset_age,
        "defectSeverity": defect_severity,
        "corridorId": corridor_id,
        "previousFailures": previous_failures
    }


# ============================================================
# CREATE MAINTENANCE REQUEST
# ============================================================

def create_maintenance_request(
    department,
    asset_id,
    description,
    urgency,
    estimated_duration,
    deadline,
    created_by
):
    # Generate a human-readable request ID
    request_count = maintenance_requests_collection.count_documents({})

    request_id = f"MR-{request_count + 1:03d}"

    now = datetime.now(timezone.utc)

    request = {
        "requestId": request_id,
        "department": department,
        "assetId": asset_id,
        "description": description,
        "urgency": urgency,
        "estimatedDuration": estimated_duration,
        "deadline": deadline,
        "status": "Pending",
        "createdBy": created_by,
        "requestedAt": now,
        "updatedAt": now
    }

    result = maintenance_requests_collection.insert_one(request)

    return {
        "message": "Maintenance request created successfully",
        "requestId": request_id,
        "id": str(result.inserted_id)
    }


# ============================================================
# GET ALL REQUESTS
# ============================================================

def get_all_maintenance_requests():

    requests = maintenance_requests_collection.find()

    result = []

    for request in requests:

        result.append({
            "id": str(request["_id"]),
            "department": request["department"],
            "assetId": request["assetId"],
            "description": request["description"],
            "urgency": request["urgency"],
            "estimatedDuration": request["estimatedDuration"],
            "deadline": request["deadline"],
            "status": request["status"],
            "createdBy": str(request["createdBy"]),
            "requestedAt": request["requestedAt"],
            "updatedAt": request["updatedAt"]
        })

    return result


# ============================================================
# ANALYZE MAINTENANCE REQUEST
# ============================================================

def analyze_maintenance_request(request_id: str):

    if not ObjectId.is_valid(request_id):
        return None

    request = maintenance_requests_collection.find_one(
        {"_id": ObjectId(request_id)}
    )

    if not request:
        return None

    # ---------------------------------
    # Deadline
    # ---------------------------------

    days_until_deadline = calculate_days_until_deadline(
        request.get("deadline")
    )

    # ---------------------------------
    # GET REAL ASSET + HISTORY DATA
    # ---------------------------------

    asset_data = get_asset_data(
        request["assetId"]
    )

    # ---------------------------------
    # Priority Engine
    # ---------------------------------

    priority_result = calculate_priority(

        urgency=request["urgency"],

        asset_criticality=asset_data[
            "assetCriticality"
        ],

        asset_age=asset_data[
            "assetAge"
        ],

        defect_severity=asset_data[
            "defectSeverity"
        ],

        previous_failures=asset_data[
            "previousFailures"
        ],

        overdue_count=0,

        days_until_deadline=days_until_deadline
    )

    return {

        "request": {
            "id": str(request["_id"]),
            "department": request["department"],
            "assetId": request["assetId"],
            "description": request["description"],
            "urgency": request["urgency"],
            "estimatedDuration": request["estimatedDuration"],
            "deadline": request["deadline"],
            "status": request["status"]
        },

        "assetData": asset_data,

        "priority": priority_result
    }


# ============================================================
# CREATE REAL BLOCK PLAN
# ============================================================

def create_real_block_plan():

    requests = maintenance_requests_collection.find({
        "status": "Pending"
    })

    planner_requests = []

    for request in requests:

        days_until_deadline = calculate_days_until_deadline(
            request.get("deadline")
        )

        asset_data = get_asset_data(
            request["assetId"]
        )

        planner_request = {
            "requestId": request.get(
                "requestId",
                str(request["_id"])
            ),

            "department": request.get("department"),

            "assetId": request.get("assetId"),

            "description": request.get("description"),

            "urgency": request.get(
                "urgency",
                "medium"
            ),

            "estimatedDuration": request.get(
                "estimatedDuration",
                0
            ),

            "deadline": request.get("deadline"),

            "status": request.get(
                "status",
                "Pending"
            ),

            "assetCriticality": asset_data[
                "assetCriticality"
            ],

            "assetAge": asset_data[
                "assetAge"
            ],

            "defectSeverity": asset_data[
                "defectSeverity"
            ],

            "previousFailures": asset_data[
                "previousFailures"
            ],

            "overdueCount": 0,

            "daysUntilDeadline": days_until_deadline,

            "corridorId": asset_data[
                "corridorId"
            ],

            "startTime": request.get(
                "startTime"
            ),

            "endTime": request.get(
                "endTime"
            )
        }

        planner_requests.append(
            planner_request
        )

    # Generate the proposed block plan
    block_plan = create_block_plan(
        planner_requests
    )

    # -----------------------------------------
    # Save proposed blocks to MongoDB
    # -----------------------------------------

    saved_blocks = []

    for block in block_plan["blocks"]:

        block_document = {
            "blockId": block["blockId"],

            "requestIds": block["requestIds"],

            "numberOfRequests": block[
                "numberOfRequests"
            ],

            "totalDuration": block[
                "totalDuration"
            ],

            "highestPriority": block[
                "highestPriority"
            ],

            "compatibility": block[
                "compatibility"
            ],

            "status": "Proposed",

            "createdAt": datetime.now(
                timezone.utc
            ),

            "updatedAt": datetime.now(
                timezone.utc
            )
        }

        # Check whether this block already exists
        existing_block = (
            maintenance_blocks_collection.find_one({
                "blockId": block["blockId"]
            })
        )

        if existing_block:

            maintenance_blocks_collection.update_one(
                {
                    "blockId": block["blockId"]
                },
                {
                    "$set": {
                        **block_document,
                        "updatedAt": datetime.now(
                            timezone.utc
                        )
                    }
                }
            )

        else:

            maintenance_blocks_collection.insert_one(
                block_document
            )

        # Add the block to the API response
        # whether it was inserted OR updated.
        saved_blocks.append({
            "blockId": block_document["blockId"],
            "requestIds": [
                str(request_id)
                for request_id in block_document["requestIds"]
            ],
            "numberOfRequests": block_document["numberOfRequests"],
            "totalDuration": block_document["totalDuration"],
            "highestPriority": block_document["highestPriority"],
            "compatibility": block_document["compatibility"],
            "status": block_document["status"],
            "createdAt": block_document["createdAt"].isoformat(),
            "updatedAt": block_document["updatedAt"].isoformat()
        })

    return {
        "source": "MongoDB",

        "dataSources": [
            "maintenanceRequests",
            "assets",
            "maintenanceHistory"
        ],

        "planningStatus": "Prototype",

        "numberOfBlocks": len(saved_blocks),

        "numberOfRequests": len(
            planner_requests
        ),

        "blocks": saved_blocks
    }

def update_block_status(block_id, new_status, approved_by=None):

    block_id = block_id.strip()
    new_status = new_status.strip()

    valid_statuses = [
        "Approved",
        "Rejected"
    ]

    if new_status not in valid_statuses:
        raise ValueError(
            "Invalid block status. Use Approved or Rejected."
        )

    # -----------------------------------------
    # Find block
    # -----------------------------------------

    block = maintenance_blocks_collection.find_one({
        "blockId": block_id
    })

    if not block:
        raise ValueError(
            f"Block {block_id} not found"
        )

    now = datetime.now(timezone.utc)

    # -----------------------------------------
    # Update block
    # -----------------------------------------

    maintenance_blocks_collection.update_one(
        {
            "blockId": block_id
        },
        {
            "$set": {
                "status": new_status,
                "updatedAt": now
            }
        }
    )

    # -----------------------------------------
    # Save approval record
    # -----------------------------------------

    approval_document = {
        "blockId": block_id,
        "decision": new_status,
        "approvedBy": approved_by,
        "approvedAt": now
    }

    approvals_collection.insert_one(
        approval_document
    )

    # -----------------------------------------
    # Update maintenance requests
    # -----------------------------------------

    if new_status == "Approved":

        request_ids = block.get(
            "requestIds",
            []
        )

        # First try human-readable request IDs
        maintenance_requests_collection.update_many(
            {
                "requestId": {
                    "$in": request_ids
                }
            },
            {
                "$set": {
                    "status": "Scheduled",
                    "updatedAt": now
                }
            }
        )

        # Also handle older blocks that contain
        # MongoDB ObjectId strings.
        object_ids = []

        for request_id in request_ids:
            try:
                object_ids.append(
                    ObjectId(request_id)
                )
            except Exception:
                pass

        if object_ids:

            maintenance_requests_collection.update_many(
                {
                    "_id": {
                        "$in": object_ids
                    }
                },
                {
                    "$set": {
                        "status": "Scheduled",
                        "updatedAt": now
                    }
                }
            )

    # -----------------------------------------
    # Return result
    # -----------------------------------------

    return {
        "blockId": block_id,
        "status": new_status,
        "message": (
            f"Block {block_id} has been "
            f"{new_status.lower()} by Control Office"
        )
    }