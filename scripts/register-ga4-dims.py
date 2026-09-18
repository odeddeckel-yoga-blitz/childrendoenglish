#!/usr/bin/env python3
"""
Register GA4 custom event-scoped dimensions for the childrendoenglish property.

Without this, all custom event params (mode, level, score, step, ...) are
unreadable in GA4 reports — only event counts are available, which makes
funnel analysis impossible.

Idempotent: skips dims that already exist (matched by parameterName).

Run:
    /usr/local/bin/python3 scripts/register-ga4-dims.py

Requires the shared OAuth creds at ~/.config/searchconsole/credentials.json
(Credentials.from_authorized_user_file) with the `analytics.edit` scope. If
the create call 403s with ACCESS_TOKEN_SCOPE_INSUFFICIENT, either re-auth
with `analytics.edit` added (see ~/.config/searchconsole/reauth.py) or
register the dims by hand in GA4 UI: Admin → Property Settings → Data
Display → Custom definitions → Custom dimensions → Create (event-scoped).

Param list was discovered by grepping src/utils/analytics.js and its
callers (src/hooks/*, src/components/*, src/main.jsx) for trackEvent /
analytics.* calls — see the DIMS list below for the actual event → param
mapping found in this codebase.
"""

import sys

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

PROP = 'properties/526390448'  # childrendoenglish.com
CREDS_PATH = '/Users/odeddeckelbaum/.config/searchconsole/credentials.json'

DIMS = [
    # (parameter_name, display_name, description)
    ('screen_name',   'Screen Name',
     'SPA screen for screen_view events (welcome, level_select, mode_select, quiz, results, ...).'),
    ('mode',          'Quiz Mode',
     'Practice mode: e.g. flashcards / quiz / listen-match, per quiz_start / quiz_complete / quiz_quit / quiz_answer.'),
    ('level',         'Level',
     'Vocabulary level selected for the quiz, per quiz_start / quiz_complete / quiz_quit.'),
    ('score',         'Quiz Score',
     'Correct-answer count at quiz_complete.'),
    ('total',         'Quiz Total',
     'Total question count at quiz_complete.'),
    ('percentage',    'Quiz Percentage',
     'Round(score/total*100) at quiz_complete.'),
    ('question_index', 'Question Index',
     'Index of the question the player was on when they quit (quiz_quit).'),
    ('word_id',       'Word ID',
     'Vocabulary word identifier answered, per quiz_answer.'),
    ('correct',       'Answer Correct',
     'Whether the quiz_answer was correct (true/false).'),
    ('feature',       'Feature',
     'Named feature/screen opened, per feature_use (fired for screens in the features allowlist).'),
    ('outcome',       'PWA Install Outcome',
     'Result of the install prompt (accepted/dismissed), per pwa_install.'),
    ('step',          'Onboarding Step',
     'Numeric onboarding step index, per onboarding_step.'),
    ('step_name',     'Onboarding Step Name',
     'Named onboarding step, per onboarding_step.'),
    ('event_category', 'Event Category',
     'Category label on web_vitals events ("Web Vitals").'),
    ('event_label',   'Event Label',
     'Web-vitals metric ID, per web_vitals.'),
    ('value',         'Metric Value',
     'Web-vitals metric value (ms, rounded), per web_vitals.'),
    ('metric_name',   'Metric Name',
     'Web-vitals metric name (CLS/INP/LCP), per web_vitals.'),
]


def main() -> int:
    try:
        creds = Credentials.from_authorized_user_file(CREDS_PATH)
    except FileNotFoundError:
        print(f'ERROR: creds not found at {CREDS_PATH}', file=sys.stderr)
        return 1

    admin = build('analyticsadmin', 'v1beta', credentials=creds)

    existing_response = admin.properties().customDimensions().list(parent=PROP).execute()
    existing_params = {
        cd.get('parameterName') for cd in existing_response.get('customDimensions', [])
    }
    print(f'Found {len(existing_params)} existing custom dimensions on {PROP}')

    created = skipped = failed = 0
    for param, display, description in DIMS:
        if param in existing_params:
            print(f'  skip   {param:18s} (already registered)')
            skipped += 1
            continue
        body = {
            'parameterName': param,
            'displayName': display,
            'description': description,
            'scope': 'EVENT',
        }
        try:
            admin.properties().customDimensions().create(parent=PROP, body=body).execute()
            print(f'  create {param:18s} ({display})')
            created += 1
        except HttpError as e:
            print(f'  FAIL   {param:18s} {e}', file=sys.stderr)
            failed += 1

    print(f'\nDone. {created} created, {skipped} skipped, {failed} failed.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
