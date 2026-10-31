#!/usr/bin/env node
// schema-gate.mjs — scan built HTML for JSON-LD types that NO LONGER get a Google rich result
// (or only get one under restrictions). Node >= 18, zero dependencies. Roadmap item R2X1.
//
//   node infra/seo/schema-gate.mjs <built-dir> [--strict] [--json]
//
// Default is report-only and exits 0. --strict exits 1 if anything is flagged (or a JSON-LD block
// fails to parse). The wording is deliberately "no Google rich result", NOT "remove": the markup is
// still valid schema.org, Google says it causes no ranking penalty, and Bing / AI assistants may
// still read it (FAQPage especially). Remove a block only when it is dead weight for every consumer.
//
// STATUS SOURCES (verified 2026-10-31 against Google Search Central):
//   [U]   Search Central changelog: https://developers.google.com/search/updates
//   [FAQ] https://developers.google.com/search/docs/appearance/structured-data/faqpage
//         2023-09-14: "only shown for well-known, authoritative government and health websites".
//         2026-05-08 changelog: "This feature will no longer appear in Google Search starting
//         May 7, 2026." 2026-06-15: docs removed, "The FAQ rich result feature is no longer shown
//         in Google Search results." So it is now retired for ALL sites, gov/health included.
//   [HOWTO] [U] 2023-09-14: HowTo docs removed "as this rich result is no longer shown in search
//         results, on both desktop and mobile devices". Background:
//         https://developers.google.com/search/blog/2023/08/howto-faq-changes
//   [SIMPLIFY] https://developers.google.com/search/blog/2025/06/simplifying-search-results
//         2025-06-12: phase-out of Book actions, Course info, ClaimReview, Estimated salary,
//         Learning video, Special announcement, Vehicle listing. [U] 2025-09-09: docs removed for
//         course info, estimated salary, learning video, special announcement, vehicle listing:
//         "These structured data types are no longer shown in Google Search results."
//   [PRACTICE] [U] 2025-11-05: "phasing out the practice problem and dataset structured data
//         types from Google Search results"; Dataset "is only used by Dataset Search, and not
//         Google Search". 2026-01-06: "The practice problem structured data type is no longer
//         shown in Google Search results."
//   [COURSELIST] https://developers.google.com/search/docs/appearance/structured-data/course
//         The Course LIST carousel is still documented (ItemList summary page + at least 3 Course
//         entities, English). Only Course INFO was retired.
//   [EDUQA] https://developers.google.com/search/docs/appearance/structured-data/education-qa
//         Education Q&A (Quiz of Question with eduQuestionType "Flashcard") is still documented
//         (last updated 2026-09-08), so flashcard Quizzes are NOT flagged.
// Re-verify when this file is touched: Google changes these often. Update RULES and this header.

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const typesOf = (n) => [].concat(n?.['@type'] || []).map((t) => String(t).replace(/^https?:\/\/schema\.org\//, ''))
const has = (n, k) => n && n[k] != null && n[k] !== ''

// Each rule: id, test(node) → bool, level ('retired' = no Google rich result at all;
// 'restricted' = only in a narrow form), message, source.
export const RULES = [
  { id: 'FAQPage', level: 'retired', source: '[FAQ]',
    test: (n) => typesOf(n).includes('FAQPage'),
    msg: 'no Google rich result: FAQ rich results retired for all sites 2026-05-07 (gov/health-only since 2023-09). May still help Bing / AI answers; keep only if the Q&A is real on-page content' },
  { id: 'HowTo', level: 'retired', source: '[HOWTO]',
    test: (n) => typesOf(n).includes('HowTo'),
    msg: 'no Google rich result: HowTo is not shown on desktop or mobile (since 2023-09-14)' },
  { id: 'Course', level: 'restricted', source: '[SIMPLIFY] [COURSELIST]',
    test: (n) => typesOf(n).includes('Course'),
    msg: 'Course info rich result retired 2025-09-09; Google only uses Course for the Course-list carousel (ItemList summary page + at least 3 courses, English)' },
  { id: 'LearningVideo', level: 'retired', source: '[SIMPLIFY]',
    test: (n) => typesOf(n).includes('VideoObject') && (has(n, 'educationalAlignment') || has(n, 'learningResourceType') || has(n, 'educationalLevel')),
    msg: 'no Google rich result for the Learning Video features (retired 2025-09-09); the plain VideoObject video features still apply' },
  { id: 'PracticeProblem', level: 'retired', source: '[PRACTICE] [EDUQA]',
    test: (n) => typesOf(n).includes('Quiz') && !isFlashcardQuiz(n),
    msg: 'no Google rich result: practice problems retired 2026-01-06 (a Quiz of only eduQuestionType "Flashcard" questions is Education Q&A, which is still supported)' },
  { id: 'SpecialAnnouncement', level: 'retired', source: '[SIMPLIFY]',
    test: (n) => typesOf(n).includes('SpecialAnnouncement'), msg: 'no Google rich result (retired 2025)' },
  { id: 'ClaimReview', level: 'retired', source: '[SIMPLIFY]',
    test: (n) => typesOf(n).includes('ClaimReview'), msg: 'no Google rich result (fact-check snippet phased out from 2025-06)' },
  { id: 'EstimatedSalary', level: 'retired', source: '[SIMPLIFY]',
    test: (n) => typesOf(n).some((t) => t === 'Occupation' || t === 'OccupationAggregationByEmployer') && has(n, 'estimatedSalary'),
    msg: 'no Google rich result (estimated salary retired 2025-09-09)' },
  { id: 'VehicleListing', level: 'retired', source: '[SIMPLIFY]',
    test: (n) => typesOf(n).some((t) => t === 'Car' || t === 'Vehicle') && has(n, 'offers'),
    msg: 'no Google rich result (vehicle listing retired 2025-09-09)' },
  { id: 'BookActions', level: 'retired', source: '[SIMPLIFY]',
    test: (n) => typesOf(n).includes('Book') && [].concat(n.potentialAction || []).some((a) => typesOf(a).some((t) => /^(Read|Borrow)Action$/.test(t))),
    msg: 'no Google rich result (book actions phased out from 2025-06)' },
  { id: 'Dataset', level: 'restricted', source: '[PRACTICE]',
    test: (n) => typesOf(n).includes('Dataset'), msg: 'not used by Google Search (Dataset Search only, since 2025-11)' },
]

function isFlashcardQuiz (n) {
  const qs = [].concat(n.hasPart || []).filter((q) => typesOf(q).includes('Question'))
  return qs.length > 0 && qs.every((q) => String(q.eduQuestionType || '').toLowerCase() === 'flashcard')
}

// Every object node anywhere in the JSON-LD (arrays, @graph, nested properties).
export function walk (value, out = []) {
  if (Array.isArray(value)) { for (const v of value) walk(v, out); return out }
  if (value && typeof value === 'object') {
    if (value['@type']) out.push(value)
    for (const v of Object.values(value)) if (v && typeof v === 'object') walk(v, out)
  }
  return out
}

export function extractJsonLd (html) {
  const blocks = []
  const re = /<script\b[^>]*\btype\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi
  for (const m of String(html).matchAll(re)) {
    const raw = m[1].trim()
    if (!raw) continue
    try { blocks.push({ data: JSON.parse(raw) }) } catch (e) { blocks.push({ error: e.message }) }
  }
  return blocks
}

// → { types: string[], findings: [{rule, level, msg, source, count}], errors: string[] }
export function scanHtml (html) {
  const types = new Set(); const hits = new Map(); const errors = []
  for (const b of extractJsonLd(html)) {
    if (b.error) { errors.push(b.error); continue }
    for (const n of walk(b.data)) {
      typesOf(n).forEach((t) => types.add(t))
      for (const r of RULES) {
        if (!r.test(n)) continue
        const h = hits.get(r.id) || { rule: r.id, level: r.level, msg: r.msg, source: r.source, count: 0 }
        h.count++; hits.set(r.id, h)
      }
    }
  }
  return { types: [...types].sort(), findings: [...hits.values()], errors }
}

export function listHtml (dir) {
  const out = []
  const skip = new Set(['node_modules', '.git', '.next', 'cache'])
  ;(function rec (d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!skip.has(e.name)) rec(path.join(d, e.name)) } else if (/\.html?$/i.test(e.name)) out.push(path.join(d, e.name))
    }
  })(dir)
  return out.sort()
}

