from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from skills_eval.models import AdapterRun, SkillConfig, TaskSpec


class SkillAdapter(ABC):
    def __init__(self, skill: SkillConfig):
        self.skill = skill

    @abstractmethod
    def run(
        self,
        task: TaskSpec,
        workdir: Path,
        stdout_path: Path,
        stderr_path: Path,
        timeout_s: int,
        seed: int,
    ) -> AdapterRun:
        raise NotImplementedError
