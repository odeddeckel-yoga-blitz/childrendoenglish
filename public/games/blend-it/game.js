/* Blend It (/games/blend-it/, wave 3 11-12). A three-letter word's letters light up one at a time, left to right
   (c … a … t), then join; the child taps the picture of that word. Whole-word audio only (owner 11-07: no sound per
   letter): on levels 1–2 the whole word is spoken once the letters have joined; on level 3 nothing is spoken before
   the tap, so the child reads the letters (the word is spoken after the tap).
   Level 1 = 3 pictures; the wrong ones share no letter in the same place and have another vowel.
   Level 2 = 4 pictures; one wrong one differs by a single letter when the pool has one (cat / hat, fan / van).
   Level 3 = 4 pictures that all share the vowel (cat / bag / fan / van), no word spoken before the tap.
   6 rounds per level, no word twice in a level. Pool: words.js.
   Oracle guards (kit "no giveaway"), asserted in e2e/blend-it.spec.js: exactly one picture is the word, every picture
   is a photo, nothing on a picture names it, the answer's position is uniform, nothing is marked before the tap.
   A wrong tap marks that picture, says the word and lights the letters again; the child then taps the right one
   (only first-try rounds score). Beacons (cookieless aggregates, same guards as land-beacon.js):
   g_open / g_start / g_lvl / g_cmp @ blend-it, and bi @ <word>_<ok|no> (first tap of a round). */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='blend-it';
var POOL=window.BI_WORDS;
var LEVELS=[{id:'far',opts:3,speak:true},{id:'near',opts:4,speak:true},{id:'read',opts:4,speak:false}];
var ROUNDS=6;
var STEP=650;   // ms per letter

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
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

function same(a,b){ var n=0; for(var i=0;i<3;i++) if(a[i]===b[i]) n++; return n; }
// the words a level may put next to `w`
function decoyPool(li,w){
  var others=POOL.filter(function(x){ return x!==w; });
  if(li===0) return others.filter(function(x){ return same(x,w)===0 && x[1]!==w[1]; });
  if(li===2) return others.filter(function(x){ return x[1]===w[1]; });
  return others;
}
// level 1 asks only for the everyday words (yak, fig and cab can still stand beside them);
// level 3 deals only words whose vowel has 3 more words to stand beside it
var LESS_KNOWN=['yak','fig','cab'];
function targets(li){
  if(li===0) return POOL.filter(function(w){ return LESS_KNOWN.indexOf(w)<0; });
  return li===2 ? POOL.filter(function(w){ return decoyPool(2,w).length>=3; }) : POOL.slice();
}
function deal(li,w){
  var lv=LEVELS[li], n=lv.opts-1, ds;
  if(li===1){
    var near=shuffle(POOL.filter(function(x){ return x!==w && same(x,w)===2; }));
    ds=near.slice(0,1);
    shuffle(decoyPool(1,w)).forEach(function(x){ if(ds.length<n && ds.indexOf(x)<0) ds.push(x); });
  } else ds=shuffle(decoyPool(li,w)).slice(0,n);
  return {word:w, opts:shuffle(ds.concat(w))};
}
function plan(li){ return shuffle(targets(li)).slice(0,ROUNDS).map(function(w){ return deal(li,w); }); }

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:0,missed:false,answered:false,started:false,sweeping:false};
var roundId=0, sweepId=0;

function startLevel(i){ roundId++; S.lvl=i; S.round=0; S.score=0; S.rounds=plan(i); try{ if(window.cdePreload) cdePreload(S.rounds.map(function(r){ return r.word; })); }catch(e){} render(); }

