/* Simon Says (/games/simon-says/, wave 2 11-08). An instruction is said and shown ("Simon says, clap your hands!");
   the child taps the action's picture (Microsoft Fluent 3D, MIT; data.js).
   Level 1 = always "Simon says", three pictures.
   Level 2 = 3 of 8 rounds are traps without "Simon says" ("Clap your hands!"): the right answer is Stay still.
   Level 3 = two actions in order ("Simon says, run and wave!"): tap both, in order, from four pictures; 2 of 8 are
   traps. Level-3 pairs and every clip are fixed in data.js (Piper, whisper-checked).
   Look-alike actions (run / walk, laugh / cry, yawn / sleep) never share a round. A trap still shows the named action
   among the pictures: the child has to listen for "Simon says".
   Oracle guards (kit "no giveaway"), asserted in e2e/simon-says.spec.js: trap counts per level, the answer's position
   uniform, no look-alikes in a round, nothing marked before the tap.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start / g_lvl / g_cmp @ simon-says, and
   ss @ <says|trap>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var GAME='simon-says';
var D=window.SIMON_DATA, A=D.ACTIONS, IDS=Object.keys(A);
var LEVELS=[{id:'says',traps:0,opts:3},{id:'traps',traps:3,opts:3},{id:'two',traps:2,opts:4}];
var ROUNDS=8;
var IMG=function(k){ return '/games/simon-says/img/'+k+'.webp'; };
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function similar(a,b){ return D.SIMILAR.some(function(s){ return s.indexOf(a)>=0&&s.indexOf(b)>=0; }); }
function text(seq,trap){
  var said=seq.map(function(k){ return A[k].say; }).join(' and ');
  return trap?cap(said)+'!':'Simon says, '+said+'!';
}

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

function say(s){ if(window.cdeSay) window.cdeSay(s, function(){ tts(s); }, '/games/simon-says/audio/'+slug(s)+'.mp3'); else tts(s); }
function tts(s){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(s); u.lang='en-US'; u.rate=0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(3500,cb); else cb(); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,txt){ var n=document.createElement(tag); if(cls) n.className=cls; if(txt!=null) n.textContent=txt; return n; }
// own static strings only (they carry drawn-icon markup) — never instructions or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

// pictures for a round: the named actions + others that look like none of them
function fill(seq,n){
  var rest=shuffle(IDS.filter(function(k){ return seq.indexOf(k)<0&&!seq.some(function(s){ return similar(s,k); }); }));
  var out=seq.slice();
  for(var i=0;i<rest.length&&out.length<n;i++) if(!out.some(function(o){ return similar(o,rest[i]); })) out.push(rest[i]);
  return shuffle(out);
}
// Round: {seq:[ids named], trap, text, opts:[ids]}
function plan(lv){
  var L=LEVELS[lv], traps=shuffle([0,1,2,3,4,5,6,7]).slice(0,L.traps);
  if(lv<2){
    return shuffle(IDS).slice(0,ROUNDS).map(function(k,i){
      var trap=traps.indexOf(i)>=0;
      return {seq:[k],trap:trap,text:text([k],trap),opts:fill([k],L.opts)};
    });
  }
  var says=shuffle(D.SAYS_PAIRS).slice(0,ROUNDS-L.traps), tr=shuffle(D.TRAP_PAIRS).slice(0,L.traps), si=0, ti=0;
  return [0,1,2,3,4,5,6,7].map(function(i){
    var trap=traps.indexOf(i)>=0, seq=(trap?tr[ti++]:says[si++]).slice();
    return {seq:seq,trap:trap,text:text(seq,trap),opts:fill(seq,L.opts)};
  });
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:0,started:false,answered:false,taps:[]};
var roundId=0;

function header(){
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  h.appendChild(el('div','hud-label',T(S.lvl===2?'askTwo':S.lvl===1?'askTrap':'ask')));
  var dots=el('div','dots');
  for(var i=0;i<ROUNDS;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots);
  return h;
}

function startLevel(i){ S.lvl=i; S.round=0; S.score=0; S.rounds=plan(i); renderRound(); }

function renderRound(){
  var r=S.rounds[S.round], my=++roundId;
  var live=function(){ return my===roundId; };
  S.answered=false; S.taps=[];
  app.textContent='';
  app.appendChild(header());
  var line=el('div','sentence'); line.setAttribute('dir','ltr');
  var tx=el('span','stext',r.text); tx.setAttribute('lang','en'); line.appendChild(tx);
  var sp=elh('button','say',IC('volume-2')); sp.type='button'; sp.id='sayBtn'; sp.setAttribute('aria-label',T('hear'));
  sp.addEventListener('click',function(){ say(r.text); });
  line.appendChild(sp); app.appendChild(line);
  var grid=el('div','grid'+(r.opts.length===3?' three':'')); grid.setAttribute('dir','ltr');
  r.opts.forEach(function(k,i){
    var card=el('div','ss-card'); card.setAttribute('data-act',k);
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-act',k); b.setAttribute('aria-label',T('picture')+' '+(i+1));
    var im=el('img'); im.src=IMG(k); im.alt=''; im.width=320; im.height=320; im.decoding='async'; b.appendChild(im);
    var wd=el('span','word late',A[k].say); wd.setAttribute('lang','en'); b.appendChild(wd);
    var n=el('span','step'); b.appendChild(n);
    b.addEventListener('click',function(){ tap(k,b); });
    card.appendChild(b); grid.appendChild(card);
  });
  app.appendChild(grid);
  var still=null;
  if(LEVELS[S.lvl].traps){
    still=elh('button','still',IC('hand')+' '+T('still')); still.type='button'; still.id='stillBtn';
    still.addEventListener('click',function(){ if(S.answered||!live()) return; finish(r.trap,still); });
    app.appendChild(still);
  }
  var fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  var row=el('div','row'); app.appendChild(row);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));
  say(r.text);

  function tap(k,b){
    if(S.answered||!live()) return;
    if(r.trap) return finish(false,b);
    if(S.taps.indexOf(k)>=0) return;
    var want=r.seq[S.taps.length];
    S.taps.push(k);
    if(k!==want) return finish(false,b);
    b.classList.add('picked'); b.querySelector('.step').textContent=String(S.taps.length);
    if(S.taps.length===r.seq.length) finish(true,b);
  }
  function finish(ok,b){
    S.answered=true;
    beacon('ss',(r.trap?'trap':'says')+'_'+(ok?'ok':'no'));
    grid.classList.add('shown');
    if(r.trap) still.classList.add('ok');
    else r.seq.forEach(function(k,i){ var g=grid.querySelector('.opt[data-act="'+k+'"]'); g.classList.add('ok'); g.querySelector('.step').textContent=r.seq.length>1?String(i+1):''; });
    fb.textContent='';
    fb.appendChild(elh('span','lead',T(ok?'right':(r.trap?'noSimon':'notQuite'))));
    if(ok){
      S.score++;
      setTimeout(function(){ if(live()) sayDone(function(){ if(live()) next(); }); }, 1300);
    } else {
      S.misses++;
      if(b) b.classList.add('no');
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
  try{ var best=JSON.parse(localStorage.getItem('cde_ss_best')||'{}'); var k=LEVELS[S.lvl].id; if(!(best[k]>=st)){ best[k]=st; localStorage.setItem('cde_ss_best',JSON.stringify(best)); } }catch(e){}
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

// test/debug contract (Playwright spec; no gameplay shortcuts — the helpers tap the real buttons)
window.SS={
  S:S, LEVELS:LEVELS, D:D, ROUNDS:ROUNDS,
  dbg:{
    get state(){ return S; },
    get round(){ return S.rounds[S.round]||null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden)?S.lvl+':'+S.round:''; },
    plan:plan, similar:similar, text:text, slug:slug,
    startLevel:function(lvl){ roundId++; startLevel(lvl); },   // phone-fit test: each level's own layout
    redraw:function(){ roundId++; renderRound(); },
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false;
      if(r.trap){ document.getElementById('stillBtn').click(); return true; }
      r.seq.forEach(function(k){ app.querySelector('.opt[data-act="'+k+'"]').click(); }); return true; },
    missForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false;
      if(r.trap){ app.querySelector('.opt[data-act="'+r.seq[0]+'"]').click(); return true; }
      var w=r.opts.filter(function(k){ return r.seq.indexOf(k)<0; })[0]; app.querySelector('.opt[data-act="'+w+'"]').click(); return true; }
  }
};
})();
