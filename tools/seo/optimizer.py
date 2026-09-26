#!/usr/bin/env python3
"""SEO Optimizer — the CTR play that unlocked kidsdomath, for childrendoenglish.

Finds pages that RANK but don't get CLICKED (impressions-but-no-clicks), ranks
them by recoverable clicks, and shows each page's real queries — so title /
description rewrites target what searchers actually typed.

Run (uses the shared GSC creds; if invalid_grant, run reauth.py first):
  ~/.config/searchconsole/venv/bin/python tools/seo/optimizer.py [days=28] [--top=15]

Operating loop (weekly-ish):
  1. Run this. 2. For the top candidates, write a better <title>+description
     speaking to the shown queries (put overrides in scripts/seo-title-overrides.json,
     keyed by URL path — the page generator applies them at build).
  3. Rebuild + deploy, then ping the changed URLs (tools/seo/push-index.py <urls-file>).
  4. Wait 2-3 weeks before re-judging a rewritten page (position/CTR lag).

Priority = impressions x max(0, expected_ctr(position) - actual_ctr), floor at
MIN_IMPRESSIONS so one-impression pages don't top the list.
"""
import json, os, sys, datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SITE = 'https://childrendoenglish.com/'
MIN_IMPRESSIONS = 20

def expected_ctr(pos):
    # Rough click-through expectations by average position (industry-typical curve)
    for limit, ctr in [(1.5, 0.28), (2.5, 0.15), (3.5, 0.10), (5, 0.07), (7, 0.045), (10, 0.03), (15, 0.015), (20, 0.008)]:
        if pos <= limit:
            return ctr
    return 0.004

days = next((int(a) for a in sys.argv[1:] if a.isdigit()), 28)
top = next((int(a.split('=')[1]) for a in sys.argv[1:] if a.startswith('--top=')), 15)

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
end = datetime.date.today().isoformat()
start = (datetime.date.today() - datetime.timedelta(days=days)).isoformat()

pages = sc.searchanalytics().query(siteUrl=SITE, body={
    'startDate': start, 'endDate': end, 'dimensions': ['page'], 'rowLimit': 1000}).execute().get('rows', [])

scored = []
for r in pages:
    imp, clk, pos = r['impressions'], r['clicks'], r['position']
    if imp < MIN_IMPRESSIONS or pos > 25:
        continue
    gap = expected_ctr(pos) - (clk / imp if imp else 0)
    if gap <= 0:
        continue
    scored.append({'page': r['keys'][0].replace(SITE.rstrip('/'), ''), 'imp': imp, 'clk': clk,
                   'pos': pos, 'ctr': clk / imp, 'priority': imp * gap})
scored.sort(key=lambda x: -x['priority'])

total_imp = sum(r['impressions'] for r in pages)
total_clk = sum(r['clicks'] for r in pages)
print(f'{days}d: {total_clk} clicks / {total_imp} impressions across {len(pages)} pages '
      f'(site CTR {100 * total_clk / max(1, total_imp):.1f}%)\n')
print(f'— CTR-opportunity pages (>= {MIN_IMPRESSIONS} impressions, position <= 25):')
if not scored:
    print('  none yet — impressions too thin; re-run as they grow')
for r in scored[:top]:
    print(f"  {r['page'][:52]:52} pos {r['pos']:4.1f}  {r['imp']:4.0f} imp  {r['clk']:3.0f} clk ({100 * r['ctr']:.1f}%)  ~+{r['priority']:.1f} clicks/period possible")
    qs = sc.searchanalytics().query(siteUrl=SITE, body={
        'startDate': start, 'endDate': end, 'dimensions': ['query'], 'rowLimit': 4,
        'dimensionFilterGroups': [{'filters': [{'dimension': 'page', 'expression': SITE.rstrip('/') + r['page']}]}]}).execute().get('rows', [])
    for q in qs:
        print(f"      └ '{q['keys'][0]}'  {q['impressions']:.0f} imp, pos {q['position']:.1f}")
