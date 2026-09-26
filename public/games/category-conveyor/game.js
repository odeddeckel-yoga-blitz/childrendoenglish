"use strict";
/* ============================================================
   CATEGORY CONVEYOR — English sorting arcade (ChildrenDoEnglish)
   Word photos ride a conveyor belt. When a photo is inside the
   glowing ACTIVE zone, tap the bin of its category to sort it:
   correct → hop into the bin + combo scoring; wrong → the bin
   bounces it back out with a buzz (streak reset, item continues).
   A word exiting unsorted costs one of 3 shields; 0 shields ends
   the run (score / best / play again). 2 bins (LV1-2) → 3 bins
   (LV3-5) → 4 bins (LV6-8). Four fast correct sorts in a row
   speed the belt up and level up; a miss rubber-bands speed down.
   speechSynthesis speaks each word as it enters the active zone.
   External file (not inline) because the site CSP is
   script-src 'self'. Zero inline handlers for the same reason.
   ============================================================ */

/* ---------------- word data (from src/data/words.js, 6 categories) ---------------- */
const CATS = {
  animals:  { name:'Animals',   emoji:'🐾', color:'#f59e0b' },
  food:     { name:'Food',      emoji:'🍎', color:'#ef4444' },
  transport:{ name:'Transport', emoji:'🚗', color:'#3b82f6' },
  clothing: { name:'Clothing',  emoji:'👕', color:'#8b5cf6' },
  home:     { name:'Home',      emoji:'🏠', color:'#16a34a' },
  colors:   { name:'Colors',    emoji:'🎨', color:'#ec4899' },
};
/* {id, en, he, cat} — id maps to /images/<id>.webp. "tricky" items are deliberate
   cross-category traps (foods that are also colors and vice versa); they only
   spawn at LV6+ when BOTH the Food and Colors bins are on screen. */
