/* Picture Bingo (/games/picture-bingo/, wave 1, 2026-11-07). A bingo card of word
   pictures, no words on it. The game calls an English word (the site's own
   /audio/<word>.mp3 via cdeSay, Piper TTS); the child taps that picture to mark it.
   A wrong tap shakes the square, counts a miss and replays the call. A full row,
   column or diagonal = BINGO; one card per level:
     1 — 3×3 from two far-apart topics (animals + transport, food + clothing, …)
     2 — 3×3 from ONE topic (all animals: harder to tell apart)
     3 — 4×4 from four topics, plus 1–2 calls that are NOT on the card: the child
         taps "Not on my card" (the button is there for every call, so it gives
         nothing away).
   No oracle: card layout is a uniform shuffle, every square looks the same, the
   called square is never highlighted, animated or focused before the tap, and a
   call never targets an already-marked square. Speech-sync (kit §8g): the next call
   waits for the last word to finish (cdeSayDone). Class mode (menu toggle or
   ?class=1): bigger card for a projector, slower calls, each call spoken twice.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start
   / g_lvl / g_cmp @ picture-bingo, and pb @ <level>_<ok|no|skip-ok|skip-no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var LANG=window.CDE_LANG||'en';
var ID='picture-bingo';

// Word ids from src/data/words.js (photo + /audio/<id>.mp3), picked by looking at every
// picture: nothing that two children could name differently on the same card
// (no hat/cap, boat/ship, mountain/volcano, pants/jeans, wolf/dog, mirror, rice).
var TOPICS={
  animals:['cat','dog','fish','bird','rabbit','horse','cow','duck','pig','mouse','frog','bear','sheep','monkey','fox','snail','spider','elephant','giraffe','penguin','turtle','zebra','lion','tiger','snake','whale','owl'],
  food:['apple','banana','bread','milk','egg','pizza','cake','carrot','orange','cheese','cookie','corn','tomato','onion','grapes','donut','pear','strawberry','burger','lemon'],
  transport:['car','bus','bicycle','airplane','train','boat','helicopter','truck','taxi','tractor','rocket','ambulance','motorcycle','firetruck'],
  clothing:['hat','shirt','shoes','dress','gloves','scarf','socks','belt','sunglasses','helmet','umbrella'],
  home:['house','bed','chair','table','door','window','lamp','clock','ladder','bucket','pillow','fridge','sofa','key','lock'],
  toys:['drum','kite','doll','balloon','puzzle','robot','dice','bubbles','trampoline','seesaw'],
  nature:['tree','flower','rainbow','mountain','moon','star','leaf','fire','feather','beach']
};
// level 1: two topics that share nothing
var FAR=[['animals','transport'],['food','clothing'],['animals','home'],['food','transport'],['toys','animals'],['nature','food'],['clothing','animals'],['home','food'],['toys','food'],['nature','transport']];
var LEVELS=[{id:'two',n:3},{id:'one',n:3},{id:'mixed',n:4,decoys:true}];
window.PB_TOPICS=TOPICS; // read by the word/audio/image coverage test

function beacon(ev,item){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(!navigator.sendBeacon) return;
    var l=LANG==='he'||LANG==='es'?LANG:'en';
    navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:item}], l:l}));
  }catch(e){}
}
beacon('g_open',ID);

// TTS only if the word file can't load; never under automation (it can stall headless Chrome)
function tts(txt){
  try{
    if(navigator.webdriver||!window.speechSynthesis||!window.SpeechSynthesisUtterance) return;
    var u=new SpeechSynthesisUtterance(txt); u.lang='en-US'; u.rate=0.9;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  }catch(e){}
}
function say(w){ if(window.cdeSay) window.cdeSay(w,function(){ tts(w); }); else tts(w); }
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(2500,cb); else setTimeout(cb,1200); }
function stopSpeech(){ try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(e){} }

function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

var CLASS=false;
try{ CLASS=localStorage.getItem('cde_pb_class')==='1'; }catch(e){}
try{ var q=new URLSearchParams(location.search).get('class'); if(q==='1') CLASS=true; else if(q==='0') CLASS=false; }catch(e){}
function pace(){ return CLASS?{first:1400,gap:2000,repeat:1600}:{first:700,gap:650,repeat:0}; }

var app=document.getElementById('app');
var S={lvl:0,card:[],topics:[],marked:[],call:null,decoy:false,callNo:0,decoySlots:[],calls:[],misses:0,totalMisses:0,busy:true,bingo:null,started:false};
window.S=S; // game-clicks.js reads S.lvl (0-based)
var token=0; // bumps on every new call / level / leave: stale timers check it

// ---- dealing --------------------------------------------------------------
// one picture style per card (owner 11-07): drawn/emoji pictures (public/games/image-style.js) leave the topics
(function(){ var D=window.CDE_DRAWN||[]; Object.keys(TOPICS).forEach(function(t){ TOPICS[t]=TOPICS[t].filter(function(w){ return D.indexOf(w)<0; }); }); })();
function deal(i){
  var lv=LEVELS[i], words, topics;
  if(lv.id==='two'){
    topics=shuffle(pick(FAR)); var a=Math.random()<0.5?5:4;
    words=shuffle(TOPICS[topics[0]]).slice(0,a).concat(shuffle(TOPICS[topics[1]]).slice(0,9-a));
  } else if(lv.id==='one'){
    topics=[pick(Object.keys(TOPICS).filter(function(t){ return TOPICS[t].length>=9; }))];
    words=shuffle(TOPICS[topics[0]]).slice(0,9);
  } else {
    topics=shuffle(Object.keys(TOPICS)).slice(0,4);
    words=[]; topics.forEach(function(t){ words=words.concat(shuffle(TOPICS[t]).slice(0,4)); });
  }
  var card=shuffle(words); // uniform layout
  // decoys: 1–2 calls among slots 1–3 (before slot 3 at most 3 squares are marked, so no line yet: they always happen)
  var slots=[];
  if(lv.decoys){ slots=shuffle([1,2,3]).slice(0,Math.random()<0.5?1:2); }
  var pool=[]; topics.forEach(function(t){ pool=pool.concat(TOPICS[t].filter(function(w){ return card.indexOf(w)<0; })); });
  return {card:card, topics:topics, decoySlots:slots, decoyPool:shuffle(pool)};
}
function lines(n){
  var L=[], r, c, d1=[], d2=[];
  for(r=0;r<n;r++){ var row=[]; for(c=0;c<n;c++) row.push(r*n+c); L.push(row); }
  for(c=0;c<n;c++){ var col=[]; for(r=0;r<n;r++) col.push(r*n+c); L.push(col); }
  for(r=0;r<n;r++){ d1.push(r*n+r); d2.push(r*n+(n-1-r)); }
  L.push(d1); L.push(d2); return L;
}
function bingoLine(){
  var n=LEVELS[S.lvl].n, ls=lines(n);
  for(var i=0;i<ls.length;i++) if(ls[i].every(function(k){ return S.marked[k]; })) return ls[i];
  return null;
}

// ---- screens ----------------------------------------------------------------
var hud, callLbl, sayBtn, fb, grid, notOn;
function topicName(t){ return T('t_'+t); }
function startLevel(i){
  token++; stopSpeech();
  var d=deal(i);
  S.lvl=i; S.card=d.card; S.topics=d.topics; S.decoySlots=d.decoySlots; S.decoyPool=d.decoyPool;
  S.marked=d.card.map(function(){ return false; }); S.call=null; S.decoy=false; S.callNo=0; S.calls=[]; S.misses=0; S.bingo=null; S.busy=true;
  render();
  var my=token; setTimeout(function(){ if(my===token) nextCall(); }, pace().first);
}

function render(){
  var lv=LEVELS[S.lvl], n=lv.n;
  app.textContent='';
  app.className='play n'+n+(lv.decoys?' decoys':'');
  hud=el('div','hud'); hud.id='hud';
  var t=el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length+' · '+
    (lv.id==='one'?topicName(S.topics[0]):lv.id==='two'?topicName(S.topics[0])+' + '+topicName(S.topics[1]):T('mixed')));
  hud.appendChild(t);
  callLbl=el('div','hud-call',''); hud.appendChild(callLbl);
  app.appendChild(hud);
  sayBtn=elh('button','say',IC('volume-2')+' <span>'+T('again')+'</span>'); sayBtn.id='sayBtn'; sayBtn.type='button';
  sayBtn.addEventListener('click',function(){ if(S.call&&!S.busy) say(S.call); });
  app.appendChild(sayBtn);
  fb=el('p','feedback'); fb.id='fb'; fb.setAttribute('role','status'); app.appendChild(fb);
  grid=el('div','grid'); grid.id='grid'; grid.setAttribute('dir','ltr');
  S.card.forEach(function(w,k){
    var b=el('button','sq'); b.type='button'; b.setAttribute('data-i',k); b.setAttribute('aria-label',w);
    var im=el('img'); im.src='/images/'+w+'.webp'; im.alt=''; im.width=160; im.height=160; im.draggable=false;
    b.appendChild(im);
    b.appendChild(elh('span','stamp',IC('check')));
    b.addEventListener('click',function(){ tapSquare(k,b); });
    grid.appendChild(b);
  });
  app.appendChild(grid);
  if(lv.decoys){
    notOn=elh('button','noton',IC('x')+' <span>'+T('notOn')+'</span>'); notOn.id='notOn'; notOn.type='button';
    notOn.addEventListener('click',tapNotOn);
    app.appendChild(notOn);
  } else notOn=null;
  if(S.lvl===0) fb.textContent=T('tip1');
  else if(lv.decoys) fb.textContent=T('tip3');
}

function nextCall(){
  token++; var my=token;
  var lv=LEVELS[S.lvl];
  var decoy=lv.decoys && S.decoySlots.indexOf(S.callNo)>=0 && S.decoyPool.length>0;
  var w;
  if(decoy) w=S.decoyPool.shift();
  else {
    var open=[]; S.card.forEach(function(x,k){ if(!S.marked[k]) open.push(k); });
    w=S.card[pick(open)];
  }
  S.call=w; S.decoy=decoy; S.callNo++; S.calls.push({w:w,decoy:decoy});
  hud.setAttribute('data-call',S.lvl+'-'+S.callNo);
  callLbl.textContent=T('call')+' '+S.callNo;
  if(!(S.lvl===0&&S.callNo===1)&&!(LEVELS[S.lvl].decoys&&S.callNo===1)) fb.textContent='';
  S.busy=false;
  // the new call number is painted first, then the word is spoken (never the other way round)
  requestAnimationFrame(function(){ setTimeout(function(){
    if(my!==token) return;
    say(w);
    // class mode: say it once more after a pause (the class hears it twice)
    if(pace().repeat) sayDone(function(){ setTimeout(function(){ if(my===token&&!S.busy) say(w); }, pace().repeat); });
  }, 120); });
}

function advance(){
  S.busy=true; var my=++token;
  sayDone(function(){
    if(my!==token) return;
    setTimeout(function(){ if(my!==token) return; if(S.bingo) levelDone(); else nextCall(); }, S.bingo?1300:pace().gap);
  });
}

function miss(kind){
  S.misses++; S.totalMisses++;
  beacon('pb',LEVELS[S.lvl].id+'_'+kind);
  say(S.call); // replay the call
}

function tapSquare(k,b){
  if(S.busy||!S.call||S.marked[k]) return;
  if(!S.decoy && S.card[k]===S.call){
    S.marked[k]=true; b.classList.add('marked');
    beacon('pb',LEVELS[S.lvl].id+'_ok');
    fb.textContent='';
    var line=bingoLine();
    if(line){
      S.bingo=line;
      line.forEach(function(i){ grid.children[i].classList.add('line'); });
      fb.innerHTML=''; fb.appendChild(elh('span','bingo',T('bingo')));
    }
    advance();
    return;
  }
  // wrong picture (or any picture on a "not on my card" call): gentle shake, replay
  b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
  fb.textContent=T(S.decoy?'notHere':'listen');
  miss('no');
}

function tapNotOn(){
  if(S.busy||!S.call) return;
  if(S.decoy){
    beacon('pb',LEVELS[S.lvl].id+'_skip-ok');
    fb.textContent=T('skipOk');
    advance();
    return;
  }
  notOn.classList.remove('shake'); void notOn.offsetWidth; notOn.classList.add('shake');
  fb.textContent=T('isOn');
  miss('skip-no');
}

function stars(m){ return m===0?3:m<=2?2:1; }
function starRow(n){
  var s=el('div','stars');
  for(var i=0;i<3;i++) s.appendChild(elh('span',i<n?'on':'off',IC('star')));
  s.setAttribute('aria-label',n+' / 3');
  return s;
}

function levelDone(){
  token++; stopSpeech(); S.busy=true; S.call=null;
  beacon('g_lvl',ID);
  app.textContent=''; app.className='';
  var last=S.lvl===LEVELS.length-1;
  if(last){ beacon('g_cmp',ID); return renderEnd(); }
  var box=el('div','card');
  box.appendChild(starRow(stars(S.misses)));
  box.appendChild(elh('h2',null,T('levelDone')));
  box.appendChild(el('p','score',T('misses')+' '+S.misses));
  var nx=elh('button','primary',T('nextLevel')); nx.type='button'; nx.id='nextLevel'; nx.addEventListener('click',function(){ startLevel(S.lvl+1); });
  var again=elh('button','ghost',T('retry')); again.type='button'; again.addEventListener('click',function(){ startLevel(S.lvl); });
  box.appendChild(nx); box.appendChild(again);
  app.appendChild(box); nx.focus();
}

function renderEnd(){
  var box=el('div','card');
  box.appendChild(starRow(stars(S.totalMisses>4?3:S.totalMisses>0?1:0)));
  box.appendChild(elh('h2',null,T('allDone')));
  box.appendChild(el('p','score',T('misses')+' '+S.totalMisses));
  var again=elh('button','primary',T('playAgain')); again.type='button'; again.id='playAgain';
  again.addEventListener('click',function(){ S.totalMisses=0; startLevel(0); });
  box.appendChild(again);
  app.appendChild(box);
  if(window.CDE_END) CDE_END({game:ID,again:again,good:S.totalMisses<=6});
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

// ---- menu ---------------------------------------------------------------------
var classBtn=document.getElementById('classBtn');
function paintClass(){
  document.documentElement.classList.toggle('classmode',CLASS);
  if(classBtn){ classBtn.setAttribute('aria-pressed',CLASS?'true':'false'); classBtn.innerHTML=IC('projector')+' '+T(CLASS?'classOn':'classOff'); }
}
if(classBtn) classBtn.addEventListener('click',function(){ CLASS=!CLASS; try{ localStorage.setItem('cde_pb_class',CLASS?'1':'0'); }catch(e){} paintClass(); });
// after cde-l10n.js has applied the page's strings
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',paintClass); else paintClass();

function go(lvl){
  if(!S.started){ S.started=true; beacon('g_start',ID); }
  document.getElementById('menu').hidden=true;
  S.totalMisses=0;
  startLevel(lvl||0);
}
document.getElementById('startBtn').addEventListener('click',function(){ go(0); });

/* test/debug contract (Playwright; no gameplay shortcuts: solveForTest taps through the real handlers) */
window.PB={
  LEVELS:LEVELS, TOPICS:TOPICS, lines:lines,
  dbg:{
    get S(){ return S; },
    get lvl(){ return S.lvl; },
    get call(){ return S.call; },
    get decoy(){ return S.decoy; },
    get busy(){ return S.busy; },
    get card(){ return S.card.slice(); },
    get marked(){ return S.marked.slice(); },
    get bingo(){ return S.bingo; },
    get classMode(){ return CLASS; },
    deal:deal,
    startLevel:function(i){ document.getElementById('menu').hidden=true; startLevel(i); },
    solveForTest:function(){
      if(S.busy||!S.call) return false;
      if(S.decoy){ document.getElementById('notOn').click(); return true; }
      var k=-1; S.card.forEach(function(w,i){ if(w===S.call&&!S.marked[i]) k=i; });
      if(k<0) return false;
      grid.children[k].click(); return true;
    },
    wrongForTest:function(){
      if(S.busy||!S.call) return false;
      for(var i=0;i<S.card.length;i++) if(!S.marked[i]&&S.card[i]!==S.call){ grid.children[i].click(); return true; }
      return false;
    }
  }
};
})();
