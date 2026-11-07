/* Sentence Builder (/games/sentence-builder/, wave 2 11-08). A picture and shuffled word tiles: tap them in order to
   build the true sentence about the picture. Sentences and their Piper clips are True or False's
   (../true-or-false/words.js, /games/true-or-false/audio/<slug>.mp3), only the true ones.
   Level 1 = "This is a cat." (4 tiles, the sentence is said first).
   Level 2 = "A cat is an animal." (5 tiles, said first).
   Level 3 = the level-2 sentences, not said until built, plus one extra article tile (a / an) that doesn't belong —
   it practises a / an ("an apple", "a vehicle").
   6 rounds per level, no picture twice in a level. A placed tile goes back with a tap. When every slot is full the
   sentence is checked word by word (two "a" tiles are interchangeable); a wrong order shows the right one.
   Oracle guards (kit "no giveaway"), asserted in e2e/sentence-builder.spec.js: tiles are all lowercase with no full
   stop (the capital and the period would mark the first and last word), the dealt order is never already right,
   and the first word's tile position is uniform.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start / g_lvl / g_cmp @ sentence-builder,
   and sb @ <level id>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='sentence-builder';
var W=window.TF_WORDS;
var LEVELS=[{id:'is'},{id:'kind'},{id:'article'}];
var ROUNDS=6;

function article(w){ return /^[aeiou]/.test(w)&&!/^uni/.test(w)?'an':'a'; }
function name(w){ return w.replace(/-/g,' '); }
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function groupOf(w){ for(var g in W.GROUPS) if(W.GROUPS[g].indexOf(w)>=0) return g; return null; }
// a sentence as its words, lowercase, no full stop: ['this','is','a','cat'] ("board game" stays one tile)
function words(w,lv){
  if(lv===0) return ['this','is',article(w),name(w)];
  var k=groupOf(w); return [article(w),name(w),'is',article(k),k];
}
function sentence(ws){ return cap(ws.join(' '))+'.'; }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function clip(s){ return '/games/true-or-false/audio/'+slug(s)+'.mp3'; }

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
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words, sentences or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

// Round: {word (picture), answer:[words], tiles:[words, shuffled, maybe + extra], extra, text}
function plan(lv){
  var pool=lv===0
    ? Object.keys(W.GROUPS).reduce(function(a,g){ return a.concat(W.GROUPS[g]); },[])
    : W.KINDS.reduce(function(a,k){ return a.concat(W.GROUPS[k]); },[]);
  return shuffle(pool).slice(0,ROUNDS).map(function(w){
    var ans=words(w,lv), extra=null, tiles=ans.slice();
    if(lv===2){ extra=article(w)==='a'?'an':'a'; tiles.push(extra); }
    // never dealt already in order (the first slots would read as the answer)
    do{ tiles=shuffle(tiles); }while(tiles.slice(0,ans.length).join(' ')===ans.join(' '));
    return {word:w,answer:ans,tiles:tiles,extra:extra,text:sentence(ans)};
  });
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:0,started:false,answered:false,placed:[]};
var roundId=0;

function header(){
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  h.appendChild(el('div','hud-label',T(S.lvl===2?'askExtra':'ask')));
  var dots=el('div','dots');
  for(var i=0;i<ROUNDS;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots);
  return h;
}

function startLevel(i){ S.lvl=i; S.round=0; S.score=0; S.rounds=plan(i); renderRound(); }

function renderRound(){
  var r=S.rounds[S.round], my=++roundId;
  var live=function(){ return my===roundId; };
  S.answered=false; S.placed=[];
  app.textContent='';
  app.appendChild(header());
  var pic=el('div','pic'); var im=el('img'); im.src='/images/'+r.word+'.webp'; im.alt=''; im.width=320; im.height=240; im.decoding='async';
  pic.appendChild(im);
  var sp=elh('button','say',IC('volume-2')); sp.type='button'; sp.id='sayBtn'; sp.setAttribute('aria-label',T('hear'));
  sp.hidden=S.lvl===2;
  sp.addEventListener('click',function(){ say(r.text); });
  pic.appendChild(sp);
  app.appendChild(pic);
  var line=el('div','slots'); line.setAttribute('dir','ltr'); line.setAttribute('lang','en');
  var slots=r.answer.map(function(){ var s=el('span','slot'); line.appendChild(s); return s; });
  app.appendChild(line);
  var bank=el('div','bank'); bank.setAttribute('dir','ltr'); bank.setAttribute('lang','en');
  var tiles=r.tiles.map(function(w,i){
    var t=el('button','tile',w); t.type='button'; t.setAttribute('data-i',String(i)); t.setAttribute('data-word',w);
    t.addEventListener('click',function(){ tap(i); });
    bank.appendChild(t); return t;
  });
  app.appendChild(bank);
  var fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  var row=el('div','row'); app.appendChild(row);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));
  if(S.lvl<2) say(r.text);

  function draw(){
    slots.forEach(function(s,k){
      s.textContent=''; s.className='slot';
      var i=S.placed[k];
      if(i!=null){
        var b=el('button','placed',r.tiles[i]); b.type='button'; b.setAttribute('data-i',String(i));
        b.addEventListener('click',function(){ tap(i); });
        s.appendChild(b); s.classList.add('full');
      }
    });
    tiles.forEach(function(t,i){ t.classList.toggle('used',S.placed.indexOf(i)>=0); t.disabled=S.placed.indexOf(i)>=0||S.answered; });
  }
  function tap(i){
    if(S.answered||!live()) return;
    var at=S.placed.indexOf(i);
    if(at>=0) S.placed.splice(at,1); else if(S.placed.length<r.answer.length) S.placed.push(i);
    draw();
    if(S.placed.length===r.answer.length) check();
  }
  function check(){
    S.answered=true;
    var built=S.placed.map(function(i){ return r.tiles[i]; }), ok=built.join(' ')===r.answer.join(' ');
    beacon('sb',LEVELS[S.lvl].id+'_'+(ok?'ok':'no'));
    draw();
    line.classList.add(ok?'ok':'no');
    fb.textContent='';
    fb.appendChild(elh('span','lead',T(ok?'right':'notQuite')));
    fb.appendChild(document.createTextNode(' '));
    var rev=el('bdi','reveal',r.text); rev.setAttribute('lang','en'); rev.setAttribute('dir','ltr'); fb.appendChild(rev);
    sp.hidden=false;
    say(r.text);
    if(ok){
      S.score++;
      setTimeout(function(){ if(live()) sayDone(function(){ if(live()) next(); }); }, 1600);
    } else {
      S.misses++;
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
  var st=S.score===ROUNDS?3:S.score>=4?2:1;
  try{ var best=JSON.parse(localStorage.getItem('cde_sb_best')||'{}'); var k=LEVELS[S.lvl].id; if(!(best[k]>=st)){ best[k]=st; localStorage.setItem('cde_sb_best',JSON.stringify(best)); } }catch(e){}
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
  if(window.CDE_END) CDE_END({game:GAME,again:again,good:S.misses<=4});
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

document.getElementById('startBtn').addEventListener('click',function(){
  if(!S.started){ S.started=true; beacon('g_start',GAME); }
  document.getElementById('menu').hidden=true;
  startLevel(0);
});

// test/debug contract (Playwright spec; no gameplay shortcuts — the helpers tap the real tiles)
function tileFor(w,used){ var b=app.querySelectorAll('.bank .tile'); for(var i=0;i<b.length;i++){ var k=+b[i].getAttribute('data-i'); if(b[i].getAttribute('data-word')===w&&used.indexOf(k)<0) return b[i]; } return null; }
window.SB={
  S:S, LEVELS:LEVELS, W:W, ROUNDS:ROUNDS,
  dbg:{
    get state(){ return S; },
    get round(){ return S.rounds[S.round]||null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden)?S.lvl+':'+S.round:''; },
    plan:plan, words:words, sentence:sentence, clip:clip,
    startLevel:function(lvl){ roundId++; startLevel(lvl); },   // phone-fit test: each level's own layout
    redraw:function(){ roundId++; renderRound(); },
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var used=[];
      r.answer.forEach(function(w){ var t=tileFor(w,used); used.push(+t.getAttribute('data-i')); t.click(); }); return true; },
    missForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var used=[], order=r.answer.slice().reverse();
      if(order.join(' ')===r.answer.join(' ')) order=[order[1],order[0]].concat(order.slice(2));
      order.forEach(function(w){ var t=tileFor(w,used); used.push(+t.getAttribute('data-i')); t.click(); }); return true; }
  }
};
})();