const WORDS = [
  // animals (21)
  {id:'cat',en:'cat',he:'חתול',cat:'animals'},{id:'dog',en:'dog',he:'כלב',cat:'animals'},
  {id:'fish',en:'fish',he:'דג',cat:'animals'},{id:'bird',en:'bird',he:'ציפור',cat:'animals'},
  {id:'rabbit',en:'rabbit',he:'ארנב',cat:'animals'},{id:'horse',en:'horse',he:'סוס',cat:'animals'},
  {id:'cow',en:'cow',he:'פרה',cat:'animals'},{id:'elephant',en:'elephant',he:'פיל',cat:'animals'},
  {id:'penguin',en:'penguin',he:'פינגווין',cat:'animals'},{id:'duck',en:'duck',he:'ברווז',cat:'animals'},
  {id:'pig',en:'pig',he:'חזיר',cat:'animals'},{id:'bee',en:'bee',he:'דבורה',cat:'animals'},
  {id:'mouse',en:'mouse',he:'עכבר',cat:'animals'},{id:'snake',en:'snake',he:'נחש',cat:'animals'},
  {id:'tiger',en:'tiger',he:'נמר',cat:'animals'},{id:'zebra',en:'zebra',he:'זברה',cat:'animals'},
  {id:'shark',en:'shark',he:'כריש',cat:'animals'},{id:'lion',en:'lion',he:'אריה',cat:'animals'},
  {id:'frog',en:'frog',he:'צפרדע',cat:'animals'},{id:'bear',en:'bear',he:'דוב',cat:'animals'},
  {id:'monkey',en:'monkey',he:'קוף',cat:'animals'},
  // food (21 + 1 tricky)
  {id:'apple',en:'apple',he:'תפוח',cat:'food'},{id:'banana',en:'banana',he:'בננה',cat:'food'},
  {id:'bread',en:'bread',he:'לחם',cat:'food'},{id:'milk',en:'milk',he:'חלב',cat:'food'},
  {id:'egg',en:'egg',he:'ביצה',cat:'food'},{id:'pizza',en:'pizza',he:'פיצה',cat:'food'},
  {id:'watermelon',en:'watermelon',he:'אבטיח',cat:'food'},{id:'carrot',en:'carrot',he:'גזר',cat:'food'},
  {id:'strawberry',en:'strawberry',he:'תות',cat:'food'},{id:'chocolate',en:'chocolate',he:'שוקולד',cat:'food'},
  {id:'cake',en:'cake',he:'עוגה',cat:'food'},{id:'soup',en:'soup',he:'מרק',cat:'food'},
  {id:'juice',en:'juice',he:'מיץ',cat:'food'},{id:'potato',en:'potato',he:'תפוח אדמה',cat:'food'},
  {id:'cucumber',en:'cucumber',he:'מלפפון',cat:'food'},{id:'icecream',en:'ice cream',he:'גלידה',cat:'food'},
  {id:'popcorn',en:'popcorn',he:'פופקורן',cat:'food'},{id:'cheese',en:'cheese',he:'גבינה',cat:'food'},
  {id:'cookie',en:'cookie',he:'עוגיה',cat:'food'},{id:'grape',en:'grape',he:'ענב',cat:'food'},
  {id:'tomato',en:'tomato',he:'עגבנייה',cat:'food'},
  {id:'orange',en:'orange',he:'תפוז',cat:'food',tricky:'🍊 orange is a FRUIT here — look at the picture!'},
  // transport (16)
  {id:'car',en:'car',he:'מכונית',cat:'transport'},{id:'bus',en:'bus',he:'אוטובוס',cat:'transport'},
  {id:'bicycle',en:'bicycle',he:'אופניים',cat:'transport'},{id:'airplane',en:'airplane',he:'מטוס',cat:'transport'},
  {id:'train',en:'train',he:'רכבת',cat:'transport'},{id:'boat',en:'boat',he:'סירה',cat:'transport'},
  {id:'helicopter',en:'helicopter',he:'מסוק',cat:'transport'},{id:'motorcycle',en:'motorcycle',he:'אופנוע',cat:'transport'},
  {id:'scooter',en:'scooter',he:'קורקינט',cat:'transport'},{id:'ambulance',en:'ambulance',he:'אמבולנס',cat:'transport'},
  {id:'tractor',en:'tractor',he:'טרקטור',cat:'transport'},{id:'rocket',en:'rocket',he:'רקטה',cat:'transport'},
  {id:'truck',en:'truck',he:'משאית',cat:'transport'},{id:'ship',en:'ship',he:'ספינה',cat:'transport'},
  {id:'taxi',en:'taxi',he:'מונית',cat:'transport'},{id:'firetruck',en:'firetruck',he:'כבאית',cat:'transport'},
  // clothing (16)
  {id:'hat',en:'hat',he:'כובע',cat:'clothing'},{id:'shirt',en:'shirt',he:'חולצה',cat:'clothing'},
  {id:'shoes',en:'shoes',he:'נעליים',cat:'clothing'},{id:'dress',en:'dress',he:'שמלה',cat:'clothing'},
  {id:'jacket',en:'jacket',he:"ז'קט",cat:'clothing'},{id:'gloves',en:'gloves',he:'כפפות',cat:'clothing'},
  {id:'scarf',en:'scarf',he:'צעיף',cat:'clothing'},{id:'sweater',en:'sweater',he:'סוודר',cat:'clothing'},
  {id:'backpack',en:'backpack',he:'תיק גב',cat:'clothing'},{id:'sunglasses',en:'sunglasses',he:'משקפי שמש',cat:'clothing'},
  {id:'helmet',en:'helmet',he:'קסדה',cat:'clothing'},{id:'belt',en:'belt',he:'חגורה',cat:'clothing'},
  {id:'socks',en:'socks',he:'גרביים',cat:'clothing'},{id:'hoodie',en:'hoodie',he:"קפוצ'ון",cat:'clothing'},
  {id:'raincoat',en:'raincoat',he:'מעיל גשם',cat:'clothing'},{id:'sandals',en:'sandals',he:'סנדלים',cat:'clothing'},
  // home (14)
  {id:'house',en:'house',he:'בית',cat:'home'},{id:'bed',en:'bed',he:'מיטה',cat:'home'},
  {id:'chair',en:'chair',he:'כיסא',cat:'home'},{id:'table',en:'table',he:'שולחן',cat:'home'},
  {id:'door',en:'door',he:'דלת',cat:'home'},{id:'window',en:'window',he:'חלון',cat:'home'},
  {id:'lamp',en:'lamp',he:'מנורה',cat:'home'},{id:'clock',en:'clock',he:'שעון',cat:'home'},
  {id:'mirror',en:'mirror',he:'מראה',cat:'home'},{id:'curtain',en:'curtain',he:'וילון',cat:'home'},
  {id:'pillow',en:'pillow',he:'כרית',cat:'home'},{id:'bathtub',en:'bathtub',he:'אמבטיה',cat:'home'},
  {id:'drawer',en:'drawer',he:'מגירה',cat:'home'},{id:'ladder',en:'ladder',he:'סולם',cat:'home'},
  // colors (10 + 3 tricky)
  {id:'red',en:'red',he:'אדום',cat:'colors'},{id:'blue',en:'blue',he:'כחול',cat:'colors'},
  {id:'green',en:'green',he:'ירוק',cat:'colors'},{id:'yellow',en:'yellow',he:'צהוב',cat:'colors'},
  {id:'black',en:'black',he:'שחור',cat:'colors'},{id:'white',en:'white',he:'לבן',cat:'colors'},
  {id:'purple',en:'purple',he:'סגול',cat:'colors'},{id:'pink',en:'pink',he:'ורוד',cat:'colors'},
  {id:'brown',en:'brown',he:'חום',cat:'colors'},{id:'gray',en:'gray',he:'אפור',cat:'colors'},
  {id:'lime',en:'lime',he:'ירוק ליים',cat:'colors',tricky:'🎨 lime is a COLOR here — look at the picture!'},
  {id:'peach',en:'peach',he:'אפרסק',cat:'colors',tricky:'🎨 peach is a COLOR here — look at the picture!'},
  {id:'cream',en:'cream',he:'שמנת',cat:'colors',tricky:'🎨 cream is a COLOR here — look at the picture!'},
];

