/**
 * Class Battle player-side Hebrew (UX audit CUX20). The kid screens (home, join,
 * name pick, lobby, play, podium) follow the site's language — ?lang=he or the
 * app's saved cde_lang — and a toggle on the home and join screens. The teacher
 * setup and projector screens stay English for now.
 * English is the markup itself; this file only holds the Hebrew.
 */

const LRI = '⁦';
const PDI = '⁩';
/** Keep a number run like "3/5" left-to-right inside Hebrew text. */
export const ltr = (s) => `${LRI}${s}${PDI}`;

/** Drawn icon (sprite) markup — our own static string, innerHTML only. */
export function ic(n) { return '<svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-' + n + '"/></svg>'; }
export function icEl(n) { const t = document.createElement('template'); t.innerHTML = ic(n); return t.content.firstChild; }
/** Set el to [pre-icon] text [post-icon]; text goes in as a text node (safe for names/words). */
export function setIc(el, text, pre, post) {
  const nodes = [];
  if (pre) nodes.push(icEl(pre), ' ');
  nodes.push(text);
  if (post) nodes.push(' ', icEl(post));
  el.replaceChildren(...nodes);
}

/** Language for the teacher's error lines: ?lang, the app's saved cde_lang, then the browser; en | he | es. */
export function errLang() {
  try {
    const ok = (v) => (v === 'he' || v === 'es' || v === 'en' ? v : '');
    return ok(new URLSearchParams(location.search).get('lang')) || ok(localStorage.getItem('cde_lang'))
      || ok(String(navigator.language || '').slice(0, 2).toLowerCase()) || 'en';
  } catch { return 'en'; }
}

export function pickLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'he' || q === 'en') return q;
    return localStorage.getItem('cde_lang') === 'he' ? 'he' : 'en';
  } catch { return 'en'; }
}

// Static text by element id (textContent), applied once at boot.
const HE_TEXT = {
  homeSub: 'מרוץ אוצר מילים באנגלית לכל הכיתה. קוד החדר מוצג על המסך הגדול — כולם מצטרפים מהמכשיר שלהם, שומעים את המילה ולוחצים על התמונה המתאימה. הרצף הכי מהיר מנצח!',
  teacherH: 'אני המורה',
  teacherSub: 'יוצרים קרב ומציגים את הקוד במקרן.',
  btnTeacher: 'יצירת קרב',
  kidH: 'באתי לשחק',
  kidSub: 'קיבלתם קוד מהמורה? קפצו פנימה!',
  btnKid: 'הצטרפות עם קוד',
  projLink: 'מצב מקרן: כל הכיתה על מסך אחד',
  joinH: 'הקלידו את קוד החדר',
  btnCheckCode: 'הבא',
  nameH: 'בחרו שם לקרב!',
  nameSub: 'בלי שמות אמיתיים — בחרו שם גיבור מהרשימה.',
  btnMoreNames: 'תראו לי שמות אחרים',
  kidLobbySub: 'אתם בפנים! הסתכלו על המסך הגדול — הקרב מתחיל כשהמורה לוחצים על Start.',
  podiumTitle: 'הקרב נגמר!',
  btnAgain: 'עוד פעם',
  podiumPrivacy: 'החדר וכל הניקוד יימחקו אוטומטית בקרוב. שום דבר אחר לא נשמר.',
};
// Drawn icon before / after the text of these ids (the emoji were stripped from HE_TEXT).
const HE_ICON = { projLink: ['projector'], btnCheckCode: [null, 'arrow-left'], btnMoreNames: ['dices'], podiumTitle: ['trophy'] };
const HE_ARIA = { codeInput: 'קוד החדר', sayBtn: 'לשמוע שוב את המילה' };
const HE_PRIVACY = ['פרטיות:', ' בלי חשבונות ובלי הרשמה. השחקנים בוחרים כינוי מצחיק מרשימה — אף אחד לא מקליד את השם האמיתי שלו. נשמרים רק הכינוי והניקוד, והחדר כולו נמחק אוטומטית תוך שעה: 30 דקות אחרי שנוצר, או 10 דקות אחרי סוף המשחק אם זה מאוחר יותר.'];

// The screens a kid sees; they turn right-to-left in Hebrew.
const KID_SCREENS = ['sHome', 'sJoin', 'sName', 'sKidLobby', 'sPlay', 'sPodium'];

export const HE = {
  team: ['השביטים', 'הטילים'],
  hello: (nick) => `היי, ${nick}!`,
  onTeam: (team) => `אתם בקבוצת ${team}!`,
  classGoal: 'לכל הכיתה יש יעד אחד משותף!',
  tie: 'תיקו!',
  teamWins: (team) => `${team} ניצחו!`,
  goalHit: 'הגעתם ליעד הכיתתי!',
  goalMiss: 'כמעט! עוד ניסיון?',
  groupSelf: (nick, n, forWhom) => `${nick}: ${HE.words(n)} נכונות בשביל ${forWhom}!`,
  yourClass: 'הכיתה',
  teamwork: 'עבודת צוות מעולה, כולם!',
  greatBattle: 'קרב מעולה, כולם!',
  soloSelf: (nick, rank, score, correct, answered) =>
    `${nick}: מקום ${ltr(rank)} עם ${ltr(score)} נקודות (${ltr(`${correct}/${answered}`)} נכונות)!`,
  words: (n) => (n === 1 ? 'מילה אחת' : `${ltr(n)} מילים`),
  pts: (n) => `${ltr(n)} נק׳`,
  members: (n) => (n === 1 ? 'שחקן אחד' : `${ltr(n)} שחקנים`),
  perPlayer: (avg) => `${ltr(avg)} לשחקן`,
  errCode: 'לקוד יש 5 אותיות — בדקו במסך הגדול!',
  errOffline: 'אין חיבור — בדקו את האינטרנט ונסו שוב.',
  errNoRoom: 'אין חדר עם הקוד הזה. בדקו במסך הגדול!',
  errFinished: 'הקרב הזה כבר נגמר — בקשו קוד חדש.',
  errTaken: 'מישהו כבר לקח את השם הזה — בחרו אחר!',
  errFull: 'החדר מלא (עד 60 שחקנים).',
  errJoin: 'לא הצלחנו להצטרף — נסו שוב.',
};

