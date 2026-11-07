#!/bin/sh
# Stop hook: fast check (lint + unit tests, no build) when tracked files changed.
# Exit 2 feeds the failure tail back to Claude. Skips when already re-run from a
# Stop hook (stop_hook_active) so a pre-existing failure can't loop forever.
cd "$CLAUDE_PROJECT_DIR" || exit 0
grep -q '"stop_hook_active": *true' 2>/dev/null && exit 0
# Skip inside headless `claude -p` runs (tool-less judges, e.g. tools/game-review/*judge*.mjs). They never edit code,
# and a full test run per judge x concurrency drove the Mac to load ~450 on 11-02. Walks up the parent chain.
pid=$PPID
for _ in 1 2 3 4 5 6; do
  [ -z "$pid" ] || [ "$pid" -le 1 ] && break
  cmd=$(ps -o command= -p "$pid" 2>/dev/null)
  echo "$cmd" | grep -qE '(^|/)claude( .*)? (-p|--print)( |$)' && exit 0
  pid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
done
git diff --quiet HEAD 2>/dev/null && [ -z "$(git ls-files --others --exclude-standard)" ] && exit 0
# Only code the checks cover (cost plan, owner 11-07): image/audio/log/plan batches used to re-run lint + vitest at
# every turn end. src/ api/ tools/ scripts/ and page/game JS are what eslint + vitest read.
CHANGED=$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null )
echo "$CHANGED" | grep -qE '^(src|api|tools|scripts)/|^public/.*\.(js|mjs)$|^package(-lock)?\.json$|^vite\.config|^eslint' || exit 0
OUT=$(mktemp)
if ! { npm run lint --silent && npx vitest run --reporter=dot; } >"$OUT" 2>&1; then
  echo "Stop check failed (lint/unit):" >&2
  tail -40 "$OUT" >&2
  rm -f "$OUT"; exit 2
fi
rm -f "$OUT"; exit 0
