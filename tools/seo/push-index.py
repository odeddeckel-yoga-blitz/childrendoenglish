#!/usr/bin/env python3
"""Resubmit the sitemap + request (re)indexing for a list of URLs.

Usage:
  ~/.config/searchconsole/venv/bin/python tools/seo/push-index.py <urls.txt>
where urls.txt has one absolute URL per line. Run after adding pages or
rewriting titles (see tools/seo/optimizer.py). Uses the shared GSC creds;
on invalid_grant run: ~/.config/searchconsole/venv/bin/python ~/.config/searchconsole/reauth.py
"""
import json, os, sys
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SITE = os.environ.get('GSC_SITE', 'https://childrendoenglish.com/')       # per-site: set in env
SITEMAP = os.environ.get('GSC_SITEMAP', SITE.rstrip('/') + '/sitemap.xml')

cred_path = os.path.expanduser('~/.config/searchconsole/credentials.json')
d = json.load(open(cred_path))
creds = Credentials(token=d.get('token'), refresh_token=d['refresh_token'],
    token_uri=d['token_uri'], client_id=d['client_id'], client_secret=d['client_secret'],
    scopes=d.get('scopes'))
try:
    creds.refresh(Request())
except Exception as e:
    print('AUTH-FAILED (run reauth.py):', e)
    sys.exit(2)

wm = build('webmasters', 'v3', credentials=creds)
wm.sitemaps().submit(siteUrl=SITE, feedpath=SITEMAP).execute()
print('sitemap resubmitted')

idx = build('indexing', 'v3', credentials=creds)
urls = open(sys.argv[1]).read().split() if len(sys.argv) > 1 else []
ok = fail = 0
for u in urls:
    try:
        idx.urlNotifications().publish(body={'url': u, 'type': 'URL_UPDATED'}).execute()
        ok += 1
    except Exception as e:
        fail += 1
        if fail <= 2: print('fail:', u, str(e)[:100])
print(f'indexing pings: {ok} ok, {fail} failed')
