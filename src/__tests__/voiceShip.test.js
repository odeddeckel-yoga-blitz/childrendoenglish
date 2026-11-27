// Voice-licence redo, shipped as six batches (fix/voice-ship-1..6) that may land in any order. Each batch adds
// briefs/voice-provenance/ship-<k>.csv (one row per clip it replaced) and scripts/audio-cache-bumps/voice-ship-<k>.txt.
// These checks judge only the batches present, so every batch passes alone and together.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { parseCsv, family } from '../../tools/voice-final-check.mjs';
import { audioCacheName } from '../../sw-audio-cache.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const PROV = path.join(ROOT, 'briefs/voice-provenance');
const sha1 = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const baseline = parseCsv(fs.readFileSync(path.join(PROV, 'baseline-2026-11-22.csv'), 'utf8'));
const ships = fs.readdirSync(PROV).filter((f) => /^ship-\d+\.csv$/.test(f));
const shipRows = ships.flatMap((s) => parseCsv(fs.readFileSync(path.join(PROV, s), 'utf8')).map((r) => ({ ...r, ship: s })));
const OK_VOICE = /^(en_GB-jenny_dioco-medium|en_US-kristin-medium|en_US-ljspeech-high)\b/;

describe('voice ship batches', () => {
  it('baseline lists every clip from before the redo, with a sha1', () => {
    expect(baseline.length).toBeGreaterThan(3300);
    for (const r of baseline) expect(r.sha1, r.file).toMatch(/^[0-9a-f]{40}$/);
  });
  it('at least one batch is present', () => { expect(ships.length).toBeGreaterThan(0); });
  it('every shipped clip is on disk with the recorded bytes, in a voice with a commercial licence', () => {
    const base = new Map(baseline.map((r) => [r.file, r]));
    const bad = [];
    for (const r of shipRows) {
      if (!fs.existsSync(path.join(ROOT, r.file))) { bad.push(`${r.file}: missing`); continue; }
      if (sha1(r.file) !== r.sha1) bad.push(`${r.file}: bytes differ from ${r.ship}`);
      if (!OK_VOICE.test(r.voice) || /amy|lessac|hfc|ryan/i.test(family(r.voice))) bad.push(`${r.file}: voice ${r.voice}`);
      if (!r.licence) bad.push(`${r.file}: no licence`);
      if (!base.has(r.file)) bad.push(`${r.file}: not in the baseline`);
      else if (base.get(r.file).sha1 !== r.old_sha1) bad.push(`${r.file}: old_sha1 is not the baseline file`);
      if (r.sha1 === r.old_sha1) bad.push(`${r.file}: not re-rendered`);
    }
    expect(bad).toEqual([]);
  });
  it('no clip is in two batches', () => {
    const seen = new Map(); const dup = [];
    for (const r of shipRows) { if (seen.has(r.file)) dup.push(`${r.file}: ${seen.get(r.file)} + ${r.ship}`); seen.set(r.file, r.ship); }
    expect(dup).toEqual([]);
  });
  it('each batch bumps the SW audio cache', () => {
    const bumps = fs.readdirSync(path.join(ROOT, 'scripts/audio-cache-bumps'));
    for (const s of ships) expect(bumps, s).toContain(s.replace('ship-', 'voice-ship-').replace('.csv', '.txt'));
    expect(audioCacheName()).not.toBe('word-audio-v5');
    const vite = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8');
    expect(vite).toMatch(/cacheName: audioCacheName\(\)/);
  });
  it('the cache name changes whenever the set of bump files changes', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cde-cache-bump-'));
    try {
      const a = audioCacheName(tmp);
      fs.writeFileSync(path.join(tmp, 'voice-ship-1.txt'), 'x\n');
      const b = audioCacheName(tmp);
      fs.writeFileSync(path.join(tmp, 'voice-ship-4.txt'), 'x\n');
      const c = audioCacheName(tmp);
      expect(new Set([a, b, c]).size).toBe(3);
      expect(a).toBe('word-audio-v5');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
  it('ships the voice licence texts', () => {
    for (const f of ['VOICE-LICENCES.md', 'licences/en_GB-jenny_dioco-medium.MODEL_CARD', 'licences/en_US-kristin-medium.MODEL_CARD', 'licences/en_US-ljspeech-high.MODEL_CARD']) {
      expect(fs.existsSync(path.join(ROOT, 'public/audio', f)), f).toBe(true);
    }
    expect(fs.readFileSync(path.join(ROOT, 'public/audio/VOICE-LICENCES.md'), 'utf8')).toMatch(/Jenny \(Dioco\)/);
  });
});
