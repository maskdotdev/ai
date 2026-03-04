from __future__ import annotations

import json
import random
import shutil
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

from skills_eval.adapters import build_adapter
from skills_eval.checks import run_checks
from skills_eval.loaders import load_eval_config, load_tasks
from skills_eval.models import EvalResults, TrialResult
from skills_eval.scoring import compute_scores


def run_evaluation(config_path: str | Path, artifacts_root: str | Path = ".artifacts") -> Path:
    config = load_eval_config(config_path)
    tasks = load_tasks(config.tasks_glob)

    run_id = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    root = Path(artifacts_root).resolve() / run_id
    root.mkdir(parents=True, exist_ok=False)

    rng = random.Random(config.seed)
    trials: list[TrialResult] = []

    for skill_name, skill_cfg in config.skills.items():
        adapter = build_adapter(skill_cfg)
        for task in tasks:
            for trial_index in range(config.trials):
                trial_seed = rng.randint(0, 2**31 - 1)
                trial_dir = root / skill_name / task.id / f"trial_{trial_index:02d}"
                workdir = trial_dir / "workdir"
                workdir.mkdir(parents=True, exist_ok=True)

                _prepare_fixtures(task.fixtures_dir, workdir)

                stdout_path = trial_dir / "stdout.log"
                stderr_path = trial_dir / "stderr.log"

                run = adapter.run(
                    task=task,
                    workdir=workdir,
                    stdout_path=stdout_path,
                    stderr_path=stderr_path,
                    timeout_s=config.timeout_s,
                    seed=trial_seed,
                )

                checks = run_checks(task.checks, workdir=workdir, timeout_s=config.timeout_s)
                check_pass_count = sum(1 for check in checks if check.passed)
                check_total = len(checks)
                full_pass = run.success and check_pass_count == check_total

                trials.append(
                    TrialResult(
                        task_id=task.id,
                        skill=skill_name,
                        trial_index=trial_index,
                        adapter_success=run.success,
                        exit_code=run.exit_code,
                        latency_ms=run.latency_ms,
                        check_pass_count=check_pass_count,
                        check_total=check_total,
                        full_pass=full_pass,
                        checks=checks,
                        stdout_path=str(stdout_path),
                        stderr_path=str(stderr_path),
                        workdir=str(workdir),
                        cost=run.cost,
                        metadata=run.metadata,
                    )
                )

    scores = compute_scores(trials=trials, skills=list(config.skills.keys()))

    payload = EvalResults(
        run_id=run_id,
        created_at=datetime.now(tz=timezone.utc).isoformat(),
        config_path=str(Path(config_path).resolve()),
        tasks=tasks,
        skills=list(config.skills.keys()),
        trials=trials,
        scores=scores,
    )

    out_path = root / "results.json"
    out_path.write_text(json.dumps(_to_json(payload), indent=2, sort_keys=True))
    return out_path


def _prepare_fixtures(fixtures_dir: str | None, workdir: Path) -> None:
    if not fixtures_dir:
        return

    source = Path(fixtures_dir)
    if not source.exists():
        raise FileNotFoundError(f"fixtures_dir does not exist: {source}")

    for item in source.iterdir():
        dst = workdir / item.name
        if item.is_dir():
            shutil.copytree(item, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dst)


def _to_json(payload: EvalResults) -> dict:
    data = asdict(payload)

    for task in data["tasks"]:
        task["checks"] = [
            {"type": check["type"], "params": check["params"]}
            for check in task["checks"]
        ]

    for trial in data["trials"]:
        trial["checks"] = [
            {
                "passed": check["passed"],
                "name": check["name"],
                "details": check["details"],
            }
            for check in trial["checks"]
        ]

    return data
