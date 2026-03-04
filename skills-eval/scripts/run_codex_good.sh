#!/usr/bin/env zsh
set -euo pipefail

PROMPT="$SKILL_PROMPT

Follow the task exactly.
Only make the minimal file changes needed in the current directory.
Do not add extra files."

codex exec \
  -c 'model_reasoning_effort="low"' \
  --skip-git-repo-check \
  --sandbox workspace-write \
  --full-auto \
  --cd "$SKILL_WORKDIR" \
  --output-last-message "$SKILL_WORKDIR/codex_final_message.txt" \
  "$PROMPT"
