/* Shopping List (/games/shopping-list/, wave 3 11-12). Short-term listening: the game reads a shopping list of 2, then
   3, then 4 food words (/audio/<word>.mp3, Piper, one after the other) and the child picks them off a shelf of photos
   IN ORDER. The list is never written; a replay button reads it again. The basket's numbered slots light up as each
   word is read, so the order is something to see as well as hear.
   Level 1 = 2 words from a shelf of 6 · level 2 = 3 from 8 · level 3 = 4 from 9. 5 rounds per level.
   The shelf waits until the list has been read once (a tap before that is not a miss: kit "not-ready is not a miss").
   A wrong tap (another food, or the right food too early) is a miss: that picture shakes, the word that comes next
   is said again and its picture gets a gold ring, and the child must still tap it (only clean rounds score).
   Oracle guards (kit "no giveaway"), asserted in e2e/shopping-list.spec.js: every shelf picture is a photo of the same
   size and look, no labels before the pick, look-alikes (SAME) never share a shelf, the list's pictures sit at
   uniform places. Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start / g_lvl / g_cmp @
   shopping-list, and sl @ n<2|3|4>_<ok|no> (a round finished clean / its first miss). */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='shopping-list';
var D=window.SL_WORDS;
var LEVELS=[{n:2,shelf:6},{n:3,shelf:8},{n:4,shelf:9}];
var ROUNDS=5;

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
function sayDone(cap,cb){ if(window.cdeSayDone) window.cdeSayDone(cap,cb); else setTimeout(cb,900); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

function clash(a,b){ return D.SAME.some(function(p){ return p.indexOf(a)>=0&&p.indexOf(b)>=0; }); }
// one round: a shelf with no look-alike pair, and a list of n words from it in a random order
function deal(li){
  var lv=LEVELS[li], shelf=[];
  shuffle(D.SHELF).forEach(function(w){ if(shelf.length<lv.shelf && !shelf.some(function(x){ return clash(x,w); })) shelf.push(w); });
  return {shelf:shelf, list:shuffle(shelf).slice(0,lv.n)};
}
// 5 rounds; a word leads the list at most once per level
function plan(li){
  var out=[], first={}, guard=0;
  while(out.length<ROUNDS && guard++<500){ var r=deal(li); if(first[r.list[0]]) continue; first[r.list[0]]=1; out.push(r); }
  return out;
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],got:0,misses:0,missed:false,answered:false,listening:false,started:false};
var roundId=0, listId=0;

function startLevel(i){ roundId++; listId++; S.lvl=i; S.round=0; S.score=0; S.rounds=plan(i); render(); }

