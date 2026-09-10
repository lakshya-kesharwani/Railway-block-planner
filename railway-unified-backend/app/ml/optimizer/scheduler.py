from ortools.sat.python import cp_model


def generate_schedule(tasks, blocks):

    model = cp_model.CpModel()

    assignment = {}

    # ==========================================
    # DEBUG: SHOW TRAINS RECEIVED BY SCHEDULER
    # ==========================================

    print("\n========== SCHEDULER DEBUG ==========")

    for block in blocks:
        print(
            f"{block['id']} ({block['start']} - {block['end']}) "
            f"TRAINS = {block.get('trains', [])}"
        )

    print("=====================================\n")

    # ==========================================
    # CREATE ASSIGNMENT VARIABLES
    # ==========================================

    for task in tasks:
        for block in blocks:

            assignment[(task["id"], block["id"])] = model.NewBoolVar(
                f'{task["id"]}_{block["id"]}'
            )

    # ==========================================
    # TRAIN TIMETABLE CONFLICTS
    # ==========================================

    for task in tasks:

        for block in blocks:

            for train in block.get("trains", []):

                if task["section_id"] == train["section_id"]:

                    print(
                        f"CONFLICT FOUND: "
                        f"Task {task['id']} ({task['section_id']}) "
                        f"cannot use {block['id']} because "
                        f"Train {train['train_id']} is on "
                        f"{train['section_id']}"
                    )

                    model.Add(
                        assignment[(task["id"], block["id"])] == 0
                    )

    # ==========================================
    # EACH TASK AT MOST ONE BLOCK
    # ==========================================

    for task in tasks:

        model.Add(
            sum(
                assignment[(task["id"], block["id"])]
                for block in blocks
            ) <= 1
        )

    # ==========================================
    # BLOCK CAPACITY
    # ==========================================

    for block in blocks:

        model.Add(
            sum(
                int(round(task["duration"])) *
                assignment[(task["id"], block["id"])]
                for task in tasks
            )
            <= block["capacity"]
        )

    # ==========================================
    # OBJECTIVE
    # ==========================================

    objective_terms = []

    for task in tasks:

        score = (
            task["priority"] * 100
            + int(task["risk"] * 100)
            - int(task["expected_delay"] * 2)
        )

        for block in blocks:

            objective_terms.append(
                score * assignment[(task["id"], block["id"])]
            )

    model.Maximize(sum(objective_terms))

    # ==========================================
    # SOLVE
    # ==========================================

    solver = cp_model.CpSolver()

    status = solver.Solve(model)

    # ==========================================
    # CREATE SCHEDULE
    # ==========================================

    schedule = []

    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:

        for block in blocks:

            block_tasks = []

            for task in tasks:

                if solver.Value(
                    assignment[(task["id"], block["id"])]
                ):

                    block_tasks.append({
                        "task_id": task["id"],
                        "asset_id": task["asset_id"],
                        "department": task["department"],
                        "section_id": task["section_id"],
                        "priority": task["priority"],
                        "risk": task["risk"],
                        "duration": task["duration"],
                        "expected_delay": task["expected_delay"]
                    })

            if block_tasks:

                schedule.append({
                    "block_id": block["id"],
                    "start": block["start"],
                    "end": block["end"],
                    "tasks": block_tasks
                })

    return schedule