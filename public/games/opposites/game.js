/* Opposites (/games/opposites/, wave 2 11-07). Nine adjective pairs, each drawn as two Microsoft Fluent 3D icons (MIT;
   owner pick 11-07: one icon style for every round). The small side of big/small and tall/short is drawn shrunk on the
   shared background so the size shows (public/games/opposites/img/, made with scripts/fluent-image.mjs).
   Level 1 = "Which one is hot?": the pair's two pictures, tap the one the word names (the word is said).
   Level 2 = one picture, pick its word from the word and its opposite.
   Level 3 = "What is the opposite of hot?": three pictures, the opposite and two words from other pairs.
   8 rounds per level, never the same pair twice in a level.
   Oracle guards (kit "no giveaway"), all asserted in e2e/opposites.spec.js:
   · every picture is the same Fluent 3D style on the same background, so style never points at the answer;
   · the answer's position is uniform (shuffled), and both sides of a pair are asked equally often;
   · in level 3 a distractor is never the asked word itself nor its own pair's partner of another distractor.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start / g_lvl / g_cmp @ opposites,
   and op @ <word>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='opposites';

// [a, b]: picture /games/opposites/img/<word>.webp (Fluent name in the comment), audio /audio/<word>.mp3
var PAIRS=[
  ['hot','cold'],      // Hot face / Cold face
  ['full','empty'],    // Battery / Low battery
  ['loud','quiet'],    // Speaker high volume / Muted speaker
  ['heavy','light'],   // Rock / Feather
  ['hard','soft'],     // Brick / Teddy bear
  ['wet','dry'],       // Umbrella with rain drops / Closed umbrella
  ['big','small'],     // Elephant / Mouse (shrunk)
  ['tall','short'],    // Evergreen tree / Seedling (shrunk)
  ['happy','sad']      // Slightly smiling face / Slightly frowning face
];
var LEVELS=[{id:'which'},{id:'word'},{id:'opposite'}];
var ROUNDS=8;
var IMG=function(w){ return '/games/opposites/img/'+w+'.webp'; };
function partner(w){ for(var i=0;i<PAIRS.length;i++){ if(PAIRS[i][0]===w) return PAIRS[i][1]; if(PAIRS[i][1]===w) return PAIRS[i][0]; } return null; }
function pairOf(w){ for(var i=0;i<PAIRS.length;i++) if(PAIRS[i].indexOf(w)>=0) return i; return -1; }

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

function say(word){ if(window.cdeSay) window.cdeSay(word, function(){ tts(word); }); else tts(word); }
function tts(word){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(word); u.lang='en-US'; u.rate=0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(1800,cb); else cb(); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

// A level's rounds: 8 different pairs, each asked from a random side.
// Round: {word (asked / shown), answer (the word to tap), opts:[words], pair:index}
function plan(lv){
  var pairs=shuffle(PAIRS.map(function(p,i){ return i; })).slice(0,ROUNDS);
  return pairs.map(function(pi){
    var p=PAIRS[pi], side=Math.random()<0.5?0:1, w=p[side], o=p[1-side];
    if(lv===0) return {pair:pi,word:w,answer:w,opts:shuffle([w,o])};
    if(lv===1) return {pair:pi,word:w,answer:w,opts:shuffle([w,o])};
    // level 3: the opposite + one word from each of two other pairs (never both sides of one pair)
    var others=shuffle(PAIRS.map(function(q,i){ return i; }).filter(function(i){ return i!==pi; })).slice(0,2)
      .map(function(i){ return PAIRS[i][Math.random()<0.5?0:1]; });
    return {pair:pi,word:w,answer:o,opts:shuffle([o].concat(others))};
  });
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:0,started:false,answered:false};
var roundId=0;

function header(r){
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  var q=el('div','hud-label');
  var ask=S.lvl===0?'askWhich':S.lvl===1?'askWord':'askOpp';
  // the asked word stays English inside the interface sentence
  var parts=T(ask).split('{w}');
  q.appendChild(document.createTextNode(parts[0]||''));
  if(S.lvl!==1){
    var b=el('bdi','target',r.word); b.setAttribute('lang','en'); b.setAttribute('dir','ltr'); q.appendChild(b);
    q.appendChild(document.createTextNode(parts[1]||''));
    var sp=elh('button','say inline',IC('volume-2')); sp.type='button'; sp.id='sayWord'; sp.setAttribute('aria-label',T('hear')+': '+r.word);
    sp.addEventListener('click',function(){ say(r.word); });
    q.appendChild(sp);
  }
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
  var grid, fb, row;
  if(S.lvl===1){
    var pic=el('div','solo'); var im=el('img'); im.src=IMG(r.word); im.alt=''; im.width=320; im.height=320; im.decoding='async'; pic.appendChild(im);
    app.appendChild(pic);
    grid=el('div','grid words'); grid.setAttribute('dir','ltr');
    r.opts.forEach(function(w){
      var card=el('div','op-card'); card.setAttribute('data-word',w);
      var b=el('button','opt wordopt'); b.type='button'; b.setAttribute('data-word',w);
      var wd=el('span','word',w); wd.setAttribute('lang','en'); b.appendChild(wd);
      b.addEventListener('click',function(){ answer(w,b); });
      var sp=elh('button','say',IC('volume-2')); sp.type='button'; sp.setAttribute('aria-label',T('hear')+': '+w);
      sp.addEventListener('click',function(e){ e.stopPropagation(); say(w); });
      card.appendChild(b); card.appendChild(sp); grid.appendChild(card);
    });
  } else {
    if(S.lvl===2){
      var mini=el('div','mini'); var mi=el('img'); mi.src=IMG(r.word); mi.alt=''; mi.width=96; mi.height=96; mi.decoding='async'; mini.appendChild(mi);
      app.appendChild(mini);
    }
    grid=el('div','grid'+(r.opts.length===3?' three':'')); grid.setAttribute('dir','ltr');
    r.opts.forEach(function(w){
      var card=el('div','op-card'); card.setAttribute('data-word',w);
      var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',w);
      b.setAttribute('aria-label',S.lvl===0?T('picture')+' '+(r.opts.indexOf(w)+1):w);
      var im=el('img'); im.src=IMG(w); im.alt=''; im.width=320; im.height=320; im.decoding='async'; b.appendChild(im);
      // level 1 hides the words (naming the pictures would give the answer away); level 3 shows them
      var wd=el('span','word'+(S.lvl===0?' late':''),w); wd.setAttribute('lang','en'); b.appendChild(wd);
      b.addEventListener('click',function(){ answer(w,b); });
      card.appendChild(b); grid.appendChild(card);
    });
  }
  app.appendChild(grid);
  fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  row=el('div','row'); app.appendChild(row);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));
  if(S.lvl!==1) say(r.word);

  function answer(w,b){
    if(S.answered||!live()) return; S.answered=true;
    var ok=w===r.answer;
    beacon('op',r.answer+'_'+(ok?'ok':'no'));
    grid.classList.add('shown');
    var good=grid.querySelector('.opt[data-word="'+r.answer+'"]'); good.classList.add('ok');
    var p=PAIRS[r.pair];
    fb.textContent='';
    fb.appendChild(elh('span','lead',T(ok?'right':'notQuite')));
    fb.appendChild(document.createTextNode(' '));
    var rev=el('bdi','reveal',p[0]+' ↔ '+p[1]); rev.setAttribute('lang','en'); rev.setAttribute('dir','ltr'); fb.appendChild(rev);
    say(r.answer);
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
  try{ var best=JSON.parse(localStorage.getItem('cde_op_best')||'{}'); var k=LEVELS[S.lvl].id; if(!(best[k]>=st)){ best[k]=st; localStorage.setItem('cde_op_best',JSON.stringify(best)); } }catch(e){}
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
window.OPP={
  S:S, LEVELS:LEVELS, PAIRS:PAIRS, ROUNDS:ROUNDS,
  dbg:{
    get state(){ return S; },
    get round(){ return S.rounds[S.round]||null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden)?S.lvl+':'+S.round:''; },
    partner:partner, pairOf:pairOf,
    plan:function(lvl){ return plan(lvl); },
    startLevel:function(lvl){ roundId++; startLevel(lvl); },   // phone-fit test: each level's own layout
    redraw:function(){ roundId++; renderRound(); },
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var b=app.querySelector('.opt[data-word="'+r.answer+'"]'); if(b) b.click(); return !!b; },
    missForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var w=r.opts.filter(function(c){ return c!==r.answer; })[0]; app.querySelector('.opt[data-word="'+w+'"]').click(); return true; }
  }
};
})();
