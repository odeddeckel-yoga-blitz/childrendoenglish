/* True or False (/games/true-or-false/, wave 2 11-07). One picture and one English sentence about it; the child taps
   True or False. The sentence is said (Piper clip, /games/true-or-false/audio/<slug>.mp3, made by
   scripts/true-or-false-audio.py and whisper-checked) and stays on screen.
   Level 1 = "This is a cat." — a false sentence names a word from another group (a cat is never called a dog here).
   Level 2 = "A cat is an animal." — animal / fruit / vegetable / vehicle / toy; a false one names another kind.
   Level 3 = "This is a fox." — a false one names another word from the SAME group, never a look-alike (words.js SIMILAR).
   8 rounds per level: exactly 4 true and 4 false, shuffled, no picture twice in a level.
   After the tap the true sentence is shown and said, so a false round still teaches the right name.
   Oracle guards (kit "no giveaway"), all asserted in e2e/true-or-false.spec.js: the 4/4 split, a false sentence is
   always really false (another word, another group / kind, never a look-alike), the buttons never change before the
   answer, and the sentence length doesn't tell (true and false sentences use the same template).
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start / g_lvl / g_cmp @ true-or-false,
   and tf @ <level id>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='true-or-false';
var W=window.TF_WORDS;
var LEVELS=[{id:'is'},{id:'kind'},{id:'near'}];
var ROUNDS=8;

function article(w){ return /^[aeiou]/.test(w)&&!/^uni/.test(w)?'an':'a'; }
function name(w){ return w.replace(/-/g,' '); }
function isSentence(w){ return 'This is '+article(w)+' '+name(w)+'.'; }
function kindSentence(w,k){ var a=article(w); return a.charAt(0).toUpperCase()+a.slice(1)+' '+name(w)+' is '+article(k)+' '+k+'.'; }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function clip(s){ return '/games/true-or-false/audio/'+slug(s)+'.mp3'; }
function groupOf(w){ for(var g in W.GROUPS) if(W.GROUPS[g].indexOf(w)>=0) return g; return null; }
function similar(a,b){ return W.SIMILAR.some(function(s){ return s.indexOf(a)>=0&&s.indexOf(b)>=0; }); }

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

function say(s){ if(window.cdeSay) window.cdeSay(s, function(){ tts(s); }, clip(s)); else tts(s); }
function tts(s){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(s); u.lang='en-US'; u.rate=0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(3000,cb); else cb(); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words or sentences
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

// Round: {word (the picture), truth, sentence (shown + said), right (the true sentence), said (word or kind named)}
function makeRound(lv,w,truth){
  var g=groupOf(w);
  if(lv===1){
    var k=truth?g:pick(W.KINDS.filter(function(x){ return x!==g; }));
    return {word:w,truth:truth,said:k,sentence:kindSentence(w,k),right:kindSentence(w,g)};
  }
  var other=w;
  if(!truth){
    // never a look-alike, in either level (a globe is never called a clock, though they're in different groups)
    var cands=(lv===0
      ? Object.keys(W.GROUPS).filter(function(x){ return x!==g; }).reduce(function(a,x){ return a.concat(W.GROUPS[x]); },[])
      : W.GROUPS[g].filter(function(x){ return x!==w; })).filter(function(x){ return !similar(w,x); });
    other=pick(cands);
  }
  return {word:w,truth:truth,said:other,sentence:isSentence(other),right:isSentence(w)};
}
function plan(lv){
  var pool=lv===1
    ? W.KINDS.reduce(function(a,k){ return a.concat(W.GROUPS[k]); },[])
    : Object.keys(W.GROUPS).reduce(function(a,g){ return a.concat(W.GROUPS[g]); },[]);
  // level 3 needs a same-group word that isn't a look-alike
  if(lv===2) pool=pool.filter(function(w){ return W.GROUPS[groupOf(w)].some(function(x){ return x!==w&&!similar(w,x); }); });
  var words=shuffle(pool).slice(0,ROUNDS), truths=shuffle([true,true,true,true,false,false,false,false]);
  return words.map(function(w,i){ return makeRound(lv,w,truths[i]); });
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:0,started:false,answered:false};
var roundId=0;

function header(){
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  h.appendChild(el('div','hud-label',T('ask')));
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
  app.appendChild(header());
  var pic=el('div','pic'); var im=el('img'); im.src='/images/'+r.word+'.webp'; im.alt=''; im.width=320; im.height=240; im.decoding='async';
  pic.appendChild(im); app.appendChild(pic);
  var line=el('div','sentence'); line.setAttribute('dir','ltr');
  var tx=el('span','stext',r.sentence); tx.setAttribute('lang','en'); line.appendChild(tx);
  var sp=elh('button','say',IC('volume-2')); sp.type='button'; sp.id='sayBtn'; sp.setAttribute('aria-label',T('hear'));
  sp.addEventListener('click',function(){ say(r.sentence); });
  line.appendChild(sp); app.appendChild(line);
  var btns=el('div','tf');
  var bt=elh('button','opt true',IC('check')+' '+T('true')); bt.type='button'; bt.setAttribute('data-ans','true');
  var bf=elh('button','opt false',IC('x')+' '+T('false')); bf.type='button'; bf.setAttribute('data-ans','false');
  bt.addEventListener('click',function(){ answer(true,bt); }); bf.addEventListener('click',function(){ answer(false,bf); });
  btns.appendChild(bt); btns.appendChild(bf); app.appendChild(btns);
  var fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  var row=el('div','row'); app.appendChild(row);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));
  say(r.sentence);

  function answer(a,b){
    if(S.answered||!live()) return; S.answered=true;
    var ok=a===r.truth;
    beacon('tf',LEVELS[S.lvl].id+'_'+(ok?'ok':'no'));
    (r.truth?bt:bf).classList.add('ok');
    fb.textContent='';
    fb.appendChild(elh('span','lead',T(ok?'right':'notQuite')));
    if(!r.truth){
      fb.appendChild(document.createTextNode(' '));
      var rev=el('bdi','reveal',r.right); rev.setAttribute('lang','en'); rev.setAttribute('dir','ltr'); fb.appendChild(rev);
      line.classList.add('struck');
    }
    say(r.right);
    if(ok){
      S.score++;
      setTimeout(function(){ if(live()) sayDone(function(){ if(live()) next(); }); }, 1600);
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
  try{ var best=JSON.parse(localStorage.getItem('cde_tf_best')||'{}'); var k=LEVELS[S.lvl].id; if(!(best[k]>=st)){ best[k]=st; localStorage.setItem('cde_tf_best',JSON.stringify(best)); } }catch(e){}
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

// test/debug contract (Playwright spec; no gameplay shortcuts — solveForTest taps the real button)
window.TF={
  S:S, LEVELS:LEVELS, W:W, ROUNDS:ROUNDS,
  dbg:{
    get state(){ return S; },
    get round(){ return S.rounds[S.round]||null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden)?S.lvl+':'+S.round:''; },
    startLevel:function(lvl){ roundId++; startLevel(lvl); },   // phone-fit test: each level's own sentences
    redraw:function(){ roundId++; renderRound(); },
    plan:plan, groupOf:groupOf, similar:similar, clip:clip, isSentence:isSentence, kindSentence:kindSentence,
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; app.querySelector('.tf .opt.'+(r.truth?'true':'false')).click(); return true; },
    missForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; app.querySelector('.tf .opt.'+(r.truth?'false':'true')).click(); return true; }
  }
};
})();
