// speech-sync v1 (kit, yoga-bits 11-07): spoken content must stay with the visual it belongs to.
// Owner bug: a pose name was spoken 250 ms after the answer while the quiz advanced at 1,100 ms, so most of every name
// played over the NEXT pose; no test caught it because none ever timed audio against the screen.
// Use from a Playwright test (real audio, nothing stubbed):
//   import { instrumentSpeech, checkSpeech } from '<kit>/test/speech-sync.mjs'
//   await instrumentSpeech(page, { audio: /\/audio\/names\//, visual: () => document.querySelector('img.pose')?.src })
//   …play a round…;  const r = checkSpeech(await page.evaluate(() => window.__sync), { maxStartMs: 1500 })
//   expect(r.spoken).toBeGreaterThan(2); expect(r.problems).toEqual([])
// Run it warm AND cold (CDP Network.setCacheDisabled + emulateNetworkConditions) — the cold run is where it bites.
// Also covers speechSynthesis utterances (start/end). The 'visual' callback returns a stable id of what is on screen.
export async function instrumentSpeech (page, { audio = /./, visual, answerSel = 'button' } = {}) {
  await page.addInitScript(({ audioSrc, visualSrc, answerSel }) => {
    const re = new RegExp(audioSrc), log = (window.__sync = []), t = () => performance.now()
    const vis = visualSrc ? new Function('return (' + visualSrc + ')()') : () => ''
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function (...a) {
      const src = this.currentSrc || this.src || ''
      // The clip id is read AT EACH EVENT: an app that reuses one shared element for every word (iOS audio unlock,
      // CDE) changes .src per word, and an id fixed at the first play() logged every later word as the first (CDE 11-07).
      if (!this.__synced && re.test(src)) {
        this.__synced = true; const id = () => String(this.currentSrc || this.src || '').replace(/^.*\//, '').replace(/\?.*$/, '')
        const ours = () => re.test(this.currentSrc || this.src || '')
        this.addEventListener('playing', () => { if (ours()) { this.__cur = id(); log.push({ e: 'start', t: t(), src: this.__cur }) } })
        // A new src on a playing shared element aborts the old clip without 'ended'/'pause': log that as a cut.
        this.addEventListener('emptied', () => { if (this.__cur) { log.push({ e: 'cut', t: t(), src: this.__cur }); this.__cur = '' } })
        this.addEventListener('ended', () => { if (ours()) log.push({ e: 'end', t: t(), src: id() }) })
        this.addEventListener('pause', () => { if (!this.ended && ours()) log.push({ e: 'cut', t: t(), src: id() }) })
      }
      return play.apply(this, a)
    }
    if (window.speechSynthesis) {
      const speak = window.speechSynthesis.speak.bind(window.speechSynthesis)
      window.speechSynthesis.speak = (u) => { const id = 'tts:' + (u.text || '').slice(0, 40)
        u.addEventListener('start', () => log.push({ e: 'start', t: t(), src: id })); u.addEventListener('end', () => log.push({ e: 'end', t: t(), src: id })); return speak(u) }
    }
    let last = ''
    const frame = () => { let v = ''; try { v = String(vis() || '') } catch (e) {} if (v && v !== last) { log.push({ e: 'visual', t: t(), src: v }); last = v } requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
    document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest(answerSel)) log.push({ e: 'answer', t: t() }) }, true)
  }, { audioSrc: audio.source, visualSrc: visual ? visual.toString() : '', answerSel })
}
// A clip is wrong if the visual changes while it is still playing (60 ms grace), or it starts > maxStartMs after the answer.
export function checkSpeech (log, { maxStartMs = 1500, graceMs = 60 } = {}) {
  const problems = [], spoken = log.filter((x) => x.e === 'start')
  for (const s of spoken) {
    const stop = log.find((x) => (x.e === 'end' || x.e === 'cut') && x.src === s.src && x.t >= s.t), end = stop ? stop.t : Infinity
    const shown = [...log].reverse().find((x) => x.e === 'visual' && x.t <= s.t), change = log.find((x) => x.e === 'visual' && x.t > s.t && x.t < end - graceMs)
    if (change) problems.push(`"${s.src}" still playing when the visual changed ${shown?.src} → ${change.src} (${Math.round(end - change.t)} ms over the next one)`)
    const answer = [...log].reverse().find((x) => x.e === 'answer' && x.t <= s.t)
    // late-start = the answer's own feedback speech lagging. A visual change between the answer and the start means this
    // is the NEXT item's word (CDE plays each question's word as it appears, 11-07), not late feedback.
    const movedOn = answer && log.some((x) => x.e === 'visual' && x.t > answer.t && x.t <= s.t)
    if (answer && !movedOn && s.t - answer.t > maxStartMs) problems.push(`"${s.src}" started ${Math.round(s.t - answer.t)} ms after the answer`)
  }
  return { spoken: spoken.length, problems }
}
