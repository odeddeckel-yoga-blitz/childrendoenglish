#!/bin/sh
# Stop hook: fast check (lint + unit tests, no build) when tracked files changed.
# Exit 2 feeds the failure tail back to Claude. Skips when already re-run from a
# Stop hook (stop_hook_active) so a pre-existing failure can't loop forever.
cd "$CLAUDE_PROJECT_DIR" || exit 0
grep -q '"stop_hook_active": *true' 2>/dev/null && exit 0
git diff --quiet HEAD 2>/dev/null && exit 0
OUT=$(mktemp)
if ! { npm run lint --silent && npx vitest run --reporter=dot; } >"$OUT" 2>&1; then
  echo "Stop check failed (lint/unit):" >&2
  tail -40 "$OUT" >&2
  rm -f "$OUT"; exit 2
fi
rm -f "$OUT"; exit 0