/* bins per level: 2 (LV1-2) → 3 (LV3-5) → 4 (LV6-8) */
const LEVEL_BINS = [
  ['animals','food'],
  ['transport','home'],
  ['animals','food','transport'],
  ['clothing','home','food'],
  ['animals','transport','clothing'],
  ['food','colors','animals','home'],
  ['colors','food','transport','clothing'],
  ['animals','colors','home','food'],
];
const MAX_LV = 8;

/* ---------------- helpers ---------------- */
const $ = id => document.getElementById(id);
const rnd = (a,b) => a + Math.random()*(b-a);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const FONT = "'Trebuchet MS','Segoe UI',system-ui,sans-serif";
const RM = (() => { try { return matchMedia('(prefers-reduced-motion:reduce)').matches; } catch(e){ return false; } })();

/* ---------------- audio (WebAudio, zero assets) + speech ---------------- */
let AC = null, muted = false;
function ac(){ if(!AC){ try { AC = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} } return AC; }
function beep(freq, dur=0.12, type='sine', gain=0.15, slideTo=null){
  if(muted) return; const a = ac(); if(!a) return;
  try{
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq;
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime+dur);
    g.gain.value = gain; g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime+dur);
  }catch(e){}
}
function chord(base){ [0,4,7,12].forEach((s,i)=>setTimeout(()=>beep(base*Math.pow(2,s/12),0.15,'triangle',0.11), i*45)); }
function buzz(){ beep(120,0.28,'sawtooth',0.16,70); }
/* guarded speech — speaks the word as it enters the active zone.
   Only speaks once TTS voices are actually available (they load async in
   Chrome; environments with no voices, e.g. headless, must never call
   speak() — it can stall the main thread there). */
