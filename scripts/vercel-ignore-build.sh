#!/bin/sh
# Vercel "Ignored Build Step" (vercel.json ignoreCommand). Exit 0 = SKIP this build, exit 1 = build.
# Otherwise skip only when every file changed since the last deployed commit is docs, a recurring-check log or a GSC snapshot:
# those don't change the site (cost plan, owner 11-07). Anything unsure (no base commit in the clone) builds.
# Branch previews (owner 11-12, build cost): only main and preview-* branches build. Name a branch preview-<what>
# when it needs a preview deploy (server/api changes run .image-work/battle-e2e.mjs against one).
REF="${VERCEL_GIT_COMMIT_REF:-}"
if [ -n "$REF" ] && [ "$REF" != "main" ] && [ "${REF#preview-}" = "$REF" ]; then
  echo "ignore-build: branch $REF is not main or preview-* — skipping the preview build"; exit 0
fi
BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -n "$BASE" ] || BASE="$(git rev-parse -q --verify HEAD^ 2>/dev/null)"
if [ -z "$BASE" ] || ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  git fetch -q --depth=50 origin 2>/dev/null
  git cat-file -e "$BASE^{commit}" 2>/dev/null || { echo "ignore-build: no base commit — building"; exit 1; }
fi
# A redeploy of the SAME commit is deliberate (an env var changed, e.g. the 11-14 DB password rotation): always build.
if [ "$(git rev-parse "$BASE^{commit}")" = "$(git rev-parse HEAD)" ]; then echo "ignore-build: redeploy of the same commit — building"; exit 1; fi
if git diff --quiet "$BASE" HEAD -- . \
  ':(exclude)*.md' ':(exclude)**/*.md' ':(exclude)plans/**' ':(exclude)docs/**' \
  ':(exclude).recurring-log.jsonl' ':(exclude).recurring-reads.jsonl' ':(exclude)tools/seo/snapshots/**'; then
  echo "ignore-build: only docs / logs / snapshots changed since $BASE — skipping the build"; exit 0
fi
echo "ignore-build: site files changed since $BASE — building"; exit 1
