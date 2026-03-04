---
name: testgen-aaa-full
description: "Detailed pytest generation workflow emphasizing strict Arrange-Act-Assert structure and coverage quality."
metadata:
  tags: testing, pytest, aaa, quality
---

# AAA Full Test Generation

Use this workflow whenever you are asked to create tests.

## Goals
- Produce deterministic pytest tests.
- Validate both happy path and error behavior.
- Keep tests highly readable with explicit Arrange/Act/Assert phases.

## Requirements
1. Write tests in `pytest` style (`def test_...`).
2. Every test must contain explicit phase comments:
   - `# Arrange`
   - `# Act`
   - `# Assert`
3. Include at least one happy-path test and one error-path test.
4. Assert on outcomes, exceptions, and key messages where relevant.
5. Avoid over-mocking and implementation-detail assertions.

## Quality bar
- Clear test names that describe behavior.
- No dead code, no TODO placeholders.
- Tests should pass immediately.
