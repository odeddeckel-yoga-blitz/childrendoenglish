// "This week in class" (RC12): only a well-formed /units/ path from the unit
// page's 📌 button becomes the home card; anything else is ignored.
import { describe, it, expect, beforeEach } from 'vitest';
import { getClassUnit } from '../utils/classUnit';

const put = (v) => localStorage.setItem('cde_class_unit', typeof v === 'string' ? v : JSON.stringify(v));

describe('getClassUnit', () => {
  beforeEach(() => localStorage.clear());

  it('nothing pinned → null', () => expect(getClassUnit()).toBeNull());

  it('a pinned unit comes back as path + name', () => {
    put({ p: '/units/jet-2/unit-3/', n: 'Jet 2 Unit 3' });
    expect(getClassUnit()).toEqual({ path: '/units/jet-2/unit-3/', name: 'Jet 2 Unit 3' });
  });

  it('rejects anything that is not a unit page path', () => {
    for (const p of ['https://evil.example/', '//evil.example/units/x/unit-1/', 'javascript:alert(1)', '/units/jet-2/', '/band-1/review/']) {
      put({ p, n: 'x' });
      expect(getClassUnit()).toBeNull();
    }
    put('{not json');
    expect(getClassUnit()).toBeNull();
  });

  it('a missing or overlong name falls back / is cut', () => {
    put({ p: '/units/jet-1/unit-2/' });
    expect(getClassUnit().name).toBe('/units/jet-1/unit-2/');
    put({ p: '/units/jet-1/unit-2/', n: 'x'.repeat(200) });
    expect(getClassUnit().name).toHaveLength(60);
  });
});
