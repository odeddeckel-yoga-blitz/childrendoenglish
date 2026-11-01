#!/usr/bin/env node
// component-inventory v1 (kit infra/kpi, All-ZC): list the component ids each template's page carries, for the
// report's "never seen" list. Loads one URL per template in headless Chromium and reads window.__componentClicks()
// (the module stays inspectable under webdriver; it just never sends). Run from a repo that has Playwright:
//   node ~/projects/shared/game-kit/infra/kpi/component-inventory.mjs https://site/ https://site/grade/3 … > inventory.json
// Output: { [tpl]: [comp ids] } (union over the URLs of a template).
import { createRequire } from 'node:module'
const { chromium } = createRequire(process.cwd() + '/')('playwright')

export async function inventory (urls, { width = 390, height = 844 } = {}) {
  const browser = await chromium.launch()
  const out = {}
  try {
    for (const u of urls) {
      const page = await browser.newPage({ viewport: { width, height } })
      try {
        await page.goto(u, { waitUntil: 'load', timeout: 45000 })   // not networkidle: dev servers and live widgets never idle
        await page.waitForTimeout(1500)                               // let client components mount
        const r = await page.waitForFunction(() => window.__componentClicks && window.__componentClicks(), null, { timeout: 8000 }).then((h) => h.jsonValue()).catch(() => null)
        if (r && r.active) out[r.tpl] = [...new Set([...(out[r.tpl] || []), ...r.inventory])]
        else console.error(`skip ${u}: ${r ? 'excluded route' : 'module not installed'}`)
      } catch (e) { console.error(`skip ${u}: ${String(e.message || e).split('\n')[0]}`) } finally { await page.close() }
    }
  } finally { await browser.close() }
  return out
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const urls = process.argv.slice(2)
  if (!urls.length) { console.error('usage: component-inventory.mjs <url> [url…]'); process.exit(2) }
  console.log(JSON.stringify(await inventory(urls), null, 1))
}
