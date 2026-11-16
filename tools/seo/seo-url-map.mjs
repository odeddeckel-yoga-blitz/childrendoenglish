// Repo file → live URL(s) for the kit's indexnow-deploy.mjs (--git-range mode; deploy-time IndexNow, owner 11-16 via
// the Bing plan). CDE's pages are generated from data, so only changes that name their pages map to URLs:
//   - scripts/published-word-urls.json: the word pages ADDED in the range (a newly published word);
//   - scripts/seo-title-overrides.json: the pages whose title/meta entry was added or changed;
//   - public/games/<id>/…: that game's page /games/<id>/.
// Everything else (the page generator, words.js, shared CSS, the app) returns null on purpose: it touches hundreds of
// pages at once, and a whole-site ping is the "batch mode" Bing warns about. Those pages reach Bing via the sitemap.
// Hand-picked extra pages go in with --urls-file on the wrapper (tools/seo/indexnow-after-deploy.sh).
import { execFileSync } from 'node:child_process'

const SITE = 'https://childrendoenglish.com'
const range = (() => { const i = process.argv.indexOf('--git-range'); return i > 0 ? process.argv[i + 1] : '' })()

const show = (rev, file) => {
  try { return execFileSync('git', ['show', `${rev}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return null }
}
const json = (s, fallback) => { try { return s == null ? fallback : JSON.parse(s) } catch { return fallback } }
const ends = () => (range.includes('..') ? range.split('..') : [null, null])

export function addedWordUrls(before, after) {
  const had = new Set(before)
  return after.filter((p) => !had.has(p)).map((p) => SITE + p)
}

export function changedOverrideUrls(before, after) {
  return Object.keys(after).filter((p) => JSON.stringify(before[p]) !== JSON.stringify(after[p])).map((p) => SITE + p)
}

export default (file) => {
  const [a, b] = ends()
  if (file === 'scripts/published-word-urls.json') {
    if (!a) return null
    return addedWordUrls(json(show(a, file), []), json(show(b, file), []))
  }
  if (file === 'scripts/seo-title-overrides.json') {
    if (!a) return null
    return changedOverrideUrls(json(show(a, file), {}), json(show(b, file), {}))
  }
  const g = /^public\/games\/([a-z0-9-]+)\//.exec(file)
  if (g) return `${SITE}/games/${g[1]}/`
  return null
}