export function scanDir (dir) {
  const files = []
  for (const f of listHtml(dir)) {
    const r = scanHtml(fs.readFileSync(f, 'utf8'))
    if (r.findings.length || r.errors.length) files.push({ file: path.relative(dir, f), ...r })
  }
  return { scanned: listHtml(dir).length, files }
}

function main () {
  const args = process.argv.slice(2)
  const strict = args.includes('--strict'); const asJson = args.includes('--json')
  const dir = args.find((a) => !a.startsWith('--'))
  if (!dir || !fs.existsSync(dir)) { console.error('usage: schema-gate.mjs <built-html-dir> [--strict] [--json]'); return 1 }
  const res = scanDir(dir)
  const flagged = res.files.filter((f) => f.findings.length).length
  const invalid = res.files.filter((f) => f.errors.length).length
  if (asJson) console.log(JSON.stringify(res, null, 2))
  else {
    for (const f of res.files) {
      console.log(f.file)
      for (const h of f.findings) console.log(`  [${h.level}] ${h.rule}${h.count > 1 ? ` ×${h.count}` : ''}: ${h.msg}`)
      for (const e of f.errors) console.log(`  [invalid] JSON-LD parse error: ${e}`)
    }
    const totals = {}
    for (const f of res.files) for (const h of f.findings) totals[h.rule] = (totals[h.rule] || 0) + 1
    console.log(`\nschema-gate: ${res.scanned} HTML file(s) scanned · ${flagged} with types that get no / restricted Google rich result · ${invalid} with invalid JSON-LD`)
    for (const [k, v] of Object.entries(totals).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v} file(s)`)
    if (flagged) console.log('  (report only: "no Google rich result" does not mean "remove"; Bing/AI may still use it. Sources are in this file\'s header.)')
  }
  return strict && (flagged || invalid) ? 1 : 0
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) process.exit(main())