function render(){
  var r=S.rounds[S.round], my=++roundId, lv=LEVELS[S.lvl];
  var live=function(){ return my===roundId; };
  S.got=0; S.missed=false; S.answered=false; S.listening=true;
  try{ if(window.cdePreload) cdePreload(r.list); }catch(e){}
  app.textContent='';
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  h.appendChild(elh('div','hud-label',T('lv'+S.lvl)));
  var dots=el('div','dots');
  for(var i=0;i<ROUNDS;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots); app.appendChild(h);

  var top=el('div','top-row');
  var basket=el('div','basket'); basket.setAttribute('dir','ltr');
  r.list.forEach(function(w,k){ var s=el('div','slot'); s.appendChild(el('span','num',String(k+1))); basket.appendChild(s); });
  top.appendChild(basket);
  var hb=elh('button','say',IC('volume-2')); hb.id='hearBtn'; hb.type='button'; hb.setAttribute('aria-label',T('again'));
  hb.addEventListener('click',function(){ if(live()&&!S.answered) readList(); });
  top.appendChild(hb);
  app.appendChild(top);

  var shelf=el('div','shelf n'+r.shelf.length+' wait'); shelf.setAttribute('dir','ltr');
  r.shelf.forEach(function(w,i){
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',w); b.setAttribute('aria-label',T('food')+' '+(i+1));
    var im=el('img'); im.src='/images/'+w+'.webp'; im.alt=''; im.width=160; im.height=160; im.draggable=false; im.decoding='async'; b.appendChild(im);
    b.addEventListener('click',function(){ pick(w,b); });
    shelf.appendChild(b);
  });
  app.appendChild(shelf);
  var fb=elh('p','feedback',T('listen')); fb.setAttribute('role','status'); app.appendChild(fb);

  function slots(){ return basket.querySelectorAll('.slot'); }
  // read the list: one word after the other, each after the last one has ENDED (kit §8g), the slot of the word
  // being read lit; a new tap or a replay stops a list that is still being read
  function readList(){
    var me=++listId, k=0, ss=slots();
    (function step(){
      if(me!==listId||!live()) return;
      for(var j=0;j<ss.length;j++) ss[j].classList.toggle('speaking',j===k&&k<r.list.length);
      if(k>=r.list.length){
        if(S.listening){ S.listening=false; shelf.classList.remove('wait'); if(!S.got&&!S.missed) fb.innerHTML=T('yourTurn'); }
        return;
      }
      say(r.list[k]);
      setTimeout(function(){ if(me!==listId||!live()) return; sayDone(2500,function(){ if(me!==listId||!live()) return; k++; setTimeout(step, k<r.list.length?350:0); }); }, 120);
    })();
  }
  function stopList(){ listId++; var ss=slots(); for(var j=0;j<ss.length;j++) ss[j].classList.remove('speaking'); }

  function pick(w,b){
    if(S.answered||!live()||b.disabled) return;
    if(S.listening) return;   // not ready yet: not a miss
    var need=r.list[S.got];
    stopList();
    if(w===need){
      var s=slots()[S.got];
      s.textContent=''; s.classList.add('filled');
      var im=el('img'); im.src='/images/'+w+'.webp'; im.alt=''; s.appendChild(im);
      // the written word goes on the picked shelf picture (a basket slot is too narrow for watermelon)
      var lab=el('span','label',w); lab.setAttribute('lang','en'); b.appendChild(lab); fitLabel(lab);
      b.classList.remove('hint'); b.classList.add('picked'); b.disabled=true; b.setAttribute('aria-disabled','true');
      S.got++;
      say(w);
      if(S.got<r.list.length){ fb.innerHTML=T('good'); return; }
      S.answered=true;
      if(!S.missed){ S.score++; beacon('sl','n'+lv.n+'_ok'); }
      fb.innerHTML=T(S.missed?'done':'right');
      setTimeout(function(){ if(live()) sayDone(2500,function(){ if(live()) next(); }); }, 900);
      return;
    }
    // a miss: shake the picture, say the word that comes next and ring its picture; the child must still tap it
    if(!S.missed){ S.misses++; beacon('sl','n'+lv.n+'_no'); }
    S.missed=true;
    b.classList.remove('no'); void b.offsetWidth; b.classList.add('no');
    setTimeout(function(){ b.classList.remove('no'); }, 700);
    var nb=shelf.querySelector('.opt[data-word="'+need+'"]'); if(nb) nb.classList.add('hint');
    fb.innerHTML=T('notYet');
    say(need);
  }

  setTimeout(function(){ if(live()) readList(); }, 400);
}

function stars(n){
  var s=n===ROUNDS?3:n>=ROUNDS-1?2:1, box=el('div','stars'); box.setAttribute('aria-label',s+' / 3');
  for(var i=0;i<3;i++) box.appendChild(elh('span',i<s?'on':'off',IC('star')));
  return box;
}

function next(){
  roundId++; listId++;
  S.round++;
  if(S.round<ROUNDS) return render();
  beacon('g_lvl',GAME);
  app.textContent='';
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
function btn(w){ return app.querySelector('.shelf .opt[data-word="'+w+'"]'); }
/* Shrink a picked word's label until it fits its picture: font widths differ by device (Linux/Chromebook fonts
   cut "watermelon" at 320 px where macOS fit, CI 11-13), so measure instead of trusting a clamp(). */
function fitLabel(lab){
  lab.style.fontSize=''; lab.style.letterSpacing='';
  var px=parseFloat(getComputedStyle(lab).fontSize)||14, over=function(){ return lab.scrollWidth>lab.clientWidth+1; };
  while(over()&&px>8){ px-=0.5; lab.style.fontSize=px+'px'; }
  if(over()) lab.style.letterSpacing='-0.6px';            // wide fonts: tighten before going smaller still
  while(over()&&px>7){ px-=0.5; lab.style.fontSize=px+'px'; }
}
window.SL={
  S:S, LEVELS:LEVELS, D:D, ROUNDS:ROUNDS,
  dbg:{
    fitLabel:fitLabel,
    get round(){ return S.rounds[S.round]||null; },
    get need(){ var r=S.rounds[S.round]; return r?r.list[S.got]||null:null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden&&app.querySelector('.shelf'))?S.lvl+':'+S.round:''; },
    plan:plan, deal:deal, clash:clash,
    startLevel:startLevel,
    /* tap the next listed food through the real button (false while the list is still being read the first time) */
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered||S.listening) return false; var b=btn(r.list[S.got]); if(b) b.click(); return !!b; },
    /* tap a food that is not next through the real button (a real miss) */
    wrongForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered||S.listening) return false; var need=r.list[S.got]; var w=r.shelf.filter(function(x){ var b=btn(x); return x!==need&&b&&!b.disabled; })[0]; if(!w) return false; btn(w).click(); return true; }
  }
};
})();
