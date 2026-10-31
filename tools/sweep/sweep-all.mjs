// Full-site sweep (Factory night run 10-31): every sitemap URL, rendered at
// 390×844 (phone) against the local dist/ server (:4719), plus static checks.
// node tools/sweep/sweep-all.mjs <out.json> [limit]
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const OUT = process.argv[2], LIMIT = +process.argv[3] || 1e9;
const SITE = 'https://childrendoenglish.com';
const urls = [...fs.readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '')).slice(0, LIMIT);
const vj = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const redirects = new Map((vj.redirects || []).map((r) => [r.source, r.destination]));
const rewrites = new Set((vj.rewrites || []).map((r) => r.source));
const axe = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const exists = (p) => {
  const clean = decodeURIComponent(p.split('#')[0].split('?')[0]);
  if (clean === '' ) return true;
  if (rewrites.has(clean) || rewrites.has(clean.replace(/\/$/, ''))) return 'rewrite';
  if (redirects.has(clean)) return 'redirect';
  const f = path.join('dist', clean);
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return true;
  if (fs.existsSync(path.join(f, 'index.html'))) return clean.endsWith('/') ? true : 'noslash';
  return false;
};
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, bypassCSP: true });
await ctx.route('**/api/**', (r) => r.fulfill({ status: 204 }));
await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
const results = [];
let i = 0;
async function one(p, u) {
  const res = { u, links: [], axe: [], small: [], noalt: 0, rtl: [], english: [], head: {} };
  const errs = [];
  p.removeAllListeners('pageerror'); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:4719' + u, { waitUntil: 'load', timeout: 30000 });
  await p.waitForTimeout(150);
  const info = await p.evaluate(() => {
    const lang = document.documentElement.lang;
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h.startsWith('/') && !h.startsWith('//'));
    const canon = document.querySelector('link[rel=canonical]')?.getAttribute('href') || null;
    const alts = [...document.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => [l.getAttribute('hreflang'), l.getAttribute('href')]);
    const noalt = [...document.querySelectorAll('img')].filter((im) => !im.hasAttribute('alt')).length;
    // tap targets: standalone controls (not a link inside running text) under 44px
    const small = [];
    for (const e of document.querySelectorAll('button, a, input, select, summary, [role=button]')) {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (e.closest('.crawl-mesh, .site-head')) continue; // footer/header link rows judged separately
      const inline = e.tagName === 'A' && cs.display === 'inline' && e.parentElement && /^(P|LI|SPAN|TD|DD|H\d|EM|STRONG|SMALL|LABEL|FIGCAPTION|BLOCKQUOTE)$/.test(e.parentElement.tagName) && e.parentElement.textContent.trim().length > e.textContent.trim().length + 3;
      if (inline) continue;
      if (Math.round(r.height) < 44 || Math.round(r.width) < 44) small.push(((e.id && '#' + e.id) || e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '')) + ` ${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}"`);
    }
    // RTL + English-on-Hebrew-page heuristics (visible text nodes only)
    const rtl = [], english = [];
    if (lang === 'he') {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.nodeValue.replace(/\s+/g, ' ').trim();
        if (!t) continue;
        const pe = n.parentElement;
        if (!pe || pe.closest('script, style, noscript, .crawl-mesh, .site-head, [hidden]')) continue;
        const cs = getComputedStyle(pe); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (!pe.offsetParent && cs.position !== 'fixed') continue;
        const ltrAnc = pe.closest('[dir=ltr], bdi, [lang=en]');
        const heb = /[֐-׿]/.test(t), lat = /[A-Za-z]{2,}/.test(t);
        if (!heb && /[A-Za-z]{3,}(\s+[A-Za-z',.!?-]+){2,}/.test(t) && !ltrAnc && pe.closest('[dir=rtl], html[dir=rtl]') !== null)
          english.push(t.slice(0, 60));
        if (!heb && !lat && /^\d+\s*\/\s*\d+$/.test(t) && !ltrAnc) rtl.push('counter: ' + t);
        if (heb && lat && !ltrAnc && /[A-Za-z][A-Za-z ]*[.!?:)(]|[(:][A-Za-z]/.test(t)) rtl.push('mixed+punct: ' + t.slice(0, 70));
        if (heb && /→/.test(t)) rtl.push('arrow →: ' + t.slice(0, 50));
      }
    }
    return { lang, dir: document.documentElement.dir || getComputedStyle(document.body).direction, links, canon, alts, noalt, small, rtl, english, title: document.title };
  });
  res.head = { lang: info.lang, dir: info.dir, canon: info.canon, alts: info.alts, title: info.title };
  res.noalt = info.noalt; res.small = info.small; res.rtl = info.rtl; res.english = info.english;
  for (const h of [...new Set(info.links)]) { const e = exists(h); if (e !== true && e !== 'rewrite') res.links.push(`${h} → ${e}`); }
  await p.addScriptTag({ content: axe });
  res.axe = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'], rules: { region: { enabled: false } } })).violations
    .flatMap((v) => v.nodes.map((n) => `${v.id} :: ${n.target[0]}`.replace(/:nth-child\(\d+\)/g, ''))));
  res.errs = errs;
  return res;
}
await Promise.all(Array.from({ length: 4 }, async () => {
  const p = await ctx.newPage();
  while (i < urls.length) { const u = urls[i++]; let r = null, last = null; for (let a = 0; a < 3 && !r; a++) { try { r = await one(p, u); } catch (e) { last = e; await p.waitForTimeout(500); } } results.push(r || { u, fail: String(last).slice(0, 120) }); }
}));
await b.close();
fs.writeFileSync(OUT, JSON.stringify(results));
console.log('pages', results.length, 'failed', results.filter((r) => r.fail).length);