let voicesReady = false;
try{
  const ss = window.speechSynthesis;
  if(ss && typeof SpeechSynthesisUtterance !== 'undefined'){
    const chk = () => { try{ voicesReady = ss.getVoices().length > 0; }catch(e){} };
    chk();
    if(ss.addEventListener) ss.addEventListener('voiceschanged', chk);
  }
}catch(e){}
function speak(txt){
  if(muted || !voicesReady) return;
  try{
    /* same guard as the site's land-beacon.js: automation (incl. headless
       browsers) must not reach the TTS engine — it can stall the page there */
    if(navigator.webdriver) return;
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'en-US'; u.rate = 0.95; u.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------------- best-score persistence ---------------- */
const AKEY = 'cde_arcade', AID = 'category-conveyor';
function readBest(){ try { return (JSON.parse(localStorage.getItem(AKEY)||'{}')[AID]||{}).best||0; } catch(e){ return 0; } }
function writeBest(b){ try { const all = JSON.parse(localStorage.getItem(AKEY)||'{}')||{}; all[AID] = {best:b}; localStorage.setItem(AKEY, JSON.stringify(all)); } catch(e){} }

/* ---------------- image cache ---------------- */
const IMGS = new Map();
function img(id){
  let m = IMGS.get(id);
  if(!m){
    m = new window.Image();
    m.src = '/images/' + id + '.webp';
    IMGS.set(id, m);
  }
  return m;
}
function preloadCats(cats){ for(const w of WORDS) if(cats.includes(w.cat)) img(w.id); }

/* ---------------- state ---------------- */
const S = {
  screen:'menu', playing:false,
  items:[], parts:[], flights:[],
  shake:0, beltOff:0,
  score:0, best:readBest(), runStartBest:0,
  shields:3, level:1, streak:0, combo:0, fastStreak:0, sortedInLevel:0,
  speedMul:1, spawnT:0, spawnInt:3.6,
  sorted:0, lastWordId:null, lastOk:false,
};
let nextId = 1;

function bins(){ return LEVEL_BINS[clamp(S.level,1,MAX_LV)-1]; }

/* ---------------- canvas ---------------- */
const cv = $('cv'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize(){
  DPR = Math.min(2, window.devicePixelRatio||1);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = W*DPR; cv.height = H*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize);
function geo(){
  const beltY = clamp(H*0.60, 90, H-46);
  const zoneW = clamp(W*0.26, 110, 220);
  const zx = W/2 - zoneW/2;
  return { beltY, beltL:6, beltR:W-6, zone:{x0:zx, x1:zx+zoneW} };
}
const CARD_W = 92, CARD_H = 104;

/* ---------------- spawning ---------------- */
function pickWord(){
  const bs = bins();
  const trickyOK = S.level >= 6 && bs.includes('food') && bs.includes('colors');
  let pool = WORDS.filter(w => bs.includes(w.cat) && w.id !== S.lastWordId && (trickyOK || !w.tricky));
  if(trickyOK && Math.random() < 0.28){
    const tp = pool.filter(w => w.tricky);
    if(tp.length) pool = tp;
  }
  if(!pool.length) pool = WORDS.filter(w => bs.includes(w.cat));
  const w = pool[Math.floor(Math.random()*pool.length)];
  S.lastWordId = w.id;
  return w;
}
function spawn(){
  const w = pickWord();
  img(w.id); // warm the image
  S.items.push({ id:nextId++, w, x:-CARD_W/2, yOff:0, vy:0, spoken:false, zoneAt:0, bounceGlow:0 });
}

/* the sortable target: frontmost item whose center is inside the active zone
   (plus a small hidden grace window past the zone, kind to slow reactions) */
function activeItem(){
  const g = geo();
  const grace = 38;
  let best = null;
  for(const it of S.items) if(it.x >= g.zone.x0 && it.x <= g.zone.x1 + grace && (!best || it.x > best.x)) best = it;
  return best;
}

/* ---------------- bin tap ---------------- */
function tapBin(cat){
  if(S.screen !== 'play' || !S.playing) return;
  ac();
  const el = $('bin-'+cat);
  const f = activeItem();
  if(!f){
    beep(240,0.07,'square',0.07);
    setFeedback('⏳ Wait for a photo in the glowing zone!', 'var(--dim)');
    return;
  }
  if(f.w.cat === cat){
    correct(f, el);
  } else {
    wrong(f, cat, el);
  }
  S.lastOk = (f.w.cat === cat);
  updateHUD();
}

function correct(f, el){
  const g = geo();
  const react = f.zoneAt ? (performance.now()-f.zoneAt)/1000 : 9;
  const fast = react < 3.0;
  S.streak++; S.combo++; S.sorted++; S.sortedInLevel++;
  const pts = Math.round(10 * (1 + 0.15*Math.min(S.streak,20)) * (fast?1.5:1));
  S.score += pts;
  if(S.score > S.best){ S.best = S.score; writeBest(S.best); }
  S.items = S.items.filter(x => x !== f);
  /* hop-into-the-bin flight */
  const r = el ? el.getBoundingClientRect() : null, c = cv.getBoundingClientRect();
  const tx = r ? (r.left + r.width/2 - c.left) : f.x, ty = r ? (H + 40) : H + 40;
  S.flights.push({ w:f.w, x:f.x, y:g.beltY + f.yOff, sx:f.x, sy:g.beltY + f.yOff, tx, ty, t:0, dur:0.45 });
  S.parts.push({ txt:'+'+pts, x:f.x, y:g.beltY-70, vx:0, vy:-46, life:0.9, max:0.9, color:'#f59e0b' });
  burst(f.x, g.beltY, 20, '#16a34a', 5, 0.8);
  chord(392); shakeIt(Math.min(4 + S.combo, 12));
  if(el){ el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  const cc = CATS[f.w.cat];
  setFeedback('✅ ' + cc.emoji + ' <b>' + f.w.en + '</b> → ' + cc.name + ' · +' + pts, 'var(--grn)');
  if(S.combo >= 5 && S.combo % 5 === 0) toast('◈ COMBO ×' + S.combo + ' ◈');
  /* two-way adaptive: 4 fast correct sorts in a row → faster belt + next level */
  if(fast){ S.fastStreak++; if(S.fastStreak >= 4){ S.fastStreak = 0; levelUp(); } }
  else S.fastStreak = 0;
  if(S.playing && S.sortedInLevel >= 10) levelUp(); // accurate-but-slow players still ramp
}

function wrong(f, cat, el){
  S.streak = 0; S.combo = 0; S.fastStreak = 0;
  S.speedMul = Math.max(0.6, S.speedMul*0.93);               // rubber-band down
  /* the bin bounces it out: hop + buzz, item continues on the belt */
  f.vy = RM ? 0 : -240; f.bounceGlow = 0.9;
  f.x = Math.max(CARD_W/2, f.x - 34);                        // knocked back a little
  buzz(); shakeIt(8);
  if(el){ el.classList.remove('buzz'); void el.offsetWidth; el.classList.add('buzz'); }
  const right = $('bin-'+f.w.cat);
  if(right){ right.classList.add('hint'); setTimeout(()=>right.classList.remove('hint'), 1400); }
  const cc = CATS[f.w.cat];
  const msg = f.w.tricky ? f.w.tricky
    : ('❌ <b>' + f.w.en + '</b> is ' + article(cc.name) + ' <b>' + cc.name.toUpperCase() + '</b> word ' + cc.emoji + ' — look at the picture!');
  setFeedback(msg, 'var(--red)');
  const g = geo();
  burst(f.x, g.beltY, 14, '#ef4444', 5, 0.7);
}
function article(n){ return /^[AEIOU]/i.test(n) ? 'an' : 'a'; }

/* item slipped off the end unsorted → shield loss */
function slipped(f){
  S.items = S.items.filter(x => x !== f);
  S.shields--; S.streak = 0; S.combo = 0; S.fastStreak = 0;
  S.speedMul = Math.max(0.6, S.speedMul*0.9);
  const g = geo();
  burst(W-30, g.beltY, 24, '#ef4444', 6, 1);
  buzz(); shakeIt(12);
  const cc = CATS[f.w.cat];
  setFeedback('💨 <b>' + f.w.en + '</b> slipped past! It was ' + cc.emoji + ' <b>' + cc.name + '</b>. −1 shield', 'var(--red)');
  updateHUD();
  if(S.shields <= 0) gameOver();
}

/* ---------------- levels ---------------- */

/* play-depth beacon (cde_learn channel) — same guards as land-beacon.js:
   automation (navigator.webdriver) and owner devices (cde_internal) never count */
function learnBeacon(ev){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(navigator.sendBeacon) navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:'category-conveyor'}]}));
  }catch(e){}
}

