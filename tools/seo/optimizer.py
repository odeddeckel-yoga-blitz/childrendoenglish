#!/usr/bin/env python3
"""SEO Optimizer — CTR + ranking opportunity finder for childrendoenglish.

Run (shared GSC creds; on invalid_grant run reauth.py):
  ~/.config/searchconsole/venv/bin/python tools/seo/optimizer.py [days=28] [--top=12]

Sections:
  1. CTR-opportunity PAGES (rank fine, unclicked) — title/description rewrites.
     Flags: IL% (>=40% → Hebrew-in-title candidate), mobile-position penalty.
  2. CTR-opportunity QUERIES — the exact phrasing to win.
  3. Cannibalization — queries split across 2+ pages (usually word page vs /hebrew/ twin).
  4. Page-2 band (pos 11-20) — RANKING problem: fix with internal links/content, NOT titles.
  5. Rewrite verdicts — for overrides in scripts/seo-title-overrides.json with an
     "added" date (YYYY-MM-DD) >=14d old, compares CTR/position before vs after.
     Also judges the 2026-09-26 site-wide title-template rewrite.
  6. Movers since the previous snapshot (each run saves tools/seo/snapshots/<date>.json).
  7. Zero-impression audit — sitemap URLs Google has never shown in 90d, bucketed.
  8. Auto-drafted override PROPOSALS (tools/seo/override-proposals.json) — suggested
     titles built from each top page's real queries; review, then merge the good ones
     into scripts/seo-title-overrides.json (keep the "added" date).
  9. Search-appearance (rich results) — prints when GSC reports any.
  Internal-link advisor: page-2 band entries get suggested linkers; act by adding
  entries to scripts/seo-featured.json (rendered as the "Popular" row on /vocabulary/).

Operating loop: run weekly → write overrides (WITH "added" dates) for section-1/2
winners → rebuild + deploy → tools/seo/push-index.py <urls> → judge in section 5.
When CONTENT IS REMOVED (a vocabulary word's page, a retired game): ship a
vercel.json 301 alongside the removal — section 7's ghost list flags stragglers
(pages Google still shows that no longer exist in the sitemap).
after 2-3 weeks. Priority = impressions x (expected_ctr(position) − actual_ctr).
"""
import json, os, sys, datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

# --- PER-SITE CONFIG (env-driven so this file syncs byte-identical across sites) ---
# Set these in the consumer's tools/seo/ wrapper or shell env. Defaults are CDE's.
#   GSC_SITE   full property URL, trailing slash   SEO_OVERRIDES  path to title-overrides JSON
#   GSC_SITEMAP  sitemap URL                        SEO_BRAND      brand suffix for drafted titles
#   SEO_TEMPLATE_REWRITE_DATE  YYYY-MM-DD of the last site-wide title-template change (or '')
#   SEO_RTL_TWIN=1  enable the ELL/RTL "Hebrew-in-title" (IL%) heuristic (CDE-only; off elsewhere)
# Sections 1-7 are site-agnostic. The IL%/RTL heuristic, the /vocabulary/ link-advisor, and the
# drafted-proposal wording are ELL-shaped: they no-op or read oddly off CDE — adapt per site.
SITE = os.environ.get('GSC_SITE', 'https://childrendoenglish.com/')
SITEMAP = os.environ.get('GSC_SITEMAP', SITE.rstrip('/') + '/sitemap.xml')
BRAND = os.environ.get('SEO_BRAND', 'Children Do English')
RTL_TWIN = os.environ.get('SEO_RTL_TWIN', '1') == '1'
MIN_IMP_PAGE, MIN_IMP_QUERY = 20, 10
TEMPLATE_REWRITE_DATE = os.environ.get('SEO_TEMPLATE_REWRITE_DATE', '2026-09-26')

def expected_ctr(pos):
    for limit, ctr in [(1.5, 0.28), (2.5, 0.15), (3.5, 0.10), (5, 0.07), (7, 0.045), (10, 0.03), (15, 0.015), (20, 0.008)]:
        if pos <= limit:
            return ctr
    return 0.004

