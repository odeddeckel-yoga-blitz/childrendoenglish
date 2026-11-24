// Postbuild check (audit 11-22 A097): every built page under /he/ must carry <html lang="he">.
// A /he/ page tagged lang="en" hurts Hebrew SEO and screen readers. Usage: node scripts/validate-he-lang.mjs [distDir]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function htmlFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** Paths (relative to heDir) of /he/ pages whose <html> tag is not lang="he". */
export function badHeLang(heDir) {
  if (!existsSync(heDir)) return [];
  return htmlFiles(heDir).filter((f) => {
    const tag = (readFileSync(f, 'utf8').match(/<html\b[^>]*>/i) || [''])[0];
    return !/\blang=["']he(-[A-Za-z]+)?["']/i.test(tag);
  }).map((f) => f.slice(heDir.length + 1));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = process.argv[2] || 'dist';
  const bad = badHeLang(join(dist, 'he'));
  if (bad.length) {
    console.error(`✗ ${bad.length} page(s) under /he/ are not <html lang="he">:\n  ` + bad.join('\n  '));
    process.exit(1);
  }
  console.log('✓ every /he/ page is <html lang="he">');
}
