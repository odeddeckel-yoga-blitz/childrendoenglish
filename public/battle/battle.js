/**
 * Vocabulary Class Battle — page controller for /battle/.
 * External module (CSP: script-src 'self' — no inline JS anywhere).
 * All game logic lives in battle-core.js; this file is DOM + network only.
 *
 * Flow: teacher creates a room (category + duration) → 5-letter code on the
 * projector → kids join by code + picked nickname → host-key-gated start →
 * kids answer client-generated word→photo questions → everyone polls room
 * state every 2s → server-clock countdown → podium.
 * Modes (RL13): team (Comets vs Rockets, average per player wins) and class
 * (everyone vs one goal) show NO per-player score — the server doesn't even
 * send one; solo is the original leaderboard race.
 */

import {
  BATTLE_CATEGORIES, BATTLE_UNIT_CATEGORIES, BATTLE_DURATIONS, BATTLE_MODES, TEAM_NAMES, defaultTarget,
  normalizeCode, suggestNicknames, makeQuestion, pointsForAnswer,
} from './battle-core.js';
import { pickLang, applyLang, HE, ltr } from './battle-l10n.js';

const API = '/api/live';
const POLL_MS = 2000;
const SS_KEY = 'cde-battle-v1';
const NO_REPEAT_WINDOW = 6;

const $ = (id) => document.getElementById(id);
// Kid screens in Hebrew (CUX20); the teacher/projector screens stay English.
const HEB = pickLang() === 'he';
const screens = ['sHome', 'sSetup', 'sHostLobby', 'sHostLive', 'sJoin', 'sName', 'sKidLobby', 'sPlay', 'sPodium'];

/* ---------------- state ---------------- */

const S = {
  view: 'sHome',
  role: null,            // 'host' | 'kid'
  code: null,
  hostKey: null,
  playerId: null,
  playerKey: null,
  nickname: null,
  category: 'mix',
  durationSec: 120,
  mode: 'team',
  targetNudge: 0,        // class mode: teacher's ± steps on the default goal
  room: null,            // last polled server state
  clockOffset: 0,        // serverNow - clientNow
  q: null,               // current question
  recent: [],            // recent word ids (no-repeat window)
  score: 0, streak: 0, answered: 0, correct: 0,
  locked: false,
  pollTimer: null,
  clockTimer: null,
  finishedPolls: 0,
};

// Debug/test hook (client logic is untrusted anyway; server clamps scores).
window.__battleDbg = S;

function show(view) {
  S.view = view;
  for (const id of screens) $(id).classList.toggle('show', id === view);
}

function saveSession() {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify({
      role: S.role, code: S.code, hostKey: S.hostKey,
      playerId: S.playerId, playerKey: S.playerKey, nickname: S.nickname,
      score: S.score, streak: S.streak, answered: S.answered, correct: S.correct,
    }));
  } catch { /* storage blocked — resume just won't work */ }
}

function clearSession() {
  try { sessionStorage.removeItem(SS_KEY); } catch { /* ignore */ }
}

/* ---------------- api ---------------- */

/* Class Battle use as aggregate tallies in /api/land (cookieless, no
   identifier, like the rest of the site): bt = create | start_p<size> | join.
   Skips automation and the owner's ?internal=1 browser, as land-beacon.js does. */
function track(item) {
  try {
    if (navigator.webdriver || !navigator.sendBeacon || localStorage.getItem('cde_internal') === '1') return;
    const sl = localStorage.getItem('cde_lang');
    navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: 'bt', i: item }], l: sl === 'he' || sl === 'es' ? sl : 'en' }));
  } catch { /* never break the game */ }
}
const sizeBucket = (n) => (n <= 1 ? '1' : n <= 5 ? '2-5' : n <= 15 ? '6-15' : '16+');

async function apiPost(body) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || 'request_failed'), { code: data.error });
  return data;
}

/** Room state, or null when the room is gone (404), or 'offline' on a network hiccup. */
async function apiState(code) {
  try {
    const r = await fetch(`${API}?code=${encodeURIComponent(code)}`);
    if (r.status === 404) return null;
    if (!r.ok) return 'offline';
    return (await r.json()) || null;
  } catch {
    return 'offline';
  }
}

/* ---------------- speech (guarded) ---------------- */

