// persona-check.mjs — the persona standard (PATTERNS §3e, P1/P2/P4) on game pages, at a phone size. (2026-10-30)
//   node <kit>/test/persona-check.mjs [id …] [--json=out.json]     # run from the site root; no ids = every game
//   GAMES_PUBLIC=<dir> overrides public/; PERSONA_W/PERSONA_H override the 390×664 VISIBLE phone area.
// P1 end screen: open it (Game.winGame(), or Game.roundClear()) → exactly ONE visible primary action ([data-kdm-primary],
//    else .btn.primary), and a tap at its centre hits it (no toast/pill/overlay on top).
// P2 start: tap the menu's play button ([data-kdm-play], else #t_start / #t_play / .btn.primary in #menu) → Game.screen
//    becomes 'play' within 2 s, the page did not merely scroll, and no question/overlay came up instead.
// P4 kid path: with no teacher arrival (?class / a set or battle link), no element marked [data-kdm-audience=teacher]
//    is visible on the menu, the play screen or the end screen. Teacher arrival (?class=1) may show them.
// A site that has not adopted the markers yet reports P1 'no-marker' — fix the site, don't loosen the check.
// Exit 1 if any game fails P1, P2 or P4.
import { chromium } from '@playwright/test'
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { createServer } from 'http'
import { join, resolve } from 'path'
const PUB = process.env.GAMES_PUBLIC ? resolve(process.env.GAMES_PUBLIC) : join(process.cwd(), 'public')
const PORT = Number(process.env.PERSONA_PORT) || 4396
const W = Number(process.env.PERSONA_W) || 390, H = Number(process.env.PERSONA_H) || 664
const args = process.argv.slice(2), JSON_OUT = (args.find((a) => a.startsWith('--json=')) || '').slice(7)
const named = args.filter((a) => !a.startsWith('--'))
const ids = named.length ? named : readdirSync(join(PUB, 'games')).filter((d) => !d.startsWith('_') && existsSync(join(PUB, 'games', d, 'index.html')))
const TYPES = { js: 'text/javascript', json: 'application/json', css: 'text/css', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp' }
const srv = createServer((req, res) => { const p = join(PUB, decodeURIComponent(req.url.split('?')[0])); if (!existsSync(p)) { res.statusCode = 404; return res.end() } res.setHeader('content-type', TYPES[p.split('.').pop()] || 'text/html'); res.end(readFileSync(p)) }).listen(PORT)

const TEACHER = '[data-kdm-audience="teacher"]'
// In-page helpers (serialised into the page).
function visible(el) { if (!el) return false; const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight && el.offsetParent !== null }
function teacherVisible(sel) { return [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && e.offsetParent !== null }).map((e) => (e.textContent || '').trim().slice(0, 40)) }

const b = await chromium.launch(); const rows = []; let i = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < ids.length) { const id = ids[i++]; const row = { id, p1: null, p2: null, p4: null, notes: [] }
    const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true }); const pg = await ctx.newPage()
    try {
      await pg.goto(`http://localhost:${PORT}/games/${id}/index.html`, { waitUntil: 'load', timeout: 15000 }); await pg.waitForTimeout(500)
      await pg.addScriptTag({ content: `window.__pv=${visible.toString()};window.__pt=${teacherVisible.toString()}` })
      const hasGame = await pg.evaluate(() => !!(window.Game && typeof Game.start === 'function'))
      if (!hasGame) { row.notes.push('no Game.start — NOT CHECKED'); rows.push(row); await ctx.close(); continue }
      // P4 on the menu
      const t4 = await pg.evaluate((sel) => __pt(sel), TEACHER)
      // P2: press the menu's play button
      const p2 = await pg.evaluate(async () => {
        const menu = document.getElementById('menu') || document.body
        const btn = menu.querySelector('[data-kdm-play]') || document.getElementById('t_start') || document.getElementById('t_play') || menu.querySelector('.btn.primary')
        if (!btn || !__pv(btn)) return { ok: false, why: 'no visible play button on the menu' }
        const y0 = scrollY; btn.click(); const end = Date.now() + 2000
        while (Date.now() < end) { if (Game.screen === 'play') return { ok: true }; await new Promise((r) => setTimeout(r, 80)) }
        return { ok: false, why: scrollY !== y0 ? 'the play button only scrolled the page' : 'play did not start (screen=' + Game.screen + ')' }
      })
      row.p2 = p2.ok ? 'ok' : p2.why
      await pg.waitForTimeout(400)
      const t4b = await pg.evaluate((sel) => __pt(sel), TEACHER)
      // P1: open the end screen
      await pg.evaluate(() => { try { if (typeof Game.winGame === 'function') Game.winGame(); else if (typeof Game.roundClear === 'function') Game.roundClear(false) } catch (e) {} })
      await pg.waitForTimeout(900)
      const p1 = await pg.evaluate(() => {
        const scr = [...document.querySelectorAll('#win, #result, .overlay.show, [data-kdm-end]')].find((e) => __pv(e) || e.classList.contains('show'))
        if (!scr) return { ok: false, why: 'no end screen opened' }
        let prim = [...scr.querySelectorAll('[data-kdm-primary]')].filter(__pv), marker = true
        if (!prim.length) { prim = [...scr.querySelectorAll('.btn.primary, button.primary')].filter(__pv); marker = false }
        if (prim.length !== 1) return { ok: false, why: (marker ? '' : 'no-marker · ') + prim.length + ' primary actions (want 1)' }
        const el = prim[0]; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect()
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        if (!hit || !(hit === el || el.contains(hit))) return { ok: false, why: 'primary covered by ' + (hit ? (hit.id ? '#' + hit.id : hit.className || hit.tagName) : 'nothing') }
        return { ok: true, why: marker ? '' : 'no-marker (used .btn.primary)' }
      })
      row.p1 = p1.ok ? 'ok' + (p1.why ? ' · ' + p1.why : '') : p1.why
      const t4c = await pg.evaluate((sel) => __pt(sel), TEACHER)
      const t = [...t4, ...t4b, ...t4c]; row.p4 = t.length ? 'teacher items visible: ' + [...new Set(t)].slice(0, 3).join(' | ') : 'ok'
    } catch (e) { row.notes.push('error: ' + String(e).slice(0, 120)) }
    rows.push(row); await ctx.close()
    const bad = [row.p1, row.p2, row.p4].some((x) => x && !String(x).startsWith('ok'))
    console.log(`${bad ? '✗' : '✓'} ${id}  P1 ${row.p1} · P2 ${row.p2} · P4 ${row.p4}${row.notes.length ? ' · ' + row.notes.join(' · ') : ''}`)
  }
}))
await b.close(); srv.close()
const fails = rows.filter((r) => [r.p1, r.p2, r.p4].some((x) => x && !String(x).startsWith('ok')) || r.notes.some((n) => /NOT CHECKED|error/.test(n)))
console.log(`persona-check: ${rows.length} games · ${W}×${H} · P1 fail ${rows.filter((r) => r.p1 && !r.p1.startsWith('ok')).length} · P2 fail ${rows.filter((r) => r.p2 && r.p2 !== 'ok').length} · P4 fail ${rows.filter((r) => r.p4 && r.p4 !== 'ok').length} · not checked ${rows.filter((r) => r.notes.length).length}`)
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(rows, null, 1))
process.exit(fails.length ? 1 : 0)
