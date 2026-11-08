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
        log.push({ e: 'queued', t: t(), src: id })
        u.addEventListener('start', () => log.push({ e: 'start', t: t(), src: id })); u.addEventListener('end', () => log.push({ e: 'end', t: t(), src: id }))
        // speechSynthesis.cancel() ends an utterance with 'error' (interrupted/canceled), never 'end' (KDM 11-08): without
        // this a cancelled line read as still playing forever and every later screen change flagged it.
        u.addEventListener('error', () => log.push({ e: 'cut', t: t(), src: id })); return speak(u) }
    }
    let last = ''
    const frame = () => { let v = ''; try { v = String(vis() || '') } catch (e) {} if (v && v !== last) { log.push({ e: 'visual', t: t(), src: v }); last = v } requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
    document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest(answerSel)) log.push({ e: 'answer', t: t() }) }, true)
  }, { audioSrc: audio.source, visualSrc: visual ? visual.toString() : '', answerSel })
}
// A clip is wrong if the visual changes while it is still playing (60 ms grace), or it starts > maxStartMs after the answer.
export function checkSpeech (log, { maxStartMs = 1500, graceMs = 60, ownMs = 150, chainMs = 600 } = {}) {
  // A clip that starts with its own screen (the app speaks the new question in the same tick it renders it) is logged a
  // frame BEFORE the visual (KDM /play 11-08: start 12553, visual 12554). A visual change within ownMs after the start
  // is the clip's OWN screen, not a change it played over.
  const problems = [], spoken = log.filter((x) => x.e === 'start')
  for (const s of spoken) {
    const stop = log.find((x) => (x.e === 'end' || x.e === 'cut') && x.src === s.src && x.t >= s.t), end = stop ? stop.t : Infinity
    const own = log.find((x) => x.e === 'visual' && x.t > s.t && x.t <= s.t + ownMs)
    const shown = own || [...log].reverse().find((x) => x.e === 'visual' && x.t <= s.t), change = log.find((x) => x.e === 'visual' && x !== own && x.t > s.t && x.t < end - graceMs)
    if (change) problems.push(`"${s.src}" still playing when the visual changed ${shown?.src} → ${change.src} (${Math.round(end - change.t)} ms over the next one)`)
    const answer = [...log].reverse().find((x) => x.e === 'answer' && x.t <= s.t)
    // late-start = the answer's own feedback speech lagging. A visual change between the answer and the start means this
    // is the NEXT item's word (CDE plays each question's word as it appears, 11-07), not late feedback.
    const movedOn = answer && log.some((x) => x.e === 'visual' && x.t > answer.t && x.t <= s.t + ownMs)
    // A word chained ≤ chainMs after another word's END (after this answer) is a sequence, not late feedback (CDE Read It's
    // slow pairs, 11-08): the first word started on time and this one follows it.
    const chained = log.some((x) => x.e === 'end' && x.t <= s.t && s.t - x.t <= chainMs && (!answer || x.t > answer.t))
    if (answer && !movedOn && !chained && s.t - answer.t > maxStartMs) problems.push(`"${s.src}" started ${Math.round(s.t - answer.t)} ms after the answer`)
  }
  // A line queued for one screen that never started before the screen changed and was then cut = never heard at all
  // (KDM /play 11-08: a question's read-out queued behind a long answer line, cut by the next answer).
  for (const q of log.filter((x) => x.e === 'queued')) {
    const started = log.find((x) => x.e === 'start' && x.src === q.src && x.t >= q.t)
    const cut = log.find((x) => x.e === 'cut' && x.src === q.src && x.t >= q.t && (!started || x.t < started.t))
    const moved = cut && log.some((x) => x.e === 'visual' && x.t > q.t + ownMs && x.t < cut.t)
    if (cut && moved) problems.push(`"${q.src}" queued ${Math.round(q.t)} ms, never heard: the screen changed and it was cut before it started`)
  }
  return { spoken: spoken.length, problems }
}