function levelUp(){
  if(!S.playing) return;
  S.sortedInLevel = 0; S.fastStreak = 0;
  S.speedMul = Math.min(3.2, S.speedMul*1.12);
  S.spawnInt = Math.max(1.7, S.spawnInt*0.92);
  if(S.level < MAX_LV){
    S.level++;
    const g = geo();
    for(const it of S.items) burst(it.x, g.beltY, 12, '#3b82f6', 5, 0.7);
    S.items.length = 0; S.spawnT = 0.6;                      // sweep the belt — new bins
    renderBins(); preloadCats(bins());
    toast('⚡ LV ' + S.level + ' — ' + (bins().length) + ' BINS!');
    learnBeacon('g_lvl');
  } else {
    toast('⚡ FASTER BELT!');
  }
  chord(523); shakeIt(6); updateHUD();
}

function gameOver(){
  S.playing = false;
  learnBeacon('g_cmp');
  try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){}
  const isBest = S.score > 0 && S.score > S.runStartBest;
  $('overCard').innerHTML =
    '⭐ Score <b>' + S.score + '</b>' +
    (isBest ? ' · <span class="newbest">★ NEW BEST!</span>' : ' · best <b>' + S.best + '</b>') +
    '<br>📦 Sorted <b>' + S.sorted + '</b> words · reached <b>LV ' + S.level + '</b>';
  show('over');
  beep(140,0.5,'sawtooth',0.16,60);
}

