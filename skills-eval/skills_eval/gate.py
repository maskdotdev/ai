from __future__ import annotations

import json
from pathlib import Path


def gate_results(
    baseline_path: str | Path,
    candidate_path: str | Path,
    max_success_drop: float,
    max_latency_increase: float,
    max_total_drop: float,
) -> list[str]:
    baseline = json.loads(Path(baseline_path).read_text())
    candidate = json.loads(Path(candidate_path).read_text())

    b_scores = baseline.get("scores", {})
    c_scores = candidate.get("scores", {})

    failures: list[str] = []
    for skill, b in b_scores.items():
        if skill not in c_scores:
            failures.append(f"Missing skill in candidate: {skill}")
            continue

        c = c_scores[skill]

        success_drop = float(b["task_success"] - c["task_success"])
        if success_drop > max_success_drop:
            failures.append(
                f"{skill}: task_success dropped by {success_drop:.4f} (max {max_success_drop:.4f})"
            )

        total_drop = float(b["total"] - c["total"])
        if total_drop > max_total_drop:
            failures.append(f"{skill}: total dropped by {total_drop:.4f} (max {max_total_drop:.4f})")

        # latency score is normalized inverse latency: lower means slower/worse.
        b_latency = float(b["latency"])
        c_latency = float(c["latency"])
        latency_worsening = b_latency - c_latency
        if latency_worsening > max_latency_increase:
            failures.append(
                f"{skill}: normalized latency worsened by {latency_worsening:.4f} "
                f"(max {max_latency_increase:.4f})"
            )

    return failures
