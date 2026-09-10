def calculate_priority(
    urgency,
    asset_criticality,
    asset_age,
    defect_severity,
    previous_failures,
    overdue_count,
    days_until_deadline
):
    print("Priority Engine Started")

    # -----------------------------
    # Input Validation
    # -----------------------------
    valid_urgencies = ["low", "medium", "high", "urgent"]

    if urgency.lower() not in valid_urgencies:
        raise ValueError("Invalid urgency value")

    if not 0 <= asset_criticality <= 10:
        raise ValueError("Asset criticality must be between 0 and 10")

    if not 0 <= asset_age:
        raise ValueError("Asset age cannot be negative")

    if not 0 <= defect_severity <= 10:
        raise ValueError("Defect severity must be between 0 and 10")

    if not 0 <= previous_failures:
        raise ValueError("Previous failures cannot be negative")

    if not 0 <= overdue_count:
        raise ValueError("Overdue count cannot be negative")

    if not 0 <= days_until_deadline:
        raise ValueError("Days until deadline cannot be negative")

    print("Input validation successful")

    # -----------------------------
    # Explanation / Reasons
    # -----------------------------
    reasons = []

    if asset_criticality >= 8:
        reasons.append("High asset criticality")

    if defect_severity >= 8:
        reasons.append("High defect severity")

    if asset_age >= 15:
        reasons.append("Asset is relatively old")

    if previous_failures > 0:
        reasons.append("Previous asset failures recorded")

    if overdue_count > 0:
        reasons.append("Maintenance is overdue")

    if days_until_deadline <= 1:
        reasons.append("Maintenance deadline is very close")
    elif days_until_deadline <= 3:
        reasons.append("Maintenance deadline is approaching")
    elif days_until_deadline <= 7:
        reasons.append("Maintenance deadline is within one week")

    if urgency.lower() == "urgent":
        reasons.append("Maintenance request is urgent")

    # -----------------------------
    # Risk Score Calculation
    # -----------------------------
    risk_score = 0

    # Asset criticality: 0-10
    risk_score += asset_criticality * 3

    # Asset age: maximum contribution = 20
    age_score = min(asset_age, 20)
    risk_score += age_score * 1

    # Defect severity: 0-10
    risk_score += defect_severity * 4

    # Previous failures: maximum contribution = 15
    risk_score += min(previous_failures * 3, 15)

    # Overdue maintenance: maximum contribution = 15
    risk_score += min(overdue_count * 3, 15)

    # Deadline pressure: maximum contribution = 15
    if days_until_deadline <= 1:
        risk_score += 15
    elif days_until_deadline <= 3:
        risk_score += 10
    elif days_until_deadline <= 7:
        risk_score += 5

    # Urgency
    if urgency.lower() == "urgent":
        risk_score += 15
    elif urgency.lower() == "high":
        risk_score += 10
    elif urgency.lower() == "medium":
        risk_score += 5

    # Keep risk score between 0 and 100
    risk_score = min(risk_score, 100)

    # -----------------------------
    # Risk Level
    # -----------------------------
    if risk_score >= 75:
        risk_level = "High"
    elif risk_score >= 50:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # -----------------------------
    # Priority Score
    # -----------------------------
    priority_score = risk_score

    # Urgent requests receive an additional priority boost
    if urgency.lower() == "urgent":
        priority_score += 5

    # Keep priority score between 0 and 100
    priority_score = min(priority_score, 100)

    # -----------------------------
    # Priority Level
    # -----------------------------
    if priority_score >= 85:
        priority_level = "Critical"
    elif priority_score >= 70:
        priority_level = "High"
    elif priority_score >= 40:
        priority_level = "Medium"
    else:
        priority_level = "Low"

    # -----------------------------
    # Final Structured Result
    # -----------------------------
    return {
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "priorityScore": priority_score,
        "priorityLevel": priority_level,
        "reasons": reasons
    }


# -----------------------------
# Local Test
# -----------------------------
if __name__ == "__main__":
    result = calculate_priority(
        urgency="urgent",
        asset_criticality=9,
        asset_age=15,
        defect_severity=8,
        previous_failures=3,
        overdue_count=2,
        days_until_deadline=2
    )

    print("\n--- Priority Engine Result ---")

    print("Risk Score      :", result["riskScore"])
    print("Risk Level      :", result["riskLevel"])
    print("Priority Score  :", result["priorityScore"])
    print("Priority Level  :", result["priorityLevel"])

    print("\nReasons:")
    for reason in result["reasons"]:
        print("-", reason)