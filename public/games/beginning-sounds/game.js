/* Beginning Sounds (/games/beginning-sounds/, wave 2 11-08). A big letter and three pictures: "Which one starts with
   B?" Each picture has a speaker that says its whole word (no letter sounds: owner 11-07, whole words only); the words
   stay hidden until the tap, then show with the first letter marked.
   Level 1 = 11 common consonants, the two wrong pictures start with letters that sound nothing alike.
   Level 2 = all 18 letters of the pool, same rule.
   Level 3 = one wrong picture starts with the letter's sound-alike partner (b / p, d / t, f / v, m / n, g / k, s / z).
   8 rounds per level, never the same letter twice in a level. Pool and rules: words.js.
   Oracle guards (kit "no giveaway"), asserted in e2e/beginning-sounds.spec.js: exactly one picture starts with the
   letter, C and K never share a round, every picture is a photo, the words are hidden before the tap, and the
   answer's position is uniform.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start / g_lvl / g_cmp @ beginning-sounds,
   and bs @ <letter>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='beginning-sounds';
var B=window.BS_WORDS;
var LEVELS=[{id:'far'},{id:'all'},{id:'near'}];
var ROUNDS=8;

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

function say(w){ if(window.cdeSay) window.cdeSay(w, function(){ tts(w); }); else tts(w); }
function tts(w){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(w); u.lang='en-US'; u.rate=0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(1800,cb); else cb(); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

function sameSound(a,b){ return a===b||B.SAME_SOUND.some(function(p){ return p.indexOf(a)>=0&&p.indexOf(b)>=0; }); }
// letters that may sit in a round with `l` without sounding like it (not itself, its partner or its same-sound twin)
function far(l,from){ return from.filter(function(x){ return !sameSound(l,x)&&(B.PARTNER[l]||[]).indexOf(x)<0; }); }

// Round: {letter, answer, opts:[3 words]}
function plan(lv){
  var letters=B.LEVEL_LETTERS[lv];
  return shuffle(letters).slice(0,ROUNDS).map(function(l){
    var answer=pick(B.LETTERS[l]), others;
    if(lv===2){
      var p=pick(B.PARTNER[l]);
      // the far letter must not sound like the partner either (c and k never together)
      var f=pick(far(l,B.LEVEL_LETTERS[1]).filter(function(x){ return !sameSound(p,x)&&x!==p; }));
      others=[pick(B.LETTERS[p]),pick(B.LETTERS[f])];
    } else {
      var fs=shuffle(far(l,letters));
      // two far letters that don't sound like each other
      var a=fs[0], b2=fs.filter(function(x){ return !sameSound(a,x)&&(B.PARTNER[a]||[]).indexOf(x)<0; })[0];
      others=[pick(B.LETTERS[a]),pick(B.LETTERS[b2])];
    }
    return {letter:l,answer:answer,opts:shuffle([answer].concat(others))};
  });
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:0,started:false,answered:false};
var roundId=0;

function header(r){
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  var q=el('div','hud-label');
  var parts=T('ask').split('{l}');
  q.appendChild(document.createTextNode(parts[0]||''));
  var b=el('bdi','target',r.letter.toUpperCase()); b.setAttribute('lang','en'); b.setAttribute('dir','ltr'); q.appendChild(b);
  q.appendChild(document.createTextNode(parts[1]||''));
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
  var big=el('div','letter',r.letter.toUpperCase()+r.letter); big.setAttribute('lang','en'); big.setAttribute('dir','ltr'); big.setAttribute('aria-hidden','true');
  app.appendChild(big);
  var grid=el('div','grid three'); grid.setAttribute('dir','ltr');
  r.opts.forEach(function(w,i){
    var card=el('div','bs-card'); card.setAttribute('data-word',w);
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',w); b.setAttribute('aria-label',T('picture')+' '+(i+1));
    var im=el('img'); im.src='/images/'+w+'.webp'; im.alt=''; im.width=200; im.height=150; im.decoding='async'; b.appendChild(im);
    // hidden until the tap (reading the word would give the first letter away)
    var wd=el('span','word late'); wd.setAttribute('lang','en');
    wd.appendChild(el('b','first',w.charAt(0))); wd.appendChild(document.createTextNode(w.slice(1)));
    b.appendChild(wd);
    b.addEventListener('click',function(){ answer(w,b); });
    var sp=elh('button','say',IC('volume-2')); sp.type='button'; sp.setAttribute('aria-label',T('hear')+' '+(i+1));
    sp.addEventListener('click',function(e){ e.stopPropagation(); say(w); });
    card.appendChild(b); card.appendChild(sp); grid.appendChild(card);
  });
  app.appendChild(grid);
  var fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  var row=el('div','row'); app.appendChild(row);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));

  function answer(w,b){
    if(S.answered||!live()) return; S.answered=true;
    var ok=w===r.answer;
    beacon('bs',r.letter+'_'+(ok?'ok':'no'));
    grid.classList.add('shown');
    grid.querySelector('.opt[data-word="'+r.answer+'"]').classList.add('ok');
    fb.textContent='';
    fb.appendChild(elh('span','lead',T(ok?'right':'notQuite')));
    fb.appendChild(document.createTextNode(' '));
    var rev=el('bdi','reveal',r.answer); rev.setAttribute('lang','en'); rev.setAttribute('dir','ltr'); fb.appendChild(rev);
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
  try{ var best=JSON.parse(localStorage.getItem('cde_bs_best')||'{}'); var k=LEVELS[S.lvl].id; if(!(best[k]>=st)){ best[k]=st; localStorage.setItem('cde_bs_best',JSON.stringify(best)); } }catch(e){}
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

// test/debug contract (Playwright spec; no gameplay shortcuts — solveForTest taps the real picture)
window.BS={
  S:S, LEVELS:LEVELS, B:B, ROUNDS:ROUNDS,
  dbg:{
    get state(){ return S; },
    get round(){ return S.rounds[S.round]||null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden)?S.lvl+':'+S.round:''; },
    plan:plan, sameSound:sameSound,
    startLevel:function(lvl){ roundId++; startLevel(lvl); },   // phone-fit test: each level's own rounds
    redraw:function(){ roundId++; renderRound(); },
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var b=app.querySelector('.opt[data-word="'+r.answer+'"]'); if(b) b.click(); return !!b; },
    missForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var w=r.opts.filter(function(c){ return c!==r.answer; })[0]; app.querySelector('.opt[data-word="'+w+'"]').click(); return true; }
  }
};
})();