function speak(word) {
  // the site's recorded voice (public/games/word-audio.js); device TTS if the file fails
  if (window.cdeSay) window.cdeSay(word, () => tts(word)); else tts(word);
}
function tts(word) {
  try {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch { /* TTS is a bonus, never required */ }
}

/* ---------------- clock ---------------- */

function remainingMs() {
  if (!S.room || !S.room.endsAt) return null;
  return S.room.endsAt - (Date.now() + S.clockOffset);
}

function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function tickClock() {
  const ms = remainingMs();
  if (ms === null) return;
  const txt = fmtClock(ms);
  if (S.view === 'sHostLive') $('hostClock').textContent = txt;
  if (S.view === 'sPlay') $('kidClock').textContent = txt;
}

/* ---------------- polling ---------------- */

function startLoops() {
  stopLoops();
  S.pollTimer = setInterval(poll, POLL_MS);
  S.clockTimer = setInterval(tickClock, 250);
  poll();
}

function stopLoops() {
  if (S.pollTimer) clearInterval(S.pollTimer);
  if (S.clockTimer) clearInterval(S.clockTimer);
  S.pollTimer = S.clockTimer = null;
}

async function poll() {
  if (!S.code) return;
  const room = await apiState(S.code);
  if (room === 'offline') return; // transient network hiccup — keep last state
  if (!room) {
    // Room expired or was cleaned up.
    stopLoops();
    if (S.view !== 'sPodium' && S.view !== 'sHome') {
      clearSession();
      show('sHome');
    }
    return;
  }
  S.room = room;
  S.clockOffset = room.now - Date.now();
  render();
  if (room.status === 'finished') {
    // A few extra polls catch classmates' final score posts, then stop.
    S.finishedPolls++;
    if (S.finishedPolls >= 3) stopLoops();
  }
}

/* ---------------- rendering ---------------- */

function render() {
  const room = S.room;
  if (!room) return;
  if (room.status === 'finished') { renderPodium(); return; }

  if (S.role === 'host') {
    if (room.status === 'lobby') {
      if (S.view !== 'sHostLobby') show('sHostLobby');
      $('roomCode').textContent = room.code;
      const n = room.players.length;
      $('hostCount').textContent = n === 0 ? 'Waiting for players…'
        : `${n} player${n === 1 ? '' : 's'} in — waiting for more!`;
      $('hostPlayers').replaceChildren(...room.players.map((p) => chip(p.nickname, room.mode === 'team' ? p.team : null)));
      $('btnStart').disabled = n === 0;
      $('hostMode').textContent = modeLine(room.mode);
      $('targetRow').hidden = room.mode !== 'class';
      if (room.mode === 'class') $('targetVal').textContent = String(lobbyTarget(n));
    } else if (room.status === 'running') {
      if (S.view !== 'sHostLive') {
        show('sHostLive');
        const cat = [...BATTLE_CATEGORIES, ...BATTLE_UNIT_CATEGORIES].find((c) => c.id === room.category);
        $('hostTopic').textContent = cat ? `${cat.emoji} ${cat.label}` : '';
      }
      if (room.mode === 'team') renderTeams($('hostBoard'), room);
      else if (room.mode === 'class') renderGoal($('hostBoard'), room);
      else renderBoard($('hostBoard'), room.players);
      tickClock();
    }
  } else if (S.role === 'kid') {
    if (room.status === 'lobby') {
      if (S.view !== 'sKidLobby') {
        show('sKidLobby');
        $('kidHello').textContent = HEB ? HE.hello(S.nickname) : `Hi, ${S.nickname}! ⚡`;
      }
      $('kidLobbyPlayers').replaceChildren(...room.players.map((p) => chip(p.nickname, room.mode === 'team' ? p.team : null)));
      const t = myTeam();
      $('kidTeam').textContent = room.mode === 'team' && t !== null ? (HEB ? HE.onTeam(teamLabel(t)) : `You're on the ${teamLabel(t)}!`)
        : room.mode === 'class' ? (HEB ? HE.classGoal : '🎯 Your whole class has one goal together!') : '';
    } else if (room.status === 'running') {
      if (S.view !== 'sPlay') {
        show('sPlay');
        nextQuestion();
      }
      renderKidHud();
      tickClock();
    }
  }
}

function modeLine(mode) {
  const m = BATTLE_MODES.find((x) => x.id === mode);
  return m ? `${m.emoji} ${m.label}: ${m.hint}` : '';
}

/** Kid HUD: points in solo; in team/class the words they got right, plus their team or the class goal. */
function renderKidHud() {
  const group = isGroup(S.room);
  $('kidScoreIcon').textContent = group ? '✅' : '⭐';
  $('kidScore').textContent = String(group ? S.correct : S.score);
  $('kidStreak').textContent = String(S.streak);
  const pill = $('kidGroup');
  const t = myTeam();
  if (S.room && S.room.mode === 'team' && t !== null) {
    pill.hidden = false;
    pill.style.borderColor = TEAM_NAMES[t].color;
    pill.textContent = teamLabel(t);
  } else if (S.room && S.room.mode === 'class') {
    pill.hidden = false;
    pill.style.borderColor = '';
    const goal = `${S.room.classTotal} / ${S.room.target}`;
    pill.textContent = `🎯 ${HEB ? ltr(goal) : goal}`;
  } else {
    pill.hidden = true;
  }
}

function chip(text, team = null) {
  const el = document.createElement('span');
  el.className = 'chip' + (team === null || team === undefined ? '' : ` t${team}`);
  el.textContent = team === null || team === undefined ? text : `${TEAM_NAMES[team].icon} ${text}`;
  return el;
}

const isGroup = (room) => room && (room.mode === 'team' || room.mode === 'class');
const teamLabel = (t) => `${TEAM_NAMES[t].icon} ${HEB ? HE.team[t] : TEAM_NAMES[t].name}`;
const myTeam = () => {
  const me = S.room && S.room.players.find((p) => p.id === S.playerId);
  return me ? me.team : null;
};
const TARGET_STEP = 5;
const words = (n) => (HEB ? HE.words(n) : `${n} word${n === 1 ? '' : 's'}`);
function lobbyTarget(n) {
  return Math.max(TARGET_STEP, defaultTarget(n, S.room ? S.room.durationSec : S.durationSec) + TARGET_STEP * S.targetNudge);
}

/** Team board: per team the average per player (what wins) and the total — no names, no player scores. */
function renderTeams(el, room) {
  const max = Math.max(1, ...room.teams.map((t) => t.avg));
  el.replaceChildren(...room.teams.map((t) => {
    const row = document.createElement('div');
    row.className = `brow team t${t.team}`;
    row.dataset.team = String(t.team);
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = `${Math.round((t.avg / max) * 100)}%`;
    const name = document.createElement('span');
    name.textContent = `${teamLabel(t.team)} · ${HEB ? HE.members(t.members) : `${t.members} player${t.members === 1 ? '' : 's'}`}`;
    const sc = document.createElement('span');
    sc.className = 'sc';
    sc.textContent = `${HEB ? HE.perPlayer(t.avg) : `${t.avg} per player`} · ${words(t.total)}`;
    row.append(bar, name, sc);
    return row;
  }));
}

/** Class goal: one bar for the whole class. */
function renderGoal(el, room) {
  const row = document.createElement('div');
  row.className = 'goal';
  const bar = document.createElement('div');
  bar.className = 'gbar';
  bar.style.width = `${Math.min(100, Math.round((room.classTotal / Math.max(1, room.target || 1)) * 100))}%`;
  const txt = document.createElement('span');
  txt.className = 'gtxt';
  txt.textContent = HEB ? `🎯 ${ltr(room.classTotal)} / ${words(room.target)}` : `🎯 ${room.classTotal} / ${words(room.target)}`;
  row.append(bar, txt);
  el.replaceChildren(row);
}

function renderBoard(el, players) {
  const max = Math.max(1, ...players.map((p) => p.score));
  el.replaceChildren(...players.map((p, i) => {
    const row = document.createElement('div');
    row.className = 'brow';
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = `${Math.round((p.score / max) * 100)}%`;
    const rank = document.createElement('span');
    rank.textContent = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
    const name = document.createElement('span');
    name.textContent = p.nickname + (p.streak >= 3 ? ' 🔥' : '');
    const sc = document.createElement('span');
    sc.className = 'sc';
    sc.textContent = String(p.score);
    row.append(bar, rank, name, sc);
    return row;
  }));
}

function renderGroupPodium() {
  const room = S.room;
  $('podiumTop').replaceChildren();
  if (room.mode === 'team') {
    $('podiumTitle').textContent = room.winner === null ? (HEB ? HE.tie : '🤝 It’s a tie!')
      : (HEB ? HE.teamWins(teamLabel(room.winner)) : `🏆 The ${teamLabel(room.winner)} win!`);
    renderTeams($('podiumList'), room);
  } else {
    const hit = room.classTotal >= room.target;
    $('podiumTitle').textContent = HEB ? (hit ? HE.goalHit : HE.goalMiss) : hit ? '🎉 Class goal reached!' : '💪 So close! Try again?';
    renderGoal($('podiumList'), room);
  }
  if (S.role === 'kid') {
    const t = myTeam();
    if (HEB) {
      $('podiumSelf').textContent = HE.groupSelf(S.nickname, S.correct, room.mode === 'team' && t !== null ? teamLabel(t) : HE.yourClass);
    } else {
      const forWhom = room.mode === 'team' && t !== null ? `the ${teamLabel(t)}` : 'your class';
      $('podiumSelf').textContent = `${S.nickname}, you got ${words(S.correct)} right for ${forWhom}!`;
    }
  } else {
    $('podiumSelf').textContent = HEB ? HE.teamwork : 'Great teamwork, everyone! 🎉';
  }
}

function renderPodium() {
  if (S.view !== 'sPodium') show('sPodium');
  if (isGroup(S.room)) { renderGroupPodium(); return; }
  $('podiumTitle').textContent = HEB ? '🏆 הקרב נגמר!' : '🏆 Battle over!';
  const players = S.room.players;
  const medals = ['🥇', '🥈', '🥉'];
  const order = [1, 0, 2]; // 2nd — 1st — 3rd visual layout
  $('podiumTop').replaceChildren(...order.filter((i) => players[i]).map((i) => {
    const p = players[i];
    const step = document.createElement('div');
    step.className = `pstep p${i + 1}`;
    const medal = document.createElement('div');
    medal.className = 'medal';
    medal.textContent = medals[i];
    const name = document.createElement('div');
    name.className = 'pname';
    name.textContent = p.nickname;
    const score = document.createElement('div');
    score.className = 'pscore';
    score.textContent = HEB ? HE.pts(p.score) : `${p.score} pts`;
    const block = document.createElement('div');
    block.className = 'block';
    step.append(medal, name, score, block);
    return step;
  }));
  renderBoard($('podiumList'), players);
  if (S.role === 'kid') {
    const rank = players.findIndex((p) => p.id === S.playerId) + 1;
    $('podiumSelf').textContent = rank > 0
      ? (HEB ? HE.soloSelf(S.nickname, rank, S.score, S.correct, S.answered)
        : `${S.nickname}, you finished #${rank} with ${S.score} points (${S.correct}/${S.answered} correct)!`)
      : '';
  } else {
    $('podiumSelf').textContent = HEB ? HE.greatBattle : 'Great battle, everyone! 🎉';
  }
}

/* ---------------- kid: questions ---------------- */

function nextQuestion() {
  if (!S.room) return;
  S.q = makeQuestion(S.room.category, S.recent);
  S.recent.push(S.q.id);
  if (S.recent.length > NO_REPEAT_WINDOW) S.recent.shift();
  S.locked = false;
  $('playWord').textContent = S.q.word;
  $('playHe').textContent = S.q.he || '';
  $('choices').replaceChildren(...S.q.choices.map((c) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.dataset.wordId = c.id;
    const img = document.createElement('img');
    img.src = c.img;
    img.alt = ''; // never leak the answer via alt text
    b.appendChild(img);
    b.addEventListener('click', () => answer(b, c.id));
    return b;
  }));
  speak(S.q.word);
}

