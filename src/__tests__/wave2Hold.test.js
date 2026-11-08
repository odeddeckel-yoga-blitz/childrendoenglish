import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SPOTLIGHT_GAMES, HUB_ONLY_GAMES } from '../data/arcadeGames';

// Wave 2 went live 11-08 with guardrails for the reads that judge the older games (owner 11-08):
// no spotlight until wave1-judge (11-28), and no older game's end card leads into a new game.
const WAVE2 = ['opposites', 'true-or-false', 'feelings', 'sentence-builder', 'beginning-sounds', 'simon-says'];
const endCard = readFileSync(resolve(import.meta.dirname, '../../public/games/end-card.js'), 'utf-8');
const loops = JSON.parse(endCard.match(/var LOOPS=(\[[\s\S]*?\]\]);/)[1].replace(/'/g, '"'));

describe('games wave 2 hold (until the 11-28 wave1-judge read)', () => {
  it('wave 2 games are hub-only, never spotlight candidates', () => {
    expect(HUB_ONLY_GAMES.map((g) => g.id).sort()).toEqual([...WAVE2].sort());
    for (const id of WAVE2) expect(SPOTLIGHT_GAMES.some((g) => g.id === id)).toBe(false);
  });
  it('the committed spotlight pick is not a wave 2 game', () => {
    const spot = JSON.parse(readFileSync(resolve(import.meta.dirname, '../data/spotlight.json'), 'utf-8'));
    expect(WAVE2).not.toContain(spot.game?.id);
  });
  it('end card: every older game leads to an older game, wave 2 only to wave 2', () => {
    const next = (id) => { const l = loops.find((x) => x.includes(id)); return l[(l.indexOf(id) + 1) % l.length]; };
    const older = SPOTLIGHT_GAMES.map((g) => g.id).filter((id) => loops.flat().includes(id));
    expect(older.length).toBeGreaterThan(8);
    for (const id of older) expect(WAVE2).not.toContain(next(id));
    for (const id of WAVE2) expect(WAVE2).toContain(next(id));
  });
});
