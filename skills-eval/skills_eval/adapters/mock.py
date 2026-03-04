from __future__ import annotations

from pathlib import Path

from skills_eval.adapters.base import SkillAdapter
from skills_eval.models import AdapterRun, TaskSpec


class MockAdapter(SkillAdapter):
    """Useful for harness self-tests; always succeeds."""

    def run(
        self,
        task: TaskSpec,
        workdir: Path,
        stdout_path: Path,
        stderr_path: Path,
        timeout_s: int,
        seed: int,
    ) -> AdapterRun:
        stdout_path.write_text(f"MOCK SKILL for task={task.id} seed={seed}\n")
        stderr_path.write_text("")
        return AdapterRun(
            success=True,
            exit_code=0,
            latency_ms=1,
            stdout_path=stdout_path,
            stderr_path=stderr_path,
        )
