// Shared snapshot builder: one SQL pass over cde_learn/cde_land → the committed
// src/data/cde-stats.json shape read by the spotlight decider.
//   { generatedAt, window, gamesOpens, words: { id: [answers, correct] },
//     games: { id: { opens, lvl, cmp } }, spot: { 'w_<id>'|'g_<id>': clicks } }
// generatedAt = last day WITH data (not wall-clock) so unchanged data → identical file.
export async function fetchSnapshot(q, days = 28) {
  const rows = await q`SELECT ev, item, sum(n)::int AS n, max(day)::text AS last
    FROM cde_learn WHERE day >= CURRENT_DATE - ${days}::int GROUP BY ev, item`;
  const land = await q`SELECT sum(n)::int AS n FROM cde_land
    WHERE day >= CURRENT_DATE - ${days}::int AND page = 'games'`;
  const words = {}, games = {}, spot = {};
  let last = '';
  for (const r of rows) {
    if (r.last && r.last > last) last = r.last.slice(0, 10);
    if (r.ev === 'ans_ok' || r.ev === 'ans_no') {
      const w = (words[r.item] = words[r.item] || [0, 0]);
      w[0] += r.n; if (r.ev === 'ans_ok') w[1] += r.n;
    } else if (r.ev === 'g_lvl' || r.ev === 'g_cmp' || r.ev === 'g_open') {
      const g = (games[r.item] = games[r.item] || { opens: 0, lvl: 0, cmp: 0 });
      g[r.ev === 'g_lvl' ? 'lvl' : r.ev === 'g_cmp' ? 'cmp' : 'opens'] += r.n;
    } else if (r.ev === 'spot') {
      spot[r.item] = (spot[r.item] || 0) + r.n;
    }
  }
  const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));
  return { generatedAt: last ? `${last}T00:00:00.000Z` : null, window: `${days}d`, gamesOpens: land[0]?.n || 0, words: sorted(words), games: sorted(games), spot: sorted(spot) };
}

/** Live exposure for the current spotlight since each lane's `since` date. */
export async function fetchLiveExposure(q, spotlight) {
  const live = {};
  for (const lane of ['word', 'game']) {
    const cur = spotlight?.[lane];
    if (!cur?.id) continue;
    const since = (cur.since || '1970-01-01').slice(0, 10);
    const spotItem = `${lane === 'word' ? 'w_' : 'g_'}${cur.id}`;
    const rows = await q`SELECT ev, item, sum(n)::int AS n FROM cde_learn
      WHERE day >= ${since}::date AND item IN (${cur.id}, ${spotItem}) GROUP BY ev, item`;
    const n = (ev, item) => rows.find((r) => r.ev === ev && r.item === item)?.n || 0;
    live[lane] = lane === 'word'
      ? { spot: n('spot', spotItem), exposure: n('ans_ok', cur.id) + n('ans_no', cur.id), good: n('ans_ok', cur.id) }
      : { spot: n('spot', spotItem), exposure: n('g_open', cur.id), good: n('g_lvl', cur.id) };
  }
  return live;
}
