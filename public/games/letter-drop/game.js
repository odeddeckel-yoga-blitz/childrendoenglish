/* Letter Drop (/games/letter-drop/, wave 3 11-12). Arcade spelling: a picture shows and its word is spoken
   (/audio/<word>.mp3, Piper); letters fall down four lanes and the child catches the letters of the word IN ORDER.
   Level 1 = 3-letter words with the letters shown faintly in the slots (match them) · level 2 = 4 letters ·
   level 3 = 5 letters, both with empty slots (spell from the picture and the sound). 5 words per level, 3 hearts.
   A wrong letter (another letter, or a letter of the word out of order) costs a heart and shows the letter that comes
   next in its slot; the child still has to catch it (never a free pass). No hearts left = soft lives (kit arcade
   addendum): the same word starts again with 3 new hearts and does not score; the level's progress is kept and the
   child is never thrown out of the run.
   A letter that falls off the bottom costs nothing; the next letter keeps coming until it is caught.
   Oracle guards (kit "no giveaway"), asserted in e2e/letter-drop.spec.js: every falling letter looks the same, the
   needed letter falls in a uniform lane and is only part of what falls, the decoys are mostly the word's own other
   letters (so order matters) and look-alike letters (b d p, m n w …), never the needed letter itself.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start / g_lvl / g_cmp @ letter-drop, and
   ld @ l<1|2|3>_<word|miss|over> (a word caught clean / its first wrong letter / out of hearts). */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='letter-drop';
var D=window.LD_WORDS;
var LEVELS=[{ghost:true,fall:7600,gap:1150},{ghost:false,fall:6800,gap:1050},{ghost:false,fall:6000,gap:950}];
var ROUNDS=5, HEARTS=3, LANES=4, TILE=58;
var RM=(function(){ try{ return matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){ return false; } })();
var AZ='abcdefghijklmnopqrstuvwxyz';

function beacon(ev,item){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(!navigator.sendBeacon) return;
    var L=window.CDE_LANG||'en', l=L==='he'||L==='es'?L:'en';
    navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:item}], l:l}));
  }catch(e){}
}
beacon('g_open',GAME);

function tts(w){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(w); u.lang='en-US'; u.rate=0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function say(w){ if(window.cdeSay) window.cdeSay(w,function(){ tts(w); }); else tts(w); }
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(2500,cb); else cb(); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

// A falling letter. need = the letter the child must catch now; onField = a needed letter is already falling in reach;
// dry = spawns in a row with no needed letter on the field. The needed letter comes often enough to catch, but is
// never the only thing that falls; decoys: the word's other letters (order matters) and look-alikes, else any letter.
function chooseLetter(word,pos,onField,dry){
  var need=word[pos];
  if(!onField && (dry>=2 || Math.random()<0.5)) return need;
  if(onField && Math.random()<0.15) return need;
  var own=word.split('').filter(function(c,i){ return i!==pos && c!==need; });
  var look=(D.CONFUSE[need]||'').split('').filter(function(c){ return c!==need; });
  var r=Math.random(), pool;
  if(r<0.45 && own.length) pool=own; else if(r<0.8 && look.length) pool=look; else pool=AZ.replace(need,'').split('');
  return pick(pool);
}
// a lane whose top is clear (no letter dropped on top of another); uniform among the clear ones
function chooseLane(clear){ return clear.length?pick(clear):-1; }
function plan(li){ return shuffle(D.LEVELS[li]).slice(0,ROUNDS); }

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,words:[],pos:0,hearts:HEARTS,misses:0,missed:false,answered:false,over:false,started:false,running:false};
var roundId=0, tiles=[], field=null, fieldH=300, laneW=80, spawnIn=0, dry=0, raf=0, last=0, spawned=[];

function startLevel(i){ roundId++; stop(); S.lvl=i; S.round=0; S.score=0; S.hearts=HEARTS; S.over=false; S.words=plan(i);
  try{ if(window.cdePreload) cdePreload(S.words); }catch(e){} render(); }

function stop(){ S.running=false; if(raf) cancelAnimationFrame(raf); raf=0; tiles.forEach(function(t){ if(t.el.parentNode) t.el.parentNode.removeChild(t.el); }); tiles=[]; }

function hearts(){
  var h=el('div','hearts'); h.setAttribute('aria-label',S.hearts+' / '+HEARTS); h.setAttribute('dir','ltr');
  for(var i=0;i<HEARTS;i++) h.appendChild(elh('span',i<S.hearts?'hrt on':'hrt off',IC('heart')));
  return h;
}

