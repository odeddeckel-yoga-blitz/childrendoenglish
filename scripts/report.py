#!/usr/bin/env python3
"""
Pull the childrendoenglish funnel from GA4 and print a scannable report.

Usage:
    /usr/local/bin/python3 scripts/report.py                    # default last 7 days
    /usr/local/bin/python3 scripts/report.py --days 28          # last 28 days
    /usr/local/bin/python3 scripts/report.py --since 2026-08-01 # since a date

Requires the shared OAuth creds at ~/.config/searchconsole/credentials.json
(analytics.readonly is enough; Credentials.from_authorized_user_file). Re-auth
with `python3 ~/.config/searchconsole/reauth.py` if the token is revoked.

Custom-dimension columns (customEvent:mode, customEvent:level, ...) only
return non-empty values once GA4 has ingested events under the dims
registered by scripts/register-ga4-dims.py — allow ~24h of lag after
registering before those breakdowns fill in.

Traffic on this site is small and real (no bot heuristics applied, unlike
kidsdomath's funnel-report.py).
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import sys
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

PROP = "properties/526390448"  # childrendoenglish.com
CREDS = Path("/Users/odeddeckelbaum/.config/searchconsole/credentials.json")
SITE_URL = "https://childrendoenglish.com"

# The core funnel in order. Each tuple is (event_name, gate label).
FUNNEL_GATES = [
    ("first_visit",    "Landed on the site"),
    ("player_create",  "Created a player profile"),
    ("quiz_start",     "Started a quiz"),
    ("quiz_complete",  "Finished a quiz"),
]

# Referrer/source substrings treated as "AI" traffic for the acquisition
# subtotal (ChatGPT is currently the largest external channel per api/land.js).
AI_SOURCE_SUBSTRINGS = [
    "chatgpt.com", "chat.openai.com", "openai.com",
    "perplexity.ai", "claude.ai", "anthropic.com",
    "gemini.google.com", "bard.google.com",
    "copilot.microsoft.com", "bing.com/chat",
    "you.com", "phind.com",
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--days", type=int, default=7,
                   help="window in days from today (default 7)")
    p.add_argument("--since", type=str, default=None,
                   help="ISO start date (e.g. 2026-08-01); overrides --days")
    p.add_argument("--prop", type=str, default=PROP)
    return p.parse_args()


def load_ga(creds_path: Path):
    if not creds_path.exists():
        sys.exit(f"creds not found at {creds_path}")
    creds = Credentials.from_authorized_user_file(str(creds_path))
    return build("analyticsdata", "v1beta", credentials=creds)


def run(ga, prop: str, body: dict) -> list[dict]:
    """Execute a runReport and return rows as {dim: val, metric: float} dicts."""
    r = ga.properties().runReport(property=prop, body=body).execute()
    dims = [d["name"] for d in body.get("dimensions", [])]
    mets = [m["name"] for m in body.get("metrics", [])]
    out = []
    for row in r.get("rows", []):
        rec = {}
        for i, dv in enumerate(row.get("dimensionValues", [])):
            rec[dims[i]] = dv["value"]
        for i, mv in enumerate(row.get("metricValues", [])):
            try:
                rec[mets[i]] = float(mv["value"])
            except ValueError:
                rec[mets[i]] = mv["value"]
        out.append(rec)
    return out


def date_range(args) -> tuple[str, str, int]:
    today = dt.date.today()
    if args.since:
        start = dt.date.fromisoformat(args.since)
    else:
        start = today - dt.timedelta(days=args.days - 1)
    return start.isoformat(), today.isoformat(), (today - start).days + 1


def fmt_pct(n: float, d: float) -> str:
    if d <= 0:
        return "—"
    return f"{(100 * n / d):.1f}%"


def is_ai_source(source: str) -> bool:
    s = (source or "").lower()
    return any(sub in s for sub in AI_SOURCE_SUBSTRINGS)


def section(title: str) -> None:
    print(f"\n\033[1m== {title} ==\033[0m")


def main() -> int:
    args = parse_args()
    ga = load_ga(CREDS)
    start, end, days = date_range(args)
    dr = [{"startDate": start, "endDate": end}]

    print(f"\n\033[1mchildrendoenglish report  {start} → {end}  ({days} days)\033[0m")

    # --- 1. Topline ---
    section("1. Topline")
    rows = run(ga, args.prop, {
        "dateRanges": dr,
        "metrics": [
            {"name": "totalUsers"}, {"name": "newUsers"},
            {"name": "sessions"}, {"name": "engagedSessions"},
            {"name": "averageSessionDuration"}, {"name": "engagementRate"},
        ],
    })
    if rows:
        r = rows[0]
        new_pct = fmt_pct(r["newUsers"], r["totalUsers"])
        eng_pct = f"{(100 * r['engagementRate']):.0f}%"
        print(f"  users={int(r['totalUsers'])}  new={int(r['newUsers'])} ({new_pct})  "
              f"sessions={int(r['sessions'])}  engaged={int(r['engagedSessions'])} ({eng_pct})  "
              f"avg session={r['averageSessionDuration']:.0f}s")
    else:
        print("  (no data in window)")

    # --- 2. Funnel: first_visit -> player_create -> quiz_start -> quiz_complete ---
    section("2. Funnel (eventCount / totalUsers per gate)")
    gate_counts = []
    for ev, label in FUNNEL_GATES:
        rows = run(ga, args.prop, {
            "dateRanges": dr,
            "dimensions": [{"name": "eventName"}],
            "metrics": [{"name": "eventCount"}, {"name": "totalUsers"}],
            "dimensionFilter": {"filter": {
                "fieldName": "eventName", "stringFilter": {"value": ev}}},
        })
        if rows:
            evc = int(rows[0]["eventCount"])
            usr = int(rows[0]["totalUsers"])
        else:
            evc = usr = 0
        gate_counts.append((ev, label, evc, usr))

    base = gate_counts[0][3] if gate_counts else 0  # first_visit users
    prev = base
    for ev, label, evc, usr in gate_counts:
        step_pct = fmt_pct(usr, prev) if prev else "—"
        cum_pct = fmt_pct(usr, base) if base else "—"
        bar = "█" * int(20 * usr / base) if base else ""
        print(f"  {ev:<16s} users={usr:>4d}  events={evc:>5d}  "
              f"step={step_pct:>6s}  vs-first-visit={cum_pct:>6s}  {bar}")
        prev = usr if usr > 0 else prev

    # quiz_quit shown alongside, not part of the main chain
    rows = run(ga, args.prop, {
        "dateRanges": dr,
        "dimensions": [{"name": "eventName"}],
        "metrics": [{"name": "eventCount"}, {"name": "totalUsers"}],
        "dimensionFilter": {"filter": {
            "fieldName": "eventName", "stringFilter": {"value": "quiz_quit"}}},
    })
    if rows:
        evc = int(rows[0]["eventCount"])
        usr = int(rows[0]["totalUsers"])
    else:
        evc = usr = 0
    quiz_start_users = next((u for e, _, _, u in gate_counts if e == "quiz_start"), 0)
    quit_pct = fmt_pct(usr, quiz_start_users) if quiz_start_users else "—"
    print(f"  {'quiz_quit':<16s} users={usr:>4d}  events={evc:>5d}  "
          f"(of quiz_start users: {quit_pct})")

    # --- 3. Weekly quiz_complete trend ---
    section("3. Weekly quiz_complete trend")
    rows = run(ga, args.prop, {
        "dateRanges": dr,
        "dimensions": [{"name": "yearWeek"}],
        "metrics": [{"name": "eventCount"}, {"name": "totalUsers"}],
        "dimensionFilter": {"filter": {
            "fieldName": "eventName", "stringFilter": {"value": "quiz_complete"}}},
        "orderBys": [{"dimension": {"dimensionName": "yearWeek"}, "desc": False}],
    })
    if rows:
        print(f"  {'week':<8s} events  users")
        for r in rows:
            print(f"  {r['yearWeek']:<8s} {int(r['eventCount']):>5d}  {int(r['totalUsers']):>5d}")
    else:
        print("  (no quiz_complete events in window)")

    # --- 4. Acquisition by sessionSource, with AI subtotal ---
    section("4. Acquisition (sessions, engagement) — AI subtotal called out")
    rows = run(ga, args.prop, {
        "dateRanges": dr,
        "dimensions": [{"name": "sessionSource"}],
        "metrics": [{"name": "sessions"}, {"name": "totalUsers"},
                    {"name": "engagedSessions"}, {"name": "engagementRate"}],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        "limit": 20,
    })
    print(f"  {'source':<28s} sess  users  eng%   {'ai?'}")
    ai_sess = ai_users = ai_eng = 0
    tot_sess = tot_users = tot_eng = 0
    for r in rows:
        src = r.get("sessionSource", "?")
        sess = int(r["sessions"])
        users = int(r["totalUsers"])
        eng = int(r["engagedSessions"])
        eng_pct = int(100 * r["engagementRate"])
        ai_tag = "  AI" if is_ai_source(src) else ""
        print(f"  {src[:28]:<28s} {sess:>4d}  {users:>5d}  {eng_pct:>3d}%{ai_tag}")
        tot_sess += sess
        tot_users += users
        tot_eng += eng
        if is_ai_source(src):
            ai_sess += sess
            ai_users += users
            ai_eng += eng
    if tot_sess:
        print(f"  ── AI subtotal: {ai_sess} sessions ({fmt_pct(ai_sess, tot_sess)} of total), "
              f"{ai_users} users, {fmt_pct(ai_eng, ai_sess) if ai_sess else '—'} engaged")

    # --- 5. Events table ---
    section("5. Events")
    rows = run(ga, args.prop, {
        "dateRanges": dr,
        "dimensions": [{"name": "eventName"}],
        "metrics": [{"name": "eventCount"}, {"name": "totalUsers"}],
        "orderBys": [{"metric": {"metricName": "eventCount"}, "desc": True}],
        "limit": 30,
    })
    print(f"  {'event':<24s} events  users")
    for r in rows:
        print(f"  {r.get('eventName', '?'):<24s} {int(r['eventCount']):>6d}  {int(r['totalUsers']):>5d}")

    # --- 6. /api/land beacon note ---
    section("6. /api/land beacon (cookieless landing counter, GA-consent-independent)")
    token = os.environ.get("LAND_REPORT_TOKEN")
    if token:
        print(f"  curl \"{SITE_URL}/api/land?key={token}&days={days}\"")
    else:
        print("  LAND_REPORT_TOKEN not set in this shell.")
        print("  Run `vercel env pull` (from the project root) to fetch it, then:")
        print(f"  curl \"{SITE_URL}/api/land?key=$LAND_REPORT_TOKEN&days={days}\"")

    print("\nDone.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
