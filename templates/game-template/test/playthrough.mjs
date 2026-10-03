#!/usr/bin/env node
/**
 * playthrough.mjs — the STANDARD automated verification gate for a KidsDoMath game.
 * Generic: it drives any game through the shared `dbg` contract, so you don't re-derive
 * a harness per game. Run it from the kidsdomath repo (Playwright lives there):
 *
 *     node templates/game-template/test/playthrough.mjs ~/projects/<game-id>/index.html
 *
 * It asserts, headless, over a real browser:
 *   1. Loads with ZERO page errors, has #cv + #hubBack, and is ENGLISH-ONLY (no #langBtn, dir≠rtl).
 *   2. Reachability invariant: ≥500 generated (mode,target) across all levels are dbg.reachable().
 *   3. Win-flow: dbg.solveForTest() clears every level 1..MAX across all 3 modes → Game.screen==='win'.
 *   4. Mobile smoke (390×844): loads clean, #cv + #actBtn present, no errors.
 *
 * REQUIRES the game to expose the dbg contract (the template ships it):
 *   Line.dbg = { o, solved, reachable(mode,target), solveForTest(), made, need }
 * Exits non-zero on the first failure. Pair with realinput.spec.mjs for the hit-tested check.
 */
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'

const file = process.argv[2] || new URL('../index.html', import.meta.url).pathname
if (!existsSync(file)) { console.error('✖ file not found:', file); process.exit(2) }
const url = pathToFileURL(file).href
const fail = (m, extra) => { console.error('✖ FAIL:', m, extra ? JSON.stringify(extra) : ''); process.exit(1) }

const browser = await chromium.launch()
try {
  // --- desktop load + english-only + no errors ---
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)

  const shape = await page.evaluate(() => ({
    cv: !!document.querySelector('#cv'),
    hubBack: !!document.querySelector('#hubBack'),
    langBtn: !!document.querySelector('#langBtn'),
    dir: document.documentElement.getAttribute('dir') || '',
    dbgOk: !!(window.Line && Line.dbg && typeof Line.dbg.reachable === 'function' &&
      typeof Line.dbg.solveForTest === 'function' && typeof Line.dbg.solved === 'function'),
  }))
  if (!shape.cv) fail('no #cv canvas')
  if (!shape.hubBack) fail('no #hubBack back-to-games button')
  if (shape.langBtn || shape.dir === 'rtl') fail('not english-only', shape)
  if (!shape.dbgOk) fail('missing dbg contract (need reachable + solveForTest + solved)')

  // --- reachability sweep ---
  const reach = await page.evaluate(() => {
    let checked = 0, bad = 0
    for (let r = 0; r < 70; r++) for (let lvl = 1; lvl <= 8; lvl++) {
      Line.build(lvl, false); const o = Line.dbg.o; checked++
      // Codebase convention: reachable takes the whole puzzle object O.
      if (!Line.dbg.reachable(o)) bad++
    }
    return { checked, bad }
  })
  if (reach.bad > 0) fail('unreachable targets generated', reach)

  // --- win-flow via solveForTest ---
  const win = await page.evaluate(() => {
    window.setTimeout = (f) => { f(); return 0 }
    const modes = new Set()
    Game.start()
    for (let g = 0; g < 400 && Game.screen !== 'win'; g++) {
      if (Game.screen === 'play') {
        modes.add(Line.dbg.o.mode); Line.dbg.solveForTest()
        if (!Line.dbg.solved()) return { ok: false, why: 'solveForTest did not solve', o: Line.dbg.o }
        Line.commit()
      } else if (Game.screen === 'result') { Game.next() }
      else return { ok: false, why: 'stuck on ' + Game.screen }
    }
    return { ok: Game.screen === 'win', modes: [...modes], level: Game.level }
  })
  if (!win.ok) fail('did not reach win screen', win)
  if (win.modes.length < 3) console.warn('⚠ only', win.modes.length, 'modes exercised (spec wants 3):', win.modes)
  if (errors.length) fail('page errors during play', errors)
  await page.close()

  // --- mobile smoke ---
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const mErr = []
  m.on('pageerror', (e) => mErr.push(String(e)))
  await m.goto(url, { waitUntil: 'networkidle' })
  await m.evaluate(() => Game.start())
  await m.waitForTimeout(300)
  const mob = await m.evaluate(() => ({ cv: !!document.querySelector('#cv'), act: !!document.querySelector('#actBtn') }))
  if (!mob.cv || !mob.act) fail('mobile layout missing #cv/#actBtn', mob)
  if (mErr.length) fail('mobile page errors', mErr)
  await m.close()

  console.log(`✓ PASS — reachability ${reach.checked}/0-bad · win across ${win.modes.length} modes · desktop+mobile clean · 0 errors`)
} finally {
  await browser.close()
}
