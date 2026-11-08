// Standing optimizer sections (kit 1.59 §5.55 / infra/optimizer-pattern.md, owner OK 11-04). Every read carries the
// whole path, not just in-game depth: movement between activities, site pages → games, in-game controls, errors ×
// bounce, AI referrals, returning players, phone load speed. All from aggregate tallies (cde_learn, cde_land,
// component_daily); the client halves are public/land-beacon.js, src/utils/activityFlow.js and public/games/game-clicks.js.
// The new tallies start 2026-11-04 — until ~Nov 11 every line here is thin; judge shares, not counts.

export const SECTIONS_SINCE = '2026-11-04';
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—');

// Pure helpers (unit-tested in src/__tests__/standingSections.test.js).
export function flowSummary(rows, visDays) {
  const g2 = {}, g3 = {}, out = {}, inn = {}, hops = [];
  for (const r of rows) {
    if (r.ev === 'g2') g2[r.item] = (g2[r.item] || 0) + r.n;
    else if (r.ev === 'g3') g3[r.item] = (g3[r.item] || 0) + r.n;
    else if (r.ev === 'hop') {
      const [from, to] = r.item.split('@');
      hops.push({ from, to, n: r.n });
      out[from] = (out[from] || 0) + r.n; inn[to] = (inn[to] || 0) + r.n;
    }
  }
  const sum = (o) => Object.values(o).reduce((a, n) => a + n, 0);
  const deadEnds = Object.entries(inn).filter(([a, n]) => n >= 10 && (out[a] || 0) / n < 0.2)
    .map(([a, n]) => ({ act: a, in: n, out: out[a] || 0 })).sort((a, b) => b.in - a.in);
  return { g2: sum(g2), g3: sum(g3), how: mergeCounts(g2, g3), visDays, top: hops.sort((a, b) => b.n - a.n).slice(0, 10), deadEnds };
}
function mergeCounts(...os) { const m = {}; for (const o of os) for (const [k, n] of Object.entries(o)) m[k] = (m[k] || 0) + n; return m; }

export function speedSummary(rows) {
  const by = {};   // surface → metric → {good, ni, poor}
  for (const r of rows) {
    const m = /^(lcp|cls|inp)_(good|ni|poor)@(.+)$/.exec(r.item); if (!m) continue;
    const s = ((by[m[3]] ||= {})[m[1]] ||= { good: 0, ni: 0, poor: 0 }); s[m[2]] += r.n;
  }
  const all = {};
  for (const ms of Object.values(by)) for (const [k, v] of Object.entries(ms)) { const a = (all[k] ||= { good: 0, ni: 0, poor: 0 }); a.good += v.good; a.ni += v.ni; a.poor += v.poor; }
  const slow = Object.entries(by).map(([s, ms]) => {
    const l = ms.lcp || { good: 0, ni: 0, poor: 0 }, c = ms.cls || { good: 0, ni: 0, poor: 0 };
    const ln = l.good + l.ni + l.poor, cn = c.good + c.ni + c.poor;
    return { surf: s, n: ln, lcpPoor: ln ? l.poor / ln : 0, clsPoor: cn ? c.poor / cn : 0 };
  }).filter((x) => x.n >= 8 && (x.lcpPoor >= 0.25 || x.clsPoor >= 0.25)).sort((a, b) => b.lcpPoor - a.lcpPoor);
  return { all, slow };
}

export function controlsSummary(rows) {
  // rows: {tpl, route, comp, imp, clk} for /games/* routes. Per game: Home taps on level 1, the most tapped control per
  // level (hear-again / hint climbing with the level = too hard), controls seen on ≥10 views and never tapped.
  const games = {};
  for (const r of rows) {
    const g = (games[r.route.replace('/games/', '')] ||= { l1home: 0, l1views: 0, levels: {}, seen: {} });
    if (r.tpl === 'game-l1') { g.l1views = Math.max(g.l1views, r.imp); if (r.comp === 'id.homepill') g.l1home += r.clk; }
    const lv = /^game-l(\d+)$/.exec(r.tpl);
    if (lv) { const L = (g.levels[+lv[1]] ||= {}); L[r.comp] = (L[r.comp] || 0) + r.clk; }
    const s = (g.seen[r.comp] ||= { imp: 0, clk: 0 }); s.imp += r.imp; s.clk += r.clk;
  }
  return Object.entries(games).map(([id, g]) => ({
    id, l1home: g.l1home, l1views: g.l1views,
    perLevel: Object.entries(g.levels).sort((a, b) => a[0] - b[0]).map(([L, cs]) => {
      const [comp, n] = Object.entries(cs).sort((a, b) => b[1] - a[1])[0] || ['—', 0];
      return { level: +L, comp, n };
    }),
    unused: Object.entries(g.seen).filter(([, s]) => s.imp >= 10 && s.clk === 0).map(([c]) => c),
  }));
}

