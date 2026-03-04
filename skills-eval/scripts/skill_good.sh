#!/usr/bin/env zsh
set -euo pipefail

case "$SKILL_TASK_ID" in
  write_ready)
    print -r -- "READY" > answer.txt
    ;;
  write_json)
    print -r -- '{"ok": true}' > result.json
    ;;
  *)
    print -r -- "unknown task: $SKILL_TASK_ID" >&2
    exit 2
    ;;
esac