function answer(btn, chosenId) {
  if (S.locked || !S.q) return;
  if (remainingMs() !== null && remainingMs() <= 0) return; // time's up — poll flips to podium
  S.locked = true;
  const good = chosenId === S.q.id;
  S.answered++;
  if (good) {
    S.score += pointsForAnswer(S.streak);
    S.streak++;
    S.correct++;
    btn.classList.add('good');
  } else {
    S.streak = 0;
    btn.classList.add('bad');
    const right = $('choices').querySelector(`[data-word-id="${S.q.id}"]`);
    if (right) right.classList.add('good');
  }
  for (const b of $('choices').querySelectorAll('button')) b.disabled = true;
  renderKidHud();
  saveSession();
  postScore();
  setTimeout(nextQuestion, good ? 550 : 1100);
}

function postScore() {
  apiPost({
    action: 'score', code: S.code, playerId: S.playerId, playerKey: S.playerKey,
    score: S.score, streak: S.streak, answered: S.answered, correct: S.correct,
  }).catch(() => { /* transient failure — next answer re-posts totals */ });
}

/* ---------------- teacher: setup ---------------- */

function renderSetup() {
  $('modeGrid').replaceChildren(...BATTLE_MODES.map((m) => {
    const b = document.createElement('button');
    b.className = 'chip' + (m.id === S.mode ? ' sel' : '');
    b.textContent = `${m.emoji} ${m.label}`;
    b.dataset.mode = m.id;
    b.setAttribute('aria-pressed', m.id === S.mode ? 'true' : 'false');
    b.addEventListener('click', () => { S.mode = m.id; renderSetup(); });
    return b;
  }));
  $('modeHint').textContent = BATTLE_MODES.find((m) => m.id === S.mode).hint;
  $('catGrid').replaceChildren(...[...BATTLE_CATEGORIES, ...BATTLE_UNIT_CATEGORIES].map((c) => {
    const b = document.createElement('button');
    b.className = 'chip' + (c.id === S.category ? ' sel' : '');
    b.textContent = `${c.emoji} ${c.label}`;
    b.dataset.cat = c.id;
    b.addEventListener('click', () => { S.category = c.id; renderSetup(); });
    return b;
  }));
  $('durGrid').replaceChildren(...BATTLE_DURATIONS.map((d) => {
    const b = document.createElement('button');
    b.className = 'chip' + (d.sec === S.durationSec ? ' sel' : '');
    b.textContent = d.label;
    b.dataset.sec = String(d.sec);
    b.addEventListener('click', () => { S.durationSec = d.sec; renderSetup(); });
    return b;
  }));
}