/*
 * Host controls + the kid-side messages they cause (battle hardening 11-20),
 * in en / he / es. The teacher screens are English today (see the header), so
 * the host strings render from `en`; he / es are ready for when they turn.
 * Nicknames are English: wrap them with ltr() inside Hebrew text.
 */
export const BATTLE_T = {
  en: {
    lock: 'Lock room',
    unlock: 'Unlock room',
    lockedNote: 'Room locked: no new players can join.',
    manage: 'Manage players',
    remove: 'Remove',
    removeAria: (nick) => `Remove ${nick} from the battle`,
    noPlayers: 'No players yet.',
    hostErr: 'Could not update the room. Please try again.',
    errLocked: 'This room is locked. Ask your teacher!',
    createErr: 'Could not create a room — please try again.',
    startErr: 'Could not start — please try again.',
    tooManyRooms: 'Battles are busy right now. Try again in a few minutes.',
    removed: 'Your teacher took you out of this battle.',
  },
  he: {
    lock: 'נעילת החדר',
    unlock: 'פתיחת החדר',
    lockedNote: 'החדר נעול: שחקנים חדשים לא יכולים להצטרף.',
    manage: 'ניהול שחקנים',
    remove: 'הוצאה',
    removeAria: (nick) => `הוצאת ${ltr(nick)} מהקרב`,
    noPlayers: 'עדיין אין שחקנים.',
    hostErr: 'לא הצלחנו לעדכן את החדר. נסו שוב.',
    errLocked: 'החדר נעול. שאלו את המורה!',
    createErr: 'לא הצלחנו ליצור חדר. נסו שוב.',
    startErr: 'לא הצלחנו להתחיל. נסו שוב.',
    tooManyRooms: 'יש כרגע הרבה קרבות פעילים. נסו שוב בעוד כמה דקות.',
    removed: 'המורה הוציאו אתכם מהקרב הזה.',
  },
  es: {
    lock: 'Bloquear la sala',
    unlock: 'Desbloquear la sala',
    lockedNote: 'Sala bloqueada: no pueden entrar jugadores nuevos.',
    manage: 'Gestionar jugadores',
    remove: 'Quitar',
    removeAria: (nick) => `Quitar a ${nick} de la batalla`,
    noPlayers: 'Todavía no hay jugadores.',
    hostErr: 'No se pudo actualizar la sala. Inténtalo de nuevo.',
    errLocked: 'Esta sala está bloqueada. ¡Pregunta a tu profe!',
    createErr: 'No se pudo crear la sala. Inténtalo de nuevo.',
    startErr: 'No se pudo empezar. Inténtalo de nuevo.',
    tooManyRooms: 'Hay muchas batallas ahora mismo. Inténtalo de nuevo en unos minutos.',
    removed: 'Tu profe te ha sacado de esta batalla.',
  },
};
/** String `key` in `lang` (falls back to English). */
export const tr = (lang, key) => (BATTLE_T[lang] && BATTLE_T[lang][key]) || BATTLE_T.en[key];

/** Hebrew on the kid screens; the toggle link on home + join switches either way. */
export function applyLang(lang, $) {
  const other = lang === 'he' ? 'en' : 'he';
  for (const a of document.querySelectorAll('.langToggle')) {
    const u = new URL(location.href);
    u.searchParams.set('lang', other);
    a.href = u.pathname + u.search + u.hash;
    a.textContent = other === 'he' ? 'עברית' : 'English';
    a.lang = other;
  }
  // the projector link keeps the language
  if ($('projLink')) $('projLink').href = lang === 'he' ? '/projector/?lang=he' : '/projector/';
  if (lang !== 'he') return;
  for (const [id, s] of Object.entries(HE_TEXT)) {
    if (!$(id)) continue;
    const [pre, post] = HE_ICON[id] || [];
    if (pre || post) setIc($(id), s, pre, post); else $(id).textContent = s;
  }
  for (const [id, s] of Object.entries(HE_ARIA)) if ($(id)) $(id).setAttribute('aria-label', s);
  const priv = $('homePrivacy');
  if (priv) {
    const b = document.createElement('b');
    b.textContent = HE_PRIVACY[0];
    priv.replaceChildren(icEl('lock'), ' ', b, HE_PRIVACY[1]);
  }
  for (const id of KID_SCREENS) { $(id).dir = 'rtl'; $(id).lang = 'he'; }
  // English stays English inside the Hebrew screens
  for (const id of ['playWord', 'codeInput', 'nameGrid', 'kidLobbyPlayers']) { $(id).dir = 'ltr'; $(id).lang = 'en'; }
}
