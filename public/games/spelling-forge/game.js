"use strict";
/* ============================================================
   SPELLING FORGE — hear it, see it, forge it letter by letter.
   Tap-tile-pad architecture modeled on KidsDoMath column-crunch;
   juice/scoring patterns modeled on even-steven. Zero assets
   beyond the site's existing /images/<id>.webp photos.
   ============================================================ */
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const RM=(()=>{ try{ return matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){ return false; } })();

/* ---------- word bank: 90 words inlined from the site's vocabulary ---------- */
const WORDS=[
{id:'ant',en:'ant',he:'נמלה'},{id:'bat',en:'bat',he:'מחבט'},{id:'bed',en:'bed',he:'מיטה'},{id:'bus',en:'bus',he:'אוטובוס'},
{id:'car',en:'car',he:'מכונית'},{id:'cat',en:'cat',he:'חתול'},{id:'cup',en:'cup',he:'כוס'},{id:'dog',en:'dog',he:'כלב'},
{id:'ear',en:'ear',he:'אוזן'},{id:'eye',en:'eye',he:'עין'},{id:'fox',en:'fox',he:'שועל'},{id:'hat',en:'hat',he:'כובע'},
{id:'key',en:'key',he:'מפתח'},{id:'net',en:'net',he:'רשת'},{id:'one',en:'one',he:'אחד'},{id:'pen',en:'pen',he:'עט'},
{id:'pig',en:'pig',he:'חזיר'},{id:'red',en:'red',he:'אדום'},{id:'sad',en:'sad',he:'עצוב'},{id:'shy',en:'shy',he:'ביישן'},
{id:'six',en:'six',he:'שש'},{id:'ten',en:'ten',he:'עשר'},{id:'tie',en:'tie',he:'עניבה'},{id:'two',en:'two',he:'שניים'},
{id:'ball',en:'ball',he:'כדור'},{id:'belt',en:'belt',he:'חגורה'},{id:'blue',en:'blue',he:'כחול'},{id:'book',en:'book',he:'ספר'},
{id:'calm',en:'calm',he:'רגוע'},{id:'cook_verb',en:'cook',he:'לבשל'},{id:'deer',en:'deer',he:'אייל'},{id:'doll',en:'doll',he:'בובה'},
{id:'drum',en:'drum',he:'תוף'},{id:'fish',en:'fish',he:'דג'},{id:'fork',en:'fork',he:'מזלג'},{id:'frog',en:'frog',he:'צפרדע'},
{id:'goat',en:'goat',he:'עז'},{id:'hand',en:'hand',he:'יד'},{id:'lake',en:'lake',he:'אגם'},{id:'lion',en:'lion',he:'אריה'},
{id:'moon',en:'moon',he:'ירח'},{id:'nest',en:'nest',he:'קן'},{id:'pink',en:'pink',he:'ורוד'},{id:'read_verb',en:'read',he:'לקרוא'},
{id:'ship',en:'ship',he:'ספינה'},{id:'star',en:'star',he:'כוכב'},{id:'tent',en:'tent',he:'אוהל'},{id:'vest',en:'vest',he:'אפודה'},
{id:'amber',en:'amber',he:'ענבר'},{id:'beige',en:'beige',he:'בז\''},{id:'brave',en:'brave',he:'אמיץ'},{id:'brown',en:'brown',he:'חום'},
{id:'cliff',en:'cliff',he:'צוק'},{id:'cream',en:'cream',he:'שמנת'},{id:'dress',en:'dress',he:'שמלה'},{id:'fence',en:'fence',he:'גדר'},
{id:'grape',en:'grape',he:'ענב'},{id:'happy',en:'happy',he:'שמח'},{id:'horse',en:'horse',he:'סוס'},{id:'kayak',en:'kayak',he:'קייאק'},
{id:'paint_verb',en:'paint',he:'לצבוע'},{id:'peach',en:'peach',he:'אפרסק'},{id:'pizza',en:'pizza',he:'פיצה'},{id:'river',en:'river',he:'נהר'},
{id:'scarf',en:'scarf',he:'צעיף'},{id:'sheep',en:'sheep',he:'כבשה'},{id:'sixty',en:'sixty',he:'שישים'},{id:'socks',en:'socks',he:'גרביים'},
{id:'three',en:'three',he:'שלוש'},{id:'tired',en:'tired',he:'עייף'},{id:'train',en:'train',he:'רכבת'},{id:'whale',en:'whale',he:'לוויתן'},
{id:'airplane',en:'airplane',he:'מטוס'},{id:'bathtub',en:'bathtub',he:'אמבטיה'},{id:'calendar',en:'calendar',he:'לוח שנה'},
{id:'climbing',en:'climbing',he:'טיפוס'},{id:'desert',en:'desert',he:'מדבר'},{id:'feather',en:'feather',he:'נוצה'},
{id:'forest',en:'forest',he:'יער'},{id:'guitar',en:'guitar',he:'גיטרה'},{id:'jacket',en:'jacket',he:'ז\'קט'},
{id:'meadow',en:'meadow',he:'אחו'},{id:'monkey',en:'monkey',he:'קוף'},{id:'nervous',en:'nervous',he:'עצבני'},
{id:'parrot',en:'parrot',he:'תוכי'},{id:'pencil',en:'pencil',he:'עיפרון'},{id:'puzzle',en:'puzzle',he:'פאזל'},
{id:'sandwich',en:'sandwich',he:'כריך'},{id:'window',en:'window',he:'חלון'},{id:'swimming',en:'swimming',he:'שחייה'}
];
/* level → word pool: L1-2 three letters, L3-4 four, L5-6 five, L7-8 six+ (listen-only) */
function poolFor(level){
  if(level<=2) return WORDS.filter(w=>w.en.length===3);
  if(level<=4) return WORDS.filter(w=>w.en.length===4);
  if(level<=6) return WORDS.filter(w=>w.en.length===5);
  return WORDS.filter(w=>w.en.length>=6);
}
/* visually/phonetically confusable letters for the trickier decoy tiers */
const CONFUSE={b:'dp',d:'bq',p:'qb',q:'pg',m:'nw',n:'mu',u:'nv',v:'uw',i:'lj',l:'it',a:'eo',e:'ai',o:'au',c:'eo',
  s:'z',z:'s',g:'qj',f:'t',h:'nb',r:'n',w:'vm',t:'fl',k:'x',x:'k',y:'vj',j:'ig'};
