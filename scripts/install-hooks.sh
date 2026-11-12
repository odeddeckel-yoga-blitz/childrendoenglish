#!/bin/sh
# Hooks run from ONE place that tracks origin/main, not from a working tree (kit PATTERNS §8f(e), owner OK 11-12).
# core.hooksPath used to point at the main checkout's .githooks, so every worktree push ran whatever branch that
# checkout had out (ahead of or behind main). This copies origin/main's .githooks into <git common dir>/kit-hooks and
# points core.hooksPath there; a guard change takes effect when it lands on main. Each hook prints its source sha.
# Run after every merge to main and every kit sync (post-merge and scripts/sync-game-kit.mjs call it).
#   sh scripts/install-hooks.sh            install from origin/main (after a fetch)
#   sh scripts/install-hooks.sh --no-fetch install from the origin/main already fetched
set -e
[ "$1" = "--no-fetch" ] || git fetch -q origin main 2>/dev/null || echo "install-hooks: fetch failed, using the origin/main already fetched" >&2
SHA=$(git rev-parse --short origin/main)
DIR="$(cd "$(git rev-parse --git-common-dir)" && pwd)/kit-hooks"
mkdir -p "$DIR"
for f in $(git ls-tree --name-only origin/main .githooks/); do
  name=$(basename "$f")
  { git show "origin/main:$f" | sed -n 1p
    echo "echo \"$name @ $SHA (origin/main)\" >&2"
    git show "origin/main:$f" | sed 1d; } > "$DIR/$name.tmp"
  chmod +x "$DIR/$name.tmp"
  mv "$DIR/$name.tmp" "$DIR/$name"
done
echo "$SHA" > "$DIR/.source"
git config core.hooksPath "$DIR"
echo "install-hooks: $(ls "$DIR" | tr '\n' ' ')from origin/main @ $SHA → $DIR"
