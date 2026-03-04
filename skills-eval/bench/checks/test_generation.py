from __future__ import annotations

import ast
from pathlib import Path


def validate_test_file(
    workdir: Path,
    path: str = "tests/test_calculator.py",
    min_tests: int = 2,
    require_aaa: bool = True,
    require_targets: list[str] | None = None,
) -> tuple[bool, str]:
    test_path = workdir / path
    if not test_path.exists():
        return False, f"missing test file: {test_path}"

    text = test_path.read_text(errors="replace")
    blocks = _test_blocks(text)
    if len(blocks) < min_tests:
        return False, f"expected >= {min_tests} tests, found {len(blocks)}"

    if require_aaa:
        missing = []
        for idx, block in enumerate(blocks, start=1):
            low = block.lower()
            if not ("arrange" in low and "act" in low and "assert" in low):
                missing.append(idx)
        if missing:
            return False, f"missing AAA markers in test blocks: {missing}"

    targets = require_targets or []
    for target in targets:
        needle = f"{target}("
        if needle not in text:
            return False, f"expected call to '{target}' not found"

    if "todo" in text.lower():
        return False, "test file contains TODO placeholder"

    return True, "ok"


def _test_blocks(text: str) -> list[str]:
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []

    lines = text.splitlines()
    blocks: list[str] = []
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
            start = max(1, int(node.lineno))
            end = int(getattr(node, "end_lineno", node.lineno))
            blocks.append("\n".join(lines[start - 1 : end]))
    return blocks
