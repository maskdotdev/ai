#!/usr/bin/env zsh
set -euo pipefail

case "$SKILL_TASK_ID" in
  write_ready)
    print -r -- "NOT_READY" > answer.txt
    ;;
  write_json)
    print -r -- '{"ok": false}' > result.json
    ;;
  *)
    print -r -- "unknown task: $SKILL_TASK_ID" >&2
    exit 2
    ;;
esac