const ALPHA='abcdefghijklmnopqrstuvwxyz';
function decoysFor(word,tricky){
  const n=ri(3,4), inWord=new Set(word), out=[];
  const take=c=>{ if(c&&!inWord.has(c)&&out.indexOf(c)<0&&out.length<n) out.push(c); };
  if(tricky){
    const cands=[];
    for(const ch of word) for(const c of (CONFUSE[ch]||'')) cands.push(c);
    cands.sort(()=>Math.random()-0.5).forEach(take);
    'aeiou'.split('').sort(()=>Math.random()-0.5).forEach(take);
  }
  let guard=0;
  while(out.length<n&&guard++<80) take(ALPHA[ri(0,25)]);
  return out;
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=ri(0,i); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ---------- audio (WebAudio, zero assets — even-steven pattern) ---------- */
let AC=null, muted=false;
function ac(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return AC; }
function beep(freq,dur=0.12,type='sine',gain=0.15,slideTo=null){
  if(muted) return; const a=ac(); if(!a) return;
  try{
    const o=a.createOscillator(), g=a.createGain();
    o.type=type; o.frequency.value=freq;
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,a.currentTime+dur);
    g.gain.value=gain; g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime+dur);
  }catch(e){}
}
function chord(base){ [0,4,7,12].forEach((s,i)=>setTimeout(()=>beep(base*Math.pow(2,s/12),0.16,'triangle',0.11), i*50)); }
function clink(){ beep(1150,0.06,'triangle',0.14); setTimeout(()=>beep(1500,0.09,'sine',0.08),40); }
function popSnd(){ beep(420,0.1,'sine',0.12,180); }
function anvil(){ beep(160,0.22,'square',0.16,70); setTimeout(()=>chord(523),90); }
function thud(){ beep(140,0.28,'sawtooth',0.15,60); }