// again = the same word once more after the hearts ran out (it stays a missed word)
function render(again){
  var w=S.words[S.round], my=++roundId, lv=LEVELS[S.lvl];
  var live=function(){ return my===roundId; };
  stop();
  S.pos=0; S.missed=!!again; S.answered=false; S.over=false;
  if(again) S.hearts=HEARTS;
  app.textContent='';
  var h=el('div','hud');
  var hl=el('div','hud-row');
  hl.appendChild(el('span','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  hl.appendChild(hearts());
  h.appendChild(hl);
  var dots=el('div','dots');
  for(var i=0;i<ROUNDS;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots); app.appendChild(h);

  var top=el('div','top-row');
  var im=el('img','pic'); im.src='/images/'+w+'.webp'; im.alt=''; im.width=150; im.height=150; im.draggable=false; top.appendChild(im);
  var right=el('div','right');
  var slots=el('div','slots'); slots.setAttribute('lang','en'); slots.setAttribute('dir','ltr');
  w.split('').forEach(function(c){ var s=el('span','slot'+(lv.ghost?' faint':''),lv.ghost?c:''); slots.appendChild(s); });
  right.appendChild(slots);
  var sb=elh('button','say',IC('volume-2')); sb.id='sayBtn'; sb.type='button'; sb.setAttribute('aria-label',T('again'));
  sb.addEventListener('click',function(){ if(live()) say(w); });
  right.appendChild(sb);
  top.appendChild(right);
  app.appendChild(top);
  var fb=elh('p','feedback',T(again?'overLine':'lv'+S.lvl)); fb.setAttribute('role','status'); app.appendChild(fb);
  field=el('div','field'); field.id='field'; field.setAttribute('dir','ltr');
  for(var k=1;k<LANES;k++){ var ln=el('span','lane-line'); ln.style.left=(k*100/LANES)+'%'; field.appendChild(ln); }
  app.appendChild(field);
  size();

  function slotEl(i){ return slots.children[i]; }
  function catchTile(t){
    if(!live()||S.answered||S.over||t.gone) return;
    var need=w[S.pos];
    if(t.c===need){
      remove(t,'got');
      var s=slotEl(S.pos); s.textContent=need; s.className='slot filled';
      S.pos++;
      if(S.pos<w.length){ fb.innerHTML=T('good'); return; }
      // the whole word: stop the drop, say it, wait for the clip to end, then the next word (kit §8g)
      S.answered=true; stop();
      for(var j=0;j<w.length;j++) slotEl(j).className='slot filled done';
      if(!S.missed){ S.score++; beacon('ld','l'+(S.lvl+1)+'_word'); }
      fb.innerHTML=T('right');
      say(w);
      setTimeout(function(){ if(live()) sayDone(function(){ if(live()) next(); }); }, 900);
      return;
    }
    // a wrong letter: a heart, the letter shakes away, the next letter shows in its slot; it still has to be caught
    remove(t,'bad');
    S.hearts--; if(!S.missed){ S.misses++; beacon('ld','l'+(S.lvl+1)+'_miss'); }
    S.missed=true;
    var hs=app.querySelector('.hearts'); if(hs) hs.parentNode.replaceChild(hearts(),hs);
    var s2=slotEl(S.pos); s2.textContent=need; s2.className='slot shown';
    if(S.hearts<=0){ S.over=true; stop(); beacon('ld','l'+(S.lvl+1)+'_over'); fb.innerHTML=T('overTitle'); return setTimeout(function(){ if(live()) render(true); }, 1400); }
    var parts=T('nowCatch').split('{L}');
    fb.textContent='';
    parts.forEach(function(p,j){ fb.appendChild(document.createTextNode(p)); if(j<parts.length-1){ var b=el('b','en',need); b.setAttribute('lang','en'); fb.appendChild(b); } });
  }
  function spawn(){
    var need=w[S.pos];
    var onField=tiles.some(function(t){ return !t.gone && t.c===need && t.y < fieldH*0.7; });
    var clear=[]; for(var l=0;l<LANES;l++){ if(!tiles.some(function(t){ return !t.gone && t.lane===l && t.y < TILE*1.4; })) clear.push(l); }
    var lane=chooseLane(clear); if(lane<0) return;
    var c=chooseLetter(w,S.pos,onField,dry);
    dry=(c===need||onField)?0:dry+1;
    var b=el('button','tile',c); b.type='button'; b.setAttribute('lang','en'); b.setAttribute('data-letter',c);
    var t={c:c,lane:lane,y:-TILE,el:b,gone:false,need:c===need};
    spawned.push({c:c,lane:lane,need:c===need});
    if(spawned.length>400) spawned.shift();
    b.style.left=(lane*laneW+(laneW-TILE)/2)+'px';
    b.style.transform='translate3d(0,'+t.y+'px,0)';
    var fire=function(e){ if(e&&e.type==='pointerdown'){ e.preventDefault(); } catchTile(t); };
    b.addEventListener('pointerdown',fire);
    b.addEventListener('click',fire);
    field.appendChild(b); tiles.push(t);
  }
  function frame(now){
    if(!S.running||!live()) return;
    var dt=Math.min(50,now-last); last=now;
    var speed=(fieldH+TILE)/(lv.fall*(RM?1.3:1));
    for(var i=tiles.length-1;i>=0;i--){
      var t=tiles[i]; if(t.gone){ continue; }
      t.y+=dt*speed;
      if(t.y>fieldH){ remove(t,'fell'); continue; }
      t.el.style.transform='translate3d(0,'+t.y+'px,0)';
    }
    tiles=tiles.filter(function(t){ return !t.gone; });
    spawnIn-=dt; if(spawnIn<=0){ spawn(); spawnIn=lv.gap; }
    raf=requestAnimationFrame(frame);
  }
  // start the drop once the word has been said (the clip plays while the first letters fall)
  say(w);
  setTimeout(function(){ if(!live()) return; S.running=true; dry=0; spawnIn=0; last=performance.now(); raf=requestAnimationFrame(frame); }, 500);
}

function remove(t,how){
  t.gone=true;
  if(how==='fell'||RM){ if(t.el.parentNode) t.el.parentNode.removeChild(t.el); return; }
  t.el.classList.add(how); t.el.disabled=true;
  setTimeout(function(){ if(t.el.parentNode) t.el.parentNode.removeChild(t.el); }, 350);
}

function size(){
  if(!field) return;
  var r=field.getBoundingClientRect();
  fieldH=Math.max(180, Math.floor(innerHeight - r.top - 12));
  field.style.height=fieldH+'px';
  laneW=field.clientWidth/LANES;
  tiles.forEach(function(t){ t.el.style.left=(t.lane*laneW+(laneW-TILE)/2)+'px'; });
}
addEventListener('resize',size);
document.addEventListener('visibilitychange',function(){ last=performance.now(); });

function stars(n){
  var s=n===ROUNDS?3:n>=ROUNDS-1?2:1, box=el('div','stars'); box.setAttribute('aria-label',s+' / 3');
  for(var i=0;i<3;i++) box.appendChild(elh('span',i<s?'on':'off',IC('star')));
  return box;
}

function next(){
  roundId++; stop();
  S.round++;
  if(S.round<ROUNDS) return render();
  beacon('g_lvl',GAME);
  app.textContent=''; field=null;
  if(S.lvl===LEVELS.length-1){ beacon('g_cmp',GAME); return renderEnd(); }
  var box=el('div','card');
  box.appendChild(stars(S.score));
  box.appendChild(el('h2',null,T('levelDone')));
  var sc=el('p','score',S.score+' / '+ROUNDS); sc.setAttribute('dir','ltr'); box.appendChild(sc);
  var nx=elh('button','primary',T('nextLevel')); nx.type='button'; nx.id='nextLevelBtn'; nx.addEventListener('click',function(){ startLevel(S.lvl+1); });
  var again=elh('button','ghost',T('retry')); again.type='button'; again.addEventListener('click',function(){ startLevel(S.lvl); });
  box.appendChild(nx); box.appendChild(again);
  app.appendChild(box); nx.focus();
}

function renderEnd(){
  var box=el('div','card');
  box.appendChild(elh('h2',null,T('allDone')));
  box.appendChild(el('p',null,T(S.misses?'endSome':'allRight')));
  var again=elh('button','primary',T('playAgain')); again.type='button'; again.id='againBtn';
  again.addEventListener('click',function(){ S.misses=0; startLevel(0); });
  box.appendChild(again);
  app.appendChild(box);
  if(window.CDE_END) CDE_END({game:GAME,again:again,good:S.misses<=4});
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

document.getElementById('startBtn').addEventListener('click',function(){
  if(!S.started){ S.started=true; beacon('g_start',GAME); }
  document.getElementById('menu').hidden=true;
  startLevel(0);
});

/* ---------- test/debug contract (real input paths only) ---------- */
// a letter tile fully inside the field (what a child can see and tap)
function inReach(match){
  for(var i=0;i<tiles.length;i++){ var t=tiles[i]; if(!t.gone && t.y>=0 && t.y<=fieldH-TILE && match(t)) return t; }
  return null;
}
window.LD={
  S:S, D:D, LEVELS:LEVELS, ROUNDS:ROUNDS, HEARTS:HEARTS, LANES:LANES,
  dbg:{
    get word(){ return S.words[S.round]||null; },
    get need(){ var w=S.words[S.round]; return w&&!S.answered?w[S.pos]:null; },
    get roundKey(){ var w=S.words[S.round]; return (w&&field&&!S.over)?S.lvl+':'+S.round+':'+w:''; },
    get tiles(){ return tiles.filter(function(t){ return !t.gone; }).map(function(t){ return {c:t.c,lane:t.lane,y:t.y}; }); },
    get spawned(){ return spawned.slice(); },
    get fieldH(){ return fieldH; },
    plan:plan, chooseLetter:chooseLetter, chooseLane:chooseLane,
    startLevel:startLevel,
    /* tap the falling letter that comes next, through the real button (false if none is in reach yet) */
    solveForTest:function(){ var w=S.words[S.round]; if(!w||S.answered||S.over||!S.running) return false; var t=inReach(function(t){ return t.c===w[S.pos]; }); if(!t) return false; t.el.click(); return true; },
    /* tap a falling letter that is NOT next, through the real button (a real miss) */
    wrongForTest:function(){ var w=S.words[S.round]; if(!w||S.answered||S.over||!S.running) return false; var t=inReach(function(t){ return t.c!==w[S.pos]; }); if(!t) return false; t.el.click(); return true; }
  }
};
})();
