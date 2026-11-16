#!/bin/sh
# Deploy-time IndexNow ping (owner 11-16, Bing plan; same shape as yoga's kit R2X3 wrapper). Run AFTER the production
# deploy is Ready: pings the pages the pushed range changed (tools/seo/seo-url-map.mjs), capped at 50, 14-day dedupe,
# refuses bulk, every row logged to ../shared/seo-logs/index-pushes.jsonl. State: tools/seo/.indexnow-last-deploy
# (the last pinged commit). Extra hand-picked pages: --urls-file <file>. Google still goes through push-index.py,
# run with INDEXNOW_KEY_DIR=/nonexistent so it doesn't send IndexNow a second time.
# Usage: sh tools/seo/indexnow-after-deploy.sh [--dry-run] [--urls-file f]
set -e
cd "$(dirname "$0")/../.."
STATE=tools/seo/.indexnow-last-deploy
PREV=$(cat "$STATE" 2>/dev/null || git rev-parse origin/main~1)
HEAD_SHA=$(git rev-parse origin/main)
node tools/seo/indexnow-deploy.mjs --production --site https://childrendoenglish.com --key-dir public \
  --git-range "$PREV..$HEAD_SHA" --map ./tools/seo/seo-url-map.mjs \
  --log "$HOME/projects/shared/seo-logs/index-pushes.jsonl" "$@"
case " $* " in *" --dry-run "*) ;; *) echo "$HEAD_SHA" > "$STATE" ;; esac
