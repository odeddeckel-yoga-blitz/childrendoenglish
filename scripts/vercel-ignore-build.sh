#!/bin/sh
# Vercel "Ignored Build Step" (vercel.json ignoreCommand). Exit 0 = SKIP this build, exit 1 = build.
# Skip only when every file changed since the last deployed commit is docs, a recurring-check log or a GSC snapshot:
# those don't change the site (cost plan, owner 11-07). Anything unsure (no base commit in the clone) builds.
BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -n "$BASE" ] || BASE="$(git rev-parse -q --verify HEAD^ 2>/dev/null)"
if [ -z "$BASE" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  git fetch -q --depth=50 origin 2>/dev/null
  git cat-file -e "$BASE^{commit}" 2>/dev/null || { echo "ignore-build: no base commit — building"; exit 1; }
fi
if git diff --quiet "$BASE" HEAD -- . \
  ':(exclude)*.md' ':(exclude)**/*.md' ':(exclude)plans/**' ':(exclude)docs/**' \
  ':(exclude).recurring-log.jsonl' ':(exclude).recurring-reads.jsonl' ':(exclude)tools/seo/snapshots/**'; then
  echo "ignore-build: only docs / logs / snapshots changed since $BASE — skipping the build"; exit 0
fi
echo "ignore-build: site files changed since $BASE — building"; exit 1