/* ---------- speech (guarded for headless/unsupported browsers) ---------- */
function say(text){
  if(muted) return;
  try{
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined') return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='en-US'; u.rate=0.9;
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- canvas FX: spark particles + screenshake ---------- */
const FX=(()=>{
  const cv=$('fxcv'), ctx=cv.getContext('2d');
  let W=0,H=0,DPR=1,parts=[],shakeV=0;
  function resize(){ DPR=Math.min(2,window.devicePixelRatio||1); W=innerWidth; H=innerHeight; cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); }
  window.addEventListener('resize',resize); resize();
  function burst(x,y,n,c,sp=5,lf=1){
    if(RM) n=Math.min(n,8);
    for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2,s=rnd(40,90)*sp/4;
      parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,life:rnd(0.4,1)*lf,max:lf,color:c,r:rnd(1.5,4)}); }
  }
  function textPop(x,y,txt,color){ parts.push({x,y,txt,color,vx:0,vy:-46,life:1,max:1}); }
  function shake(v){ if(RM) return; shakeV=Math.max(shakeV,v); }
  const stage=$('stage');
  let last=0;
  function loop(ts){
    const dt=Math.min(0.05,(ts-last)/1000)||0.016; last=ts;
    ctx.clearRect(0,0,W,H);
    for(const p of parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; if(!p.txt)p.vy+=180*dt; p.life-=dt;
      ctx.globalAlpha=clamp(p.life/p.max,0,1);
      if(p.txt){ ctx.fillStyle=p.color; ctx.font='bold 20px Trebuchet MS,system-ui'; ctx.textAlign='center'; ctx.fillText(p.txt,p.x,p.y); }
      else{ ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); } }
    ctx.globalAlpha=1;
    parts=parts.filter(p=>p.life>0);
    if(shakeV>0.3){ stage.style.transform='translate('+rnd(-shakeV,shakeV)+'px,'+rnd(-shakeV,shakeV)+'px)'; shakeV*=Math.pow(0.001,dt); }
    else if(stage.style.transform){ stage.style.transform=''; shakeV=0; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return {burst,textPop,shake};
})();

/* ---------- persistence ---------- */
const BKEY='childrendoenglish-spelling-forge';
function readBest(){ try{ return (JSON.parse(localStorage.getItem(BKEY)||'{}')).best||0; }catch(e){ return 0; } }
function writeBest(b){ try{ localStorage.setItem(BKEY,JSON.stringify({best:b})); }catch(e){} }
function track(name,params){ try{ if(typeof window.gtag==='function') window.gtag('event',name,Object.assign({game:'spelling-forge'},params||{})); }catch(e){} }

/* ---------- game state ---------- */
const MAXLV=8, WORDS_PER_LEVEL=3;
const S={
  screen:'menu', level:1, wordIdx:0, score:0, best:readBest(), runStartBest:0,
  streak:0, forged:0, perfect:0, locked:false, autoFilling:false,
  word:null, letters:[], tiles:[], slots:[], wrongForges:0, hintStage:0, usedHint:false,
  lastWordId:null, usedIds:new Set(),
};

function setStatus(msg,col){ const e=$('statusLine'); e.innerHTML=msg; e.style.color=col||'var(--dim)'; }
function updateHUD(){
  $('levelPill').textContent='⚒️ LV '+S.level;
  $('wordPill').textContent='📜 '+(S.wordIdx+1)+'/'+WORDS_PER_LEVEL;
  $('scorePill').textContent='⭐ '+S.score+(S.best>0?' · best '+S.best:'');
  $('streakPill').textContent='🔥 '+S.streak;
}
let toastT=null;
function toast(msg){ const e=$('combo'); e.textContent=msg; e.style.opacity=1; clearTimeout(toastT); toastT=setTimeout(()=>{ e.style.opacity=0; },1100); }

/* ---------- round build ---------- */
function pickWord(){
  const pool=poolFor(S.level);
  let cands=pool.filter(w=>w.id!==S.lastWordId&&!S.usedIds.has(w.id));
  if(!cands.length) cands=pool.filter(w=>w.id!==S.lastWordId);
  if(!cands.length) cands=pool;
  return cands[ri(0,cands.length-1)];
}
function buildRound(){
  S.word=pickWord(); S.lastWordId=S.word.id; S.usedIds.add(S.word.id);
  S.letters=S.word.en.split('');
  S.wrongForges=0; S.hintStage=0; S.usedHint=false; S.locked=false; S.autoFilling=false;
  const tricky=S.level>=5;
  const listenOnly=S.level>=7;
  const chars=shuffle(S.letters.concat(decoysFor(S.word.en,tricky)));
  S.tiles=chars.map(ch=>({ch,used:false}));
  S.slots=S.letters.map(()=>({ch:null,tile:-1}));
  /* photo */
  const card=$('photoCard');
  card.classList.toggle('myst',listenOnly);
  const img=$('photo');
  img.src='/images/'+S.word.id+'.webp';
  img.alt=listenOnly?'':('photo of '+S.word.en);
  $('heWord').textContent=S.word.he;
  $('heWord').style.display=listenOnly?'none':'';
  renderSlots(); renderPad(); refreshForge();
  setStatus(listenOnly?'🎧 Listen closely, then forge the word — the photo is your reward!':'Tap the letter tiles to spell what you see and hear!');
  updateHUD();
  setTimeout(()=>{ if(S.screen==='play') say(S.word.en); },350);
}

