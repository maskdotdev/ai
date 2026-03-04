from pathlib import Path

from skills_eval.loaders import load_eval_config, load_tasks


def test_load_eval_config() -> None:
    cfg = load_eval_config("bench/eval.example.yaml")
    assert cfg.trials == 5
    assert "skill_good" in cfg.skills


def test_load_tasks() -> None:
    tasks = load_tasks("bench/tasks/*.yaml")
    assert {t.id for t in tasks} >= {"write_ready", "write_json", "testgen_pytest_aaa"}
    assert all(t.checks for t in tasks)


def test_unique_ids(tmp_path: Path) -> None:
    (tmp_path / "a.yaml").write_text("id: x\nprompt: p\nchecks:\n  - type: file_exists\n    path: a.txt\n")
    (tmp_path / "b.yaml").write_text("id: x\nprompt: p\nchecks:\n  - type: file_exists\n    path: b.txt\n")

    try:
        load_tasks(str(tmp_path / "*.yaml"))
        assert False, "Expected duplicate id error"
    except ValueError as exc:
        assert "unique" in str(exc).lower()
