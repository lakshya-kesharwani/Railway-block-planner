from app.priority.priority_engine import calculate_priority
from app.conflict.conflict_engine import check_compatibility


def create_block_plan(requests):

    if not requests:
        return {
            "blocks": [],
            "message": "No maintenance requests available"
        }

    # -----------------------------------------
    # STEP 1: Calculate priority
    # -----------------------------------------

    analyzed_requests = []

    for request in requests:

        priority = calculate_priority(
            urgency=request["urgency"],
            asset_criticality=request.get("assetCriticality", 5),
            asset_age=request.get("assetAge", 0),
            defect_severity=request.get("defectSeverity", 5),
            previous_failures=request.get("previousFailures", 0),
            overdue_count=request.get("overdueCount", 0),
            days_until_deadline=request.get("daysUntilDeadline", 30)
        )

        analyzed_requests.append({
            **request,
            "priority": priority
        })

    # Highest-priority maintenance requests are
    # considered first.
    analyzed_requests.sort(
        key=lambda x: x["priority"]["priorityScore"],
        reverse=True
    )

    # -----------------------------------------
    # STEP 2: Create blocks
    # -----------------------------------------

    blocks = []

    for request in analyzed_requests:

        added_to_block = False

        # Try to put the request into an existing block
        for block in blocks:

            compatible_with_all = True
            compatibility_results = []

            # A request must be compatible with
            # EVERY request already inside the block.
            for existing_request in block["requests"]:

                compatibility = check_compatibility(
                    existing_request,
                    request
                )

                compatibility_results.append(compatibility)

                if not compatibility["canCombine"]:
                    compatible_with_all = False
                    break

            # If compatible with all requests,
            # add it to the existing block.
            if compatible_with_all:

                block["requests"].append(request)

                block["totalDuration"] += request["estimatedDuration"]

                block["compatibilityChecks"].extend(
                    compatibility_results
                )

                added_to_block = True
                break

        # If the request cannot be added to any
        # existing block, create a new block.
        if not added_to_block:

            blocks.append({
                "blockId": f"BLOCK-{len(blocks) + 1:03d}",
                "requests": [request],
                "totalDuration": request["estimatedDuration"],
                "compatibilityChecks": []
            })

    # -----------------------------------------
    # STEP 3: Prepare final block information
    # -----------------------------------------

    final_blocks = []

    for block in blocks:

        request_ids = [
            request["requestId"]
            for request in block["requests"]
        ]

        priority_scores = [
            request["priority"]["priorityScore"]
            for request in block["requests"]
        ]

        # -----------------------------------------
        # Compatibility summary
        # -----------------------------------------

        if len(block["requests"]) == 1:

            compatibility_summary = {
                "decision": "SINGLE_REQUEST",
                "score": 100,
                "canCombine": True,
                "reasons": [
                    "Only one maintenance request in this block"
                ],
                "warnings": []
            }

        else:

            scores = [
                result["compatibilityScore"]
                for result in block["compatibilityChecks"]
            ]

            all_reasons = []
            all_warnings = []

            for result in block["compatibilityChecks"]:

                all_reasons.extend(
                    result.get("reasons", [])
                )

                all_warnings.extend(
                    result.get("warnings", [])
                )

            # Remove duplicate explanations
            unique_reasons = list(dict.fromkeys(all_reasons))
            unique_warnings = list(dict.fromkeys(all_warnings))

            # Use the lowest compatibility score
            # as the conservative score for the block.
            compatibility_score = min(scores)

            if compatibility_score >= 70:
                decision = "HIGHLY_COMPATIBLE"

            elif compatibility_score >= 50:
                decision = "COMPATIBLE"

            elif compatibility_score >= 30:
                decision = "REVIEW"

            else:
                decision = "CONFLICT"

            compatibility_summary = {
                "decision": decision,
                "score": compatibility_score,
                "canCombine": decision in [
                    "HIGHLY_COMPATIBLE",
                    "COMPATIBLE"
                ],
                "reasons": unique_reasons,
                "warnings": unique_warnings
            }

        # -----------------------------------------
        # Final proposed block
        # -----------------------------------------

        final_blocks.append({

            "blockId": block["blockId"],

            "requestIds": request_ids,

            "numberOfRequests": len(request_ids),

            "totalDuration": block["totalDuration"],

            "highestPriority": max(priority_scores),

            "compatibility": compatibility_summary,

            "status": "Proposed"
        })

    # -----------------------------------------
    # STEP 4: Return complete planning result
    # -----------------------------------------

    return {
        "numberOfBlocks": len(final_blocks),

        "numberOfRequests": len(requests),

        "blocks": final_blocks
    }