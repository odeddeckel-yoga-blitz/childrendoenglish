/* error pill: friendly reload prompt if anything throws */
(function(){var s=false;window.addEventListener('error',function(){if(s)return;s=true;try{var d=document.createElement('button');d.textContent='⚠️ Oops, something broke — tap to reload';d.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483200;background:#ef4444;color:#fff;font:bold 14px/1.2 system-ui,sans-serif;border:none;border-radius:999px;padding:10px 16px;box-shadow:0 6px 24px rgba(0,0,0,.4);cursor:pointer;';d.onclick=function(){location.reload()};(document.body||document.documentElement).appendChild(d);}catch(e){}});})();

"use strict";
/* ============================================================
   WORD ZAPPER — hear the word, zap the picture (2026)
   Endless-survival vocabulary arcade for ChildrenDoEnglish,
   modeled on the proven "Sorting Rush" pattern:
   - real site photos (/images/<id>.webp) drift down the canvas
   - the target word shows as big text AND is spoken (en-US, 0.9)
   - tap the right picture = zap (particles + chime + combo);
     wrong picture = red flash + streak reset; the TARGET picture
     reaching the ground costs one of 3 shields; 0 = game over
   - two-way adaptive: 4 fast correct → faster + more pictures +
     harder words; any miss → rubber-band down
   ============================================================ */
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const $=id=>document.getElementById(id);
const RM=(()=>{ try{ return matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){ return false; } })();

/* ---------------- word data (curated from the site's 342-word bank; every id has
   a real photo at /images/<id>.webp). lv: 1 easy · 2 medium · 3 harder.
   grp: visually-confusable group — two words sharing a grp never fall together. */
const WORDS=[
  /* animals */
  {id:'cat',en:'cat',he:'חתול',lv:1},{id:'dog',en:'dog',he:'כלב',lv:1},{id:'fish',en:'fish',he:'דג',lv:1},
  {id:'bird',en:'bird',he:'ציפור',lv:1,grp:'bird'},{id:'duck',en:'duck',he:'ברווז',lv:1,grp:'bird'},
  {id:'rabbit',en:'rabbit',he:'ארנב',lv:1},{id:'horse',en:'horse',he:'סוס',lv:1},{id:'cow',en:'cow',he:'פרה',lv:1},
  {id:'pig',en:'pig',he:'חזיר',lv:1},{id:'bee',en:'bee',he:'דבורה',lv:1},{id:'mouse',en:'mouse',he:'עכבר',lv:1},
  {id:'frog',en:'frog',he:'צפרדע',lv:1},{id:'bear',en:'bear',he:'דוב',lv:1},
  {id:'elephant',en:'elephant',he:'פיל',lv:2},{id:'penguin',en:'penguin',he:'פינגווין',lv:2},
  {id:'giraffe',en:'giraffe',he:"ג'ירפה",lv:2},{id:'lion',en:'lion',he:'אריה',lv:2},{id:'turtle',en:'turtle',he:'צב',lv:2},
  /* food */
  {id:'apple',en:'apple',he:'תפוח',lv:1},{id:'banana',en:'banana',he:'בננה',lv:1},{id:'bread',en:'bread',he:'לחם',lv:1},
  {id:'milk',en:'milk',he:'חלב',lv:1},{id:'egg',en:'egg',he:'ביצה',lv:1},{id:'orange',en:'orange',he:'תפוז',lv:1},
  {id:'cake',en:'cake',he:'עוגה',lv:1},{id:'cheese',en:'cheese',he:'גבינה',lv:1},
  {id:'pizza',en:'pizza',he:'פיצה',lv:2},{id:'watermelon',en:'watermelon',he:'אבטיח',lv:2},
  {id:'carrot',en:'carrot',he:'גזר',lv:2},{id:'icecream',en:'ice cream',he:'גלידה',lv:2},
  {id:'strawberry',en:'strawberry',he:'תות',lv:3},
  /* transport */
  {id:'car',en:'car',he:'מכונית',lv:1},{id:'bus',en:'bus',he:'אוטובוס',lv:1},{id:'bicycle',en:'bicycle',he:'אופניים',lv:1},
  {id:'airplane',en:'airplane',he:'מטוס',lv:1},{id:'train',en:'train',he:'רכבת',lv:1},{id:'truck',en:'truck',he:'משאית',lv:1},
  {id:'ship',en:'ship',he:'ספינה',lv:1,grp:'boat'},{id:'boat',en:'boat',he:'סירה',lv:2,grp:'boat'},
  {id:'helicopter',en:'helicopter',he:'מסוק',lv:2},{id:'rocket',en:'rocket',he:'רקטה',lv:3},
  /* home */
  {id:'house',en:'house',he:'בית',lv:1},{id:'bed',en:'bed',he:'מיטה',lv:1},{id:'chair',en:'chair',he:'כיסא',lv:1},
  {id:'table',en:'table',he:'שולחן',lv:1},{id:'door',en:'door',he:'דלת',lv:1},
  {id:'window',en:'window',he:'חלון',lv:2},{id:'lamp',en:'lamp',he:'מנורה',lv:2},{id:'clock',en:'clock',he:'שעון',lv:2},
  /* colors — one color card on screen at a time (they all look alike in shape) */
  {id:'red',en:'red',he:'אדום',lv:1,grp:'color'},{id:'blue',en:'blue',he:'כחול',lv:1,grp:'color'},
  {id:'green',en:'green',he:'ירוק',lv:1,grp:'color'},{id:'yellow',en:'yellow',he:'צהוב',lv:1,grp:'color'},
  {id:'black',en:'black',he:'שחור',lv:1,grp:'color'},{id:'white',en:'white',he:'לבן',lv:1,grp:'color'},
  {id:'purple',en:'purple',he:'סגול',lv:2,grp:'color'},{id:'pink',en:'pink',he:'ורוד',lv:2,grp:'color'},
  /* nature */
  {id:'sun',en:'sun',he:'שמש',lv:1,grp:'sky'},{id:'star',en:'star',he:'כוכב',lv:1,grp:'sky'},
  {id:'tree',en:'tree',he:'עץ',lv:1},{id:'flower',en:'flower',he:'פרח',lv:1},{id:'rain',en:'rain',he:'גשם',lv:1},
  {id:'moon',en:'moon',he:'ירח',lv:1},{id:'rainbow',en:'rainbow',he:'קשת בענן',lv:2},
  /* clothing */
  {id:'hat',en:'hat',he:'כובע',lv:1},{id:'shirt',en:'shirt',he:'חולצה',lv:1},{id:'dress',en:'dress',he:'שמלה',lv:1},
  {id:'shoes',en:'shoes',he:'נעליים',lv:1,grp:'feet'},{id:'socks',en:'socks',he:'גרביים',lv:1,grp:'feet'},
  {id:'umbrella',en:'umbrella',he:'מטריה',lv:3},
  /* school */
  {id:'book',en:'book',he:'ספר',lv:1},{id:'ruler',en:'ruler',he:'סרגל',lv:1},
  {id:'pen',en:'pen',he:'עט',lv:1,grp:'pen'},{id:'pencil',en:'pencil',he:'עיפרון',lv:2,grp:'pen'},
  /* toys */
  {id:'kite',en:'kite',he:'עפיפון',lv:1},{id:'doll',en:'doll',he:'בובה',lv:1},
  {id:'balloon',en:'balloon',he:'בלון',lv:1,grp:'ball'},{id:'robot',en:'robot',he:'רובוט',lv:2},
  /* everyday */
  {id:'cup',en:'cup',he:'כוס',lv:1},{id:'key',en:'key',he:'מפתח',lv:1},{id:'phone',en:'phone',he:'טלפון',lv:1},
  {id:'ball',en:'ball',he:'כדור',lv:1,grp:'ball'},
];

/* ---------------- image loading (real site photos, lazy by level) ---------------- */
for(const w of WORDS){ w.img=null; w.ready=false; w.broken=false; }
function loadWord(w){
  if(w.img) return;
  const im=new window.Image();
  im.decoding='async';
  im.onload=()=>{ w.ready=im.naturalWidth>0; };
  im.onerror=()=>{ w.broken=true; };
  im.src='/images/'+w.id+'.webp';
  w.img=im;
}
WORDS.filter(w=>w.lv===1).forEach(loadWord);
setTimeout(()=>WORDS.forEach(loadWord),2500);   // levels 2-3 shortly after

/* ---------------- audio (WebAudio SFX, zero assets) ---------------- */
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
function chord(base){ [0,4,7,12].forEach((s,i)=>setTimeout(()=>beep(base*Math.pow(2,s/12),0.16,'triangle',0.11), i*45)); }

/* ---------------- speech (guarded — may be silent headless / no voices) ---------------- */
let voice=null;
function pickVoice(){
  try{
    const vs=speechSynthesis.getVoices()||[];
    voice=vs.find(v=>v.lang==='en-US')||vs.find(v=>v.lang&&v.lang.indexOf('en')===0)||null;
  }catch(e){}
}
try{ if('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; } }catch(e){}
function speak(text,force){
  if(muted&&!force) return;
  try{
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang='en-US'; u.rate=0.9; u.pitch=1.05;
    if(voice) u.voice=voice;
    speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------------- best-score persistence ---------------- */
const AKEY='cde_arcade', AID='word-zapper';
function readBest(){ try{ return (JSON.parse(localStorage.getItem(AKEY)||'{}')[AID]||{}).best||0; }catch(e){ return 0; } }
function writeBest(b){ try{ const all=JSON.parse(localStorage.getItem(AKEY)||'{}')||{}; all[AID]={best:b}; localStorage.setItem(AKEY,JSON.stringify(all)); }catch(e){} }

/* ---------------- state ---------------- */
const S={
  screen:'menu', playing:false,
  sprites:[], parts:[], shake:0,
  score:0, best:readBest(), runStartBest:0,
  shields:3, tier:1, streak:0, combo:0, fastStreak:0,
  speedMul:1, spawnT:0, spawnInt:2.6,
  target:null,           // current target word object
  targetAt:0,            // when it was announced (for the fast bonus)
  zapped:0,
};
let lastTargetId=null, firstRoundEver=true;

/* ---------------- canvas ---------------- */
const cv=$('cv'), ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;
function resize(){ DPR=Math.min(2,window.devicePixelRatio||1); W=cv.clientWidth; H=cv.clientHeight; cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); }
window.addEventListener('resize',resize);
function geo(){
  let topInset=110;
  const tb=$('topbar');
  if(tb&&tb.classList.contains('show')){
    try{ topInset=Math.max(90,tb.getBoundingClientRect().bottom+6); }catch(e){}
  }
  const lineY=H-26;
  return {topInset, lineY, avail:Math.max(160,lineY-topInset)};
}
function cardSize(){ return clamp(Math.min(W,H)*0.22, 74, 128); }  // always ≥64px touch target

/* ---------------- word selection ---------------- */
function levelsForTier(t){ return t>=4?3 : t>=2?2 : 1; }
function onScreenIds(){ return new Set(S.sprites.map(s=>s.word.id)); }
function onScreenGrps(){ const g=new Set(); for(const s of S.sprites) if(s.word.grp) g.add(s.word.grp); return g; }
function pickWord(opts){
  const {asTarget}=opts||{};
  const maxLv=levelsForTier(S.tier), ids=onScreenIds(), grps=onScreenGrps();
  /* progressively relax: strict (level+grp) → ignore level → ignore grp */
  const passes=[
    w=>w.ready&&!w.broken&&w.lv<=maxLv&&!ids.has(w.id)&&(!w.grp||!grps.has(w.grp))&&(!asTarget||w.id!==lastTargetId),
    w=>w.ready&&!w.broken&&!ids.has(w.id)&&(!w.grp||!grps.has(w.grp))&&(!asTarget||w.id!==lastTargetId),
    w=>w.ready&&!w.broken&&!ids.has(w.id)&&(!asTarget||w.id!==lastTargetId),
  ];
  for(const pass of passes){
    const c=WORDS.filter(pass);
    if(c.length) return c[Math.floor(Math.random()*c.length)];
  }
  return null;
}

/* ---------------- spawning ---------------- */
function spawnSprite(word,isTarget){
  if(!word) return null;
  const g=geo(), sz=cardSize();
  let x=rnd(sz/2+10, Math.max(sz/2+11, W-sz/2-10));
  /* try to avoid overlapping an existing card horizontally near the top */
  for(let i=0;i<8;i++){
    const clash=S.sprites.some(s=>s.y<g.topInset+sz*2.2 && Math.abs(s.x-x)<sz*1.05);
    if(!clash) break;
    x=rnd(sz/2+10, Math.max(sz/2+11, W-sz/2-10));
  }
  const slow=(firstRoundEver&&isTarget)?0.42:1;             // first picture falls slowly
  const rmMul=RM?0.72:1;                                    // reduced motion → slower drift
  const sp={ word, isTarget:!!isTarget, x, y:g.topInset+sz/2+6, size:sz,
    v:g.avail*0.052*rnd(0.9,1.15)*slow*rmMul, flashT:0, wob:rnd(0,6.28) };
  S.sprites.push(sp);
  return sp;
}

/* ---------------- rounds ---------------- */
function announce(word){
  S.target=word; S.targetAt=performance.now(); lastTargetId=word.id;
  const en=$('targetEn'), he=$('targetHe');
  if(en) en.textContent=word.en;
  if(he) he.textContent=word.he;
  speak(word.en);
}
function newRound(){
  /* half the time promote an existing high-up distractor to target (so "newest
     card = answer" is never a reliable trick); otherwise spawn a fresh one */
  let sp=null;
  const cands=S.sprites.filter(s=>!s.isTarget && s.word.id!==lastTargetId && s.y<H*0.42);
  if(!firstRoundEver && cands.length && Math.random()<0.5){
    sp=cands[Math.floor(Math.random()*cands.length)];
    sp.isTarget=true;
  }else{
    sp=spawnSprite(pickWord({asTarget:true}),true);
  }
  if(!sp){ S.spawnT=99; return; }                          // pool not ready yet → retry via update()
  announce(sp.word);
  firstRoundEver=false;
}
function targetSprite(){ for(const s of S.sprites) if(s.isTarget) return s; return null; }
function maxOn(){ return S.tier>=5?4 : S.tier>=3?3 : 2; }   // 2-4 pictures on screen

/* ---------------- tap resolution ---------------- */
function hitSprite(x,y){
  const pad=10; let best=null,bd=1e9;
  for(const s of S.sprites){
    const h=s.size/2+pad;
    if(x>=s.x-h&&x<=s.x+h&&y>=s.y-h&&y<=s.y+h){
      const d=Math.hypot(x-s.x,y-s.y);
      if(d<bd){ bd=d; best=s; }
    }
  }
  return best;
}
function zap(sp){
  const react=(performance.now()-S.targetAt)/1000, fast=react<4;
  S.streak++; S.combo++;
  const pts=Math.round(10*(1+0.15*S.streak)*(fast?1.5:1));
  S.score+=pts; S.zapped++;
  if(S.score>S.best){ S.best=S.score; writeBest(S.best); }
  S.sprites=S.sprites.filter(s=>s!==sp);
  burst(sp.x,sp.y,26,'#6366f1',5,0.9);
  burst(sp.x,sp.y,12,'#f59e0b',4,0.7);
  S.parts.push({txt:'+'+pts,x:sp.x,y:sp.y-sp.size/2-8,vx:0,vy:-46,life:0.9,max:0.9,color:'#f59e0b'});
  chord(523); shakeIt(Math.min(4+S.combo,12));
  if(S.combo>=5&&S.combo%5===0){ toast('◈ COMBO ×'+S.combo+' ◈'); }
  if(fast){ S.fastStreak++; if(S.fastStreak>=4){ S.fastStreak=0; tierUp(); } } else S.fastStreak=0;
  updateHUD();
  newRound();
}
function miss(sp){
  S.streak=0; S.combo=0; S.fastStreak=0;
  S.speedMul=Math.max(0.65,S.speedMul*0.94);               // rubber-band down
  sp.flashT=0.7;
  redFlash(); shakeIt(6); beep(150,0.22,'sawtooth',0.14,70);
  S.parts.push({txt:sp.word.en,x:sp.x,y:sp.y-sp.size/2-8,vx:0,vy:-30,life:1.1,max:1.1,color:'#ef4444'});
  speak(S.target?S.target.en:'');                           // re-cue the word they need
  updateHUD();
}
function tap(x,y){
  if(S.screen!=='play'||!S.playing) return;
  ac();
  const sp=hitSprite(x,y);
  if(!sp){ beep(220,0.06,'square',0.06); return; }
  if(sp.isTarget) zap(sp); else miss(sp);
}
cv.addEventListener('pointerdown',e=>{
  const r=cv.getBoundingClientRect();
  tap(e.clientX-r.left,e.clientY-r.top);
});


/* play-depth beacon (cde_learn channel) — same guards as land-beacon.js:
   automation (navigator.webdriver) and owner devices (cde_internal) never count */
function learnBeacon(ev){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(navigator.sendBeacon) navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:'word-zapper'}]}));
  }catch(e){}
}

/* two-way adaptive: 4-streak of fast correct zaps → up-tier */
function tierUp(){
  S.tier++;
  S.speedMul=Math.min(2.6,S.speedMul*1.12);
  S.spawnInt=Math.max(1.3,S.spawnInt*0.92);
  toast('⚡ SPEED UP — LV '+S.tier);
  learnBeacon('g_lvl');
  chord(659); shakeIt(5); updateHUD();
}

/* the TARGET picture reached the ground → shield loss */
function leak(sp){
  S.sprites=S.sprites.filter(s=>s!==sp);
  if(!sp.isTarget){ burst(sp.x,geo().lineY-10,8,'#c7d2fe',3,0.5); return; }   // distractors drift away free
  burst(sp.x,geo().lineY-10,30,'#ef4444',6,1);
  redFlash(); shakeIt(12); beep(90,0.4,'sawtooth',0.18,50);
  S.shields--; S.streak=0; S.combo=0; S.fastStreak=0;
  S.speedMul=Math.max(0.65,S.speedMul*0.94);
  updateHUD();
  if(S.shields<=0){ gameOver(); return; }
  newRound();
}

/* ---------------- physics ---------------- */
function update(dt){
  const g=geo();
  S.spawnT+=dt;
  if(!targetSprite()&&S.target===null){ newRound(); S.spawnT=0; }
  else if(!targetSprite()&&S.spawnT>=0.8){ newRound(); S.spawnT=0; }          // pool was loading — retry
  else if(S.sprites.length<maxOn()&&S.spawnT>=S.spawnInt){ spawnSprite(pickWord({}),false); S.spawnT=0; }
  for(const s of S.sprites){ s.y+=s.v*S.speedMul*dt; s.wob+=dt*2.2; if(s.flashT>0)s.flashT-=dt; }
  for(const s of [...S.sprites]) if(s.y>=g.lineY-s.size/2+6) leak(s);
  if(!S.playing) return;
  for(const p of S.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; if(!p.txt)p.vy+=150*dt; p.life-=dt; }
  S.parts=S.parts.filter(p=>p.life>0);
  S.shake*=Math.pow(0.0003,dt); if(S.shake<0.3)S.shake=0;
}
function burst(x,y,n,c,sp=5,lf=1){
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2,s2=rnd(30,60)*sp/4;
    S.parts.push({x,y,vx:Math.cos(a)*s2,vy:Math.sin(a)*s2,life:rnd(0.4,1)*lf,max:lf,color:c,r:rnd(1.5,4)}); }
}
function shakeIt(v){ if(RM) return; S.shake=Math.max(S.shake,v); }
let flashT2=null;
function redFlash(){ const f=$('flash'); if(!f) return; f.style.opacity=RM?0.12:0.22; clearTimeout(flashT2); flashT2=setTimeout(()=>{ f.style.opacity=0; },140); }

/* ---------------- render ---------------- */
let clouds=[];
function initClouds(){ clouds=[]; for(let i=0;i<7;i++) clouds.push({x:Math.random(),y:Math.random()*0.8,s:rnd(0.5,1.2),v:rnd(0.004,0.012)}); }
function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function render(dt){
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#eef2ff'); bg.addColorStop(0.6,'#e0e7ff'); bg.addColorStop(1,'#dbeafe');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  ctx.save();
  if(S.shake>0.2) ctx.translate(rnd(-S.shake,S.shake),rnd(-S.shake,S.shake));
  /* soft drifting clouds */
  ctx.fillStyle='rgba(255,255,255,.65)';
  for(const c of clouds){
    c.x+=c.v*dt; if(c.x>1.15)c.x=-0.15;
    const cx=c.x*W, cy=c.y*H, r=26*c.s;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.arc(cx+r*0.9,cy+4,r*0.75,0,7); ctx.arc(cx-r*0.9,cy+5,r*0.7,0,7); ctx.fill();
  }
  if(S.screen==='play'){
    drawGround();
    for(const s of S.sprites) drawSprite(s);
  }
  drawParts();
  ctx.restore();
}
function drawGround(){
  const g=geo(), y=g.lineY;
  ctx.fillStyle='rgba(79,70,229,.10)'; ctx.fillRect(0,y,W,H-y);
  ctx.strokeStyle='rgba(239,68,68,.55)'; ctx.lineWidth=2.5; ctx.setLineDash([12,9]);
  ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); ctx.setLineDash([]);
}
function drawSprite(s){
  const sz=s.size, x=s.x-sz/2, y=s.y-sz/2, flash=s.flashT>0;
  const tilt=RM?0:Math.sin(s.wob)*0.045;
  ctx.save();
  ctx.translate(s.x,s.y); ctx.rotate(tilt); ctx.translate(-s.x,-s.y);
  if(flash) ctx.translate(rnd(-2,2),0);
  ctx.shadowColor=flash?'rgba(239,68,68,.55)':'rgba(79,70,229,.30)';
  ctx.shadowBlur=flash?20:12; ctx.shadowOffsetY=5;
  ctx.fillStyle='#fff';
  roundRect(x,y,sz,sz,16); ctx.fill();
  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
  ctx.strokeStyle=flash?'#ef4444':'rgba(99,102,241,.55)'; ctx.lineWidth=flash?4:2.5;
  roundRect(x,y,sz,sz,16); ctx.stroke();
  /* the photo, cover-cropped into the card */
  const im=s.word.img, pad=6;
  if(im&&s.word.ready){
    ctx.save();
    roundRect(x+pad,y+pad,sz-pad*2,sz-pad*2,11); ctx.clip();
    const iw=im.naturalWidth, ih=im.naturalHeight, box=sz-pad*2;
    const sc=Math.max(box/iw,box/ih), dw=iw*sc, dh=ih*sc;
    ctx.drawImage(im, x+pad+(box-dw)/2, y+pad+(box-dh)/2, dw, dh);
    if(flash){ ctx.fillStyle='rgba(239,68,68,.30)'; ctx.fillRect(x,y,sz,sz); }
    ctx.restore();
  }
  ctx.restore();
}
function drawParts(){
  for(const p of S.parts){
    ctx.globalAlpha=clamp(p.life/p.max,0,1);
    if(p.txt){ ctx.fillStyle=p.color; ctx.font='900 20px Segoe UI,system-ui,sans-serif'; ctx.textAlign='center'; ctx.fillText(p.txt,p.x,p.y); }
    else{ ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); }
  }
  ctx.globalAlpha=1;
}