days = next((int(a) for a in sys.argv[1:] if a.isdigit()), 28)
top = next((int(a.split('=')[1]) for a in sys.argv[1:] if a.startswith('--top=')), 12)

d = json.load(open(os.path.expanduser('~/.config/searchconsole/credentials.json')))
creds = Credentials(token=d.get('token'), refresh_token=d['refresh_token'], token_uri=d['token_uri'],
                    client_id=d['client_id'], client_secret=d['client_secret'], scopes=d.get('scopes'))
try:
    creds.refresh(Request())
except Exception as e:
    print('GSC auth dead (weekly lapse):', str(e)[:80])
    print('Fix: ! ~/.config/searchconsole/venv/bin/python ~/.config/searchconsole/reauth.py')
    sys.exit(2)
sc = build('searchconsole', 'v1', credentials=creds)
today = datetime.date.today()
end = today.isoformat()
start = (today - datetime.timedelta(days=days)).isoformat()

def q(dims, s=start, e=end, flt=None, limit=5000):
    body = {'startDate': s, 'endDate': e, 'dimensions': dims, 'rowLimit': limit}
    if flt:
        body['dimensionFilterGroups'] = [{'filters': flt}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get('rows', [])

pages = q(['page'])
queries = q(['query'])
page_country = q(['page', 'country'])
page_device = q(['page', 'device'])
query_page = q(['query', 'page'])

path = lambda u: u.replace(SITE.rstrip('/'), '')

# country + device maps per page
il_share, dev_pos = {}, {}
for r in page_country:
    p = path(r['keys'][0])
    a = il_share.setdefault(p, {'il': 0, 'all': 0})
    a['all'] += r['impressions']
    if r['keys'][1] == 'isr':
        a['il'] += r['impressions']
for r in page_device:
    dev_pos.setdefault(path(r['keys'][0]), {})[r['keys'][1]] = (r['position'], r['impressions'])

total_imp = sum(r['impressions'] for r in pages)
total_clk = sum(r['clicks'] for r in pages)
il_total = sum(a['il'] for a in il_share.values())
print(f"{days}d: {total_clk} clicks / {total_imp} impressions across {len(pages)} pages "
      f"(site CTR {100*total_clk/max(1,total_imp):.1f}%, IL share {100*il_total/max(1,total_imp):.0f}%)")
# Discovery health: brand queries are people who already know us; NON-brand growth is real
# discovery. A rising non-brand share means SEO is reaching new people, not just the loyal few.
_bkey = ''.join(c for c in BRAND.lower() if c.isalnum())
_collapse = lambda s: ''.join(c for c in str(s).lower() if c.isalnum())
_q_clk = sum(r['clicks'] for r in queries)
_brand_clk = sum(r['clicks'] for r in queries if _bkey and _bkey in _collapse(r['keys'][0]))
if _q_clk:
    print(f"  brand vs discovery: {_brand_clk} brand / {_q_clk - _brand_clk} non-brand clicks "
          f"({100*(_q_clk - _brand_clk)/_q_clk:.0f}% non-brand — higher = more real discovery)")
print()

# 1 — CTR-opportunity pages
# Per-page top query, for the brand-sitelink filter below: a page ranking pos ~1-5
# on the BRAND query with ~0 clicks is a sitelink under the homepage result — the
# homepage takes the click, and no title rewrite can change that. Flag, don't chase.
top_query = {}
for r in query_page:
    p = path(r['keys'][1])
    if r['impressions'] > top_query.get(p, (0, ''))[0]:
        top_query[p] = (r['impressions'], r['keys'][0])
_norm = lambda t: ''.join(ch for ch in t.lower() if ch.isalnum())
_brand_n = _norm(BRAND)
def brandish(query_text):
    qn = _norm(query_text)
    return len(qn) >= 4 and (qn in _brand_n or _brand_n in qn)

scored = []
brand_noise = []
for r in pages:
    imp, clk, pos = r['impressions'], r['clicks'], r['position']
    if imp < MIN_IMP_PAGE or pos > 10:
        continue
    gap = expected_ctr(pos) - (clk / imp)
    if gap <= 0:
        continue
    p = path(r['keys'][0])
    tq = top_query.get(p, (0, ''))[1]
    if pos <= 5 and tq and brandish(tq):
        brand_noise.append(f"{p} (top query '{tq}')")
        continue
    ish = il_share.get(p, {'il': 0, 'all': 1})
    ilpct = 100 * ish['il'] / max(1, ish['all'])
    dv = dev_pos.get(p, {})
    mob_pen = ''
    if 'MOBILE' in dv and 'DESKTOP' in dv and dv['MOBILE'][0] - dv['DESKTOP'][0] >= 3:
        mob_pen = f"  📱 mobile pos {dv['MOBILE'][0]:.0f} vs desktop {dv['DESKTOP'][0]:.0f}"
    heb = ('  🇮🇱 Hebrew-title candidate' if ilpct >= 40 else '') if RTL_TWIN else ''
    il_seg = f"  IL {ilpct:2.0f}%" if RTL_TWIN else ''
    scored.append((imp * gap, f"  {p[:48]:48} pos {pos:4.1f}  {imp:4.0f} imp  {clk:2.0f} clk{il_seg}{heb}{mob_pen}"))
scored.sort(reverse=True)
print(f"— 1. CTR-opportunity pages (title/description territory, pos ≤10, ≥{MIN_IMP_PAGE} imp):")
print('\n'.join(s for _, s in scored[:top]) or '  none')
if brand_noise:
    print('  excluded as brand-sitelink noise (homepage takes the click): ' + '; '.join(brand_noise[:4]))

# 2 — CTR-opportunity queries
qscored = []
for r in queries:
    imp, clk, pos = r['impressions'], r['clicks'], r['position']
    if imp < MIN_IMP_QUERY or pos > 12 or clk / imp >= expected_ctr(pos):
        continue
    qscored.append((imp * (expected_ctr(pos) - clk / imp), f"  '{r['keys'][0][:56]}'  pos {pos:.1f}, {imp:.0f} imp, {clk:.0f} clk"))
qscored.sort(reverse=True)
print(f"\n— 2. CTR-opportunity queries (≥{MIN_IMP_QUERY} imp, pos ≤12):")
print('\n'.join(s for _, s in qscored[:top]) or '  none')

# 3 — cannibalization
byq = {}
for r in query_page:
    if r['impressions'] >= 5:
        byq.setdefault(r['keys'][0], []).append((path(r['keys'][1]), r['impressions'], r['position']))
cann = {k: v for k, v in byq.items() if len(v) >= 2}
print('\n— 3. Cannibalized queries (impressions split across pages):')
for k, v in sorted(cann.items(), key=lambda kv: -sum(x[1] for x in kv[1]))[:8]:
    print(f"  '{k}' → " + ' | '.join(f"{p} ({i:.0f} imp, pos {ps:.0f})" for p, i, ps in v))
if not cann:
    print('  none')

# 4 — ranking-limited pages (pos 11-30 = page 2-3). RANKING problem, NOT titles: a rewrite
# can't lift a page that isn't on page 1. Learned the hard way — the real opportunity spans
# well past pos 20 (high-impression landing pages sitting at pos 14-19 AND 25-68), so the old
# pos≤20 band hid most of them. Sort by impressions; the pos column shows how far off page 1.
band = [(r['impressions'], f"  {path(r['keys'][0])[:52]:52} pos {r['position']:4.1f}  {r['impressions']:4.0f} imp")
        for r in pages if MIN_IMP_PAGE <= r['impressions'] and 10 < r['position'] <= 30]
band.sort(reverse=True)
print('\n— 4. Ranking-limited pages (pos 11-30 — internal links/content/authority, NOT titles):')
print('\n'.join(s for _, s in band[:top]) or '  none')
# The bottleneck verdict: title-limited (a rewrite CAN help) vs ranking-limited (only
# authority/links can). Encodes the core lesson so nobody burns time rewriting titles on
# page-2/3 pages — that was the repeated trap: pages ranked pos 25-68, titles were fine.
_ranking_limited = sum(1 for r in pages if r['impressions'] >= MIN_IMP_PAGE and r['position'] > 10)
if _ranking_limited > len(scored):
    print(f"\n  ▸ verdict: {_ranking_limited} high-impression pages are RANKING-limited (pos >10) vs "
          f"{len(scored)} title-limited (pos ≤10, low CTR). The lever is authority/backlinks (outreach), "
          f"not more title rewrites.")

# 5 — rewrite verdicts
print('\n— 5. Rewrite verdicts (needs ≥14d post-change):')
def verdict(label, page_filter, added):
    added_d = datetime.date.fromisoformat(added)
    if (today - added_d).days < 14:
        print(f"  {label}: too early ({(today - added_d).days}d since change)")
        return
    pre_s, pre_e = (added_d - datetime.timedelta(days=21)).isoformat(), (added_d - datetime.timedelta(days=1)).isoformat()
    post_s = (added_d + datetime.timedelta(days=1)).isoformat()
    def tot(rows):
        i = sum(r['impressions'] for r in rows); c = sum(r['clicks'] for r in rows)
        pos = sum(r['position'] * r['impressions'] for r in rows) / max(1, i)
        return i, c, pos
    pre = tot(q(['page'], pre_s, pre_e, page_filter))
    post = tot(q(['page'], post_s, end, page_filter))
    if pre[0] < 10 or post[0] < 10:
        print(f"  {label}: insufficient impressions to judge (pre {pre[0]:.0f} / post {post[0]:.0f})")
        return
    pre_ctr, post_ctr, post_pos = pre[1] / max(1, pre[0]), post[1] / max(1, post[0]), post[2]
    improved = post_ctr > pre_ctr
    # Intent-mismatch flag (the prime-factory lesson): the title was rewritten, the page ranks
    # PAGE 1 (so CTR is snippet-driven, not position-capped), yet CTR didn't lift AND still
    # trails what that rank should earn. More rewrites won't help — the searcher's intent
    # doesn't match the page. Stop re-tuning; the query is the mismatch, not the words.
    flag = ''
    if not improved and post_pos <= 10 and post_ctr < expected_ctr(post_pos):
        flag = f"  ⚠ no lift at pos {post_pos:.1f} (want ~{100*expected_ctr(post_pos):.0f}%) → likely query-INTENT mismatch, stop re-tuning"
    print(f"  {label}: CTR {100*pre_ctr:.1f}% → {100*post_ctr:.1f}%, "
          f"pos {pre[2]:.1f} → {post_pos:.1f}  ({'✅ improved' if improved else '➖ not yet'}){flag}")

verdict('site-wide title template', None, TEMPLATE_REWRITE_DATE)
overrides_path = os.environ.get('SEO_OVERRIDES', os.path.join(os.path.dirname(__file__), '..', '..', 'scripts', 'seo-title-overrides.json'))
for pth, o in json.load(open(overrides_path)).items():
    if o.get('added'):
        verdict(pth, [{'dimension': 'page', 'expression': SITE.rstrip('/') + pth}], o['added'])


# 6 — movers vs previous snapshot
import glob
snapdir = os.path.join(os.path.dirname(__file__), 'snapshots')
os.makedirs(snapdir, exist_ok=True)
prev_files = sorted(glob.glob(os.path.join(snapdir, '*.json')))
prev = None
for f in reversed(prev_files):
    fdate = datetime.date.fromisoformat(os.path.basename(f)[:10])
    if (today - fdate).days >= 3:
        prev = json.load(open(f)); prev_date = fdate; break
cur_snap = {'pages': {path(r['keys'][0]): [r['impressions'], r['clicks'], round(r['position'], 1)] for r in pages},
            'queries': {r['keys'][0]: [r['impressions'], r['clicks'], round(r['position'], 1)] for r in queries}}
json.dump(cur_snap, open(os.path.join(snapdir, end + '.json'), 'w'))
print('\n— 6. Movers since last snapshot:')
if not prev:
    print('  first snapshot saved — movers appear from the next run (>=3d apart)')
else:
    moves = []
    for p, (i, c, ps) in cur_snap['pages'].items():
        pi, pc, pps = prev['pages'].get(p, [0, 0, 0])
        if i + pi >= 30 and (abs(i - pi) >= 15 or abs(ps - pps) >= 2 or c != pc):
            moves.append((abs(i - pi) + 20 * abs(c - pc), f"  {p[:48]:48} imp {pi:.0f}→{i:.0f}  clk {pc:.0f}→{c:.0f}  pos {pps:.1f}→{ps:.1f}"))
    moves.sort(reverse=True)
    print(f'  (vs {prev_date})')
    print('\n'.join(m for _, m in moves[:10]) or '  no significant movement')

# 7 — zero-impression audit
print('\n— 7. Zero-impression audit (sitemap vs 90d of GSC):')
import re as _re
sm_path = os.environ.get('SEO_SITEMAP_FILE', os.path.join(os.path.dirname(__file__), '..', '..', 'dist', 'sitemap.xml'))
if not os.path.exists(sm_path):
    print('  dist/sitemap.xml not found — run a build first')
else:
    sm_urls = set(_re.findall(r'<loc>([^<]+)</loc>', open(sm_path).read()))
    rows90 = q(['page'], (today - datetime.timedelta(days=90)).isoformat(), end)
    shown90 = {path(r['keys'][0]).rstrip('/') + '/' for r in rows90}
    never = sorted(path(u).rstrip('/') + '/' for u in sm_urls if (path(u).rstrip('/') + '/') not in shown90)
    from collections import Counter
    bucket = Counter(('/' + p.split('/')[1] + '/') if len(p.split('/')) > 2 else p for p in never)
    print(f'  {len(never)}/{len(sm_urls)} sitemap URLs never shown in 90d, by section: '
          + ', '.join(f'{k}:{v}' for k, v in bucket.most_common(8)))
    print('  sample: ' + ', '.join(never[:6]))
    # Ghosts: the REVERSE direction — Google still surfaces a page that no longer
    # exists in the current build (removed word, renamed route). Each one is either
    # a missing vercel.json 301 (losing accrued equity) or an accepted 404.
    sm_paths = {path(u).rstrip('/') + '/' for u in sm_urls}
    ghosts = [(r['impressions'], r['clicks'], path(r['keys'][0]).rstrip('/') + '/')
              for r in rows90
              if '?' not in r['keys'][0] and '#' not in r['keys'][0]
              and (path(r['keys'][0]).rstrip('/') + '/') not in sm_paths
              and r['impressions'] >= 5]
    ghosts.sort(reverse=True)
    if ghosts:
        print('  ghosts (in GSC, NOT in sitemap — removed/renamed → add a 301 or accept the 404):')
        for i, c, p in ghosts[:8]:
            print(f'    {p[:52]:52} {i:4.0f} imp  {c:2.0f} clk')
    else:
        print('  ghosts: none (every page Google shows exists in the current sitemap)')

# 8 — auto-drafted override proposals for top CTR pages
print('\n— 8. Override proposals (review, then merge into scripts/seo-title-overrides.json):')
overrides = json.load(open(overrides_path))
proposals = {}
for _, line in scored[:5]:
    p = line.split()[0]
    if p in overrides:
        continue
    qs = q(['query'], flt=[{'dimension': 'page', 'expression': SITE.rstrip('/') + p}], limit=5)
    qs = [r for r in qs if r['impressions'] >= 3]
    if not qs:
        continue
    best = max(qs, key=lambda r: r['impressions'])['keys'][0]
    wordish = p.rstrip('/').split('/')[-1].replace('-', ' ').title()
    proposals[p] = {
        # Generic draft wording — the owner reviews before merging; adapt the phrasing to the
        # site's content type (CDE: picture/audio/Hebrew; a games site: "free … game", etc.).
        'title': f"{wordish} — {best.title()} | {BRAND}",
        'description': f"{best.capitalize()}? A free, kid-friendly page — no ads, no sign-up, works in any browser.",
        'based_on_queries': [r['keys'][0] for r in qs[:3]],
        'added': end,
    }
    print(f"  {p}\n    → {proposals[p]['title']}")
if proposals:
    json.dump(proposals, open(os.path.join(os.path.dirname(__file__), 'override-proposals.json'), 'w'), ensure_ascii=False, indent=2)
else:
    print('  none (top pages already overridden or too few queries)')

# internal-link advisor for the page-2 band
print('\n— Link advisor (page-2 band → add to scripts/seo-featured.json for the /vocabulary/ Popular row):')
top_linkers = [path(r['keys'][0]) for r in sorted(pages, key=lambda r: -r['clicks'])[:3]]
for _, line in band[:5]:
    p = line.split()[0]
    cat = p.split('/')[2] if p.startswith('/vocabulary/') and len(p.split('/')) > 3 else None
    sugg = ['/', '/vocabulary/'] + ([f'/vocabulary/{cat}/'] if cat else []) + top_linkers
    print(f"  {p[:48]:48} ← link from: {', '.join(dict.fromkeys(sugg))}")

# 8.5 — language-market fit (multilang: GSC country-groups × language surfaces)
# Sized per-language: are the language surfaces (/he/, /es/, /vocabulary/*/hebrew|spanish/)
# earning impressions where their speakers are, and (when the land beacon carries lang)
# are those arrivals actually USING the localized interface? "AR-region impressions up
# but ar-UI sessions flat" = the localization isn't landing.
LANG_SURFACES = {
    'he': ('/he/', '/hebrew/'),
    'es': ('/es/', '/spanish/'),
    'ar': ('/ar/', '/arabic/'),
}
COUNTRY_GROUPS = {
    'IL': {'isr'},
    'ES-region': {'mex', 'esp', 'arg', 'col', 'per', 'chl', 'gtm', 'ecu', 'bol', 'ven',
                  'dom', 'hnd', 'slv', 'nic', 'cri', 'pan', 'pry', 'ury', 'pri'},
    'AR-region': {'are', 'egy', 'sau', 'jor', 'mar', 'dza', 'tun', 'irq', 'kwt', 'qat',
                  'bhr', 'omn', 'lbn', 'lby', 'yem', 'syr', 'pse'},
}
print('\n— 8.5. Language-market fit:')
cp_rows = q(['country', 'page'])
for grp, countries in COUNTRY_GROUPS.items():
    gi = sum(r['impressions'] for r in cp_rows if r['keys'][0] in countries)
    gc = sum(r['clicks'] for r in cp_rows if r['keys'][0] in countries)
    per_lang = []
    for lg, prefixes in LANG_SURFACES.items():
        li = sum(r['impressions'] for r in cp_rows
                 if r['keys'][0] in countries and any(px in path(r['keys'][1]) for px in prefixes))
        if li:
            per_lang.append(f'{lg}-surface {li}')
    print(f'  {grp:10} {gi:5.0f} imp {gc:3.0f} clk  ' + (' · '.join(per_lang) or 'no language-surface impressions yet'))
# Whole-site per-surface totals (all countries) — is the surface indexed at all?
for lg, prefixes in LANG_SURFACES.items():
    ti = sum(r['impressions'] for r in pages if any(px in path(r['keys'][0]) for px in prefixes))
    tc = sum(r['clicks'] for r in pages if any(px in path(r['keys'][0]) for px in prefixes))
    print(f'  {lg}-surface total: {ti:.0f} imp, {tc:.0f} clk')
print('  (interface-language USAGE lives in cde_land.lang — compare via tools/learning/optimizer.mjs / land report)')

# 9 — search appearance
sa = q(['searchAppearance'])
print('\n— 9. Search appearance (rich results): ' + (', '.join(f"{r['keys'][0]}:{r['impressions']:.0f}imp/{r['clicks']:.0f}clk" for r in sa) if sa else 'none reported yet'))
