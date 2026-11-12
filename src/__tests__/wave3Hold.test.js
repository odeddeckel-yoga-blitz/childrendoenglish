import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SPOTLIGHT_GAMES, HUB_ONLY_GAMES } from '../data/arcadeGames';

// Wave 3 (Letter Drop, Shopping List, Blend It; owner OK 11-12) ships hub-only like wave 2, so no unit under an open
// read changes: never a spotlight candidate, never next after an older or a wave-2 game on the end card, and its
// games lead only to each other. Lift with wave 2's guardrails (read wave2-guardrails-off) or at wave3-judge.
const WAVE3 = ['letter-drop', 'shopping-list', 'blend-it'];
const WAVE2 = ['opposites', 'true-or-false', 'feelings', 'sentence-builder', 'beginning-sounds', 'simon-says'];
const endCard = readFileSync(resolve(import.meta.dirname, '../../public/games/end-card.js'), 'utf-8');
const loops = JSON.parse(endCard.match(/var LOOPS=(\[[\s\S]*?\]\]);/)[1].replace(/'/g, '"'));
const names = endCard.match(/var NAMES=(\{[^}]*\})/)[1];

describe('games wave 3 hold', () => {
  it('wave 3 games are hub-only, never spotlight candidates; the hub-only list is wave 2 + wave 3', () => {
    expect(HUB_ONLY_GAMES.map((g) => g.id).sort()).toEqual([...WAVE2, ...WAVE3].sort());
    for (const id of WAVE3) expect(SPOTLIGHT_GAMES.some((g) => g.id === id)).toBe(false);
  });
  it('the committed spotlight pick is not a wave 3 game', () => {
    const spot = JSON.parse(readFileSync(resolve(import.meta.dirname, '../data/spotlight.json'), 'utf-8'));
    expect(WAVE3).not.toContain(spot.game?.id);
  });
  it('end card: no older or wave-2 game leads into wave 3; wave 3 leads only to wave 3; every game has a name', () => {
    const next = (id) => { const l = loops.find((x) => x.includes(id)); return l[(l.indexOf(id) + 1) % l.length]; };
    const all = loops.flat();
    for (const id of WAVE3) expect(all).toContain(id);
    for (const id of all.filter((x) => !WAVE3.includes(x))) expect(WAVE3).not.toContain(next(id));
    for (const id of WAVE3) expect(WAVE3).toContain(next(id));
    for (const id of all) expect(names).toContain(`'${id}':`);
  });
  it('each wave-3 game page exists with its scripts and the shared end card', () => {
    for (const id of WAVE3) {
      const html = readFileSync(resolve(import.meta.dirname, `../../public/games/${id}/index.html`), 'utf-8');
      for (const s of ['../cde-l10n.js', '../word-audio.js', '../end-card.js', './l10n.js', './game.js']) expect(html).toContain(`src="${s}"`);
      expect(html).not.toMatch(/<script>(?!\s*$)|\son[a-z]+=/i);   // CSP: no inline scripts or handlers
    }
  });
});
