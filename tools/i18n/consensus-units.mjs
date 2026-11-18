// Export CDE's translations as JSON units for the kit's i18n consensus (infra/i18n/consensus.mjs, read i18n-consensus).
// CDE keeps translations in JS modules (src/utils/i18n-{he,es}.js, word glosses in words.js / word-glosses-es.js), which
// the consensus can't read, so this writes plain JSON copies + a units file under .image-work/i18n-review/units/.
// The consensus then runs report-only: an agreed fix is ported back to the JS module by hand (never --apply here).
//   node tools/i18n/consensus-units.mjs [--chunk=60]
//   node ~/projects/shared/game-kit/infra/i18n/consensus.mjs --site=cde --units=.image-work/i18n-review/units/units.json --list
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { t } from '../../src/utils/i18n.js'
import { WORDS } from '../../src/data/words.js'
import he from '../../src/utils/i18n-he.js'
import es from '../../src/utils/i18n-es.js'
import glossEs from '../../src/data/word-glosses-es.js'
import { READINGS } from '../../src/data/readings.js'
import { READING_GLOSSES, READING_PHRASES, READING_GLOSSES_ES, READING_PHRASES_ES } from '../../src/data/readingGlosses.js'
import { READING_UI } from '../../src/data/readingUi.js'

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d }
const CHUNK = +arg('chunk', 60)
const OUT = '.image-work/i18n-review/units'
mkdirSync(OUT, { recursive: true })
const write = (name, o) => { writeFileSync(join(OUT, name), JSON.stringify(o, null, 1) + '\n'); return join(OUT, name) }
const chunks = (keys) => Array.from({ length: Math.ceil(keys.length / CHUNK) }, (_, i) => keys.slice(i * CHUNK, (i + 1) * CHUNK))

const units = []
const UI_NOTE = 'App UI strings for children 6-12 learning English; short, friendly, kid-level. {placeholders} must stay. ' +
  'Audio is text-to-speech: never call it a native speaker or a recording.'
for (const [lang, tr] of [['he', he], ['es', es]]) {
  const keys = Object.keys(tr).filter((k) => typeof tr[k] === 'string')
  const en = write(`ui-en-${lang}.json`, Object.fromEntries(keys.map((k) => [k, t(k, 'en')])))
  const path = write(`ui-${lang}.json`, Object.fromEntries(keys.map((k) => [k, tr[k]])))
  chunks(keys).forEach((ks, i) => units.push({ id: `${lang}-ui-${i + 1}`, lang, kind: 'strings', path, en, keys: ks, note: UI_NOTE }))
}

const GLOSS_NOTE = 'One-word kid-level glosses of English vocabulary (the English gives the word and its definition). ' +
  'Bare form, no article, shortest natural word a child would know.'
const enGloss = (w) => `${w.word} (${w.partOfSpeech}: ${w.definition})`
for (const [lang, get] of [['he', (w) => w.hebrewTranslation], ['es', (w) => glossEs[w.id]]]) {
  const ws = WORDS.filter((w) => get(w))
  const en = write(`gloss-en-${lang}.json`, Object.fromEntries(ws.map((w) => [w.id, enGloss(w)])))
  const path = write(`gloss-${lang}.json`, Object.fromEntries(ws.map((w) => [w.id, get(w)])))
  chunks(ws.map((w) => w.id)).forEach((ks, i) => units.push({ id: `${lang}-gloss-${i + 1}`, lang, kind: 'strings', path, en, keys: ks, note: GLOSS_NOTE }))
}

// Graded readers (11-18): tap-a-word glosses (each key judged with the first sentence it appears in) and the
// reading pages' UI copy. Hebrew: only the wave-1 entries (the RC11 ones shipped 10-31); Spanish: all of them.
// Ids rd-<lang>-gloss-N / rd-<lang>-ui, so `--only='^rd-'` runs just these.
const RD_NOTE = 'Tap-a-word glosses in short English reading texts for children 6-12: the meaning of the word AS USED in the ' +
  'example sentence, kid-level; past-tense forms may list the forms used (e.g. "I walked / they walked"). Two-word keys are phrases. ' +
  'Hebrew glosses may use the slash form for gender (אוכל/ת). Spanish: Latin-American.'
const RD_UI_NOTE = 'UI copy of free English reading pages for children 6-12 (tap a word for its meaning, 3 questions, a printable sheet). ' +
  '{placeholders} must stay. Hebrew: gender-neutral plural forms. Audio is a computer voice (text-to-speech): never call it a native speaker or a recording.'
const firstUse = (key) => {
  const words = key.split(' ')
  for (const r of READINGS) for (const s of [...r.text, ...r.questions.flatMap((q) => [q.q, ...q.options])]) {
    const toks = (s.match(/[A-Za-z][A-Za-z']*/g) || []).map((x) => x.toLowerCase())
    if (toks.some((_, i) => words.every((w, j) => toks[i + j] === w))) return s
  }
  return ''
}
// RC11 = the 8 texts with a Band I `level`; their Hebrew glosses were already live, so only keys they don't use are new.
const RC11 = READINGS.filter((r) => r.level)
const usedIn = (rs, key) => { const w = key.split(' '); return rs.some((r) => [...r.text, ...r.questions.flatMap((q) => [q.q, ...q.options])].some((s) => { const t = (s.match(/[A-Za-z][A-Za-z']*/g) || []).map((x) => x.toLowerCase()); return t.some((_, i) => w.every((x, j) => t[i + j] === x)) })) }
const RC11_KEYS = new Set(Object.keys({ ...READING_PHRASES, ...READING_GLOSSES }).filter((k) => usedIn(RC11, k)))
const RD_CHUNK = +arg('rd-chunk', 90)
const rdChunks = (keys) => Array.from({ length: Math.ceil(keys.length / RD_CHUNK) }, (_, i) => keys.slice(i * RD_CHUNK, (i + 1) * RD_CHUNK))
const rdEn = (key) => { const s = firstUse(key); return s ? `${key} — as in: "${s}"` : key }
for (const [lang, phrases, glosses, keep] of [
  ['he', READING_PHRASES, READING_GLOSSES, (k) => !RC11_KEYS.has(k)],
  ['es', READING_PHRASES_ES, READING_GLOSSES_ES, () => true],
]) {
  const all = { ...phrases, ...glosses }
  const keys = Object.keys(all).filter(keep)
  const en = write(`rd-gloss-en-${lang}.json`, Object.fromEntries(keys.map((k) => [k, rdEn(k)])))
  const path = write(`rd-gloss-${lang}.json`, Object.fromEntries(keys.map((k) => [k, all[k]])))
  rdChunks(keys).forEach((ks, i) => units.push({ id: `rd-${lang}-gloss-${i + 1}`, lang, kind: 'strings', path, en, keys: ks, note: RD_NOTE }))
  const uiKeys = Object.keys(READING_UI[lang])
  const uiEn = write(`rd-ui-en-${lang}.json`, Object.fromEntries(uiKeys.map((k) => [k, READING_UI.en[k]])))
  const uiPath = write(`rd-ui-${lang}.json`, Object.fromEntries(uiKeys.map((k) => [k, READING_UI[lang][k]])))
  units.push({ id: `rd-${lang}-ui`, lang, kind: 'strings', path: uiPath, en: uiEn, keys: uiKeys, note: RD_UI_NOTE })
}

write('units.json', units)
console.log(`consensus units: ${units.length} (${units.map((u) => u.id).join(', ')}) → ${OUT}/units.json`)
