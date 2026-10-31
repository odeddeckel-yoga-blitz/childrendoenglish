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
  joinH: 'הקלידו את קוד החדר',
  btnCheckCode: 'הבא ←',
  nameH: 'בחרו שם לקרב!',
  nameSub: 'בלי שמות אמיתיים — בחרו שם גיבור מהרשימה.',
  btnMoreNames: '🎲 תראו לי שמות אחרים',
  kidLobbySub: 'אתם בפנים! 👀 הסתכלו על המסך הגדול — הקרב מתחיל כשהמורה לוחצים על Start.',
  podiumTitle: '🏆 הקרב נגמר!',
  btnAgain: 'עוד פעם',
  podiumPrivacy: 'החדר וכל הניקוד יימחקו אוטומטית בקרוב. שום דבר אחר לא נשמר.',
};
const HE_ARIA = { codeInput: 'קוד החדר', sayBtn: 'לשמוע שוב את המילה' };
const HE_PRIVACY = ['פרטיות:', ' בלי חשבונות ובלי הרשמה. השחקנים בוחרים כינוי מצחיק מרשימה — אף אחד לא מקליד את השם האמיתי שלו. נשמרים רק הכינוי והניקוד, והחדר כולו נמחק אוטומטית כ־30 דקות אחרי שנוצר.'];

// The screens a kid sees; they turn right-to-left in Hebrew.
const KID_SCREENS = ['sHome', 'sJoin', 'sName', 'sKidLobby', 'sPlay', 'sPodium'];

export const HE = {
  team: ['השביטים', 'הטילים'],
  hello: (nick) => `היי, ${nick}! ⚡`,
  onTeam: (team) => `אתם בקבוצת ${team}!`,
  classGoal: '🎯 לכל הכיתה יש יעד אחד משותף!',
  tie: '🤝 תיקו!',
  teamWins: (team) => `🏆 ${team} ניצחו!`,
  goalHit: '🎉 הגעתם ליעד הכיתתי!',
  goalMiss: '💪 כמעט! עוד ניסיון?',
  groupSelf: (nick, n, forWhom) => `${nick}: ${HE.words(n)} נכונות בשביל ${forWhom}!`,
  yourClass: 'הכיתה',
  teamwork: 'עבודת צוות מעולה, כולם! 🎉',
  greatBattle: 'קרב מעולה, כולם! 🎉',
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
  if (lang !== 'he') return;
  for (const [id, s] of Object.entries(HE_TEXT)) if ($(id)) $(id).textContent = s;
  for (const [id, s] of Object.entries(HE_ARIA)) if ($(id)) $(id).setAttribute('aria-label', s);
  const priv = $('homePrivacy');
  if (priv) {
    const b = document.createElement('b');
    b.textContent = HE_PRIVACY[0];
    priv.replaceChildren('🔒 ', b, HE_PRIVACY[1]);
  }
  for (const id of KID_SCREENS) { $(id).dir = 'rtl'; $(id).lang = 'he'; }
  // English stays English inside the Hebrew screens
  for (const id of ['playWord', 'codeInput', 'nameGrid', 'kidLobbyPlayers']) { $(id).dir = 'ltr'; $(id).lang = 'en'; }
}
