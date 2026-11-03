# The issue loop — every game issue makes every game better (kit v1.52.0)

Owner rule (2026-11-02): an issue found in ONE game is never just fixed there. It goes round the loop, so the creator
stops making it, the tester catches it, the optimizer knows it, every existing game is checked for it, and every app
that uses this kit gets the lesson.

## The loop (after every real issue — from a review, a test sweep, a Sentry alert or a teacher)

1. **Fix** the game. Verify with the check that found it.
2. **Creator** — a rule in `PATTERNS.md` (robustness, §4/§5) or `GENERATION.md` (design) so a new game is born without
   the issue. If the template can make it impossible (the CHECK pinned by default, 1.51.0), change the template.
3. **Tester** — the gate that would have caught it. It must **fail on the old game and pass on the fixed one**: check
   out the old file and run it (git stash / `git show HEAD~1:<file>`). If an existing gate already catches it, say so.
   If the gate missed it, find out WHY before writing a new one (2026-11-02: tap-reach stages the answer in one go, so a
   work log that grows with each real step never pushed CHECK down — only real step-by-step play shows it).
4. **Optimizer** — if the issue changes how kids play (a wall, a giveaway, a dead control), add the signal or the step
   to the engagement optimizer / improver recipe so it is looked for in the data.
5. **Propagate** — run the gate over the whole catalogue; fix the other games in the same pass or list them.
6. **Kit** — commit the kit with a line in `LESSONS.jsonl`, bump `VERSION`, then run each consumer's
   `scripts/sync-game-kit.mjs`. Tell the Factory session which version carries it (a message; pushes stay with the owner).

## How it is enforced

- `hooks/commit-msg` + `test/lesson-check.mjs`: a commit that changes a game file must carry at least one trailer:
  ```
  Lesson: gate tools/game-review/blank-commit-probe.mjs   ← the file must exist
  Lesson: rule PATTERNS.md §5.31
  Lesson: optimizer tools/engagement/optimizer.mjs
  Lesson: covered tap-reach                               ← an existing gate already catches this class
  Lesson: none spelling fix in the level-3 hint            ← a one-off; say why
  ```
  Otherwise the commit is refused and this checklist is printed. Merges and reverts are skipped.
- `LESSONS.jsonl` — one line per lesson, append-only:
  `{"date","app","issue","games","creator","tester","optimizer","kit"}` — `creator`/`tester`/`optimizer` name the rule,
  gate or step (or `"-"` when that part does not apply). Consumers read it to see what is new after a sync.

## Wiring a consumer (any app that uses the kit)

Add to its `scripts/sync-game-kit.mjs` MAP:
```
'hooks/commit-msg':      '.githooks/commit-msg',          // or the repo's core.hooksPath
'test/lesson-check.mjs': 'tools/game-review/lesson-check.mjs',
'ISSUE-LOOP.md':         'plans/issue-loop.md',
```
then `git config core.hooksPath .githooks` (once per clone) and `chmod +x .githooks/commit-msg`. Set `KIT_GAME_PATHS` if
games live somewhere other than `public/games/<id>/index.html`.
