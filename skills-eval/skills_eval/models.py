from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal


CheckType = Literal["file_exists", "file_contains", "command_exit", "custom"]


@dataclass(slots=True)
class CheckSpec:
    type: CheckType
    params: dict[str, Any]


@dataclass(slots=True)
class TaskSpec:
    id: str
    prompt: str
    checks: list[CheckSpec]
    difficulty: str = "normal"
    tags: list[str] = field(default_factory=list)
    fixtures_dir: str | None = None


@dataclass(slots=True)
class SkillConfig:
    name: str
    type: Literal["command", "mock"]
    command: str | None = None
    shell: str = "zsh"


@dataclass(slots=True)
class EvalConfig:
    tasks_glob: str
    trials: int
    timeout_s: int
    seed: int
    skills: dict[str, SkillConfig]


@dataclass(slots=True)
class AdapterRun:
    success: bool
    exit_code: int
    latency_ms: int
    stdout_path: Path
    stderr_path: Path
    cost: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class CheckResult:
    passed: bool
    name: str
    details: str = ""


@dataclass(slots=True)
class TrialResult:
    task_id: str
    skill: str
    trial_index: int
    adapter_success: bool
    exit_code: int
    latency_ms: int
    check_pass_count: int
    check_total: int
    full_pass: bool
    checks: list[CheckResult]
    stdout_path: str
    stderr_path: str
    workdir: str
    cost: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class SkillScore:
    task_success: float
    correctness: float
    reliability: float
    cost_efficiency: float
    latency: float
    total: float


@dataclass(slots=True)
class EvalResults:
    run_id: str
    created_at: str
    config_path: str
    tasks: list[TaskSpec]
    skills: list[str]
    trials: list[TrialResult]
    scores: dict[str, SkillScore]
