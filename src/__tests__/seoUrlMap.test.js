// Deploy-time IndexNow map (tools/seo/seo-url-map.mjs): only pages a change names get pinged, never the whole site.
import { describe, it, expect } from 'vitest';
import map, { addedWordUrls, changedOverrideUrls } from '../../tools/seo/seo-url-map.mjs';

describe('seo-url-map', () => {
  it('pings only the newly published word pages', () => {
    expect(addedWordUrls(['/vocabulary/food/egg/'], ['/vocabulary/food/egg/', '/vocabulary/food/rice/']))
      .toEqual(['https://childrendoenglish.com/vocabulary/food/rice/']);
  });
  it('pings only the pages whose title/meta entry changed', () => {
    const before = { '/he/grade-4/': { title: 'a' }, '/he/grade-5/': { title: 'b' } };
    const after = { '/he/grade-4/': { title: 'a' }, '/he/grade-5/': { title: 'c' }, '/he/abc/': { title: 'd' } };
    expect(changedOverrideUrls(before, after)).toEqual(['https://childrendoenglish.com/he/grade-5/', 'https://childrendoenglish.com/he/abc/']);
  });
  it('maps a game folder to its page and site-wide files to nothing', () => {
    expect(map('public/games/letter-drop/game.js')).toBe('https://childrendoenglish.com/games/letter-drop/');
    for (const f of ['scripts/generate-seo-pages.js', 'src/data/words.js', 'src/App.jsx']) expect(map(f)).toBeNull();
  });
});