async function createRoom() {
  $('setupErr').textContent = '';
  try {
    const { code, hostKey } = await apiPost({
      action: 'create', category: S.category, durationSec: S.durationSec, mode: S.mode,
    });
    S.role = 'host';
    S.code = code;
    S.hostKey = hostKey;
    saveSession();
    track('create');
    track('mode_' + S.mode);
    show('sHostLobby');
    $('roomCode').textContent = code;
    startLoops();
  } catch {
    $('setupErr').textContent = 'Could not create a room — please try again.';
  }
}

async function startBattle() {
  $('hostErr').textContent = '';
  try {
    const n = (S.room && S.room.players || []).length;
    await apiPost({
      action: 'start', code: S.code, hostKey: S.hostKey,
      ...(S.room && S.room.mode === 'class' ? { target: lobbyTarget(n) } : {}),
    });
    track('start_p' + sizeBucket((S.room && S.room.players || []).length));
    poll();
  } catch (e) {
    if (e.code !== 'already_started') {
      $('hostErr').textContent = 'Could not start — please try again.';
    }
  }
}

/* ---------------- kid: join ---------------- */

async function checkCode() {
  $('joinErr').textContent = '';
  const code = normalizeCode($('codeInput').value);
  if (!code) {
    $('joinErr').textContent = (HEB ? HE.errCode : 'Codes are 5 letters — check the big screen!');
    return;
  }
  const room = await apiState(code);
  if (room === 'offline') {
    $('joinErr').textContent = (HEB ? HE.errOffline : 'No connection — check your internet and try again.');
    return;
  }
  if (!room) {
    $('joinErr').textContent = (HEB ? HE.errNoRoom : 'Hmm, no room with that code. Check the big screen!');
    return;
  }
  if (room.status === 'finished') {
    $('joinErr').textContent = (HEB ? HE.errFinished : 'That battle already finished — ask for a new code.');
    return;
  }
  S.code = code;
  S.room = room;
  renderNamePicker();
  show('sName');
}

