import json
from pathlib import Path

from skills_eval.runner import run_evaluation


def test_run_evaluation_smoke(tmp_path: Path) -> None:
    out = run_evaluation("bench/eval.example.yaml", artifacts_root=tmp_path)
    assert out.exists()

    payload = json.loads(out.read_text())
    assert "scores" in payload
    assert set(payload["skills"]) == {"skill_good", "skill_bad"}

    good = payload["scores"]["skill_good"]
    bad = payload["scores"]["skill_bad"]
    assert good["task_success"] > bad["task_success"]
