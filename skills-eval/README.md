# skills-eval

Local, robust framework for evaluating and comparing skills with repeatable trials, deterministic checks, and regression gates.

## Setup (uv)

```bash
uv sync
```

## Quick start

Run a benchmark:

```bash
uv run skills-eval run --config bench/eval.example.yaml
```

Show leaderboard from a previous run:

```bash
uv run skills-eval report --results .artifacts/<RUN_ID>/results.json
```

Compare two skills head-to-head:

```bash
uv run skills-eval compare \
  --results .artifacts/<RUN_ID>/results.json \
  --skill-a skill_good \
  --skill-b skill_bad
```

Gate candidate against baseline:

```bash
uv run skills-eval gate \
  --baseline .artifacts/<BASELINE_RUN>/results.json \
  --candidate .artifacts/<CANDIDATE_RUN>/results.json \
  --max-success-drop 0.02 \
  --max-total-drop 0.02 \
  --max-latency-increase 0.05
```

## Task spec (`bench/tasks/*.yaml`)

Required fields:

- `id`: unique task id
- `prompt`: text passed to the skill as `SKILL_PROMPT`
- `checks`: list of checks

Optional fields:

- `difficulty`: free-form label
- `tags`: free-form labels
- `fixtures_dir`: directory copied into each trial workdir

Supported checks:

- `file_exists`: `path`
- `file_contains`: `path`, `text`
- `command_exit`: `command`, optional `exit_code` (default `0`)
- `custom`: `target` (`<path.py>:<function_name>`), optional `kwargs`

## Eval config

```yaml
tasks_glob: "bench/tasks/*.yaml"
trials: 5
timeout_s: 30
seed: 4242
skills:
  my_skill:
    type: command
    command: "./scripts/run_my_skill.sh"
    shell: zsh
```

## Skill command contract

For each trial, the framework executes each skill command in an isolated workdir with env vars:

- `SKILL_TASK_ID`
- `SKILL_PROMPT`
- `SKILL_WORKDIR`
- `SKILL_SEED`

A trial is considered full-pass when:

1. Skill command exits `0`
2. All checks pass

## Output artifacts

Each run writes to `.artifacts/<RUN_ID>/`:

- `results.json`: aggregate data and scores
- `/<skill>/<task>/trial_XX/workdir`: trial workspace
- `/<skill>/<task>/trial_XX/stdout.log`
- `/<skill>/<task>/trial_XX/stderr.log`

## Scoring

Per skill:

- `task_success`: full-pass rate across all trials
- `correctness`: average check pass ratio
- `reliability`: `1 - flaky_task_ratio`
- `cost_efficiency`: normalized inverse cost (if provided by adapter)
- `latency`: normalized inverse latency

Composite:

```text
0.50*task_success + 0.20*correctness + 0.15*reliability + 0.10*cost_efficiency + 0.05*latency
```

## Robustness defaults

- Repeat each task multiple times (`trials >= 5` recommended)
- Use deterministic checks whenever possible
- Keep tasks immutable and versioned
- Use `gate` in CI/local pre-merge to prevent silent regressions

## Skill usefulness eval (Codex)

Use the Codex skill-quality benchmark to compare:
- `codex_no_skill`
- `codex_skill_general`
- `codex_skill_aaa_lite`
- `codex_skill_aaa_full`

Run:

```bash
uv run skills-eval run --config bench/eval.codex.skill_quality.yaml
```

This benchmark uses:
- task: `bench/tasks/testgen_pytest_aaa.yaml`
- quality checker: `bench/checks/test_generation.py`
- wrappers: `scripts/run_codex_*`

### Loaded vs used

- **Loaded correctly** means the expected skill file had no load error in Codex stderr.
- **Used effectively** means output quality improved on task checks (for this benchmark: AAA structure + passing tests).

The framework records both:
- load health in `trial.metadata.expected_skill_load_ok`
- behavioral impact via deterministic checks and score deltas versus `codex_no_skill`
