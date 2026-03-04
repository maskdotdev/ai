#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR=${0:A:h}
PROFILE_NAME="no_skill" CODEX_SKILLS="" "$SCRIPT_DIR/run_codex_profile.sh"
