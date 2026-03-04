#!/usr/bin/env zsh
set -euo pipefail

: "${SKILL_PROMPT:?SKILL_PROMPT must be set}"
: "${SKILL_WORKDIR:?SKILL_WORKDIR must be set}"

MODEL="${CODEX_MODEL:-gpt-5.3-codex}"
REASONING="${CODEX_REASONING:-low}"
PROFILE_NAME="${PROFILE_NAME:-default}"
SKILLS_CSV="${CODEX_SKILLS:-}"
EXPECTED_MANIFEST="$SKILL_WORKDIR/.eval_expected_skills.txt"
printf '' > "$EXPECTED_MANIFEST"

typeset -a CODEX_CFG_ARGS
CODEX_CFG_ARGS=(
  -c "model=\"$MODEL\""
  -c "model_reasoning_effort=\"$REASONING\""
)

skills_toml="skills.config=[]"
if [[ -n "$SKILLS_CSV" ]]; then
  skills_toml="skills.config=["
  first=1
  for skill_path in ${(s:,:)SKILLS_CSV}; do
    [[ -z "$skill_path" ]] && continue
    abs_path="$(cd "$(dirname "$skill_path")" && pwd)/$(basename "$skill_path")"
    print -r -- "$abs_path" >> "$EXPECTED_MANIFEST"
    if [[ $first -eq 0 ]]; then
      skills_toml+=", "
    fi
    first=0
    skills_toml+="{path=\"$abs_path\", enabled=true}"
  done
  skills_toml+="]"
fi

CODEX_CFG_ARGS+=(-c "$skills_toml")

PROMPT="$SKILL_PROMPT"
if [[ -n "${PROMPT_SUFFIX:-}" ]]; then
  PROMPT="$PROMPT

$PROMPT_SUFFIX"
fi

codex exec \
  "${CODEX_CFG_ARGS[@]}" \
  --skip-git-repo-check \
  --sandbox workspace-write \
  --full-auto \
  --cd "$SKILL_WORKDIR" \
  --output-last-message "$SKILL_WORKDIR/codex_final_message.txt" \
  "$PROMPT"
