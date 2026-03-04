from __future__ import annotations

import json
from pathlib import Path

from rich.console import Console
from rich.table import Table

from skills_eval.scoring import head_to_head


def print_leaderboard(results_path: str | Path) -> None:
    payload = json.loads(Path(results_path).read_text())
    scores = payload.get("scores", {})
    load_stats = _skill_load_stats(payload.get("trials", []))

    rows = sorted(scores.items(), key=lambda x: x[1]["total"], reverse=True)

    table = Table(title="Skills Eval Leaderboard")
    table.add_column("Skill")
    table.add_column("Total", justify="right")
    table.add_column("Task Success", justify="right")
    table.add_column("Correctness", justify="right")
    table.add_column("Reliability", justify="right")
    table.add_column("Cost", justify="right")
    table.add_column("Latency", justify="right")
    table.add_column("Skill Load", justify="right")

    for skill, score in rows:
        clean, total = load_stats.get(skill, (0, 0))
        load_text = "n/a" if total == 0 else f"{(clean / total) * 100:.0f}% ({clean}/{total})"
        table.add_row(
            skill,
            f"{score['total']:.3f}",
            f"{score['task_success']:.3f}",
            f"{score['correctness']:.3f}",
            f"{score['reliability']:.3f}",
            f"{score['cost_efficiency']:.3f}",
            f"{score['latency']:.3f}",
            load_text,
        )

    console = Console()
    console.print(table)


def print_head_to_head(results_path: str | Path, skill_a: str, skill_b: str) -> None:
    payload = json.loads(Path(results_path).read_text())
    trial_objs = payload.get("trials", [])

    # Reuse score logic by creating tiny objects with required attrs.
    class Trial:
        def __init__(self, obj: dict):
            self.task_id = obj["task_id"]
            self.skill = obj["skill"]
            self.full_pass = bool(obj["full_pass"])
            self.check_pass_count = int(obj["check_pass_count"])
            self.check_total = int(obj["check_total"])
            self.latency_ms = int(obj["latency_ms"])

    trials = [Trial(obj) for obj in trial_objs]
    rate, (lo, hi), wins, losses = head_to_head(trials, skill_a, skill_b)

    console = Console()
    console.print(
        f"[bold]{skill_a} vs {skill_b}[/bold]: win_rate={rate:.3f}, "
        f"95% CI=[{lo:.3f}, {hi:.3f}], wins={wins}, losses={losses}"
    )


def _skill_load_stats(trials: list[dict]) -> dict[str, tuple[int, int]]:
    stats: dict[str, list[int]] = {}
    for trial in trials:
        skill = trial.get("skill", "")
        metadata = trial.get("metadata", {})
        error_count = int(
            metadata.get(
                "expected_skill_load_error_count",
                metadata.get("skill_load_error_count", 0),
            )
        )
        if skill not in stats:
            stats[skill] = [0, 0]
        stats[skill][1] += 1
        if error_count == 0:
            stats[skill][0] += 1

    return {skill: (vals[0], vals[1]) for skill, vals in stats.items()}
