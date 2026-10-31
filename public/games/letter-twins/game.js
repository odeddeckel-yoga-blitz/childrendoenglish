/* Letter Twins (/games/letter-twins/, round-2 R2C6). Three tracks, same loop:
   twins  — b, d, p or q? Each round shows a CDE photo, plays the word (the app's own
            word audio) and asks for its first letter. Levels b/d, p/b, p/q, all four.
   mnwu   — the other look-alikes: m/n, m/w (w is an upside-down m), n/u, all four.
   sounds — letter sounds: NO photo and NO spelling, only the word is heard; the child
            taps the letter its first SOUND makes (four letters with clearly different
            sounds per level, phonics order s a t p first). The photo and the spelled
            word appear after the answer. The sound comes from the word itself (bare
            phonemes are unreliable in TTS), so every clip is an already-checked word.
   A mistake shows the right letter in the word and a tip. ?track=mnwu|sounds opens a
   track. Beacons (cookieless aggregates, same guards as land-beacon.js): g_open /
   g_start / g_lvl / g_cmp @ letter-twins, and ltw @ <level>_<letter>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var LANG=window.CDE_LANG||'en';

// words = CDE app words with a photo and audio; letters = the choices shown
var TRACKS={
  twins:[
    {id:'bd', letters:['b','d'], words:['bed','bus','ball','book','bag','box','bell','bone','dog','duck','door','doll','drum','dad','dress','donut']},
    {id:'pb', letters:['p','b'], words:['pig','pen','peach','pear','plate','pants','park','potato','bear','bread','banana','bee','bird','boy']},
    {id:'pq', letters:['p','q'], words:['queen','quilt','quail','pig','pen','pear','plate','park']},
    {id:'all', letters:['b','d','p','q'], words:['bed','dog','pig','queen','ball','duck','pen','quilt','book','door','peach','quail','bus','drum','pear']}
  ],
  mnwu:[
    {id:'mn', letters:['m','n'], words:['moon','milk','map','mouse','monkey','mask','mango','net','nest','nut','nurse','nine','notebook','necklace']},
    {id:'mw', letters:['m','w'], words:['moon','milk','map','mouse','monkey','mask','water','watch','wall','wolf','worm','wagon','wheel','whale']},
    {id:'nu', letters:['n','u'], words:['unicorn','uniform','ukulele','net','nest','nut','nurse','nine','notebook']},
    {id:'mnwu', letters:['m','n','w','u'], words:['moon','net','water','unicorn','milk','nut','watch','uniform','map','nurse','wolf','ukulele','mouse','nest','wall']}
  ],
  // four letters per level whose first sounds are clearly different (never c with k).
  // Every clip whisper-checked 10-31: v words dropped (van/vest/violin/vet heard as
  // than/best/file/that), park ("hark") and axe ("x") too — the v/w contrast lives in Sound Pairs.
  sounds:[
    {id:'s1', letters:['s','a','t','p'], words:['sun','socks','sad','star','ant','apple','arrow','alligator','table','tent','tiger','taxi','pig','pen','pumpkin','pants']},
    {id:'s2', letters:['m','d','g','h'], words:['moon','milk','map','monkey','dog','duck','drum','door','goat','gift','girl','garden','horse','hen','hat','hand']},
    {id:'s3', letters:['b','f','l','r'], words:['bus','bed','ball','box','fish','fox','fan','fork','lion','leaf','lock','lamp','rabbit','rain','red','robot']},
    {id:'s4', letters:['c','w','z','j'], words:['cat','cake','car','cup','water','watch','wolf','worm','zebra','zero','zipper','zoo','juice','jam','jar','jeep']}
  ]
};
var TRACK=(function(){ try{ var q=new URLSearchParams(location.search).get('track'); return TRACKS[q]?q:'twins'; }catch(e){ return 'twins'; } })();
var LEVELS=TRACKS[TRACK];
var ROUNDS=8;
window.LT_TRACKS=TRACKS; // read by the audio/image coverage test

function beacon(ev,item){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(!navigator.sendBeacon) return;
    var l=LANG==='he'||LANG==='es'?LANG:'en';
    navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:item}], l:l}));
  }catch(e){}
}
beacon('g_open','letter-twins');

var clip=null;
function play(word){
  try{
    if(clip){ clip.pause(); }
    clip=new Audio('/audio/'+word+'.mp3');
    try{ if(localStorage.getItem('cde_slow')==='1'){ clip.playbackRate=0.75; clip.preservesPitch=true; } }catch(e){}
    var p=clip.play(); if(p&&p.catch) p.catch(function(){});
  }catch(e){}
}
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,items:[],misses:{},started:false};
var roundId=0;

function plan(level){
  // the round's words, balanced across the level's letters where possible
  var by={}; level.letters.forEach(function(l){ by[l]=shuffle(level.words.filter(function(w){ return w[0]===l; })); });
  var out=[], i=0;
  while(out.length<ROUNDS && i<20){ level.letters.forEach(function(l){ if(out.length<ROUNDS && by[l][i]) out.push(by[l][i]); }); i++; }
  return shuffle(out);
}
function startLevel(i){ LEVELS=TRACKS[TRACK]; S.lvl=i; S.round=0; S.score=0; S.items=plan(LEVELS[i]); render(); }

function gapWord(word, filled){
  var w=el('div','gap-word'); w.setAttribute('dir','ltr'); w.setAttribute('lang','en');
  var b=el('span', filled?'':'blank', filled?word[0]:' '); w.appendChild(b);
  w.appendChild(document.createTextNode(word.slice(1)));
  return w;
}

function render(){
  var word=S.items[S.round], lv=LEVELS[S.lvl], my=++roundId;
  var live=function(){ return my===roundId; };
  app.textContent='';
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  var snd=TRACK==='sounds';
  h.appendChild(el('div','hud-label',T(snd?'pickSound':'pick')));
  var dots=el('div','dots');
  for(var i=0;i<S.items.length;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots); app.appendChild(h);
  var im=el('img','pic'); im.src='/images/'+word+'.webp'; im.alt=''; im.width=200; im.height=200;
  var gw=gapWord(word,false);
  if(snd){ im.hidden=true; gw.classList.add('hidden-word'); gw.setAttribute('aria-hidden','true'); }
  app.appendChild(im); app.appendChild(gw);
  var say=el('button','big-say','🔊'); say.id='sayBtn'; say.type='button'; say.setAttribute('aria-label',T('again'));
  say.addEventListener('click',function(){ play(word); });
  app.appendChild(say);
  var answered=false, fb, row;
  var opts=el('div','opts letters'); opts.setAttribute('dir','ltr');
  lv.letters.forEach(function(l){
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-letter',l); b.setAttribute('aria-label',l);
    var t=el('span','opt-letter',l); b.appendChild(t);
    b.addEventListener('click',function(){
      if(answered) return; answered=true;
      var ok=l===word[0];
      beacon('ltw', lv.id+'_'+word[0]+'_'+(ok?'ok':'no'));
      im.hidden=false;
      gw.replaceWith(gapWord(word,true));
      play(word);
      if(ok){ S.score++; b.classList.add('ok'); fb.textContent=T('right'); setTimeout(function(){ if(live()) next(); }, 1200); return; }
      S.misses[lv.id]=(S.misses[lv.id]||0)+1;
      b.classList.add('no'); opts.querySelector('[data-letter="'+word[0]+'"]').classList.add('ok');
      fb.textContent=snd ? T('sndTip').replace('{w}','\u2066'+word+'\u2069').replace('{L}','\u2066'+word[0]+'\u2069') : T('tip_'+word[0]);
      var nx=el('button','next',T('next')); nx.type='button'; nx.addEventListener('click',next);
      row.appendChild(nx); nx.focus();
    });
    opts.appendChild(b);
  });
  app.appendChild(opts);
  fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  row=el('div','row'); app.appendChild(row);
  setTimeout(function(){ if(live()) play(word); }, 250);
}

function next(){
  roundId++;
  if(clip) clip.pause();
  S.round++;
  if(S.round<S.items.length) return render();
  beacon('g_lvl','letter-twins');
  var stars=S.score===S.items.length?3:S.score>=S.items.length-2?2:1;
  app.textContent='';
  if(S.lvl===LEVELS.length-1){ beacon('g_cmp','letter-twins'); return renderEnd(); }
  var box=el('div','card');
  box.appendChild(el('div','stars','⭐'.repeat(stars)+'☆'.repeat(3-stars)));
  box.appendChild(el('h2',null,T('levelDone')));
  var sc=el('p','score',S.score+' / '+S.items.length); sc.setAttribute('dir','ltr'); box.appendChild(sc);
  var nx=el('button','primary',T('nextLevel')); nx.type='button'; nx.addEventListener('click',function(){ startLevel(S.lvl+1); });
  var again=el('button','ghost',T('retry')); again.type='button'; again.addEventListener('click',function(){ startLevel(S.lvl); });
  box.appendChild(nx); box.appendChild(again);
  app.appendChild(box); nx.focus();
}

function renderEnd(){
  var box=el('div','card');
  box.appendChild(el('h2',null,T(TRACK==='sounds'?'allDoneSnd':'allDone')));
  var worst=null; LEVELS.forEach(function(l){ if((S.misses[l.id]||0)>(worst?S.misses[worst.id]:0)) worst=l; });
  if(worst){ box.appendChild(el('p',null,T('hardest'))); var w=el('p','hard',worst.letters.join(' · ')); w.setAttribute('dir','ltr'); box.appendChild(w); }
  else box.appendChild(el('p',null,T('allRight')));
  var again=el('button','primary',T('playAgain')); again.type='button';
  again.addEventListener('click',function(){ S.misses={}; startLevel(0); });
  box.appendChild(again);
  app.appendChild(box);
  if(window.CDE_END) CDE_END({game:'letter-twins',again:again,good:true});
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

// track picker on the menu (the start button plays the picked track)
var picks=document.querySelectorAll('[data-track]');
function markTrack(){ for(var i=0;i<picks.length;i++) picks[i].setAttribute('aria-pressed', String(picks[i].getAttribute('data-track')===TRACK)); }
for(var i=0;i<picks.length;i++) picks[i].addEventListener('click',function(){ TRACK=this.getAttribute('data-track'); markTrack(); });
markTrack();

document.getElementById('startBtn').addEventListener('click',function(){
  if(!S.started){ S.started=true; beacon('g_start','letter-twins'); }
  document.getElementById('menu').hidden=true;
  startLevel(0);
});
})();
