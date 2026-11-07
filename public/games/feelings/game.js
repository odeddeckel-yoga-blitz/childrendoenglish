/* Feelings (/games/feelings/, wave 2 11-08). Thirteen feeling words, each a Microsoft Fluent 3D face (MIT; data.js).
   Level 1 = "Which face is happy?": the word is said, tap its face from three.
   Level 2 = one face, pick its word from three (each word has a speaker).
   Level 3 = a situation ("I got a new puppy!", said by Piper): pick how they feel from three faces. A feeling that could
   fairly fit the same situation (data.js `also`) is never offered next to it.
   8 rounds per level, never the same feeling twice in a level.
   Oracle guards (kit "no giveaway"), asserted in e2e/feelings.spec.js: every face is the same 3D style on the same
   background, the answer's position is uniform, and level 3 never offers an `also` feeling.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start / g_lvl / g_cmp @ feelings, and
   fe @ <word>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='feelings';
var D=window.FEEL_DATA;
var LEVELS=[{id:'face'},{id:'word'},{id:'story'}];
var ROUNDS=8, OPTS=3;
var IMG=function(w){ return '/games/feelings/img/'+w+'.webp'; };
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function situation(w){ for(var i=0;i<D.SITUATIONS.length;i++) if(D.SITUATIONS[i].feel===w) return D.SITUATIONS[i]; return null; }

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

// a word: /audio/<word>.mp3; a situation sentence: its own clip
function say(text,src){ if(window.cdeSay) window.cdeSay(text, function(){ tts(text); }, src); else tts(text); }
function sayWord(w){ say(w); }
function saySit(s){ say(s.text,'/games/feelings/audio/'+slug(s.text)+'.mp3'); }
function tts(t){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(3000,cb); else cb(); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words, sentences or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

// Round: {answer, opts:[words]} (+ sit for level 3)
function plan(lv){
  return shuffle(D.WORDS).slice(0,ROUNDS).map(function(w){
    var sit=lv===2?situation(w):null;
    var pool=D.WORDS.filter(function(x){ return x!==w&&!(sit&&sit.also.indexOf(x)>=0); });
    var r={answer:w,opts:shuffle([w].concat(shuffle(pool).slice(0,OPTS-1)))};
    if(sit) r.sit=sit;
    return r;
  });
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:0,started:false,answered:false};
var roundId=0;

function header(r){
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  var q=el('div','hud-label');
  if(S.lvl===0){
    var parts=T('askFace').split('{w}');
    q.appendChild(document.createTextNode(parts[0]||''));
    var b=el('bdi','target',r.answer); b.setAttribute('lang','en'); b.setAttribute('dir','ltr'); q.appendChild(b);
    q.appendChild(document.createTextNode(parts[1]||''));
    var sp=elh('button','say inline',IC('volume-2')); sp.type='button'; sp.id='sayWord'; sp.setAttribute('aria-label',T('hear')+': '+r.answer);
    sp.addEventListener('click',function(){ sayWord(r.answer); });
    q.appendChild(sp);
  } else q.appendChild(document.createTextNode(T(S.lvl===1?'askWord':'askStory')));
  h.appendChild(q);
  var dots=el('div','dots');
  for(var i=0;i<ROUNDS;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots);
  return h;
}

function startLevel(i){ S.lvl=i; S.round=0; S.score=0; S.rounds=plan(i); renderRound(); }

function renderRound(){
  var r=S.rounds[S.round], my=++roundId;
  var live=function(){ return my===roundId; };
  S.answered=false;
  app.textContent='';
  app.appendChild(header(r));
  var grid;
  if(S.lvl===2){
    var line=el('div','sentence'); line.setAttribute('dir','ltr');
    var tx=el('span','stext',r.sit.text); tx.setAttribute('lang','en'); line.appendChild(tx);
    var ss=elh('button','say',IC('volume-2')); ss.type='button'; ss.id='saySit'; ss.setAttribute('aria-label',T('hearSit'));
    ss.addEventListener('click',function(){ saySit(r.sit); });
    line.appendChild(ss); app.appendChild(line);
  }
  if(S.lvl===1){
    var pic=el('div','solo'); var im=el('img'); im.src=IMG(r.answer); im.alt=''; im.width=320; im.height=320; im.decoding='async'; pic.appendChild(im);
    app.appendChild(pic);
    grid=el('div','grid words'); grid.setAttribute('dir','ltr');
    r.opts.forEach(function(w){
      var card=el('div','fe-card'); card.setAttribute('data-word',w);
      var b=el('button','opt wordopt'); b.type='button'; b.setAttribute('data-word',w);
      var wd=el('span','word',w); wd.setAttribute('lang','en'); b.appendChild(wd);
      b.addEventListener('click',function(){ answer(w,b); });
      var sp=elh('button','say',IC('volume-2')); sp.type='button'; sp.setAttribute('aria-label',T('hear')+': '+w);
      sp.addEventListener('click',function(e){ e.stopPropagation(); sayWord(w); });
      card.appendChild(b); card.appendChild(sp); grid.appendChild(card);
    });
  } else {
    grid=el('div','grid three'); grid.setAttribute('dir','ltr');
    r.opts.forEach(function(w,i){
      var card=el('div','fe-card'); card.setAttribute('data-word',w);
      var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',w);
      b.setAttribute('aria-label',S.lvl===0?T('face')+' '+(i+1):w);
      var im=el('img'); im.src=IMG(w); im.alt=''; im.width=320; im.height=320; im.decoding='async'; b.appendChild(im);
      // level 1 hides the words (they would give the answer away); level 3 shows them
      var wd=el('span','word'+(S.lvl===0?' late':''),w); wd.setAttribute('lang','en'); b.appendChild(wd);
      b.addEventListener('click',function(){ answer(w,b); });
      card.appendChild(b); grid.appendChild(card);
    });
  }
  app.appendChild(grid);
  var fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  var row=el('div','row'); app.appendChild(row);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));
  if(S.lvl===0) sayWord(r.answer); else if(S.lvl===2) saySit(r.sit);

  function answer(w,b){
    if(S.answered||!live()) return; S.answered=true;
    var ok=w===r.answer;
    beacon('fe',r.answer+'_'+(ok?'ok':'no'));
    grid.classList.add('shown');
    grid.querySelector('.opt[data-word="'+r.answer+'"]').classList.add('ok');
    fb.textContent='';
    fb.appendChild(elh('span','lead',T(ok?'right':'notQuite')));
    fb.appendChild(document.createTextNode(' '));
    var rev=el('bdi','reveal',r.answer); rev.setAttribute('lang','en'); rev.setAttribute('dir','ltr'); fb.appendChild(rev);
    sayWord(r.answer);
    if(ok){
      S.score++;
      setTimeout(function(){ if(live()) sayDone(function(){ if(live()) next(); }); }, 1400);
    } else {
      S.misses++;
      b.classList.add('no');
      var nx=elh('button','next',T('next')); nx.type='button'; nx.id='nextBtn';
      nx.addEventListener('click',function(){ nx.disabled=true; sayDone(function(){ if(live()) next(); }); });
      row.appendChild(nx);
    }
  }
}

function stars(n){
  var s=el('div','stars'); s.setAttribute('aria-label',n+' / 3');
  for(var i=0;i<3;i++) s.appendChild(elh('span',i<n?'st on':'st',IC('star')));
  return s;
}

function next(){
  roundId++;
  S.round++;
  if(S.round<ROUNDS) return renderRound();
  beacon('g_lvl',GAME);
  var st=S.score===ROUNDS?3:S.score>=6?2:1;
  try{ var best=JSON.parse(localStorage.getItem('cde_fe_best')||'{}'); var k=LEVELS[S.lvl].id; if(!(best[k]>=st)){ best[k]=st; localStorage.setItem('cde_fe_best',JSON.stringify(best)); } }catch(e){}
  app.textContent='';
  if(S.lvl===LEVELS.length-1){ beacon('g_cmp',GAME); return renderEnd(); }
  var box=el('div','card');
  box.appendChild(stars(st));
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
  if(window.CDE_END) CDE_END({game:GAME,again:again,good:S.misses<=6});
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

document.getElementById('startBtn').addEventListener('click',function(){
  if(!S.started){ S.started=true; beacon('g_start',GAME); }
  document.getElementById('menu').hidden=true;
  startLevel(0);
});

// test/debug contract (Playwright spec; no gameplay shortcuts — solveForTest taps the real option)
window.FE={
  S:S, LEVELS:LEVELS, D:D, ROUNDS:ROUNDS,
  dbg:{
    get state(){ return S; },
    get round(){ return S.rounds[S.round]||null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden)?S.lvl+':'+S.round:''; },
    plan:plan, slug:slug,
    startLevel:function(lvl){ roundId++; startLevel(lvl); },   // phone-fit test: each level's own layout
    redraw:function(){ roundId++; renderRound(); },
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var b=app.querySelector('.opt[data-word="'+r.answer+'"]'); if(b) b.click(); return !!b; },
    missForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var w=r.opts.filter(function(c){ return c!==r.answer; })[0]; app.querySelector('.opt[data-word="'+w+'"]').click(); return true; }
  }
};
})();
