#!/usr/bin/env python3
"""Search CTR per test arm, Bing and Google separately and pooled (generic: any site, any page split).

Usage:
  ~/.config/searchconsole/venv/bin/python tools/seo/arm-ctr.py --site https://childrendoenglish.com \
      --arms arms.json --since 2026-11-24 [--until 2026-12-22]
arms.json: {"test": ["https://…/vocabulary/feelings/curious/", …], "control": [...], ...} (any arm names).
Prints impressions, clicks, CTR and impression-weighted position per arm for Bing (Webmaster API GetPageStats,
weekly rows), Google (Search Console, page dimension) and both pooled, plus a two-proportion z on pooled CTR when
there are exactly two arms. Read-only. Bing key: ~/.config/bing-webmaster/apikey (or BING_API_KEY); GSC: ~/.config/searchconsole.
"""
import argparse, datetime, json, math, os, re, sys, urllib.parse, urllib.request

ap = argparse.ArgumentParser()
ap.add_argument('--site', required=True)
ap.add_argument('--arms', required=True)
ap.add_argument('--since', required=True)
ap.add_argument('--until', default=datetime.date.today().isoformat())
a = ap.parse_args()
SITE = a.site.rstrip('/')
arms = json.load(open(a.arms))
arm_of = {u.rstrip('/') + '/': k for k, us in arms.items() for u in us}
since, until = datetime.date.fromisoformat(a.since), datetime.date.fromisoformat(a.until)
norm = lambda u: u.split('#')[0].split('?')[0].rstrip('/') + '/'
tot = {src: {k: [0, 0, 0.0] for k in arms} for src in ('bing', 'google')}

# Bing
kp = os.path.expanduser('~/.config/bing-webmaster/apikey')
key = os.environ.get('BING_API_KEY') or (open(kp).read().strip() if os.path.exists(kp) else '')
if key:
    url = ('https://ssl.bing.com/webmaster/api.svc/json/GetPageStats?apikey=' + key +
           '&siteUrl=' + urllib.parse.quote(SITE, safe=''))
    with urllib.request.urlopen(url, timeout=30) as r:
        rows = json.loads(r.read().decode()).get('d', [])
    for r in rows:
        day = datetime.date(1970, 1, 1) + datetime.timedelta(milliseconds=int(re.search(r'\d+', r['Date']).group()))
        k = arm_of.get(norm(r['Query']))
        if k and since <= day <= until:
            t = tot['bing'][k]; t[0] += r['Impressions']; t[1] += r['Clicks']; t[2] += r['AvgImpressionPosition'] * r['Impressions']
else:
    print('Bing: no API key — Bing columns stay 0')

# Google
try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    d = json.load(open(os.path.expanduser('~/.config/searchconsole/credentials.json')))
    creds = Credentials(token=d.get('token'), refresh_token=d['refresh_token'], token_uri=d['token_uri'],
                        client_id=d['client_id'], client_secret=d['client_secret'], scopes=d.get('scopes'))
    creds.refresh(Request())
    sc = build('searchconsole', 'v1', credentials=creds)
    body = {'startDate': a.since, 'endDate': a.until, 'dimensions': ['page'], 'rowLimit': 25000}
    for r in sc.searchanalytics().query(siteUrl=SITE + '/', body=body).execute().get('rows', []):
        k = arm_of.get(norm(r['keys'][0]))
        if k:
            t = tot['google'][k]; t[0] += r['impressions']; t[1] += r['clicks']; t[2] += r['position'] * r['impressions']
except Exception as e:
    print('Google: skipped —', str(e)[:100])

def line(label, t):
    i, c, p = t
    return f'  {label:<18} impr {i:6}  clicks {c:4}  CTR {100 * c / i if i else 0:5.2f}%  pos {p / i if i else 0:5.1f}'

print(f'arm CTR {SITE} · {a.since} → {a.until} · arms: ' + ', '.join(f'{k} {len(v)} pages' for k, v in arms.items()))
pooled = {}
for k in arms:
    b, g = tot['bing'][k], tot['google'][k]
    pooled[k] = [b[0] + g[0], b[1] + g[1], b[2] + g[2]]
    print(f'{k}:'); print(line('Bing', b)); print(line('Google', g)); print(line('pooled', pooled[k]))
if len(arms) == 2:
    (i1, c1, _), (i2, c2, _) = pooled.values()
    if i1 and i2 and c1 + c2:
        pp = (c1 + c2) / (i1 + i2); se = math.sqrt(pp * (1 - pp) * (1 / i1 + 1 / i2))
        z = (c1 / i1 - c2 / i2) / se if se else 0
        print(f'pooled CTR difference ({" − ".join(arms)}): {100 * (c1 / i1 - c2 / i2):+.2f} pp · z = {z:+.2f} (|z| ≥ 1.96 ≈ 95 %)')
    else:
        print('pooled CTR difference: not enough clicks yet')