/* ---------- render ---------- */
function renderSlots(){
  const box=$('slots'); box.innerHTML='';
  const firstEmpty=S.slots.findIndex(s=>s.ch===null);
  S.slots.forEach((s,i)=>{
    const b=document.createElement('button');
    b.className='slot'+(s.ch?' filled':'')+(i===firstEmpty&&!S.locked?' next':'');
    b.textContent=s.ch||'';
    b.setAttribute('aria-label','slot '+(i+1)+(s.ch?': '+s.ch:' empty'));
    b.dataset.slot=i;
    b.addEventListener('click',()=>tapSlot(i));
    box.appendChild(b);
  });
}
function renderPad(){
  const box=$('pad'); box.innerHTML='';
  S.tiles.forEach((t,i)=>{
    const b=document.createElement('button');
    b.className='tile'+(t.used?' used':'');
    b.textContent=t.ch;
    b.dataset.tile=i; b.dataset.ch=t.ch;
    b.setAttribute('aria-label','letter '+t.ch);
    b.addEventListener('click',()=>tapTile(i));
    box.appendChild(b);
  });
  updateHintGlow();
}
function refreshForge(){
  const full=S.slots.every(s=>s.ch!==null);
  $('forgeBtn').classList.toggle('ready',full&&!S.locked);
}

/* ---------- interactions ---------- */
function tapTile(i,silent){
  if(S.screen!=='play'||S.locked) return;
  if(S.autoFilling&&!silent) return;
  const t=S.tiles[i]; if(!t||t.used) return;
  const j=S.slots.findIndex(s=>s.ch===null); if(j<0) return;
  t.used=true; S.slots[j]={ch:t.ch,tile:i};
  flyTile(i,j);
  clink();
  renderSlots(); refreshForge(); updateHintGlow();
  const padBtn=document.querySelector('.tile[data-tile="'+i+'"]'); if(padBtn) padBtn.classList.add('used');
}
function tapSlot(j){
  if(S.screen!=='play'||S.locked||S.autoFilling) return;
  const s=S.slots[j]; if(!s||s.ch===null) return;
  if(s.tile>=0&&S.tiles[s.tile]) S.tiles[s.tile].used=false;
  S.slots[j]={ch:null,tile:-1};
  popSnd();
  renderSlots(); renderPad(); refreshForge();
}
/* tile flies from the pad to its slot (FLIP clone) */
function flyTile(tileIdx,slotIdx){
  if(RM) return;
  try{
    const src=document.querySelector('.tile[data-tile="'+tileIdx+'"]');
    const dstBox=$('slots').children[slotIdx]||$('slots');
    if(!src) return;
    const a=src.getBoundingClientRect(), b=dstBox.getBoundingClientRect();
    const ghost=src.cloneNode(true);
    ghost.className='tile fly';
    ghost.style.left=a.left+'px'; ghost.style.top=a.top+'px';
    ghost.style.width=a.width+'px'; ghost.style.height=a.height+'px';
    document.body.appendChild(ghost);
    requestAnimationFrame(()=>{ ghost.style.transform='translate('+(b.left-a.left+(b.width-a.width)/2)+'px,'+(b.top-a.top+(b.height-a.height)/2)+'px) scale(.85)'; });
    setTimeout(()=>ghost.remove(),320);
  }catch(e){}
}

/* ---------- hints ---------- */
function neededLetter(){
  const j=S.slots.findIndex(s=>s.ch===null);
  return j<0?null:S.letters[j];
}
function updateHintGlow(){
  document.querySelectorAll('.tile.glow').forEach(el=>el.classList.remove('glow'));
  if(S.hintStage<1||S.locked) return;
  const need=neededLetter(); if(!need) return;
  const idx=S.tiles.findIndex(t=>!t.used&&t.ch===need);
  if(idx>=0){ const el=document.querySelector('.tile[data-tile="'+idx+'"]'); if(el) el.classList.add('glow'); }
}
function autoFill(){
  /* stage-2 scaffold: forge fills the word one tile at a time, leaving the LAST slot for the kid */
  if(S.autoFilling||S.locked) return;
  S.autoFilling=true;
  const step=()=>{
    if(S.screen!=='play'||S.locked){ S.autoFilling=false; return; }
    const empties=S.slots.filter(s=>s.ch===null).length;
    if(empties<=1){ S.autoFilling=false; updateHintGlow(); setStatus('⚒️ One letter left — you finish it!','var(--gold)'); return; }
    const j=S.slots.findIndex(s=>s.ch===null);
    const need=S.letters[j];
    const idx=S.tiles.findIndex(t=>!t.used&&t.ch===need);
    if(idx<0){ S.autoFilling=false; return; }
    tapTile(idx,true);
    setTimeout(step,RM?60:520);
  };
  setStatus('🤖 The forge helps out — watch the letters!','var(--gold)');
  setTimeout(step,RM?60:400);
}

