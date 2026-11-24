import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { badHeLang } from '../../scripts/validate-he-lang.mjs';

describe('badHeLang (postbuild /he/ lang check)', () => {
  it('flags a /he/ page that is not lang=he and passes the rest', () => {
    const he = join(mkdtempSync(join(tmpdir(), 'cde-he-')), 'he');
    mkdirSync(join(he, 'vocabulary'), { recursive: true });
    mkdirSync(join(he, 'about'), { recursive: true });
    writeFileSync(join(he, 'index.html'), '<!doctype html><html lang="he" dir="rtl"><head></head></html>');
    writeFileSync(join(he, 'about', 'index.html'), '<html dir="rtl" lang="he"><body></body></html>');
    writeFileSync(join(he, 'vocabulary', 'index.html'), '<html lang="en"><body></body></html>');
    expect(badHeLang(he)).toEqual([join('vocabulary', 'index.html')]);
  });
  it('is empty when there is no /he/ dir', () => expect(badHeLang(join(tmpdir(), 'cde-no-such-he'))).toEqual([]));
});
