// persona-counts.mjs — P5 of the persona standard (PATTERNS §3e): no hand-typed catalogue counts. (2026-10-30)
//   node <kit>/test/persona-counts.mjs [dir …]      # default: src (run from the site root)
// A count shown to people ("287 games", "450+ math games", "60 poses") must come from ONE data source (the registry
// length, rounded by one shared helper) — typed numbers drift: KDM showed 287+214, "450+" and "287 games, 11 topics" on
// three pages at once. Flags string literals with a number next to a catalogue noun. Interpolated values (`${n} games`,
// {count} games) pass. A deliberate fixed number (a quote, a study) can carry `persona-ok` on the same line.
// Exit 1 on any hit.
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, extname } from 'path'
const dirs = process.argv.slice(2).filter((a) => !a.startsWith('--')); if (!dirs.length) dirs.push('src')
const NOUN = process.env.PERSONA_NOUNS || 'games?|activities|poses|mudras|words|lessons|quizzes|worksheets|topics'
const RE = new RegExp(String.raw`(?<![\w$.{-])(\d{2,5})\+?\s+(?:free\s+|fun\s+|interactive\s+)?(?:(?:math|science|english|yoga|kids'?|online|educational)\s+(?:and\s+|&\s+|&amp;\s+)?)*(?:` + NOUN + String.raw`)\b`, 'i')
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.astro', '.md', '.mdx', '.html', '.json'])
const SKIP = /node_modules|__tests__|\.test\.|\/test\/|\/data\/|\/i18n\/|\.next|dist/
const hits = []
function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (SKIP.test(p)) continue; const s = statSync(p)
  if (s.isDirectory()) walk(p); else if (EXT.has(extname(p))) readFileSync(p, 'utf8').split('\n').forEach((ln, i) => {
    if (/persona-ok/.test(ln) || /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(ln)) return   // comments describe history, not the page
    const m = ln.match(RE); if (m && !/^\s*(played|mastered|completed|in a row|per|a day|a week)\b/i.test(ln.slice(ln.indexOf(m[0]) + m[0].length))) hits.push(`${p}:${i + 1}  "${m[0]}"  ${ln.trim().slice(0, 110)}`) }) } }
for (const d of dirs) walk(d)
for (const h of hits) console.log(h)
console.log(`persona-counts: ${hits.length} hand-typed count(s) in ${dirs.join(', ')}`)
process.exit(hits.length ? 1 : 0)
