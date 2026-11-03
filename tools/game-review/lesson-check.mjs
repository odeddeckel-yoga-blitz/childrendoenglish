#!/usr/bin/env node
// lesson-check (kit v1.52.0, ISSUE-LOOP.md): a commit that changes a game must say where its lesson went, so a bug
// fixed in one game is also caught for every future game (creator), by the tester, and by the optimizer.
// Run by hooks/commit-msg:   node <this> <commit-msg-file>
// Changed game files are read from the index (git diff --cached). Game paths: KIT_GAME_PATHS (a regex), default
// ^public/games/[^_][^/]*/index\.html$ (shared code under public/games/_shared is infrastructure, not a game).
//
// Accepted trailers (one or more lines, any mix):
//   Lesson: gate <path>              a tester gate that now FAILS on the old game and passes on the fix (the file must exist)
//   Lesson: rule <FILE> §<n>         a creator rule (PATTERNS.md / GENERATION.md / plans/…) that prevents it in new games
//   Lesson: optimizer <path>         an engagement / improver step (the file must exist)
//   Lesson: covered <gate-name>      an existing gate already catches this class (the gate missed nothing new)
//   Lesson: none <reason>            a one-off with nothing to learn (content typo, art); ≥ 12 characters of reason
// Without one, the commit is refused with the ISSUE-LOOP checklist. Merges and reverts are skipped.
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const msgFile = process.argv[2]
if (!msgFile) { console.error('usage: lesson-check.mjs <commit-msg-file>'); process.exit(2) }
const msg = readFileSync(msgFile, 'utf8').split('\n').filter((l) => !l.startsWith('#')).join('\n')
if (/^(Merge|Revert) /.test(msg)) process.exit(0)

const GAME = new RegExp(process.env.KIT_GAME_PATHS || '^public/games/[^_/][^/]*/index\\.html$')
let changed = []
try { changed = execSync('git diff --cached --name-only --diff-filter=AM', { encoding: 'utf8' }).split('\n').filter((f) => GAME.test(f)) } catch (e) { process.exit(0) }
if (!changed.length) process.exit(0)

const bad = [], ok = []
for (const m of msg.matchAll(/^Lesson:\s*(\w+)\s+(.+?)\s*$/gim)) {
  const [kind, rest] = [m[1].toLowerCase(), m[2]]
  if (kind === 'gate' || kind === 'optimizer') (existsSync(rest.split(/\s/)[0]) ? ok : bad).push(`${kind} ${rest}` + (existsSync(rest.split(/\s/)[0]) ? '' : ' (file not found)'))
  else if (kind === 'rule') (/§\s*[\d.]+|^\S+\.md\b/.test(rest) ? ok : bad).push(`rule ${rest}` + (/§\s*[\d.]+|^\S+\.md\b/.test(rest) ? '' : ' (name the file and §)'))
  else if (kind === 'covered') ok.push(`covered ${rest}`)
  else if (kind === 'none') (rest.length >= 12 ? ok : bad).push(`none ${rest}` + (rest.length >= 12 ? '' : ' (say why there is nothing to learn)'))
  else bad.push(`${kind} ${rest} (unknown kind)`)
}
if (ok.length && !bad.length) process.exit(0)

const games = [...new Set(changed.map((f) => f.split('/').slice(-2, -1)[0]))]
console.error(`
✋ lesson-check: this commit changes ${games.length} game(s) (${games.slice(0, 6).join(', ')}${games.length > 6 ? ', …' : ''}) but does not say where the lesson went.
${bad.length ? '   Not accepted: ' + bad.join(' · ') + '\n' : ''}
   Every game issue gets the loop (kit ISSUE-LOOP.md):
     1. fix the game
     2. creator  — a rule in PATTERNS.md / GENERATION.md so new games are born without it
     3. tester   — a gate that FAILS on the old game and passes on the fix (or say which gate already covers it)
     4. optimizer — an engagement / improver step, if the issue changes how kids play
     5. propagate — run the gate over the whole catalogue and fix the others
     6. kit       — commit the kit (and add a line to kit LESSONS.jsonl), then sync this repo

   Add one or more trailer lines, e.g.:
     Lesson: gate tools/game-review/blank-commit-probe.mjs
     Lesson: rule PATTERNS.md §5.31
     Lesson: covered tap-reach
     Lesson: none spelling fix in the level-3 hint
`)
process.exit(1)
