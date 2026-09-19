/**
 * Vocabulary Class Battle — page controller for /battle/.
 * External module (CSP: script-src 'self' — no inline JS anywhere).
 * All game logic lives in battle-core.js; this file is DOM + network only.
 *
 * Flow: teacher creates a room (category + duration) → 5-letter code on the
 * projector → kids join by code + picked nickname → host-key-gated start →
 * kids answer client-generated word→photo questions → everyone polls room
 * state every 2s → server-clock countdown → podium.
 */

import {
  BATTLE_CATEGORIES, BATTLE_DURATIONS, normalizeCode, suggestNicknames,
  makeQuestion, pointsForAnswer,
} from './battle-core.js';

const API = '/api/live';
const POLL_MS = 2000;
const SS_KEY = 'cde-battle-v1';
const NO_REPEAT_WINDOW = 6;

const $ = (id) => document.getElementById(id);
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
      $('hostPlayers').replaceChildren(...room.players.map((p) => chip(p.nickname)));
      $('btnStart').disabled = n === 0;
    } else if (room.status === 'running') {
      if (S.view !== 'sHostLive') {
        show('sHostLive');
        const cat = BATTLE_CATEGORIES.find((c) => c.id === room.category);
        $('hostTopic').textContent = cat ? `${cat.emoji} ${cat.label}` : '';
      }
      renderBoard($('hostBoard'), room.players);
      tickClock();
    }
  } else if (S.role === 'kid') {
    if (room.status === 'lobby') {
      if (S.view !== 'sKidLobby') {
        show('sKidLobby');
        $('kidHello').textContent = `Hi, ${S.nickname}! ⚡`;
      }
      $('kidLobbyPlayers').replaceChildren(...room.players.map((p) => chip(p.nickname)));
    } else if (room.status === 'running') {
      if (S.view !== 'sPlay') {
        show('sPlay');
        nextQuestion();
      }
      $('kidScore').textContent = String(S.score);
      $('kidStreak').textContent = String(S.streak);
      tickClock();
    }
  }
}

function chip(text) {
  const el = document.createElement('span');
  el.className = 'chip';
  el.textContent = text;
  return el;
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

function renderPodium() {
  if (S.view !== 'sPodium') show('sPodium');
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
    score.textContent = `${p.score} pts`;
    const block = document.createElement('div');
    block.className = 'block';
    step.append(medal, name, score, block);
    return step;
  }));
  renderBoard($('podiumList'), players);
  if (S.role === 'kid') {
    const rank = players.findIndex((p) => p.id === S.playerId) + 1;
    $('podiumSelf').textContent = rank > 0
      ? `${S.nickname}, you finished #${rank} with ${S.score} points (${S.correct}/${S.answered} correct)!`
      : '';
  } else {
    $('podiumSelf').textContent = 'Great battle, everyone! 🎉';
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
  $('kidScore').textContent = String(S.score);
  $('kidStreak').textContent = String(S.streak);
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
  $('catGrid').replaceChildren(...BATTLE_CATEGORIES.map((c) => {
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
      action: 'create', category: S.category, durationSec: S.durationSec,
    });
    S.role = 'host';
    S.code = code;
    S.hostKey = hostKey;
    saveSession();
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
    await apiPost({ action: 'start', code: S.code, hostKey: S.hostKey });
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
    $('joinErr').textContent = 'Codes are 5 letters — check the big screen!';
    return;
  }
  const room = await apiState(code);
  if (room === 'offline') {
    $('joinErr').textContent = 'No connection — check your internet and try again.';
    return;
  }
  if (!room) {
    $('joinErr').textContent = 'Hmm, no room with that code. Check the big screen!';
    return;
  }
  if (room.status === 'finished') {
    $('joinErr').textContent = 'That battle already finished — ask for a new code.';
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
    startLoops();
  } catch (e) {
    if (e.code === 'nickname_taken') {
      $('nameErr').textContent = 'Someone grabbed that name — pick another!';
      renderNamePicker();
    } else if (e.code === 'room_full') {
      $('nameErr').textContent = 'This room is full (60 players max).';
    } else if (e.code === 'room_finished') {
      $('nameErr').textContent = 'That battle already finished — ask for a new code.';
    } else {
      $('nameErr').textContent = 'Could not join — please try again.';
    }
  }
}

/* ---------------- boot / resume ---------------- */

async function resume() {
  // 1) #host=CODE.HOSTKEY lets a teacher reopen the projector screen.
  //    #join=CODE prefills the code for kids (e.g. from a shared link).
  const hash = location.hash.slice(1);
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
    if (norm) {
      $('codeInput').value = norm;
      show('sJoin');
      return;
    }
  }

  // 2) sessionStorage resume (page reload mid-battle).
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SS_KEY) || 'null'); } catch { /* ignore */ }
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
  $('btnTeacher').addEventListener('click', () => { renderSetup(); show('sSetup'); });
  $('btnKid').addEventListener('click', () => show('sJoin'));
  $('btnCreate').addEventListener('click', createRoom);
  $('btnStart').addEventListener('click', startBattle);
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
  resume();
}

boot();
