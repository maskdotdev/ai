from __future__ import annotations

import math
from collections import defaultdict

from skills_eval.models import SkillScore, TrialResult


def compute_scores(trials: list[TrialResult], skills: list[str]) -> dict[str, SkillScore]:
    by_skill: dict[str, list[TrialResult]] = {s: [] for s in skills}
    for trial in trials:
        by_skill[trial.skill].append(trial)

    mean_latency = {
        skill: (_avg([t.latency_ms for t in tlist]) if tlist else 0.0)
        for skill, tlist in by_skill.items()
    }
    max_latency = max(mean_latency.values(), default=0.0)

    mean_cost = {}
    for skill, tlist in by_skill.items():
        costs = [t.cost for t in tlist if t.cost is not None]
        mean_cost[skill] = _avg(costs) if costs else None

    max_cost = max([c for c in mean_cost.values() if c is not None], default=None)

    result: dict[str, SkillScore] = {}
    for skill, tlist in by_skill.items():
        if not tlist:
            result[skill] = SkillScore(0, 0, 0, 1, 0, 0)
            continue

        task_success = _avg([1.0 if t.full_pass else 0.0 for t in tlist])
        correctness = _avg([t.check_pass_count / max(1, t.check_total) for t in tlist])

        per_task_rates = _task_pass_rates(tlist)
        flaky_count = sum(1 for rate in per_task_rates.values() if 0.0 < rate < 1.0)
        reliability = 1.0 - (flaky_count / max(1, len(per_task_rates)))

        if max_cost is None or mean_cost[skill] is None or max_cost == 0:
            cost_efficiency = 1.0
        else:
            cost_efficiency = 1.0 - (mean_cost[skill] / max_cost)

        if max_latency <= 0:
            latency = 1.0
        else:
            latency = 1.0 - (mean_latency[skill] / max_latency)

        total = (
            0.50 * task_success
            + 0.20 * correctness
            + 0.15 * reliability
            + 0.10 * cost_efficiency
            + 0.05 * latency
        )

        result[skill] = SkillScore(
            task_success=task_success,
            correctness=correctness,
            reliability=reliability,
            cost_efficiency=cost_efficiency,
            latency=latency,
            total=total,
        )

    return result


def head_to_head(
    trials: list[TrialResult], skill_a: str, skill_b: str
) -> tuple[float, tuple[float, float], int, int]:
    by_skill_task: dict[str, dict[str, list[TrialResult]]] = defaultdict(lambda: defaultdict(list))
    for trial in trials:
        by_skill_task[trial.skill][trial.task_id].append(trial)

    wins = 0
    losses = 0
    decisions = 0

    common_tasks = set(by_skill_task[skill_a]).intersection(by_skill_task[skill_b])
    for task_id in sorted(common_tasks):
        a = _summarize_task(by_skill_task[skill_a][task_id])
        b = _summarize_task(by_skill_task[skill_b][task_id])

        if a > b:
            wins += 1
            decisions += 1
        elif b > a:
            losses += 1
            decisions += 1

    if decisions == 0:
        return 0.0, (0.0, 0.0), 0, 0

    p_hat = wins / decisions
    ci = _wilson_interval(wins, decisions)
    return p_hat, ci, wins, losses


def _summarize_task(trials: list[TrialResult]) -> tuple[float, float, float]:
    pass_rate = _avg([1.0 if t.full_pass else 0.0 for t in trials])
    correctness = _avg([t.check_pass_count / max(1, t.check_total) for t in trials])
    latency = _avg([t.latency_ms for t in trials])
    return pass_rate, correctness, -latency


def _task_pass_rates(trials: list[TrialResult]) -> dict[str, float]:
    grouped: dict[str, list[float]] = defaultdict(list)
    for trial in trials:
        grouped[trial.task_id].append(1.0 if trial.full_pass else 0.0)
    return {k: _avg(v) for k, v in grouped.items()}


def _avg(vals: list[float]) -> float:
    if not vals:
        return 0.0
    return sum(vals) / len(vals)


def _wilson_interval(successes: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total == 0:
        return 0.0, 0.0

    p = successes / total
    denom = 1 + z**2 / total
    center = (p + z**2 / (2 * total)) / denom
    margin = z * math.sqrt((p * (1 - p) + z**2 / (4 * total)) / total) / denom
    return max(0.0, center - margin), min(1.0, center + margin)