function render(){
  var r=S.rounds[S.round], my=++roundId, lv=LEVELS[S.lvl];
  var live=function(){ return my===roundId; };
  S.missed=false; S.answered=false;
  app.textContent='';
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  h.appendChild(el('div','hud-label',T('lv'+S.lvl)));
  var dots=el('div','dots');
  for(var i=0;i<ROUNDS;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots); app.appendChild(h);

  var row=el('div','blend-row');
  var tiles=el('div','tiles'); tiles.setAttribute('lang','en'); tiles.setAttribute('dir','ltr');
  r.word.split('').forEach(function(c){ tiles.appendChild(el('span','tile',c)); });
  row.appendChild(tiles);
  var sb=elh('button','say',IC(lv.speak?'volume-2':'refresh-cw')); sb.id='sayBtn'; sb.type='button'; sb.setAttribute('aria-label',T(lv.speak?'again':'againLook'));
  sb.addEventListener('click',function(){ if(live()) sweep(STEP,lv.speak&&!S.answered); });
  row.appendChild(sb); app.appendChild(row);

  var grid=el('div','grid n'+r.opts.length); grid.setAttribute('dir','ltr');
  r.opts.forEach(function(w,i){
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',w); b.setAttribute('aria-label',T('picture')+' '+(i+1));
    var im=el('img'); im.src='/images/'+w+'.webp'; im.alt=''; im.width=200; im.height=200; im.draggable=false; im.decoding='async'; b.appendChild(im);
    var lab=el('span','label late',w); lab.setAttribute('lang','en'); b.appendChild(lab);   // shown after the right tap
    b.addEventListener('click',function(){ answer(w,b); });
    grid.appendChild(b);
  });
  app.appendChild(grid);
  var fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));

  // light the letters one at a time, then join them; speak = say the whole word once they have joined
  function sweep(step,speak){
    var me=++sweepId, ts=tiles.children, k=0;
    S.sweeping=true;
    tiles.classList.remove('joined');
    for(var j=0;j<ts.length;j++) ts[j].classList.remove('lit');
    (function lightNext(){
      if(me!==sweepId||!live()) return;
      if(k<ts.length){ ts[k].classList.add('lit'); k++; setTimeout(lightNext,step); return; }
      tiles.classList.add('joined'); S.sweeping=false;
      if(speak) say(r.word);
    })();
  }

  function answer(w,b){
    if(S.answered||b.disabled||!live()) return;
    var first=!S.missed;
    if(w===r.word){
      S.answered=true; sweepId++; S.sweeping=false;
      if(first) S.score++;
      if(first) beacon('bi',r.word+'_ok');
      b.classList.add('ok'); grid.classList.add('shown');
      tiles.classList.add('joined');
      for(var j=0;j<tiles.children.length;j++) tiles.children[j].classList.add('lit');
      fb.innerHTML=T('right');
      say(r.word);
      setTimeout(function(){ if(live()) sayDone(function(){ if(live()) next(); }); }, 1100);
      return;
    }
    // a miss: mark it, say the word, light the letters again quickly; the child still has to find the right picture
    if(first){ beacon('bi',r.word+'_no'); S.misses++; }
    S.missed=true;
    b.classList.add('no'); b.disabled=true; b.setAttribute('aria-disabled','true');
    fb.innerHTML=T('notThat');
    say(r.word);
    sweep(220,false);
  }

  setTimeout(function(){ if(live()) sweep(STEP,lv.speak); }, 450);
}

function stars(n){
  var s=n===ROUNDS?3:n>=ROUNDS-2?2:1, box=el('div','stars'); box.setAttribute('aria-label',s+' / 3');
  for(var i=0;i<3;i++) box.appendChild(elh('span',i<s?'on':'off',IC('star')));
  return box;
}

function next(){
  roundId++; sweepId++;
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
function btn(w){ return app.querySelector('.opt[data-word="'+w+'"]'); }
window.BI={
  S:S, LEVELS:LEVELS, POOL:POOL, ROUNDS:ROUNDS,
  dbg:{
    get round(){ return S.rounds[S.round]||null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden&&app.querySelector('.opt'))?S.lvl+':'+S.round+':'+r.word:''; },
    plan:plan, deal:deal, decoyPool:decoyPool, targets:targets, same:same,
    startLevel:startLevel,
    /* tap the right picture through the real button */
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var b=btn(r.word); if(b) b.click(); return !!b; },
    /* tap one wrong picture through the real button (a real miss) */
    wrongForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var w=r.opts.filter(function(x){ var b=btn(x); return x!==r.word&&b&&!b.disabled; })[0]; if(!w) return false; btn(w).click(); return true; }
  }
};
})();
