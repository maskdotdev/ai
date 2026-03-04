from __future__ import annotations

import glob
import shlex
from pathlib import Path
from typing import Any

import yaml

from skills_eval.models import CheckSpec, EvalConfig, SkillConfig, TaskSpec


class ConfigError(ValueError):
    pass


def _load_yaml(path: Path) -> dict[str, Any]:
    try:
        data = yaml.safe_load(path.read_text())
    except FileNotFoundError as exc:
        raise ConfigError(f"File not found: {path}") from exc
    except yaml.YAMLError as exc:
        raise ConfigError(f"Invalid YAML in {path}: {exc}") from exc

    if not isinstance(data, dict):
        raise ConfigError(f"Expected mapping at top-level: {path}")
    return data


def load_eval_config(path: str | Path) -> EvalConfig:
    config_path = Path(path)
    raw = _load_yaml(config_path)

    required = ["tasks_glob", "trials", "timeout_s", "skills"]
    missing = [k for k in required if k not in raw]
    if missing:
        raise ConfigError(f"Missing required config keys: {', '.join(missing)}")

    tasks_glob_raw = str(raw["tasks_glob"])
    if Path(tasks_glob_raw).is_absolute():
        tasks_glob = tasks_glob_raw
    else:
        tasks_glob = str((config_path.parent / tasks_glob_raw).resolve())

    skills_raw = raw["skills"]
    if not isinstance(skills_raw, dict) or not skills_raw:
        raise ConfigError("'skills' must be a non-empty mapping")

    skills: dict[str, SkillConfig] = {}
    for name, cfg in skills_raw.items():
        if not isinstance(cfg, dict):
            raise ConfigError(f"Skill '{name}' must be a mapping")

        skill_type = cfg.get("type", "command")
        if skill_type not in {"command", "mock"}:
            raise ConfigError(f"Skill '{name}' has unsupported type '{skill_type}'")

        command_raw = cfg.get("command")
        command = None
        if command_raw is not None:
            command = _resolve_command(str(command_raw), config_path.parent)

        shell = cfg.get("shell", "zsh")
        if skill_type == "command" and not command:
            raise ConfigError(f"Skill '{name}' of type command requires 'command'")

        skills[name] = SkillConfig(
            name=name,
            type=skill_type,
            command=command,
            shell=shell,
        )

    return EvalConfig(
        tasks_glob=tasks_glob,
        trials=int(raw["trials"]),
        timeout_s=int(raw["timeout_s"]),
        seed=int(raw.get("seed", 1337)),
        skills=skills,
    )


def _resolve_command(command: str, config_dir: Path) -> str:
    """Resolve relative executable path in the first token, preserving shell args."""
    try:
        tokens = shlex.split(command)
    except ValueError:
        # Keep original if shell parsing fails.
        return command

    if not tokens:
        return command

    first = tokens[0]
    if first.startswith("/"):
        return command

    candidate = (config_dir / first).resolve()
    if not candidate.exists():
        return command

    tokens[0] = str(candidate)
    return " ".join(shlex.quote(tok) for tok in tokens)


def load_task(path: Path) -> TaskSpec:
    raw = _load_yaml(path)

    required = ["id", "prompt", "checks"]
    missing = [k for k in required if k not in raw]
    if missing:
        raise ConfigError(f"Task {path} missing required keys: {', '.join(missing)}")

    checks_raw = raw["checks"]
    if not isinstance(checks_raw, list) or not checks_raw:
        raise ConfigError(f"Task {path} checks must be a non-empty list")

    checks: list[CheckSpec] = []
    for i, item in enumerate(checks_raw):
        if not isinstance(item, dict):
            raise ConfigError(f"Task {path} check #{i} must be a mapping")
        check_type = item.get("type")
        if check_type not in {"file_exists", "file_contains", "command_exit", "custom"}:
            raise ConfigError(f"Task {path} has invalid check type '{check_type}'")
        params = {k: v for k, v in item.items() if k != "type"}
        checks.append(CheckSpec(type=check_type, params=params))

    fixtures_dir = raw.get("fixtures_dir")
    if fixtures_dir:
        fixtures_dir = str((path.parent / str(fixtures_dir)).resolve())

    return TaskSpec(
        id=str(raw["id"]),
        prompt=str(raw["prompt"]),
        checks=checks,
        difficulty=str(raw.get("difficulty", "normal")),
        tags=[str(t) for t in raw.get("tags", [])],
        fixtures_dir=str(fixtures_dir) if fixtures_dir else None,
    )


def load_tasks(tasks_glob: str) -> list[TaskSpec]:
    paths = sorted(Path(p) for p in glob.glob(tasks_glob))
    if not paths:
        raise ConfigError(f"No task files matched: {tasks_glob}")
    tasks = [load_task(path) for path in paths]

    ids = [t.id for t in tasks]
    if len(ids) != len(set(ids)):
        raise ConfigError("Task ids must be unique")

    return tasks