// Static-page depth (measure step 2, 11-08): the page key (pg's item) → page type, the unit the layout work is judged by.
export const DEPTH_SINCE = '2026-11-08';
export function pageType(key) {
  if (key === 'vocabulary_word') return 'word';
  if (/^vocabulary_ages-/.test(key)) return 'age';
  if (/^vocabulary_[^_]+_(hebrew|spanish)$/.test(key)) return 'bilingual';
  if (/^vocabulary(_[^_]+)?$/.test(key)) return 'category';
  if (/^printable-flashcards(_(hebrew|spanish))?$/.test(key)) return 'printable-index';
  if (/^printable-flashcards_/.test(key)) return 'printable';
  if (key === 'tools_flashcard-maker') return 'maker';
  if (/^((he|es)_)?(for-)?teachers(_|$)/.test(key)) return 'teachers';
  if (/^guides(_|$)/.test(key)) return 'guide';
  if (/^units(_|$)/.test(key)) return 'unit';
  if (/^band-1(_|$)/.test(key)) return 'band1';
  if (key === 'games') return 'games-hub';
  if (/^games_/.test(key)) return 'game';
  if (/^he(_|$)/.test(key)) return 'he-pages';
  if (/^es(_|$)/.test(key)) return 'es-pages';
  return 'other';
}
const DEPTH_EVS = ['pg', 'cta', 'mq', 'mqv', 's15', 'prc', 'bpr', 'fmb'];
// rows: {item, ev, lang, n} → one line per page type × interface language, each rate ÷ that line's page views (pg).
export function pageDepthSummary(rows) {
  const by = {};
  for (const r of rows) {
    if (!DEPTH_EVS.includes(r.ev)) continue;
    const k = `${pageType(r.item)}|${r.lang || 'en'}`;
    const o = (by[k] ||= Object.fromEntries(DEPTH_EVS.map((e) => [e, 0])));
    o[r.ev] += r.n;
  }
  return Object.entries(by).map(([k, v]) => { const [type, lang] = k.split('|'); return { type, lang, ...v }; })
    .sort((a, b) => b.pg - a.pg);
}
export function printPageDepth(rows, minViews = 10) {
  const lines = pageDepthSummary(rows).filter((x) => x.pg >= minViews);
  console.log(`\n— static pages by type: depth (÷ views; depth tallies from ${DEPTH_SINCE}, views ≥ ${minViews}) —`);
  console.log('  stayed15 = visible 15 s · quiz-seen = mini-quiz ≥50% on screen · print = print button · dialog = beforeprint · build = maker Build');
  if (!lines.length) { console.log('  no page views yet'); return lines; }
  const c = (a, b) => pct(a, b).padStart(4);
  for (const x of lines) {
    const extra = [x.mqv || x.mq ? `quiz-seen ${c(x.mqv, x.pg)}  quiz-tap ${c(x.mq, x.pg)}` : '',
      x.prc || x.bpr || /printable|maker/.test(x.type) ? `print ${c(x.prc, x.pg)}  dialog ${c(x.bpr, x.pg)}` : '',
      x.type === 'maker' ? `build ${c(x.fmb, x.pg)}` : ''].filter(Boolean).join('  ');
    console.log(`  ${(x.type + ' ' + x.lang).padEnd(20)} views ${String(x.pg).padStart(5)}  stayed15 ${c(x.s15, x.pg)}  play-click ${c(x.cta, x.pg)}  ${extra}`);
  }
  return lines;
}

