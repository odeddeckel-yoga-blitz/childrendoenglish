#!/usr/bin/env node
// Voice final check (owner 11-25/11-27: every clip leaves the voices without a commercial licence; the Jenny redo ships
// as six batches, fix/voice-ship-1..6, in any order). Lists every audio file under public/ by voice, from the
// provenance csvs in briefs/voice-provenance/, and FAILS when any clip is still on amy, lessac, hfc_female or ryan.
//
//   node tools/voice-final-check.mjs [--root=<repo>] [--list] [--strict] [--json=<out.json>]
//   exit 0 clean · 1 a clip is on a banned voice, or a ship record does not match the bytes on disk
//   --list   print every file with its voice and record
//   --strict also fail on clips whose voice is unknown or that no csv records
//
// How a file's voice is decided (by content sha1, so a half-applied batch can't pass as done):
//   1. a ship-<k>.csv row for the file whose sha1 equals the bytes on disk → that row's voice
//   2. else the baseline-2026-11-22.csv row (the clip as it was before the redo) whose sha1 matches → its voice
//   3. else: "unrecorded" (a clip added or re-rendered after the baseline without a provenance row)
// A ship row whose sha1 does NOT match the file is an error: the batch's record says one thing, the disk another.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const args = process.argv.slice(2);
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const ROOT = resolve(opt('root') || process.cwd());
const PROV = join(ROOT, 'briefs', 'voice-provenance');
const BANNED = /amy|lessac|hfc|ryan/i;

export function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// voice string → family name used in the summary
export function family(voice) {
  const v = String(voice || '').toLowerCase();
  if (/jenny/.test(v)) return 'jenny';
  if (/kristin/.test(v)) return 'kristin';
  if (/ljspeech/.test(v)) return 'ljspeech';
  if (/^none/.test(v)) return 'none (silent)';
  if (/lessac/.test(v)) return 'lessac';
  if (/hfc/.test(v)) return 'hfc_female';
  if (/ryan/.test(v)) return 'ryan';
  if (/amy/.test(v)) return 'amy';
  return 'unknown';
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.mp3') && /\/audio\//.test(p.slice(ROOT.length))) out.push(p);
  }
  return out;
}

export function run() {
  if (!existsSync(join(PROV, 'baseline-2026-11-22.csv'))) {
    console.error(`voice-final-check: ${relative(process.cwd(), PROV)}/baseline-2026-11-22.csv missing`); process.exit(2);
  }
  const base = new Map(parseCsv(readFileSync(join(PROV, 'baseline-2026-11-22.csv'), 'utf8')).map((r) => [r.file, r]));
  const ships = readdirSync(PROV).filter((f) => /^ship-\d+\.csv$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));
  const shipRow = new Map(); const errors = [];
  for (const s of ships) {
    for (const r of parseCsv(readFileSync(join(PROV, s), 'utf8'))) {
      if (shipRow.has(r.file)) errors.push(`${r.file}: listed in ${shipRow.get(r.file).ship} and ${s}`);
      shipRow.set(r.file, { ...r, ship: s.replace('.csv', '') });
    }
  }
  const files = walk(join(ROOT, 'public')).map((p) => relative(ROOT, p).split('\\').join('/')).sort();
  const onDisk = new Set(files);
  const list = [];
  for (const f of files) {
    const sha = createHash('sha1').update(readFileSync(join(ROOT, f))).digest('hex');
    const s = shipRow.get(f), b = base.get(f);
    let voice, source;
    if (s && s.sha1 === sha) { voice = s.voice; source = s.ship; }
    else {
      if (s) errors.push(`${f}: ${s.ship} records sha1 ${s.sha1.slice(0, 10)}, file on disk is ${sha.slice(0, 10)}`);
      if (b && b.sha1 === sha) { voice = b.voice; source = 'baseline'; }
      else { voice = 'unrecorded'; source = b ? 'changed since baseline, no record' : 'not in any csv'; }
    }
    list.push({ file: f, voice, family: voice === 'unrecorded' ? 'unrecorded' : family(voice), source });
  }
  for (const [f, s] of shipRow) if (!onDisk.has(f)) errors.push(`${f}: in ${s.ship} but missing on disk`);

  const by = {}; for (const x of list) by[x.family] = (by[x.family] || 0) + 1;
  const banned = list.filter((x) => BANNED.test(x.family));
  const unknown = list.filter((x) => x.family === 'unknown' || x.family === 'unrecorded');
  console.log(`voice-final-check: ${list.length} audio files · ship records: ${ships.length ? ships.map((s) => s.replace('.csv', '')).join(', ') : 'none'}`);
  for (const [k, n] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(16)} ${n}`);
  if (args.includes('--list')) for (const x of list) console.log(`${x.file}\t${x.voice}\t${x.source}`);
  if (banned.length) {
    const fam = {}; for (const x of banned) fam[x.family] = (fam[x.family] || 0) + 1;
    console.log(`FAIL ${banned.length} clips still on a voice without a commercial licence (${Object.entries(fam).map(([k, n]) => `${k} ${n}`).join(', ')}):`);
    for (const x of banned.slice(0, 40)) console.log(`  ${x.file} (${x.voice}; ${x.source})`);
    if (banned.length > 40) console.log(`  … ${banned.length - 40} more (--list for all)`);
  }
  if (unknown.length) {
    console.log(`${args.includes('--strict') ? 'FAIL' : 'WARN'} ${unknown.length} clips with no known voice (not in any batch; the 31 'unknown' rows were made by generators whose default was amy):`);
    for (const x of unknown) console.log(`  ${x.file} (${x.voice}; ${x.source})`);
  }
  for (const e of errors) console.log(`ERROR ${e}`);
  if (opt('json')) writeFileSync(opt('json'), JSON.stringify({ by, banned, unknown, errors, list }, null, 1));
  const fail = banned.length || errors.length || (args.includes('--strict') && unknown.length);
  console.log(fail ? 'voice-final-check: FAIL' : 'voice-final-check: OK (no amy / lessac / hfc_female / ryan clip left)');
  return fail ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(run());
