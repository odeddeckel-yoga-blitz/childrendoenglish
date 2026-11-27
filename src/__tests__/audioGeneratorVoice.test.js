// Owner 11-25/11-27: the site voice is Jenny (Dioco); amy, lessac, hfc_female and ryan have no commercial licence, so no
// generator may be able to make a new clip in them. Every audio generator takes its voice from scripts/site_voice.py
// (Jenny, then Kristin, then LJ Speech, all with a licence text in public/audio/licences/).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const BANNED = /en_US-(amy|lessac|hfc_female|ryan)\b/;
const ALLOWED = new Set(['en_GB-jenny_dioco-medium', 'en_US-kristin-medium', 'en_US-ljspeech-high']);
const MODEL_ID = /\ben_[A-Z]{2}-[a-z_]+-(?:x_low|low|medium|high)\b/g;
const GENERATORS = ['scripts/generate-word-audio.sh', 'scripts/render-word-audio.py', 'scripts/unit-audio.py',
  'scripts/reading-audio.py', 'scripts/chant-audio.py', 'scripts/feelings-audio.py', 'scripts/simon-says-audio.py',
  'scripts/true-or-false-audio.py', 'scripts/voice-improver.py', 'scripts/voice-pass2.py', 'scripts/word-voice-improver.py'];

function codeFiles(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', '__pycache__'].includes(e.name)) codeFiles(p, out); }
    else if (/\.(py|sh|mjs|js|cjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe('audio generators use only licensed voices', () => {
  it('no script or tool names an amy / lessac / hfc_female / ryan Piper model', () => {
    const hits = [...codeFiles('scripts'), ...codeFiles('tools')].filter((f) => BANNED.test(read(f)));
    expect(hits).toEqual([]);
  });
  it('every Piper model a script names is a licensed site voice', () => {
    const bad = [];
    for (const f of codeFiles('scripts')) for (const m of read(f).match(MODEL_ID) || []) if (!ALLOWED.has(m)) bad.push(`${f}: ${m}`);
    expect(bad).toEqual([]);
  });
  it('site_voice.py: Jenny first, then Kristin, then LJ Speech, each with a licence text', () => {
    const s = read('scripts/site_voice.py');
    expect(s).toMatch(/^SITE_VOICE = 'en_GB-jenny_dioco-medium'/m);
    expect(s).toMatch(/^MODELS = \(SITE_VOICE, KRISTIN, LJSPEECH\)/m);
    for (const m of ALLOWED) expect(fs.existsSync(path.join(ROOT, 'public/audio/licences', `${m}.MODEL_CARD`)), m).toBe(true);
  });
  it('each generator takes its voice from site_voice.py (or Jenny directly in the shell script)', () => {
    const bad = [];
    for (const f of GENERATORS) {
      const s = read(f);
      const ok = f.endsWith('.sh') ? /download_voices en_GB-jenny_dioco-medium/.test(s) && /en_GB-jenny_dioco-medium\.onnx/.test(s)
        : f === 'scripts/word-voice-improver.py' ? /site_voice\.CHAIN/.test(s) : /^import site_voice\b/m.test(s);
      if (!ok) bad.push(f);
    }
    expect(bad).toEqual([]);
  });
  it('render-word-audio.py defaults to Jenny and offers no unlicensed voice', () => {
    const s = read('scripts/render-word-audio.py');
    expect(s).toMatch(/opt\.get\('voices'\) or 'jenny,/);
    expect(s).not.toMatch(/'(amy|hfc|lessac|ryan)[-\w]*': \(/);
  });
});
