#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR=${0:A:h}
PROFILE_NAME="skill_general" \
CODEX_SKILLS="$SCRIPT_DIR/../bench/skills/testgen_general/SKILL.md" \
PROMPT_SUFFIX='Use $testgen-general skill instructions for this task.' \
"$SCRIPT_DIR/run_codex_profile.sh"