function renderNamePicker() {
  const taken = (S.room && S.room.players || []).map((p) => p.nickname);
  const names = suggestNicknames(8, taken);
  $('nameErr').textContent = '';
  $('nameGrid').replaceChildren(...names.map((n) => {
    const b = document.createElement('button');
    b.className = 'namebtn';
    b.textContent = n;
    b.addEventListener('click', () => joinAs(n));
    return b;
  }));
}

async function joinAs(nickname) {
  $('nameErr').textContent = '';
  try {
    const { playerId, playerKey } = await apiPost({ action: 'join', code: S.code, nickname });
    S.role = 'kid';
    S.playerId = playerId;
    S.playerKey = playerKey;
    S.nickname = nickname;
    S.score = S.streak = S.answered = S.correct = 0;
    saveSession();
    track('join');
    startLoops();
  } catch (e) {
    if (e.code === 'nickname_taken') {
      $('nameErr').textContent = (HEB ? HE.errTaken : 'Someone grabbed that name — pick another!');
      renderNamePicker();
    } else if (e.code === 'room_full') {
      $('nameErr').textContent = (HEB ? HE.errFull : 'This room is full (60 players max).');
    } else if (e.code === 'room_finished') {
      $('nameErr').textContent = (HEB ? HE.errFinished : 'That battle already finished — ask for a new code.');
    } else {
      $('nameErr').textContent = (HEB ? HE.errJoin : 'Could not join — please try again.');
    }
  }
}

