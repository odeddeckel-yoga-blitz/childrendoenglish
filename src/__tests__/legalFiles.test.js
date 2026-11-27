// The repo is public (owner 11-27): LICENSE grants MIT for the code only, THIRD_PARTY_NOTICES.md names the outside
// licences, and the README's License section points at both. None of them may ship with a drafting marker.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '../..');
const read = (f) => readFileSync(resolve(root, f), 'utf8');
const MARKERS = /\[(OWNER|COUNSEL|VERIFY)\]|<OWNER|\bTODO\b|\bTBD\b|\bFIXME\b|\bXXX\b/;

describe('legal files', () => {
  it('LICENSE exists: MIT, code only, held by Children Do English, media and content excluded', () => {
    expect(existsSync(resolve(root, 'LICENSE'))).toBe(true);
    const lic = read('LICENSE');
    expect(lic).toMatch(/^MIT License \(code only\)/);
    expect(lic).toMatch(/^Copyright \(c\) \d{4} Children Do English$/m);
    expect(lic).toContain('does NOT cover');
    for (const s of ['images', 'audio', 'written learning content', 'THIRD_PARTY_NOTICES.md', 'https://childrendoenglish.com/image-credits/']) expect(lic).toContain(s);
  });
  it('THIRD_PARTY_NOTICES.md exists and points at the per-file image sources', () => {
    expect(existsSync(resolve(root, 'THIRD_PARTY_NOTICES.md'))).toBe(true);
    const n = read('THIRD_PARTY_NOTICES.md');
    expect(n).toContain('scripts/IMAGE_SOURCES.json');
    expect(n).toContain('https://childrendoenglish.com/image-credits/');
  });
  it('the README License section names LICENSE and THIRD_PARTY_NOTICES.md (no bare "MIT")', () => {
    const sec = read('README.md').split(/^## License\s*$/m)[1];
    expect(sec).toBeDefined();
    const body = sec.split(/^## /m)[0];
    expect(body).toContain('[LICENSE](LICENSE)');
    expect(body).toContain('[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)');
    expect(body).toMatch(/code only/i);
  });
  it('no drafting placeholder or marker in LICENSE, THIRD_PARTY_NOTICES.md or README.md', () => {
    for (const f of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'README.md']) expect(read(f), f).not.toMatch(MARKERS);
  });
});
