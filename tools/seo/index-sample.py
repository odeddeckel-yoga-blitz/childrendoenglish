#!/usr/bin/env python3
"""RECURRING index-coverage as a script (cost plan, owner 11-07): inspects a fixed-size sample of sitemap URLs with the
Search Console URL Inspection API and prints a 3-line summary (states, newest pages, unknown-to-Google sample).
The sitemap API's 'indexed' count is always 0 (a known API quirk), so a sample is the only real reading.
  ~/.config/searchconsole/venv/bin/python tools/seo/index-sample.py [N=20] [extra URL paths…]
Read-only. Seeded sample (same day = same URLs), so day-to-day reruns compare like for like."""
import json, os, random, re, sys, urllib.request, datetime
from collections import Counter
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SITE = 'https://childrendoenglish.com/'
n = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 20
extra = [a for a in sys.argv[1:] if a.startswith('/')]
d = json.load(open(os.path.expanduser('~/.config/searchconsole/credentials.json')))
creds = Credentials(token=d.get('token'), refresh_token=d['refresh_token'], token_uri=d['token_uri'],
                    client_id=d['client_id'], client_secret=d['client_secret'])
sc = build('searchconsole', 'v1', credentials=creds, cache_discovery=False)
urls = re.findall(r'<loc>([^<]+)</loc>', urllib.request.urlopen(SITE + 'sitemap.xml').read().decode())
random.seed(datetime.date.today().isocalendar()[1])   # one sample per ISO week
sample = [SITE.rstrip('/') + p for p in extra] + random.sample(urls, min(n, len(urls)))
states, unknown, extra_out = Counter(), [], []
for u in sample:
    try:
        r = sc.urlInspection().index().inspect(body={'inspectionUrl': u, 'siteUrl': SITE}).execute()
        st = r['inspectionResult']['indexStatusResult'].get('coverageState', '?')
    except Exception as e:
        st = 'ERROR ' + str(e)[:40]
    states[st] += 1
    path = u.replace(SITE.rstrip('/'), '')
    if 'unknown' in st.lower(): unknown.append(path)
    if path in extra: extra_out.append(f'{path}: {st}')
indexed = sum(v for k, v in states.items() if k.startswith('Submitted and indexed') or k.startswith('Indexed'))
print(f'index sample ({len(sample)} of {len(urls)} sitemap URLs, week {datetime.date.today().isocalendar()[1]}): '
      f'{indexed} indexed ({round(100 * indexed / max(1, len(sample)))}%) · ' + ' · '.join(f'{k} {v}' for k, v in states.most_common()))
if extra_out: print('  named pages: ' + ' | '.join(extra_out))
if unknown: print('  unknown to Google: ' + ', '.join(unknown[:8]) + (' …' if len(unknown) > 8 else ''))