/* ---------- forge (commit) ---------- */
function forge(){
  if(S.screen!=='play'||S.locked||S.autoFilling) return;
  ac();
  const emptyAt=S.slots.findIndex(s=>s.ch===null);
  if(emptyAt>=0){ FX.shake(5); thud(); setStatus('Fill every slot first!','var(--red)'); return; }
  const guess=S.slots.map(s=>s.ch).join('');
  if(guess===S.word.en){ forgeSuccess(); } else { forgeWrong(); }
}
function forgeSuccess(){
  S.locked=true; S.forged++;
  if(S.wrongForges===0&&!S.usedHint) S.perfect++;
  const len=S.letters.length;
  let pts=Math.round((10+2*len)*(1+0.2*S.streak));
  if(S.hintStage>0){ pts=Math.max(5,Math.round(pts/2)); }
  S.streak++;
  S.score+=pts;
  if(S.score>S.best){ S.best=S.score; writeBest(S.best); }
  /* anvil-strike celebration */
  anvil(); FX.shake(Math.min(8+S.streak*1.5,18));
  try{
    const r=$('slots').getBoundingClientRect();
    FX.burst(r.left+r.width/2,r.top+r.height/2,34,'#fbbf24',7,1);
    FX.burst(r.left+r.width/2,r.top+r.height/2,20,'#60a5fa',5,0.8);
    FX.textPop(r.left+r.width/2,r.top-8,'+'+pts,'#fbbf24');
  }catch(e){}
  document.querySelectorAll('.slot').forEach(el=>{ el.classList.add('good'); el.classList.remove('next'); });
  $('forgeBtn').classList.remove('ready');
  /* the reveal: photo appears on listen-only rounds, word is pronounced again */
  $('photoCard').classList.remove('myst');
  $('heWord').style.display='';
  say(S.word.en);
  setStatus('⚒️ CLANG! <b style="color:var(--grn)">'+S.word.en.toUpperCase()+'</b> forged! · <span dir="rtl">'+S.word.he+'</span> · +'+pts,'var(--grn)');
  if(S.streak>=3) toast('🔥 COMBO ×'+S.streak);
  updateHUD();
  track('word_forged',{word:S.word.en,level:S.level,streak:S.streak});
  setTimeout(nextWord,1600);
}
function forgeWrong(){
  S.wrongForges++; S.streak=0;
  thud(); FX.shake(9);
  /* targeted feedback: only the WRONG letters shake red and pop back */
  const wrong=[];
  S.slots.forEach((s,i)=>{ if(s.ch!==S.letters[i]) wrong.push(i); });
  const slotEls=$('slots').children;
  wrong.forEach(i=>{ if(slotEls[i]) slotEls[i].classList.add('bad'); });
  const missN=wrong.length;
  setStatus('❌ '+missN+(missN===1?' letter is':' letters are')+' in the wrong place — they pop back. The green-ringed ones are right!','var(--red)');
  updateHUD();
  S.locked=true; // freeze taps during the shake
  setTimeout(()=>{
    S.locked=false;
    wrong.forEach(i=>{ const s=S.slots[i]; if(s.tile>=0&&S.tiles[s.tile]) S.tiles[s.tile].used=false; S.slots[i]={ch:null,tile:-1}; });
    popSnd();
    renderSlots(); renderPad(); refreshForge();
    /* two-stage hints */
    if(S.wrongForges>=4){ S.hintStage=2; S.usedHint=true; updateHintGlow(); autoFill(); }
    else if(S.wrongForges>=2){ S.hintStage=1; S.usedHint=true; updateHintGlow();
      setStatus('💡 Hint: the glowing tile goes in the next slot!','var(--gold)'); }
    say(S.word.en);
  }, RM?120:820);
}

