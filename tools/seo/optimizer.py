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

Operating loop: run weekly → write overrides (WITH "added" dates) for section-1/2
winners → rebuild + deploy → tools/seo/push-index.py <urls> → judge in section 5
after 2-3 weeks. Priority = impressions x (expected_ctr(position) − actual_ctr).
"""
import json, os, sys, datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SITE = 'https://childrendoenglish.com/'
MIN_IMP_PAGE, MIN_IMP_QUERY = 20, 10
TEMPLATE_REWRITE_DATE = '2026-09-26'  # site-wide "Meaning for Kids" title change

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
      f"(site CTR {100*total_clk/max(1,total_imp):.1f}%, IL share {100*il_total/max(1,total_imp):.0f}%)\n")

# 1 — CTR-opportunity pages
scored = []
for r in pages:
    imp, clk, pos = r['impressions'], r['clicks'], r['position']
    if imp < MIN_IMP_PAGE or pos > 10:
        continue
    gap = expected_ctr(pos) - (clk / imp)
    if gap <= 0:
        continue
    p = path(r['keys'][0])
    ish = il_share.get(p, {'il': 0, 'all': 1})
    ilpct = 100 * ish['il'] / max(1, ish['all'])
    dv = dev_pos.get(p, {})
    mob_pen = ''
    if 'MOBILE' in dv and 'DESKTOP' in dv and dv['MOBILE'][0] - dv['DESKTOP'][0] >= 3:
        mob_pen = f"  📱 mobile pos {dv['MOBILE'][0]:.0f} vs desktop {dv['DESKTOP'][0]:.0f}"
    heb = '  🇮🇱 Hebrew-title candidate' if ilpct >= 40 else ''
    scored.append((imp * gap, f"  {p[:48]:48} pos {pos:4.1f}  {imp:4.0f} imp  {clk:2.0f} clk  IL {ilpct:2.0f}%{heb}{mob_pen}"))
scored.sort(reverse=True)
print(f"— 1. CTR-opportunity pages (title/description territory, pos ≤10, ≥{MIN_IMP_PAGE} imp):")
print('\n'.join(s for _, s in scored[:top]) or '  none')

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

# 4 — page-2 band
band = [(r['impressions'], f"  {path(r['keys'][0])[:52]:52} pos {r['position']:4.1f}  {r['impressions']:4.0f} imp")
        for r in pages if MIN_IMP_PAGE <= r['impressions'] and 10 < r['position'] <= 20]
band.sort(reverse=True)
print('\n— 4. Page-2 band (RANKING problem — internal links/content, not titles):')
print('\n'.join(s for _, s in band[:top]) or '  none')

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
    print(f"  {label}: CTR {100*pre[1]/max(1,pre[0]):.1f}% → {100*post[1]/max(1,post[0]):.1f}%, "
          f"pos {pre[2]:.1f} → {post[2]:.1f}  ({'✅ improved' if post[1]/max(1,post[0]) > pre[1]/max(1,pre[0]) else '➖ not yet'})")

verdict('site-wide title template', None, TEMPLATE_REWRITE_DATE)
overrides_path = os.path.join(os.path.dirname(__file__), '..', '..', 'scripts', 'seo-title-overrides.json')
for pth, o in json.load(open(overrides_path)).items():
    if o.get('added'):
        verdict(pth, [{'dimension': 'page', 'expression': SITE.rstrip('/') + pth}], o['added'])
