// Movement between activities (kit 1.59 §5.55 "movement between games", owner 11-04).
// One activity = a game page (public/land-beacon.js) or an app play screen (here). Both
// keep the same tab-scoped list in sessionStorage (cleared when the tab closes, never sent):
//   g2 / g3 @ how  — the 2nd / 3rd DISTINCT activity this visit, and how it was reached
//   hop @ from@to  — a move from one activity to another (the edges table)
// how = ladder | menu here; ladder | hub | game | app | page | ext | direct on game pages.
// Aggregate tallies only, through the same no-identifier learn beacon.
import { sendLearnBatch } from './learnBeacon';

// App screens that count as an activity → the id the report shows.
export const APP_ACTIVITIES = {
  imageQuiz: 'image-quiz', wordQuiz: 'word-quiz', audioQuiz: 'audio-quiz', listenMatchQuiz: 'listen-quiz',
  flashcards: 'flashcards', letterFix: 'letter-fix', sentenceGap: 'sentence-gap', today: 'today',
  dailyReview: 'daily-review', lightning: 'lightning', learning: 'learn', wordCheck: 'word-check',
};

// The events for one activity open; updates the session list. Shared logic with land-beacon.js.
export function flowEvents(act, how, store = sessionStorage) {
  const out = [];
  try {
    let seen = [];
    try { seen = JSON.parse(store.getItem('cde_acts') || '[]') || []; } catch { seen = []; }
    if (!seen.includes(act)) {
      seen.push(act);
      store.setItem('cde_acts', JSON.stringify(seen.slice(-30)));
      if (seen.length === 2 || seen.length === 3) out.push({ e: `g${seen.length}`, i: how });
    }
    const last = store.getItem('cde_last');
    if (last && last !== act) out.push({ e: 'hop', i: `${last}@${act}`.slice(0, 40) });
    store.setItem('cde_last', act);
  } catch { /* storage unavailable — no flow signal */ }
  return out;
}

export function noteAppActivity(view, how) {
  const act = APP_ACTIVITIES[view];
  if (!act) return;
  const ev = flowEvents(act, how);
  if (ev.length) sendLearnBatch(ev);
}
