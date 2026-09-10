def check_compatibility(request_a, request_b):
    """
    Prototype Compatibility Recommendation Engine.

    Goal:
    Determine whether two maintenance activities can potentially
    be grouped into the same maintenance block.

    Department is NOT used as a conflict condition.
    Compatibility is based on operational characteristics.
    """

    compatibility_score = 100
    reasons = []
    warnings = []

    # ---------------------------------
    # 1. Same Asset
    # ---------------------------------

    if request_a.get("assetId") == request_b.get("assetId"):
        compatibility_score -= 60
        warnings.append("Both requests target the same asset")

    else:
        reasons.append("Requests target different assets")

    # ---------------------------------
    # 2. Same Corridor
    # ---------------------------------

    corridor_a = request_a.get("corridorId")
    corridor_b = request_b.get("corridorId")

    if corridor_a and corridor_b:

        if corridor_a == corridor_b:
            reasons.append("Both activities are on the same corridor")
        else:
            compatibility_score -= 20
            warnings.append("Activities are on different corridors")

    # ---------------------------------
    # 3. Time Window
    # ---------------------------------

    start_a = request_a.get("startTime")
    end_a = request_a.get("endTime")

    start_b = request_b.get("startTime")
    end_b = request_b.get("endTime")

    if start_a is not None and end_a is not None \
            and start_b is not None and end_b is not None:

        # Time windows overlap
        if start_a < end_b and start_b < end_a:
            reasons.append("Maintenance windows overlap")
        else:
            compatibility_score -= 30
            warnings.append("Maintenance windows do not overlap")

    # ---------------------------------
    # 4. Duration Compatibility
    # ---------------------------------

    duration_a = request_a.get("estimatedDuration")
    duration_b = request_b.get("estimatedDuration")

    if duration_a is not None and duration_b is not None:

        combined_duration = duration_a + duration_b

        # Prototype block limit: 8 hours = 480 minutes
        if combined_duration <= 480:
            reasons.append(
                "Combined maintenance duration fits within the block"
            )
        else:
            compatibility_score -= 25
            warnings.append(
                "Combined maintenance duration exceeds block capacity"
            )

    # ---------------------------------
    # 5. Department
    # ---------------------------------

    department_a = request_a.get("department")
    department_b = request_b.get("department")

    if department_a and department_b:

        if department_a != department_b:
            reasons.append(
                "Activities belong to different departments but may be coordinated"
            )
        else:
            reasons.append(
                "Activities belong to the same department"
            )

    # IMPORTANT:
    # Department does NOT increase or decrease compatibility.
    # The same/different department alone does not determine conflict.

    # ---------------------------------
    # Keep score between 0 and 100
    # ---------------------------------

    compatibility_score = max(0, min(compatibility_score, 100))

    # ---------------------------------
    # Final Classification
    # ---------------------------------

    if compatibility_score >= 70:
        decision = "HIGHLY_COMPATIBLE"

    elif compatibility_score >= 50:
        decision = "COMPATIBLE"

    elif compatibility_score >= 30:
        decision = "REVIEW"

    else:
        decision = "CONFLICT"

    # ---------------------------------
    # Final Result
    # ---------------------------------

    return {
        "compatibilityScore": compatibility_score,
        "decision": decision,
        "canCombine": decision in [
            "HIGHLY_COMPATIBLE",
            "COMPATIBLE"
        ],
        "reasons": reasons,
        "warnings": warnings
    }


# =================================
# Local Test
# =================================

if __name__ == "__main__":

    request_a = {
    "requestId": "REQ-001",
    "department": "Engineering",
    "assetId": "AST-001",
    "corridorId": "COR-001",
    "startTime": 10,
    "endTime": 14,
    "estimatedDuration": 300
}

    request_b = {
    "requestId": "REQ-002",
    "department": "Traction",
    "assetId": "AST-001",
    "corridorId": "COR-001",
    "startTime": 12,
    "endTime": 16,
    "estimatedDuration": 300
}

    result = check_compatibility(request_a, request_b)

    print("\n--- Compatibility Engine Result ---")

    print("Compatibility Score :", result["compatibilityScore"])
    print("Decision             :", result["decision"])
    print("Can Combine          :", result["canCombine"])

    print("\nReasons:")

    if result["reasons"]:
        for reason in result["reasons"]:
            print("-", reason)
    else:
        print("- None")

    print("\nWarnings:")

    if result["warnings"]:
        for warning in result["warnings"]:
            print("-", warning)
    else:
        print("- None")