// Consensus units for the 11-18 trust pages only (the new/changed privacy + terms strings in src/utils/i18n*.js and the
// /about/ + page-title copy in scripts/trust-copy.mjs), so the kit consensus judges just these and not the whole UI.
//   node tools/i18n/trust-units.mjs
//   node ~/projects/shared/game-kit/infra/i18n/consensus.mjs --site=cde --units=.image-work/i18n-review/units/units-trust.json --only='trust'
// Report-only, like tools/i18n/consensus-units.mjs: an agreed fix is ported back to the JS module by hand.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { t } from '../../src/utils/i18n.js'
import he from '../../src/utils/i18n-he.js'
import es from '../../src/utils/i18n-es.js'
import { ABOUT, FACTS_ES, LEGAL_META } from '../../scripts/trust-copy.mjs'

const OUT = '.image-work/i18n-review/units'
mkdirSync(OUT, { recursive: true })
const write = (name, o) => { writeFileSync(join(OUT, name), JSON.stringify(o, null, 1) + '\n'); return join(OUT, name) }

const UI_KEYS = ['privacyUpdated', 'termsUpdated', 'termsContentDesc', 'privacyCoppaTitle', 'privacyCoppaDesc', 'privacyRightsTitle',
  'privacyRightsDevice', 'privacyRightsCounts', 'privacyRightsErrors', 'privacyRightsWho']
// The English of the Spanish facts (FACTS_EN in generate-seo-pages.js, placeholders kept).
const FACTS_EN = {
  words: 'Children Do English has {words} English words in {cats} topics, each with a picture, audio, a kid-friendly definition and an example sentence.',
  glossAll: 'Every word has a Hebrew and a Spanish translation.',
  glossSome: 'Every word has a Hebrew translation, and {es} have a Spanish one.',
  audio: "Every word's audio uses one computer voice (Piper text-to-speech), the same on every device.",
  ladder: 'Each group of 10 words climbs an 11-step practice ladder: flashcards, listening and reading quizzes, spelling, a sentence step and arcade games.',
  games: 'There are {games} free arcade games and a live Class Battle for classrooms.',
  band1: "{band1} of the words are mapped to Israel's Band I vocabulary levels, and {units} textbook units have their own word pages.",
  free: 'It is free, has no ads, needs no account or sign-up, and keeps progress on the device.',
}
const NOTE = 'Privacy policy, terms and About page of a free English-vocabulary site for children 6-12; the reader is a parent or ' +
  'teacher. Every factual claim must stay exactly as narrow as the English (what is or is not collected, stored or sent): never ' +
  'widen or soften it. Audio is text-to-speech: never call it a native speaker or a recording. Hebrew: address the reader in the ' +
  'gender-neutral plural (אתם / plural imperatives). Spanish: tú. Keep [[/path/|text]] link markers, {placeholders}, product ' +
  'names (Children Do English, Sentry, Vercel, Piper, Class Battle, Band I) and the email address unchanged.'

const units = []
for (const [lang, tr] of [['he', he], ['es', es]]) {
  const en = {}, tx = {}
  for (const k of UI_KEYS) { en[`ui.${k}`] = t(k, 'en'); tx[`ui.${k}`] = tr[k] }
  for (const [k, v] of Object.entries(ABOUT.en)) { en[`about.${k}`] = v; tx[`about.${k}`] = ABOUT[lang][k] }
  for (const [k, v] of Object.entries(LEGAL_META.en)) { en[`meta.${k}`] = v; tx[`meta.${k}`] = LEGAL_META[lang][k] }
  if (lang === 'es') for (const [k, v] of Object.entries(FACTS_EN)) { en[`facts.${k}`] = v; tx[`facts.${k}`] = FACTS_ES[k] }
  const enPath = write(`trust-en-${lang}.json`, en)
  const path = write(`trust-${lang}.json`, tx)
  const keys = Object.keys(en)
  const half = Math.ceil(keys.length / 2)
  ;[keys.slice(0, half), keys.slice(half)].forEach((ks, i) => units.push({ id: `trust-${lang}-${i + 1}`, lang, kind: 'strings', path, en: enPath, keys: ks, note: NOTE }))
}
write('units-trust.json', units)
console.log(`trust units: ${units.map((u) => `${u.id} (${u.keys.length})`).join(', ')} → ${OUT}/units-trust.json`)
