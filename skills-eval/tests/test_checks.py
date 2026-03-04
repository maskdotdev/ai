from pathlib import Path

from skills_eval.checks import run_checks
from skills_eval.models import CheckSpec


def test_custom_check_supports_absolute_module_path(tmp_path: Path) -> None:
    module = tmp_path / "mycheck.py"
    module.write_text(
        "def ok(workdir):\n"
        "    return (workdir / 'signal.txt').exists(), 'missing signal'\n"
    )

    (tmp_path / "signal.txt").write_text("ok")

    checks = [
        CheckSpec(
            type="custom",
            params={"target": f"{module}:ok"},
        )
    ]

    results = run_checks(checks, workdir=tmp_path, timeout_s=5)
    assert len(results) == 1
    assert results[0].passed is True
