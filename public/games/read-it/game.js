/* Read It! — decoding game (/games/read-it/), roadmap B2 phonics in the Building
   Blocks order: strand 1 = five short-vowel CVC levels (a, i, o, u, e; design:
   plans/b2-phonics-cvc-2026-10.md), strand 2 = magic e (a_e, i_e, o_e + u_e),
   strand 3 = digraphs (sh + ch, th + ck). Each level = "read it → tap the picture"
   items (the level's photo words) then "hear it → pick the spelling" items (three
   real words, mostly one letter or one sound apart: cap / cape, ship / chip).
   Audio = /audio/cvc/<word>.mp3, each accepted only when whisper hears it as
   itself and never as a word shown next to it (2026-10-29; strands 2–3 10-31).
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open /
   g_start / g_lvl / g_cmp @ read-it, and cvc @ <vowel>_<r|h>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var LANG=window.CDE_LANG||'en';

// read = photo words (app images); hear = [target, two one-letter neighbours]
var LEVELS=[
  // strand 1 — short vowels
  {id:'a', read:['cat','hat','bat','jam','can','cap','bag','fan','map'], hear:[['cat','cut','cap'],['bag','big','bug'],['hat','hit','hot'],['pan','pen','pin'],['fan','fin','fun'],['bat','bit','bet'],['map','mop','mud'],['man','men','mud']]},
  {id:'i', read:['pig','six'], hear:[['pig','peg','pug'],['pin','pan','pen'],['sit','sat','set'],['tin','tan','ten'],['fin','fan','fun'],['hit','hat','hot'],['big','bag','bug'],['zip','zap','dig']]},
  {id:'o', read:['dog','fox','box'], hear:[['dog','dig','dot'],['pot','pit','pet'],['mop','map','men'],['top','tip','tap'],['lot','lit','let'],['hot','hit','hat'],['fox','fix','fax'],['rod','red','rid']]},
  {id:'u', read:['bus','sun','cup'], hear:[['cup','cap','cut'],['bug','bag','big'],['hum','ham','him'],['fun','fan','fin'],['mud','mad','mid'],['hug','hog','hum'],['tub','tab','tug'],['run','ran','rot']]},
  {id:'e', read:['bed','pen','net','jet'], hear:[['pen','pan','pin'],['bed','bad','bud'],['ten','tan','tin'],['net','not','nap'],['red','rid','rod'],['jet','jam','pet'],['peg','pig','pug'],['wet','web','wig']]},
  // strand 2 — magic e: the silent e makes the vowel say its name
  {id:'a_e', read:['cake','gate','plate','snake','lake','cave','whale'], hear:[['cape','cap','cope'],['made','mad','mud'],['cane','can','cone'],['mane','man','mine'],['pane','pan','pine'],['bake','bike','cake'],['lake','lack','like'],['tape','tap','top']]},
  {id:'i_e', read:['kite','five','nine','dice','slide','smile','rice'], hear:[['kite','kit','cute'],['pine','pin','pane'],['bite','bit','bat'],['hide','hid','had'],['ride','rid','rode'],['fine','fin','fun'],['dime','dim','dice'],['ripe','rip','rope']]},
  {id:'o_e', read:['rope','globe','phone'], hear:[['hope','hop','top'],['note','not','net'],['robe','rob','rub'],['cone','cane','can'],['cube','tube','cute'],['tube','tub','tab'],['cute','cut','cat'],['rode','rod','red']]},
  // strand 3 — digraphs: two letters, one sound
  {id:'sh_ch', read:['ship','fish','sheep','shirt','brush','shark','cheese','chair','watch'], hear:[['ship','chip','sip'],['chop','shop','hop'],['dish','ditch','dig'],['sheep','cheap','jeep'],['wish','with','wit'],['cash','catch','cat'],['much','mush','mug'],['chat','that','hat']]},
  {id:'th_ck', read:['three','duck','clock','truck','lock'], hear:[['thin','tin','fin'],['three','tree','free'],['bath','bat','path'],['math','mat','mash'],['sock','shock','lock'],['pick','pig','pit'],['lock','log','lot'],['duck','dock','sock']]}
];
// strand of each level, by id (1 = short vowels)
var STRAND=function(l){ return /_e$/.test(l.id)?2:/^(sh|th)_/.test(l.id)?3:1; };
var STRAND_START=[null,0,5,8]; // first level index of strands 1–3
var ROUNDS=8, MAX_READ=4;
var photosOf=function(s){ return [].concat.apply([],LEVELS.filter(function(l){ return STRAND(l)===s; }).map(function(l){ return l.read; })); };
window.RI_LEVELS=LEVELS; // read by the audio-coverage test

function beacon(ev,item){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(!navigator.sendBeacon) return;
    var l=LANG==='he'||LANG==='es'?LANG:'en';
    navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:item}], l:l}));
  }catch(e){}
}
beacon('g_open','read-it');

var clip=null;
function play(word, done){
  try{
    if(clip){ clip.onended=null; clip.pause(); }
    clip=new Audio('/audio/cvc/'+word+'.mp3');
    if(done) clip.onended=done;
    var p=clip.play(); if(p&&p.catch) p.catch(function(){ if(done) done(); });
  }catch(e){ if(done) done(); }
}
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
var shared=function(a,b){ var n=0; for(var i=0;i<Math.min(a.length,b.length);i++) if(a[i]===b[i]) n++; return n; };

// Photo distractors: other photo words, closest spelling first (cat → hat, cap),
// so the child must read every letter rather than guess from the first one.
function photoChoices(target, strand){
  var others=shuffle(photosOf(strand).filter(function(w){ return w!==target; }))
    .sort(function(a,b){ return shared(b,target)-shared(a,target); });
  return shuffle([target, others[0], others[1]]);
}
// The differing letter between two same-length words (for the wrong-answer hint)
function diffAt(a,b){ for(var i=0;i<Math.max(a.length,b.length);i++) if(a[i]!==b[i]) return i<a.length?i:a.length-1; return -1; }
function spelled(word, mark){
  var s=el('span','spelled'); s.setAttribute('dir','ltr');
  word.split('').forEach(function(ch,i){ s.appendChild(el('span', i===mark?'hl':null, ch)); });
  return s;
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,items:[],misses:{},started:false};
var roundId=0;
window.__riState=function(){ var it=S.items[S.round]; return {lvl:S.lvl, round:S.round, n:S.items.length, target:it&&it.target, kind:it&&it.kind}; }; // test hook (read-only)

function plan(level){
  var reads=shuffle(level.read).slice(0,MAX_READ).map(function(w){ return {kind:'r', target:w, choices:photoChoices(w, STRAND(level))}; });
  var hears=shuffle(level.hear).slice(0,ROUNDS-reads.length).map(function(q){ return {kind:'h', target:q[0], choices:shuffle(q)}; });
  return reads.concat(hears);
}
function startLevel(i){ S.lvl=i; S.round=0; S.score=0; S.items=plan(LEVELS[i]); render(); }

function header(item){
  var lv=LEVELS[S.lvl], h=el('div','hud');
  var hl=el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length+' · '+T(['vowel','magicE','digraph'][STRAND(lv)-1])+' ');
  var tag=el('bdi','tag',lv.id.replace('_',STRAND(lv)===3?' · ':'_')); tag.setAttribute('dir','ltr'); hl.appendChild(tag);
  h.appendChild(hl);
  h.appendChild(el('div','hud-label', item.kind==='r'?T('readTap'):T('hearPick')));
  var dots=el('div','dots');
  for(var i=0;i<S.items.length;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots);
  return h;
}

function render(){
  var item=S.items[S.round], lv=LEVELS[S.lvl], my=++roundId;
  var live=function(){ return my===roundId; };
  app.textContent='';
  app.appendChild(header(item));
  var answered=false, fb, row;
  var opts=el('div', item.kind==='r'?'opts photos':'opts words');
  if(item.kind==='r'){
    var w=el('div','big-word',item.target); w.setAttribute('dir','ltr'); w.id='readWord';
    app.appendChild(w);
  } else {
    var say=el('button','big-say','🔊'); say.id='sayBtn'; say.type='button'; say.setAttribute('aria-label',T('again'));
    say.addEventListener('click',function(){ play(item.target); });
    app.appendChild(say);
  }
  item.choices.forEach(function(c){
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',c);
    if(item.kind==='r'){ var im=el('img'); im.src='/images/'+c+'.webp'; im.alt=''; im.width=160; im.height=160; b.appendChild(im); b.setAttribute('aria-label',c); }
    else { var t=el('span','opt-en',c); t.setAttribute('dir','ltr'); b.appendChild(t); }
    b.addEventListener('click',function(){
      if(answered) return; answered=true;
      var ok=c===item.target;
      beacon('cvc', lv.id+'_'+item.kind+'_'+(ok?'ok':'no'));
      var right=opts.querySelector('[data-word="'+item.target+'"]');
      if(ok){
        S.score++; b.classList.add('ok'); fb.textContent=T('right');
        play(item.target);
        setTimeout(function(){ if(live()) next(); }, 1100);
        return;
      }
      S.misses[lv.id]=(S.misses[lv.id]||0)+1;
      b.classList.add('no'); right.classList.add('ok');
      fb.textContent='';
      var at=diffAt(item.target,c);
      fb.appendChild(document.createTextNode(T(item.kind==='h'?'youHeard':'itSays')+': ')); fb.appendChild(spelled(item.target,at));
      if(item.kind==='h'){ fb.appendChild(document.createTextNode(' · '+T('youPicked')+': ')); fb.appendChild(spelled(c,at)); }
      play(item.target, function(){ if(item.kind==='h' && live()) setTimeout(function(){ if(live()) play(c); },350); });
      var nx=el('button','next',T('next')); nx.type='button'; nx.addEventListener('click',next);
      row.appendChild(nx);
    });
    opts.appendChild(b);
  });
  app.appendChild(opts);
  fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  row=el('div','row'); app.appendChild(row);
  if(S.round===0 && S.lvl===STRAND_START[STRAND(lv)]) app.appendChild(el('p','tip',T(['tip','tip2','tip3'][STRAND(lv)-1])));
  if(item.kind==='h') setTimeout(function(){ if(live()) play(item.target); }, 250);
}

function next(){
  roundId++;
  if(clip){ clip.onended=null; clip.pause(); }
  S.round++;
  if(S.round<S.items.length) return render();
  beacon('g_lvl','read-it');
  var stars=S.score===S.items.length?3:S.score>=S.items.length-2?2:1;
  app.textContent='';
  if(S.lvl===LEVELS.length-1){ beacon('g_cmp','read-it'); return renderEnd(); }
  var box=el('div','card');
  box.appendChild(el('div','stars','⭐'.repeat(stars)+'☆'.repeat(3-stars)));
  box.appendChild(el('h2',null,T('levelDone')));
  box.appendChild(el('p','score',S.score+' / '+S.items.length));
  var nx=el('button','primary',T('nextLevel')); nx.type='button'; nx.addEventListener('click',function(){ startLevel(S.lvl+1); });
  var again=el('button','ghost',T('retry')); again.type='button'; again.addEventListener('click',function(){ startLevel(S.lvl); });
  box.appendChild(nx); box.appendChild(again);
  app.appendChild(box); nx.focus();
}

function renderEnd(){
  var box=el('div','card');
  box.appendChild(el('h2',null,T('allDone')));
  var worst=null; LEVELS.forEach(function(l){ if((S.misses[l.id]||0)>(worst?S.misses[worst.id]:0)) worst=l; });
  if(worst){ box.appendChild(el('p',null,T('hardest'))); var w=el('p','hard',worst.id.replace('_',STRAND(worst)===3?' · ':'_')+' — '+worst.read[0]); w.setAttribute('dir','ltr'); box.appendChild(w); }
  else box.appendChild(el('p',null,T('allRight')));
  var again=el('button','primary',T('playAgain')); again.type='button';
  again.addEventListener('click',function(){ S.misses={}; startLevel(0); });
  box.appendChild(again);
  app.appendChild(box);
  if(window.CDE_END) CDE_END({game:'read-it',again:again,good:true}); // all levels done → next game leads
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

function go(lvl){
  if(!S.started){ S.started=true; beacon('g_start','read-it'); }
  document.getElementById('menu').hidden=true;
  startLevel(lvl);
}
document.getElementById('startBtn').addEventListener('click',function(){ go(0); });
// Strand chips: a child who already reads CVC words can jump to magic e or digraphs
Array.prototype.forEach.call(document.querySelectorAll('[data-strand]'),function(b){
  b.addEventListener('click',function(){ go(STRAND_START[+b.getAttribute('data-strand')]); });
});
})();