/* ---------------- main loop ---------------- */
let lastTS=0;
function loop(ts){
  const dt=Math.min(0.05,(ts-lastTS)/1000)||0.016; lastTS=ts;
  if(S.playing&&S.screen==='play') update(dt);
  render(dt);
  requestAnimationFrame(loop);
}

/* ---------------- HUD / toast ---------------- */
function updateHUD(){
  const sp=$('shieldPill'), sc=$('scorePill'), tp=$('tierPill');
  if(sp){ const k=Math.max(0,S.shields); sp.textContent='🛡 '+(k>0?'●'.repeat(k):'')+'○'.repeat(Math.max(0,3-k)); }
  if(sc) sc.textContent='⭐ '+S.score+(S.best>0?' · best '+S.best:'');
  if(tp) tp.textContent='⚡ LV '+S.tier;
}
let toastT=null;
function toast(msg){ const e=$('combo'); if(!e) return; e.textContent=msg; e.style.opacity=1; clearTimeout(toastT); toastT=setTimeout(()=>{ e.style.opacity=0; },900); }

/* ---------------- screens / lifecycle ---------------- */
function show(s){
  S.screen=s;
  ['menu','over'].forEach(x=>{ const e=$(x); if(e) e.classList.toggle('show',x===s); });
  const tb=$('topbar'); if(tb) tb.classList.toggle('show',s==='play');
  resize();
}
function start(){
  Object.assign(S,{ playing:true, sprites:[], parts:[], shake:0,
    score:0, shields:3, tier:1, streak:0, combo:0, fastStreak:0,
    speedMul:1, spawnT:0, spawnInt:2.6, target:null, targetAt:0, zapped:0 });
  S.runStartBest=S.best;
  show('play'); updateHUD();
  const en=$('targetEn'), he=$('targetHe');
  if(en) en.textContent='…'; if(he) he.textContent='מקשיבים…';
  ac();
  try{ if('speechSynthesis' in window) speechSynthesis.resume(); }catch(e){}
}
function gameOver(){
  S.playing=false; S.target=null;
  learnBeacon('g_cmp');
  try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){}
  const isBest=S.score>0&&S.score>S.runStartBest;
  const c=$('overCard');
  if(c) c.innerHTML='⭐ Score <b>'+S.score+'</b>'
    +(isBest?' · <span class="newbest">★ NEW BEST!</span>':' · best <b>'+S.best+'</b>')
    +'<br>⚡ Reached <b>LV '+S.tier+'</b> · zapped <b>'+S.zapped+'</b> word'+(S.zapped===1?'':'s');
  show('over');
  beep(120,0.6,'sawtooth',0.16,60);
}

