from __future__ import annotations

import importlib.util
import shlex
import subprocess
from pathlib import Path
from typing import Any, Callable

from skills_eval.models import CheckResult, CheckSpec


def run_checks(checks: list[CheckSpec], workdir: Path, timeout_s: int) -> list[CheckResult]:
    results: list[CheckResult] = []
    for check in checks:
        handler = _HANDLERS[check.type]
        results.append(handler(check.params, workdir, timeout_s))
    return results


def _check_file_exists(params: dict[str, Any], workdir: Path, timeout_s: int) -> CheckResult:
    rel_path = params.get("path")
    if not rel_path:
        return CheckResult(passed=False, name="file_exists", details="Missing 'path'")
    path = workdir / str(rel_path)
    passed = path.exists()
    return CheckResult(
        passed=passed,
        name=f"file_exists:{rel_path}",
        details="" if passed else f"Missing file: {path}",
    )


def _check_file_contains(params: dict[str, Any], workdir: Path, timeout_s: int) -> CheckResult:
    rel_path = params.get("path")
    text = params.get("text")
    if not rel_path or text is None:
        return CheckResult(passed=False, name="file_contains", details="Missing 'path' or 'text'")
    path = workdir / str(rel_path)
    if not path.exists():
        return CheckResult(
            passed=False,
            name=f"file_contains:{rel_path}",
            details=f"File not found: {path}",
        )
    contents = path.read_text(errors="replace")
    passed = str(text) in contents
    return CheckResult(
        passed=passed,
        name=f"file_contains:{rel_path}",
        details="" if passed else f"Did not find expected text: {text!r}",
    )


def _check_command_exit(params: dict[str, Any], workdir: Path, timeout_s: int) -> CheckResult:
    command = params.get("command")
    expected_exit = int(params.get("exit_code", 0))
    if not command:
        return CheckResult(passed=False, name="command_exit", details="Missing 'command'")

    try:
        proc = subprocess.run(
            str(command),
            cwd=workdir,
            shell=True,
            executable="/bin/zsh",
            timeout=timeout_s,
            check=False,
            capture_output=True,
            text=True,
        )
        passed = proc.returncode == expected_exit
        details = "" if passed else f"expected={expected_exit} actual={proc.returncode}"
        return CheckResult(passed=passed, name=f"command_exit:{shlex.quote(str(command))}", details=details)
    except subprocess.TimeoutExpired:
        return CheckResult(
            passed=False,
            name=f"command_exit:{shlex.quote(str(command))}",
            details=f"Timed out after {timeout_s}s",
        )


def _check_custom(params: dict[str, Any], workdir: Path, timeout_s: int) -> CheckResult:
    target = params.get("target")
    kwargs = params.get("kwargs", {})
    if not target or ":" not in str(target):
        return CheckResult(
            passed=False,
            name="custom",
            details="Missing/invalid 'target'. Use '<path.py>:<function_name>'",
        )

    module_path_raw, fn_name = str(target).split(":", 1)
    candidate = Path(module_path_raw)
    if candidate.is_absolute():
        module_path = candidate
    else:
        module_path = (workdir / module_path_raw).resolve()
    if not module_path.exists():
        return CheckResult(
            passed=False,
            name=f"custom:{target}",
            details=f"Module not found: {module_path}",
        )

    fn = _load_callable(module_path, fn_name)
    try:
        result = fn(workdir=workdir, **kwargs)
    except Exception as exc:  # noqa: BLE001 - check function is user provided
        return CheckResult(
            passed=False,
            name=f"custom:{target}",
            details=f"Custom check raised: {exc}",
        )

    if isinstance(result, tuple) and len(result) == 2:
        passed, details = bool(result[0]), str(result[1])
    else:
        passed, details = bool(result), ""

    return CheckResult(passed=passed, name=f"custom:{target}", details=details)


def _load_callable(module_path: Path, fn_name: str) -> Callable[..., Any]:
    spec = importlib.util.spec_from_file_location(module_path.stem, module_path)
    if spec is None or spec.loader is None:
        raise ValueError(f"Unable to load module spec from {module_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    fn = getattr(module, fn_name, None)
    if not callable(fn):
        raise ValueError(f"Function '{fn_name}' not found in {module_path}")
    return fn


_HANDLERS = {
    "file_exists": _check_file_exists,
    "file_contains": _check_file_contains,
    "command_exit": _check_command_exit,
    "custom": _check_custom,
}
