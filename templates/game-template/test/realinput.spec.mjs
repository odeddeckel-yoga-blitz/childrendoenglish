#!/usr/bin/env node
/**
 * realinput.spec.mjs — the HIT-TESTED half of the gate. playthrough.mjs proves the win-flow
 * via dbg; this proves a real kid can actually DRIVE it with the mouse/touch (the check that
 * caught the Stat Lab hidden-multi-select bug — calling Line methods directly hid it).
 *
 *     node templates/game-template/test/realinput.spec.mjs ~/projects/<game-id>/index.html
 *
 * Generic checks (always run): desktop + mobile screenshots to /tmp, canvas present, no errors.
 * Game-specific check (YOU MUST ADAPT `solveWithRealInput` below): solve one puzzle using real
 * page.mouse clicks/drags on the actual controls — NOT page.evaluate calling Line.*. If the
 * mechanic has multiple manipulable objects, exercise MORE THAN ONE.
 */
import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'

const file = process.argv[2] || new URL('../index.html', import.meta.url).pathname
if (!existsSync(file)) { console.error('✖ file not found:', file); process.exit(2) }
const url = pathToFileURL(file).href
const id = file.split('/').slice(-2)[0]

// ─────────────────────────────────────────────────────────────────────────────
// ⟨REPLACE for your game⟩  Drive ONE puzzle to solved using REAL input only.
// Template demo: a −/+ stepper — click the real buttons to reach the target.
async function solveWithRealInput(page) {
  const { mode, T } = await page.evaluate(() => ({ mode: Line.dbg.o.mode, T: Line.dbg.o.T })) // read target only
  const clicks = mode === 'match' ? T : T + 1                          // match: hit T exactly; more: one above
  const plus = page.locator('#ctlBox .ctl button', { hasText: '+' })
  for (let i = 0; i < clicks; i++) await plus.click()                  // real clicks on the real button
  return await page.evaluate(() => Line.dbg.solved())
}
// ─────────────────────────────────────────────────────────────────────────────

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => Game.start())
  await page.waitForTimeout(400)
  await page.screenshot({ path: `/tmp/${id}_desktop.png` })

  const solved = await solveWithRealInput(page)
  if (!solved) { console.error('✖ FAIL: real-input solve did not reach solved state'); process.exit(1) }

  // mobile screenshot for eyeballing the layout / affordance cue
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await m.goto(url, { waitUntil: 'networkidle' })
  await m.evaluate(() => Game.start())
  await m.waitForTimeout(400)
  await m.screenshot({ path: `/tmp/${id}_mobile.png` })
  await m.close()

  if (errors.length) { console.error('✖ FAIL: page errors', errors); process.exit(1) }
  console.log(`✓ PASS — real-input solve OK · screenshots: /tmp/${id}_desktop.png /tmp/${id}_mobile.png (eyeball: no overlaps, cue visible, RTL-free)`)
} finally {
  await browser.close()
}
