"""Last Google crawl per page vs a cutoff (stale-crawl check for a read's day 0). Read-only, URL Inspection API.
  ~/.config/searchconsole/venv/bin/python tools/seo/recrawl-check.py --after=2026-11-14T09:20 he_grade-5 /he/grade-1/ …
Args are unit keys (path joined by "_") or paths."""
import json, os, sys
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
d = json.load(open(os.path.expanduser('~/.config/searchconsole/credentials.json')))
c = Credentials(token=d.get('token'), refresh_token=d['refresh_token'], token_uri=d['token_uri'], client_id=d['client_id'], client_secret=d['client_secret'], scopes=d.get('scopes'))
c.refresh(Request())
sc = build('searchconsole', 'v1', credentials=c)
after = next((x.split('=',1)[1] for x in sys.argv[1:] if x.startswith('--after=')), '')
units = [x for x in sys.argv[1:] if not x.startswith('--')]
for u in units:
    url = 'https://childrendoenglish.com/' + (u.strip('/') if u.startswith('/') else u.replace('_', '/')) + '/'
    r = sc.urlInspection().index().inspect(body={'inspectionUrl': url, 'siteUrl': 'https://childrendoenglish.com/'}).execute()['inspectionResult']['indexStatusResult']
    t = r.get('lastCrawlTime', '-')
    print(('NEW ' if t > after else 'old ') + t[:16], r.get('coverageState', ''), url)
