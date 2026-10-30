/**
 * Team battle maths (kit PATTERNS §8c; KDM reference src/lib/liveTeams.js).
 * Teams are DERIVED from join order, never stored: 1st, 3rd, 5th… player →
 * team 0 (ties by id), so a reload or rejoin keeps the same team.
 * CDE counts words right (p.correct) toward a team.
 */

/** player id → team index (0/1), by join order (ties: id). */
export function teamOf(players) {
  const order = players.slice().sort((a, b) => (a.joinedAt - b.joinedAt) || String(a.id).localeCompare(String(b.id)));
  const m = new Map();
  order.forEach((p, i) => m.set(p.id, i % 2));
  return m;
}

/** [{ team, members, total, avg }] for both teams — never a per-player score. */
export function teamTotals(players) {
  const tm = teamOf(players);
  const out = [0, 1].map((team) => ({ team, members: 0, total: 0, avg: 0 }));
  for (const p of players) {
    const t = out[tm.get(p.id)];
    t.members++;
    t.total += p.correct || 0;
  }
  for (const t of out) t.avg = t.members ? Math.round((t.total / t.members) * 10) / 10 : 0;
  return out;
}

/** 0 or 1 = the team with the higher average; null = tie or a team with nobody. */
export function teamWinner(totals) {
  const [a, b] = totals;
  if (!a.members || !b.members || a.avg === b.avg) return null;
  return a.avg > b.avg ? 0 : 1;
}