/* ---------------- physics / loop ---------------- */
function update(dt){
  const g = geo();
  S.spawnT += dt;
  const maxOn = S.level <= 2 ? 2 : S.level <= 5 ? 3 : 4;
  const entryClear = !S.items.some(it => it.x < CARD_W + 24);
  if(S.items.length === 0 && S.spawnT >= 0.5){ spawn(); S.spawnT = 0; }
  else if(S.items.length < maxOn && entryClear && S.spawnT >= S.spawnInt){ spawn(); S.spawnT = 0; }

  const v = W * 0.085 * S.speedMul * (RM ? 0.6 : 1);         // reduced motion: slower belt
  S.beltOff = (S.beltOff + v*dt) % 26;
  for(const it of S.items){
    it.x += v*dt;
    /* bounce physics after a wrong bin */
    if(it.vy !== 0 || it.yOff !== 0){
      it.vy += 900*dt; it.yOff += it.vy*dt;
      if(it.yOff > 0){ it.yOff = 0; it.vy = 0; }
    }
    if(it.bounceGlow > 0) it.bounceGlow -= dt;
    /* entering the active zone: speak the word once */
    if(!it.spoken && it.x >= g.zone.x0){
      it.spoken = true; it.zoneAt = performance.now();
      speak(it.w.en);
    }
  }
  for(const it of [...S.items]) if(it.x - CARD_W/2 > g.beltR) slipped(it);
  if(!S.playing) return;

  for(const f of S.flights){ f.t += dt; }
  S.flights = S.flights.filter(f => f.t < f.dur);
  for(const p of S.parts){ p.x += p.vx*dt; p.y += p.vy*dt; if(!p.txt) p.vy += 150*dt; p.life -= dt; }
  S.parts = S.parts.filter(p => p.life > 0);
  S.shake *= Math.pow(0.0004, dt); if(S.shake < 0.3) S.shake = 0;
}
function burst(x,y,n,c,sp=5,lf=1){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, s = rnd(35,70)*sp/4;
    S.parts.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:rnd(0.4,1)*lf, max:lf, color:c, r:rnd(2,4.5) });
  }
}
function shakeIt(v){ if(RM) return; S.shake = Math.max(S.shake, v); }