/* ---------------- public contract + test hooks ---------------- */
const WZ={
  start,
  say(){ if(S.target) speak(S.target.en,true); },
  toggleMute(){ muted=!muted; const m=$('mutePill'); if(m) m.textContent=muted?'🔇':'🔊'; if(muted){ try{ speechSynthesis.cancel(); }catch(e){} } },
  dbg:{
    get screen(){ return S.screen; }, get playing(){ return S.playing; },
    get score(){ return S.score; }, get shields(){ return S.shields; },
    get tier(){ return S.tier; }, get spriteCount(){ return S.sprites.length; },
    get streak(){ return S.streak; },
    targetWord(){ return S.target?S.target.id:null; },
    hasTargetSprite(){ return !!targetSprite(); },
    targetPos(){ const t=targetSprite(); return t?{x:t.x,y:t.y}:null; },
    wrongPos(){
      let d=S.sprites.find(s=>!s.isTarget);
      if(!d) d=spawnSprite(pickWord({}),false);
      return d?{x:d.x,y:d.y}:null;
    },
    dropTarget(){ const t=targetSprite(); if(t) t.y=1e6; },
    spriteY(){ const t=targetSprite()||S.sprites[0]; return t?t.y:null; },
    solveForTest(){ const t=targetSprite(); if(t) zap(t); },
    wrongForTest(){ const d=S.sprites.find(s=>!s.isTarget)||spawnSprite(pickWord({}),false); if(d) miss(d); },
  },
};
window.WZ=WZ;

updateHUD(); resize(); initClouds(); requestAnimationFrame(loop);

/* ---------------- DOM wiring (CSP-safe: no inline handlers) ---------------- */
$('startBtn').addEventListener('click',()=>WZ.start());
$('againBtn').addEventListener('click',()=>WZ.start());
$('mutePill').addEventListener('click',()=>WZ.toggleMute());
$('sayBtn').addEventListener('click',()=>WZ.say());

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
