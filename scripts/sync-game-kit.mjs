#!/usr/bin/env node
// Copy this into a consumer repo's scripts/ and set MAP for that repo.
// Usage: node scripts/sync-game-kit.mjs [--check]
//   default: copy kit files into the repo + stamp .game-kit-version
//   --check: exit 1 if the local copies drifted from the kit (for CI)
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { join, dirname } from 'path';

const KIT = process.env.GAME_KIT_DIR || join(process.env.HOME, 'projects', 'shared', 'game-kit');
// Per-repo mapping: kit path -> repo path  (EDIT PER CONSUMER)
const MAP = {
  'template/index.html': 'game-kit/template/index.html',
  'test/playthrough.mjs': 'game-kit/test/playthrough.mjs',
  'test/realinput.spec.mjs': 'game-kit/test/realinput.spec.mjs',
  'GENERATION.md': 'game-kit/GENERATION.md',
  'PATTERNS.md': 'plans/game-kit-patterns.md',
};

const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12);
const check = process.argv.includes('--check');
let drift = 0;
for (const [src, dst] of Object.entries(MAP)) {
  const s = join(KIT, src);
  if (!existsSync(s)) { console.warn(`kit missing: ${src}`); continue; }
  if (!existsSync(dst) || hash(s) !== hash(dst)) {
    if (check) { console.error(`DRIFT: ${dst} != kit/${src}`); drift++; }
    else { mkdirSync(dirname(dst), { recursive: true }); cpSync(s, dst); console.log(`synced: ${dst}`); }
  }
}
if (!check) {
  let rev = 'unknown';
  try { rev = execSync('git rev-parse --short HEAD', { cwd: KIT }).toString().trim(); } catch { /* kit not a repo */ }
  writeFileSync('.game-kit-version', `${readFileSync(join(KIT, 'VERSION'), 'utf8').trim()} @ ${rev}\n`);
  console.log('kit version stamped:', readFileSync('.game-kit-version', 'utf8').trim());
}
process.exit(drift ? 1 : 0);