/* play-depth beacon (cde_learn channel) — same guards as land-beacon.js:
   automation (navigator.webdriver) and owner devices (cde_internal) never count */
function learnBeacon(ev){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(navigator.sendBeacon) navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:'spelling-forge'}]}));
  }catch(e){}
}

function nextWord(){
  if(S.screen!=='play') return;
  S.wordIdx++;
  if(S.wordIdx>=WORDS_PER_LEVEL){
    S.wordIdx=0; S.level++;
    if(S.level>MAXLV){ winGame(); return; }
    toast('⬆️ LEVEL '+S.level+(S.level>=7?' — 🎧 listen-only!':''));
    learnBeacon('g_lvl');
    chord(659);
  }
  buildRound();
}

/* ---------- screens ---------- */
function show(s){ S.screen=s; ['menu','play','win'].forEach(x=>$(x).classList.toggle('show',x===s)); }
function start(){
  Object.assign(S,{level:1,wordIdx:0,score:0,streak:0,forged:0,perfect:0,locked:false,autoFilling:false,
    wrongForges:0,hintStage:0,usedHint:false,usedIds:new Set()});
  S.runStartBest=S.best;
  ac();
  show('play'); buildRound();
  track('game_start',{});
}
function winGame(){
  const isBest=S.score>0&&S.score>S.runStartBest;
  $('winBody').innerHTML='⭐ Score <b>'+S.score+'</b>'
    +(isBest?' · <b style="color:var(--gold)">★ NEW BEST!</b>':' · best <b>'+S.best+'</b>')
    +'<br>⚒️ Forged <b>'+S.forged+'</b> words across all <b>'+MAXLV+'</b> levels'
    +'<br>✨ First-strike words (no misses, no hints): <b>'+S.perfect+'</b>';
  show('win');
  chord(659); setTimeout(()=>chord(784),220);
  try{ const r=$('winTitle').getBoundingClientRect(); FX.burst(r.left+r.width/2,r.bottom,40,'#fbbf24',8,1.2); }catch(e){}
  track('game_complete',{score:S.score,perfect:S.perfect});
  learnBeacon('g_cmp');
}

/* ---------- wiring ---------- */
$('startBtn').addEventListener('click',start);
$('againBtn').addEventListener('click',start); // play again without reload
$('forgeBtn').addEventListener('click',forge);
$('sayBtn').addEventListener('click',()=>{ ac(); if(S.word) say(S.word.en); });
$('mute').addEventListener('click',()=>{ muted=!muted; $('mute').textContent=muted?'🔇':'🔊';
  if(muted){ try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){} } });
$('photo').addEventListener('error',()=>{ $('photoCard').classList.add('myst'); });

/* ---------- test/debug contract (real input paths only) ---------- */
window.SF={
  get state(){ return S; },
  tapTile, tapSlot, forge, start,
  dbg:{
    get word(){ return S.word; },
    get slots(){ return S.slots.map(s=>s.ch); },
    get score(){ return S.score; },
    get best(){ return S.best; },
    get hintStage(){ return S.hintStage; },
    /* fill the word correctly via the same tap path the pad uses */
    solveForTest(){ let g=0;
      while(S.slots.some(s=>s.ch===null)&&g++<24){
        const j=S.slots.findIndex(s=>s.ch===null), need=S.letters[j];
        const i=S.tiles.findIndex(t=>!t.used&&t.ch===need);
        if(i<0) break; tapTile(i,true);
      } },
    /* nudge one letter wrong (guaranteed-wrong guess), then forge → a real miss */
    wrongForTest(){ if(!S.word||S.locked) return;
      while(S.slots.some(s=>s.ch!==null)) tapSlot(S.slots.findIndex(s=>s.ch!==null));
      let g=0,nudged=false;
      while(S.slots.some(s=>s.ch===null)&&g++<24){
        const j=S.slots.findIndex(s=>s.ch===null), need=S.letters[j];
        let i=-1;
        if(!nudged){ i=S.tiles.findIndex(t=>!t.used&&t.ch!==need); if(i>=0) nudged=true; }
        if(i<0) i=S.tiles.findIndex(t=>!t.used&&t.ch===need);
        if(i<0) i=S.tiles.findIndex(t=>!t.used);
        if(i<0) break; tapTile(i,true);
      }
      forge(); },
  },
};

/* ---- leave-guard: during an active run the home pill needs two taps ----
   First tap arms it ("Leave game? Tap again") for 3s; second tap leaves.
   On the menu / win screens a single tap navigates as usual. */
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
