#!/usr/bin/env python3
"""Bing Webmaster Tools — query/page/CTR report (the Bing counterpart to the GSC scripts).

Bing is kidsdomath's LARGEST search referrer (Vercel 28d: Bing > Google), but it's
invisible to Google Search Console. This pulls Bing's own data via the Webmaster API.

Usage:
  python3 tools/seo/bing_query.py            # top queries + pages + CTR levers
Auth: reads the API key from ~/.config/bing-webmaster/apikey (chmod 600) or $BING_API_KEY
(ONE key covers every site verified under the same Bing Webmaster account).
Generate at bing.com/webmasters → Settings → API access → API Key.
Site: $BING_SITE (or $GSC_SITE); kit convention: defaults are CDE's — consumers
set BING_SITE in their wrapper/env (kidsdomath: BING_SITE=https://kidsdomath.com).
"""
import os, sys, json, urllib.request, urllib.parse, urllib.error

KEYPATH = os.path.expanduser('~/.config/bing-webmaster/apikey')
KEY = os.environ.get('BING_API_KEY') or (open(KEYPATH).read().strip() if os.path.exists(KEYPATH) else None)
SITE = (os.environ.get('BING_SITE') or os.environ.get('GSC_SITE', 'https://childrendoenglish.com/')).rstrip('/')
if not KEY:
    sys.exit(f'No Bing API key. Put it in {KEYPATH} or set BING_API_KEY.')

BASE = 'https://ssl.bing.com/webmaster/api.svc/json/'


def call(method):
    url = f'{BASE}{method}?apikey={KEY}&siteUrl={urllib.parse.quote(SITE, safe="")}'
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read().decode()).get('d', [])
    except urllib.error.HTTPError as e:
        sys.exit(f'{method} HTTP {e.code}: {e.read()[:200].decode(errors="replace")}')


def ctr(c, i):
    return f'{100 * c / i:4.1f}%' if i else '  -'


# ---- overall traffic ----
rt = call('GetRankAndTrafficStats')
tc = sum(x.get('Clicks', 0) for x in rt)
ti = sum(x.get('Impressions', 0) for x in rt)
print(f'Bing — {SITE}  ·  {len(rt)} days  ·  {tc} clicks / {ti} impressions (all data)')

# ---- queries ----
q = sorted(call('GetQueryStats'), key=lambda x: -x.get('Impressions', 0))
print(f'\n## Top queries (by impressions) — {len(q)} total')
print(f'{"query":36s} {"impr":>6} {"clk":>4} {"ctr":>6} {"pos":>4}')
for x in q[:20]:
    print(f'{x.get("Query","")[:36]:36s} {x.get("Impressions",0):>6} {x.get("Clicks",0):>4} '
          f'{ctr(x.get("Clicks",0),x.get("Impressions",0)):>6} {x.get("AvgImpressionPosition",0):>4}')

# ---- pages ----
p = sorted(call('GetPageStats'), key=lambda x: -x.get('Impressions', 0))
print(f'\n## Top pages (by impressions) — {len(p)} total')
print(f'{"page":46s} {"impr":>6} {"clk":>4} {"ctr":>6} {"pos":>4}')
for x in p[:20]:
    pg = (x.get('Query', '') or '').replace('https://www.kidsdomath.com', '').replace('https://kidsdomath.com', '') or '/'
    print(f'{pg[:46]:46s} {x.get("Impressions",0):>6} {x.get("Clicks",0):>4} '
          f'{ctr(x.get("Clicks",0),x.get("Impressions",0)):>6} {x.get("AvgImpressionPosition",0):>4}')

# ---- CTR levers: page-1 (pos <=10), decent volume, low CTR ----
levers = [x for x in p if x.get('AvgImpressionPosition', 99) <= 10 and x.get('Impressions', 0) >= 150
          and (x.get('Clicks', 0) / max(1, x.get('Impressions', 1))) < 0.04]
levers.sort(key=lambda x: -x.get('Impressions', 0))
if levers:
    print('\n## 🎯 Bing CTR levers (page-1, ≥150 impr, <4% CTR — title/meta candidates)')
    seen = set()
    for x in levers:
        pg = (x.get('Query', '') or '').replace('https://www.kidsdomath.com', '').replace('https://kidsdomath.com', '') or '/'
        if pg in seen:
            continue
        seen.add(pg)
        print(f'  {pg[:46]:46s} impr={x.get("Impressions",0):>5} ctr={ctr(x.get("Clicks",0),x.get("Impressions",0))} pos={x.get("AvgImpressionPosition",0)}')