/* ---------------- boot / resume ---------------- */

async function resume() {
  // 1) #host=CODE.HOSTKEY lets a teacher reopen the projector screen.
  //    #join=CODE prefills the code for kids (e.g. from a shared link) —
  //    unless this tab already joined that room, so a reload mid-battle
  //    resumes the same player instead of dropping back to the join screen.
  const hash = location.hash.slice(1);
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SS_KEY) || 'null'); } catch { /* ignore */ }
  if (hash.startsWith('host=')) {
    const [code, hostKey] = hash.slice(5).split('.');
    const norm = normalizeCode(code);
    if (norm && hostKey) {
      S.role = 'host';
      S.code = norm;
      S.hostKey = hostKey;
      saveSession();
      startLoops();
      return;
    }
  }
  if (hash.startsWith('join=')) {
    const norm = normalizeCode(hash.slice(5));
    if (norm && !(saved && saved.role === 'kid' && saved.code === norm)) {
      $('codeInput').value = norm;
      show('sJoin');
      return;
    }
  }

  // 2) sessionStorage resume (page reload mid-battle).
  if (saved && saved.code && saved.role) {
    const room = await apiState(saved.code);
    if (room) { // includes 'offline' — assume the room is still alive
      Object.assign(S, saved);
      if (room !== 'offline') S.room = room;
      startLoops();
      return;
    }
    clearSession();
  }
  show('sHome');
}

function boot() {
  applyLang(HEB ? 'he' : 'en', $);
  $('btnTeacher').addEventListener('click', () => { renderSetup(); show('sSetup'); });
  $('btnKid').addEventListener('click', () => show('sJoin'));
  $('btnCreate').addEventListener('click', createRoom);
  $('btnStart').addEventListener('click', startBattle);
  $('targetDown').addEventListener('click', () => { S.targetNudge--; render(); });
  $('targetUp').addEventListener('click', () => { S.targetNudge++; render(); });
  $('btnCheckCode').addEventListener('click', checkCode);
  $('codeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkCode(); });
  $('btnMoreNames').addEventListener('click', renderNamePicker);
  $('sayBtn').addEventListener('click', () => { if (S.q) speak(S.q.word); });
  $('btnAgain').addEventListener('click', () => {
    stopLoops();
    clearSession();
    location.hash = '';
    location.reload();
  });
  // A unit page's "battle these words" link: /battle/?unit=u-<book>-<unit> opens
  // the teacher setup with that unit already picked — unless resume() put this
  // tab back into a room it already belongs to.
  const unit = new URLSearchParams(location.search).get('unit');
  resume().then(() => {
    if (S.view === 'sHome' && unit && BATTLE_UNIT_CATEGORIES.some((c) => c.id === unit)) {
      S.category = unit;
      renderSetup();
      show('sSetup');
    }
  });
}

boot();
