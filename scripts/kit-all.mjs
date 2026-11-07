#!/usr/bin/env node
// One command for the kit's site gates (cost plan, owner 11-07): runs each read-only check against the live site and
// prints ONE line per gate (its summary) plus any finding lines, instead of each gate's full output.
//   node scripts/kit-all.mjs            (npm run kit:all) — exit 1 if any gate failed
import { spawnSync } from 'node:child_process';
const GATES = ['kit:smoke', 'kit:tap', 'kit:lang', 'kit:contrast', 'kit:creds', 'kit:hreflang'];
let bad = 0;
for (const g of GATES) {
  const r = spawnSync('npm', ['run', '-s', g], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const lines = `${r.stdout || ''}\n${r.stderr || ''}`.split('\n').map((l) => l.trim()).filter(Boolean);
  const summary = [...lines].reverse().find((l) => /pass|fail|finding|all readable|need attention|reachable|screens|checked/i.test(l)) || lines.at(-1) || '(no output)';
  const findings = lines.filter((l) => /^✗/.test(l)).slice(0, 5);
  if (r.status) bad++;
  console.log(`${r.status ? '✗' : '✓'} ${g.padEnd(13)} ${summary.slice(0, 170)}`);
  for (const f of findings) console.log(`    ${f.slice(0, 170)}`);
}
process.exit(bad ? 1 : 0);