export async function standingSections(q, days) {
  const since = `GREATEST(CURRENT_DATE - ${Number(days)}, DATE '${SECTIONS_SINCE}')`;
  const learn = await q.query(`SELECT ev, item, sum(n)::int AS n FROM cde_learn WHERE day >= ${since}
    AND ev IN ('g2','g3','hop','vp','rets','jserr','cwv','g_open','vis') GROUP BY ev, item`, []);
  const land = await q.query(`SELECT page, src, sum(n)::int AS n FROM cde_land WHERE day >= ${since} GROUP BY page, src`, []);
  const of = (ev) => learn.filter((r) => r.ev === ev);
  const loads = {}; for (const r of land) loads[r.page] = (loads[r.page] || 0) + r.n;
  const visDays = of('vis').reduce((a, r) => a + r.n, 0);
  console.log(`\n══ standing sections (kit §5.55; tallies from ${SECTIONS_SINCE} — thin until ~Nov 11) ══`);

  // 1. Movement between activities
  const f = flowSummary(learn, visDays);
  console.log(`— movement between activities: 2nd activity in ${f.g2} visits (${pct(f.g2, visDays)} of ${visDays} browser-days), 3rd in ${f.g3} (${pct(f.g3, f.g2)} of those)`);
  if (f.g2) console.log('  how the next one was reached: ' + Object.entries(f.how).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${pct(n, f.g2 + f.g3)}`).join(' · '));
  if (f.top.length) console.log('  top moves: ' + f.top.map((h) => `${h.from}→${h.to} ${h.n}`).join(' · '));
  for (const d of f.deadEnds) console.log(`  ⚠ dead end: ${d.act} — ${d.in} arrivals, ${d.out} moved on (${pct(d.out, d.in)})`);

  // 2. Site pages → games
  const vp = of('vp');
  console.log('— site pages → games (game opens from that kind of page ÷ its page loads):');
  console.log(vp.length ? '  ' + vp.sort((a, b) => b.n - a.n).map((r) => `${r.item} ${r.n}/${loads[r.item] || 0} (${pct(r.n, loads[r.item])})`).join(' · ')
    : '  no vp tallies yet');

  // 3. In-game controls
  let cc = [];
  try {
    cc = await q.query(`SELECT tpl, route, comp, SUM(imp)::int AS imp, SUM(clk)::int AS clk FROM component_daily
      WHERE day >= ${since} AND route LIKE '/games/%' GROUP BY tpl, route, comp`, []);
  } catch { /* table appears with the first beacon */ }
  console.log('— in-game controls (per game: Home taps at level 1 · most-tapped control per level · seen, never tapped):');
  if (!cc.length) console.log('  no game control tallies yet');
  for (const g of controlsSummary(cc)) {
    console.log(`  ${g.id.padEnd(18)} L1 Home ${g.l1home}/${g.l1views} views · ` + g.perLevel.map((x) => `L${x.level} ${x.comp}×${x.n}`).join(' ') +
      (g.unused.length ? ` · never tapped: ${g.unused.slice(0, 5).join(', ')}` : ''));
  }

  // 4. Errors × bounce
  const opens = {}; for (const r of of('g_open')) opens[`g-${r.item}`] = r.n;
  opens.app = (loads.home || 0) + (loads.app || 0);
  const errs = of('jserr').map((r) => {
    const den = opens[r.item] ?? loads[r.item.replace(/^pg-/, '')] ?? 0;
    return { s: r.item, n: r.n, den, rate: den ? r.n / den : 1 };
  }).sort((a, b) => b.rate - a.rate);
  console.log('— script errors × bounce (page loads with an error ÷ opens):');
  console.log(errs.length ? '  ' + errs.map((e) => `${e.s} ${e.n}/${e.den} (${pct(e.n, e.den)})${e.den >= 10 && e.rate >= 0.05 ? ' ⚠' : ''}`).join(' · ')
    : '  none recorded');

  // 5. AI referrals (engines are in the AI arrivals line above; here: where they land)
  // (AI landings are an old tally: the full window, not just since the new ones shipped)
  const ai = await q.query(`SELECT page, sum(n)::int AS n FROM cde_land WHERE day >= CURRENT_DATE - ${Number(days)} AND src = 'ai' GROUP BY page`, []);
  const aiTot = ai.reduce((a, r) => a + r.n, 0);
  console.log(`— AI referrals (${days}d): ${aiTot} AI arrivals land on ` + (aiTot ? ai.sort((a, b) => b.n - a.n).slice(0, 6).map((r) => `${r.page} ${pct(r.n, aiTot)}`).join(' · ') : '—'));

  // 6. Returning players (the bucket mix is in "return visits" above; here: where a returning day starts)
  const rets = of('rets'), rt = rets.reduce((a, r) => a + r.n, 0);
  console.log(`— returning days start on: ` + (rt ? rets.sort((a, b) => b.n - a.n).slice(0, 8).map((r) => `${r.item} ${pct(r.n, rt)}`).join(' · ') + ` (of ${rt})` : 'no data yet'));

  // 7. Phone load speed
  const sp = speedSummary(of('cwv'));
  const share = (m) => { const v = sp.all[m]; if (!v) return `${m} —`; const n = v.good + v.ni + v.poor; return `${m} good ${pct(v.good, n)} / poor ${pct(v.poor, n)} (${n})`; };
  console.log(`— phone load speed (1 phone load in 4): ${share('lcp')} · ${share('cls')} · ${share('inp')}`);
  for (const s of sp.slow) console.log(`  ⚠ slow or jumpy: ${s.surf} — LCP poor ${pct(s.lcpPoor, 1)} · CLS poor ${pct(s.clsPoor, 1)} (${s.n} loads)`);
}
