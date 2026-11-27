// Voice-licence redo, shipped as six batches (fix/voice-ship-1..6) that may land in any order. Each batch adds
// briefs/voice-provenance/ship-<k>.csv (one row per clip it replaced) and scripts/audio-cache-bumps/voice-ship-<k>.txt.
// These checks judge only the batches present, so every batch passes alone and together.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { parseCsv, family, parseHeld } from '../../tools/voice-final-check.mjs';
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
  it('a clip held by the owner keeps its baseline bytes and is in no batch (remove the hold line when the owner clears it)', () => {
    const heldFiles = fs.readdirSync(PROV).filter((f) => /^held-by-owner.*\.txt$/.test(f));
    expect(heldFiles).toContain('held-by-owner.txt');
    const held = parseHeld(heldFiles.map((f) => fs.readFileSync(path.join(PROV, f), 'utf8')).join('\n'));
    expect(held.has('public/audio/cvc/bit.mp3')).toBe(true);
    const base = new Map(baseline.map((r) => [r.file, r]));
    const shipped = new Set(shipRows.map((r) => r.file));
    const bad = [];
    for (const [f, h] of held) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(h.date) || !h.why) bad.push(`${f}: needs '<file> | <date> | <why>'`);
      if (!fs.existsSync(path.join(ROOT, f))) { bad.push(`${f}: missing`); continue; }
      if (!base.has(f) || base.get(f).sha1 !== sha1(f)) bad.push(`${f}: bytes are not the baseline file`);
      if (shipped.has(f)) bad.push(`${f}: shipped by a batch, so the hold is stale`);
    }
    expect(bad).toEqual([]);
  });
  it('the final check reads every held-by-owner*.txt (a batch keeps its holds in a file of its own)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cde-held-'));
    try {
      const prov = path.join(tmp, 'briefs/voice-provenance');
      fs.mkdirSync(prov, { recursive: true }); fs.mkdirSync(path.join(tmp, 'public/audio'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'public/audio/x.mp3'), 'x');
      const x = crypto.createHash('sha1').update('x').digest('hex');
      fs.writeFileSync(path.join(prov, 'baseline-2026-11-22.csv'), `file,voice,sha1\npublic/audio/x.mp3,en_US-amy-medium,${x}\n`);
      fs.writeFileSync(path.join(prov, 'held-by-owner-ship9.txt'), 'public/audio/x.mp3 | 2026-11-27 | test\n');
      const tool = path.join(ROOT, 'tools/voice-final-check.mjs');
      const r = spawnSync(process.execPath, [tool, `--root=${tmp}`, '--strict'], { encoding: 'utf8' });
      expect(r.stdout).toMatch(/HELD 1 clip/);
      expect(r.status).toBe(0);
      fs.rmSync(path.join(prov, 'held-by-owner-ship9.txt'));
      expect(spawnSync(process.execPath, [tool, `--root=${tmp}`, '--strict'], { encoding: 'utf8' }).status).toBe(1);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
  it('parses the hold list (comments and blank lines skipped)', () => {
    const h = parseHeld('# c\n\npublic/audio/cvc/bit.mp3 | 2026-11-27 | why | more\n');
    expect([...h.keys()]).toEqual(['public/audio/cvc/bit.mp3']);
    expect(h.get('public/audio/cvc/bit.mp3')).toEqual({ date: '2026-11-27', why: 'why | more' });
  });
  it('ships the voice licence texts', () => {
    for (const f of ['VOICE-LICENCES.md', 'licences/en_GB-jenny_dioco-medium.MODEL_CARD', 'licences/en_US-kristin-medium.MODEL_CARD', 'licences/en_US-ljspeech-high.MODEL_CARD']) {
      expect(fs.existsSync(path.join(ROOT, 'public/audio', f)), f).toBe(true);
    }
    expect(fs.readFileSync(path.join(ROOT, 'public/audio/VOICE-LICENCES.md'), 'utf8')).toMatch(/Jenny \(Dioco\)/);
  });
  // Ship 7 (owner 11-27): or / our rendered as just the letter 'r', so the owner holds them on their origin/main files.
  // Their hold lines live in held-by-owner-ship7.txt (not ship-2's held-by-owner.txt, so the two batches never conflict).
  it('ship 7 holds or / our out: 29 clips ship, the two keep their baseline bytes and are listed in held-by-owner-ship7.txt', () => {
    if (!fs.existsSync(path.join(PROV, 'ship-7.csv'))) return;
    const rows = parseCsv(fs.readFileSync(path.join(PROV, 'ship-7.csv'), 'utf8'));
    const HELD7 = ['public/audio/or.mp3', 'public/audio/our.mp3'];
    expect(rows.length).toBe(29);
    const holdTxt = path.join(PROV, 'held-by-owner-ship7.txt');
    expect(fs.existsSync(holdTxt)).toBe(true);
    const lines = fs.readFileSync(holdTxt, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    expect(lines.map((l) => l.split('|')[0].trim()).sort()).toEqual(HELD7);
    for (const l of lines) expect(l.split('|').map((x) => x.trim())[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const base = new Map(baseline.map((r) => [r.file, r]));
    for (const f of HELD7) {
      expect(shipRows.some((r) => r.file === f), `${f} is in a batch`).toBe(false);
      expect(sha1(f), `${f} is not its baseline file`).toBe(base.get(f).sha1);
    }
  });
});
