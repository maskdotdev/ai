from __future__ import annotations

from pathlib import Path

import typer
from rich.console import Console

from skills_eval.gate import gate_results
from skills_eval.report import print_head_to_head, print_leaderboard
from skills_eval.runner import run_evaluation

app = typer.Typer(help="Local evaluation harness for comparing skills")
console = Console()


@app.command("run")
def cmd_run(
    config: Path = typer.Option(..., exists=True, readable=True, help="Path to eval config YAML"),
    artifacts_dir: Path = typer.Option(Path(".artifacts"), help="Directory for run artifacts"),
) -> None:
    results_path = run_evaluation(config_path=config, artifacts_root=artifacts_dir)
    console.print(f"[green]Run completed[/green]: {results_path}")
    print_leaderboard(results_path)


@app.command("report")
def cmd_report(
    results: Path = typer.Option(..., exists=True, readable=True, help="Path to results.json"),
) -> None:
    print_leaderboard(results)


@app.command("compare")
def cmd_compare(
    results: Path = typer.Option(..., exists=True, readable=True, help="Path to results.json"),
    skill_a: str = typer.Option(..., help="First skill name"),
    skill_b: str = typer.Option(..., help="Second skill name"),
) -> None:
    print_head_to_head(results, skill_a=skill_a, skill_b=skill_b)


@app.command("gate")
def cmd_gate(
    baseline: Path = typer.Option(..., exists=True, readable=True, help="Baseline results.json"),
    candidate: Path = typer.Option(..., exists=True, readable=True, help="Candidate results.json"),
    max_success_drop: float = typer.Option(0.02, help="Allowed drop in task_success"),
    max_latency_increase: float = typer.Option(
        0.05,
        help="Allowed increase in normalized latency",
    ),
    max_total_drop: float = typer.Option(0.02, help="Allowed drop in total score"),
) -> None:
    failures = gate_results(
        baseline_path=baseline,
        candidate_path=candidate,
        max_success_drop=max_success_drop,
        max_latency_increase=max_latency_increase,
        max_total_drop=max_total_drop,
    )
    if failures:
        console.print("[red]Gate failed:[/red]")
        for failure in failures:
            console.print(f"  - {failure}")
        raise typer.Exit(1)

    console.print("[green]Gate passed[/green]")


if __name__ == "__main__":
    app()