/* ---------------- render ---------------- */
let clouds = [];
function initClouds(){
  clouds = [];
  for(let i=0;i<6;i++) clouds.push({ x:Math.random(), y:Math.random()*0.35, s:rnd(0.5,1.2), v:rnd(0.004,0.012) });
}
function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function render(dt){
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#bfdbfe'); bg.addColorStop(1,'#eff6ff');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.direction = 'ltr';
  if(S.shake > 0.2) ctx.translate(rnd(-S.shake,S.shake), rnd(-S.shake,S.shake));
  /* drifting clouds */
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  for(const c of clouds){
    c.x += c.v*dt*(RM?0.4:1); if(c.x > 1.15) c.x = -0.15;
    const cx = c.x*W, cy = c.y*H, s = c.s*22;
    ctx.beginPath(); ctx.arc(cx,cy,s,0,7); ctx.arc(cx+s*0.9,cy+s*0.2,s*0.75,0,7); ctx.arc(cx-s*0.9,cy+s*0.25,s*0.7,0,7); ctx.fill();
  }
  if(S.screen === 'play'){
    const g = geo();
    drawZone(g);
    drawBelt(g);
    for(const it of S.items) drawCard(it.x, g.beltY + it.yOff, it.w, it.bounceGlow > 0, isActive(it,g));
    for(const f of S.flights){
      const k = f.t/f.dur, e = k*k;
      const x = f.sx + (f.tx-f.sx)*e, y = f.sy + (f.ty-f.sy)*e - Math.sin(k*Math.PI)*46;
      ctx.save(); ctx.globalAlpha = 1-k*0.5;
      const sc = 1-k*0.55;
      ctx.translate(x,y); ctx.scale(sc,sc); ctx.translate(-x,-y);
      drawCard(x, y, f.w, false, false);
      ctx.restore();
    }
  }
  drawParts();
  ctx.restore();
}
function isActive(it,g){ return it.x >= g.zone.x0 && it.x <= g.zone.x1; }
function drawZone(g){
  const y = g.beltY, x0 = g.zone.x0, w = g.zone.x1-g.zone.x0;
  const ph = RM ? 0.5 : (Math.sin(performance.now()/380)+1)/2;
  ctx.save();
  ctx.fillStyle = 'rgba(37,99,235,' + (0.10+ph*0.08) + ')';
  roundRect(x0, y-CARD_H/2-26, w, CARD_H+62, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(37,99,235,' + (0.5+ph*0.4) + ')';
  ctx.lineWidth = 3; ctx.setLineDash([8,6]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#2563eb'; ctx.font = 'bold 13px ' + FONT; ctx.textAlign = 'center';
  ctx.fillText('⬇ SORT NOW ⬇', x0+w/2, y-CARD_H/2-32);
  ctx.restore();
}
function drawBelt(g){
  const y = g.beltY + CARD_H/2, bx = g.beltL, bw = g.beltR-bx;
  ctx.fillStyle = '#475569';
  roundRect(bx, y-4, bw, 26, 10); ctx.fill();
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); roundRect(bx+2, y-2, bw-4, 22, 8); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 3;
  for(let x = bx-26+S.beltOff; x < bx+bw+26; x += 26){
    ctx.beginPath(); ctx.moveTo(x, y-4); ctx.lineTo(x-9, y+24); ctx.stroke();
  }
  ctx.restore();
  /* end-of-belt danger edge */
  const grd = ctx.createLinearGradient(g.beltR-46,0,g.beltR,0);
  grd.addColorStop(0,'rgba(239,68,68,0)'); grd.addColorStop(1,'rgba(239,68,68,.30)');
  ctx.fillStyle = grd; ctx.fillRect(g.beltR-46, y-CARD_H-10, 46, CARD_H+36);
  ctx.strokeStyle = 'rgba(239,68,68,.85)'; ctx.lineWidth = 3; ctx.setLineDash([8,6]);
  ctx.beginPath(); ctx.moveTo(g.beltR-2, y-CARD_H-6); ctx.lineTo(g.beltR-2, y+22); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 15px ' + FONT; ctx.textAlign = 'center';
  ctx.fillText('⚠', g.beltR-16, y-CARD_H-14);
}
function drawCard(x, y, w, glowRed, active){
  const cw = CARD_W, chh = CARD_H, x0 = x-cw/2, y0 = y-chh/2;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = glowRed ? '#ef4444' : (active ? '#2563eb' : '#cbd5e1');
  ctx.lineWidth = active ? 3.5 : 2;
  ctx.shadowColor = glowRed ? '#ef4444' : (active ? '#2563eb' : 'rgba(30,41,59,.3)');
  ctx.shadowBlur = active ? 16 : 7;
  roundRect(x0, y0, cw, chh, 12); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  const im = img(w.id), pad = 8, iw = cw-pad*2, ih = chh-34;
  if(im.complete && im.naturalWidth > 0){
    const s = Math.min(iw/im.naturalWidth, ih/im.naturalHeight);
    const dw = im.naturalWidth*s, dh = im.naturalHeight*s;
    ctx.drawImage(im, x-dw/2, y0+pad+(ih-dh)/2, dw, dh);
  } else {
    ctx.fillStyle = '#e2e8f0';
    roundRect(x0+pad, y0+pad, iw, ih, 8); ctx.fill();
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 22px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📷', x, y0+pad+ih/2);
    ctx.textBaseline = 'alphabetic';
  }
  /* the English word, labeled beneath the photo */
  ctx.fillStyle = '#1e293b';
  let fs = 15;
  ctx.font = 'bold ' + fs + 'px ' + FONT;
  while(fs > 9 && ctx.measureText(w.en).width > cw-10){ fs--; ctx.font = 'bold ' + fs + 'px ' + FONT; }
  ctx.textAlign = 'center';
  ctx.fillText(w.en, x, y0+chh-9);
  ctx.restore();
}
function drawParts(){
  for(const p of S.parts){
    ctx.globalAlpha = clamp(p.life/p.max, 0, 1);
    if(p.txt){ ctx.fillStyle = p.color; ctx.font = 'bold 20px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(p.txt, p.x, p.y); }
    else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}

let lastTS = 0;
function loop(ts){
  const dt = Math.min(0.05, (ts-lastTS)/1000) || 0.016; lastTS = ts;
  if(S.playing && S.screen === 'play') update(dt);
  render(dt);
  requestAnimationFrame(loop);
}

/* ---------------- HUD / feedback / bins / screens ---------------- */
function updateHUD(){
  $('shieldPill').textContent = '🛡'.repeat(Math.max(0,S.shields)) + '▫'.repeat(Math.max(0, 3-S.shields));
  $('scorePill').textContent = '⭐ ' + S.score + (S.best > 0 ? ' · best ' + S.best : '');
  $('levelPill').textContent = '⚡ LV ' + S.level;
}
const NEUTRAL = '👀 Tap the bin that matches the photo in the glowing zone!';
let fbT = null;
function setFeedback(msg, col){
  const e = $('feedback');
  e.innerHTML = msg; e.style.color = col || 'var(--dim)';
  clearTimeout(fbT);
  fbT = setTimeout(() => { if(S.screen === 'play' && S.playing){ e.innerHTML = NEUTRAL; e.style.color = 'var(--dim)'; } }, 2800);
}
let toastT = null;
function toast(msg){
  const e = $('combo');
  e.textContent = msg; e.style.opacity = 1;
  clearTimeout(toastT); toastT = setTimeout(() => { e.style.opacity = 0; }, 1000);
}
function renderBins(){
  const el = $('bins');
  el.innerHTML = '';
  for(const cat of bins()){
    const c = CATS[cat], b = document.createElement('button');
    b.type = 'button'; b.className = 'bin'; b.id = 'bin-'+cat;
    b.style.setProperty('--bc', c.color);
    b.setAttribute('aria-label', 'Sort into ' + c.name);
    const be = document.createElement('span'); be.className = 'be'; be.textContent = c.emoji;
    const bn = document.createElement('span'); bn.className = 'bn'; bn.textContent = c.name;
    b.appendChild(be); b.appendChild(bn);
    b.addEventListener('click', () => tapBin(cat));
    el.appendChild(b);
  }
}
const screens = ['menu','over'];
function show(s){
  S.screen = s === 'play' ? 'play' : s;
  screens.forEach(x => $(x).classList.toggle('show', x === s));
  resize();
}

/* ---------------- lifecycle ---------------- */
function start(){
  Object.assign(S, {
    playing:true, items:[], parts:[], flights:[], shake:0, beltOff:0,
    score:0, shields:3, level:1, streak:0, combo:0, fastStreak:0, sortedInLevel:0,
    speedMul:1, spawnT:0.2, spawnInt:3.6, sorted:0, lastWordId:null, lastOk:false,
  });
  S.runStartBest = S.best;
  renderBins(); preloadCats(bins());
  show('play');
  updateHUD();
  $('feedback').innerHTML = NEUTRAL; $('feedback').style.color = 'var(--dim)';
  ac();
}

function toggleMute(){
  muted = !muted;
  $('mute').textContent = muted ? '🔇' : '🔊';
  if(muted){ try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){} }
}

$('startBtn').addEventListener('click', start);
$('againBtn').addEventListener('click', start);
$('mute').addEventListener('click', toggleMute);
/* keyboard: 1-4 tap the bins left-to-right */
window.addEventListener('keydown', e => {
  const n = parseInt(e.key, 10);
  if(n >= 1 && n <= 4 && S.screen === 'play'){ const b = bins()[n-1]; if(b) tapBin(b); }
});

const mb = $('menuBest');
if(S.best > 0){ mb.style.display = ''; mb.textContent = '🏆 Your best: ' + S.best; }

/* test/debug contract (used by the Playwright verification; no gameplay shortcuts) */
window.CC = {
  start, tapBin,
  dbg: {
    get state(){ return S; },
    get screen(){ return S.screen; },
    get score(){ return S.score; },
    get shields(){ return S.shields; },
    get level(){ return S.level; },
    get sorted(){ return S.sorted; },
    bins,
    activeCat(){ const f = activeItem(); return f ? f.w.cat : null; },
    activeWord(){ const f = activeItem(); return f ? f.w.en : null; },
    itemsOnBelt(){ return S.items.length; },
    solved(){ return S.lastOk; },
  },
};

updateHUD();
resize(); initClouds(); requestAnimationFrame(loop);

/* ---- leave-guard: during an active run the home pill needs two taps ----
   First tap arms it ("Leave game? Tap again") for 3s; second tap leaves.
   On the menu / game-over screens a single tap navigates as usual. */
(function(){
  var pill=document.getElementById('homePill');
  if(!pill) return;
  var orig=pill.textContent, armedUntil=0, timer=null;
  function inRun(){
    var m=document.getElementById('menu');
    var o=document.getElementById('over')||document.getElementById('win');
    return !!m && !m.classList.contains('show') && !(o&&o.classList.contains('show'));
  }
  pill.addEventListener('click',function(e){
    if(!inRun()) return;                 // menu / end screen: navigate normally
    if(Date.now()<armedUntil) return;    // second tap within 3s: leave
    e.preventDefault();                  // first tap: arm
    armedUntil=Date.now()+3000;
    pill.textContent='Leave game? Tap again';
    pill.classList.add('leave');
    clearTimeout(timer);
    timer=setTimeout(function(){armedUntil=0;pill.textContent=orig;pill.classList.remove('leave');},3000);
  });
})();
