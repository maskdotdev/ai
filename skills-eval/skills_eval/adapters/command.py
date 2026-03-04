from __future__ import annotations

import os
import re
import subprocess
import time
from pathlib import Path

from skills_eval.adapters.base import SkillAdapter
from skills_eval.models import AdapterRun, TaskSpec


class CommandAdapter(SkillAdapter):
    def run(
        self,
        task: TaskSpec,
        workdir: Path,
        stdout_path: Path,
        stderr_path: Path,
        timeout_s: int,
        seed: int,
    ) -> AdapterRun:
        if not self.skill.command:
            raise ValueError("CommandAdapter requires skill.command")

        env = os.environ.copy()
        env["SKILL_TASK_ID"] = task.id
        env["SKILL_PROMPT"] = task.prompt
        env["SKILL_WORKDIR"] = str(workdir)
        env["SKILL_SEED"] = str(seed)

        start = time.perf_counter()
        with stdout_path.open("w") as out, stderr_path.open("w") as err:
            try:
                proc = subprocess.run(
                    self.skill.command,
                    shell=True,
                    executable=self._resolve_shell(),
                    cwd=workdir,
                    env=env,
                    timeout=timeout_s,
                    check=False,
                    stdout=out,
                    stderr=err,
                    text=True,
                )
                exit_code = proc.returncode
                success = exit_code == 0
            except subprocess.TimeoutExpired:
                exit_code = 124
                success = False
                err.write(f"Timed out after {timeout_s} seconds\n")

        latency_ms = int((time.perf_counter() - start) * 1000)
        metadata = self._extract_metadata(stderr_path=stderr_path, workdir=workdir)
        return AdapterRun(
            success=success,
            exit_code=exit_code,
            latency_ms=latency_ms,
            stdout_path=stdout_path,
            stderr_path=stderr_path,
            metadata=metadata,
        )

    def _resolve_shell(self) -> str:
        shell = self.skill.shell.strip()
        if shell.startswith("/"):
            return shell
        return f"/bin/{shell}"

    def _extract_metadata(self, stderr_path: Path, workdir: Path) -> dict:
        stderr_text = stderr_path.read_text(errors="replace")
        matches = re.findall(r"failed to load skill ([^:]+): (.+)", stderr_text)

        skill_load_errors = [
            {"skill_path": skill_path.strip(), "error": error.strip()}
            for skill_path, error in matches
        ]

        expected_paths = self._read_expected_skills(workdir)
        expected_set = {str(Path(p).resolve()) for p in expected_paths}

        expected_errors = [
            err for err in skill_load_errors if str(Path(err["skill_path"]).resolve()) in expected_set
        ]
        unexpected_errors = [
            err for err in skill_load_errors if str(Path(err["skill_path"]).resolve()) not in expected_set
        ]

        return {
            "skill_load_error_count": len(skill_load_errors),
            "skill_load_ok": len(skill_load_errors) == 0,
            "skill_load_errors": skill_load_errors,
            "expected_skill_paths": expected_paths,
            "expected_skill_load_error_count": len(expected_errors),
            "expected_skill_load_ok": len(expected_errors) == 0,
            "expected_skill_load_errors": expected_errors,
            "unexpected_skill_load_error_count": len(unexpected_errors),
            "unexpected_skill_load_errors": unexpected_errors,
        }

    def _read_expected_skills(self, workdir: Path) -> list[str]:
        manifest = workdir / ".eval_expected_skills.txt"
        if not manifest.exists():
            return []
        lines = [line.strip() for line in manifest.read_text(errors="replace").splitlines()]
        return [line for line in lines if line]
