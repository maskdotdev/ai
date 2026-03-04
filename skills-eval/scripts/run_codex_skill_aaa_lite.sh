#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR=${0:A:h}
PROFILE_NAME="skill_aaa_lite" \
CODEX_SKILLS="$SCRIPT_DIR/../bench/skills/testgen_aaa_lite/SKILL.md" \
PROMPT_SUFFIX='Use $testgen-aaa-lite skill instructions for this task.' \
"$SCRIPT_DIR/run_codex_profile.sh"
