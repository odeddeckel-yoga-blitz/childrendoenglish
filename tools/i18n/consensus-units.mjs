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

write('units.json', units)
console.log(`consensus units: ${units.length} (${units.map((u) => u.id).join(', ')}) → ${OUT}/units.json`)
