/* Missing Letter (/games/missing-letter/, wave 1, 11-07). A picture, the word spoken (/audio/<word>.mp3, Piper TTS,
   via word-audio.js) and the word with one letter missing (c_t). The child taps the missing letter.
   Level 1: the short vowel of a 3-letter word (4 vowel buttons).
   Level 2: the first or last letter; the decoys are its look-alike / sound-alike group (b d p · m n w · c k s).
   Level 3: a letter inside a 4–6 letter word; a vowel gap gets vowel decoys, a consonant gap its group's letters.
   Oracle rules (asserted in e2e/missing-letter.spec.js over many deals):
   · a decoy never spells another word of this game (cap/cup, net/nut) or a word on BLOCK (rude words, words the
     picture could also be, and for level 3 every dictionary word a decoy would make: level 3 decoys are non-words);
   · a gap's decoys are always the same kind of letter as the answer (never a consonant against a vowel), so the gap
     can't be solved by elimination; no gap inside qu / ck / a double letter;
   · the right button's position is uniform random, nothing is highlighted before the first tap.
   A wrong tap puts the right letter in the gap and says the word again; the child then taps that letter to go on
   (only first-try answers score). Beacons (cookieless aggregates, same guards as land-beacon.js):
   g_open / g_start / g_lvl / g_cmp @ missing-letter. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var LANG=window.CDE_LANG||'en';
var ID='missing-letter';

var GROUPS={V:'aeiou',BDP:'bdp',MN:'mnw',CK:'cks'};
// [word, gap index, letter group] — words = CDE app words with a picture and audio (checked in the spec)
var LEVELS=[
  {id:'vowel', opts:4, items:'cat dog pig hen bed bus van sun pen bat net fox jam nut jet bag box fan map cab hat yak'.split(' ').map(function(w){ return [w,1,'V']; })},
  {id:'edge', opts:3, items:[
    ['bed',0,'BDP'],['bag',0,'BDP'],['bat',0,'BDP'],['ball',0,'BDP'],['book',0,'BDP'],['bell',0,'BDP'],['boat',0,'BDP'],['dog',0,'BDP'],
    ['duck',0,'BDP'],['door',0,'BDP'],['doll',0,'BDP'],['pig',0,'BDP'],['pen',0,'BDP'],['potato',0,'BDP'],['pizza',0,'BDP'],['panda',0,'BDP'],
    ['bed',2,'BDP'],['cup',2,'BDP'],['map',2,'BDP'],['jeep',3,'BDP'],['ship',3,'BDP'],['bird',3,'BDP'],
    ['moon',0,'MN'],['mouse',0,'MN'],['mask',0,'MN'],['milk',0,'MN'],['monkey',0,'MN'],['mango',0,'MN'],['nest',0,'MN'],['net',0,'MN'],
    ['nut',0,'MN'],['nurse',0,'MN'],['nail',0,'MN'],['wolf',0,'MN'],['worm',0,'MN'],['wall',0,'MN'],['watch',0,'MN'],['water',0,'MN'],['wagon',0,'MN'],
    ['drum',3,'MN'],['hen',2,'MN'],['sun',2,'MN'],['pen',2,'MN'],['van',2,'MN'],['fan',2,'MN'],['jam',2,'MN'],['can',2,'MN'],['moon',3,'MN'],
    ['broom',4,'MN'],['queen',4,'MN'],['lemon',4,'MN'],['lion',3,'MN'],
    ['cat',0,'CK'],['cup',0,'CK'],['cap',0,'CK'],['can',0,'CK'],['car',0,'CK'],['cake',0,'CK'],['comb',0,'CK'],['corn',0,'CK'],['cave',0,'CK'],
    ['candle',0,'CK'],['carrot',0,'CK'],['camel',0,'CK'],['kite',0,'CK'],['king',0,'CK'],['key',0,'CK'],['kiwi',0,'CK'],['kettle',0,'CK'],
    ['koala',0,'CK'],['kayak',0,'CK']]},
  {id:'middle', opts:4, items:[
    ['lemon',1,'V'],['camel',1,'V'],['robot',1,'V'],['tiger',1,'V'],['wagon',1,'V'],['hippo',1,'V'],['rabbit',1,'V'],['carrot',1,'V'],
    ['pencil',1,'V'],['monkey',1,'V'],['button',1,'V'],['tomato',3,'V'],['dragon',2,'V'],['lizard',1,'V'],['spider',2,'V'],
    ['zebra',2,'BDP'],['robot',2,'BDP'],['spider',3,'BDP'],['panda',3,'BDP'],['table',2,'BDP'],['lemon',2,'MN'],['tomato',2,'MN'],
    ['banana',2,'MN'],['pencil',3,'CK'],['donkey',3,'CK'],['monkey',3,'CK']]}
];
// A decoy may never make one of these: this game's own words (cap/cup), rude or unkind words, a word the picture
// could also be, and (level 3) the dictionary words a decoy would otherwise make — level 3 decoys are non-words.
var BLOCK={};
LEVELS.forEach(function(l){ l.items.forEach(function(it){ BLOCK[it[0]]=1; }); });
'cop hun fag wap pee poo pus pox sow mum lamb ribbit spader penda pinda canel'.split(' ').forEach(function(w){ BLOCK[w]=1; });
var ROUNDS=8;

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

function tts(w){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(w); u.lang='en-US'; u.rate=0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function say(w){ if(window.cdeSay) window.cdeSay(w,function(){ tts(w); }); else tts(w); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

// the letters that may stand in the gap besides the answer
function decoys(it){
  var w=it[0], i=it[1], c=w[i];
  return GROUPS[it[2]].split('').filter(function(l){ return l!==c && !BLOCK[w.slice(0,i)+l+w.slice(i+1)]; });
}
// one dealt round: the item + its shuffled buttons (the right one at a uniform random place)
// (a 3-letter group always gives 3 buttons: level 3 consonant gaps)
function nOpts(lv,it){ return Math.min(lv.opts, GROUPS[it[2]].length); }
function deal(lv,it){
  var ds=shuffle(decoys(it)).slice(0,nOpts(lv,it)-1);
  return {word:it[0], gap:it[1], group:it[2], answer:it[0][it[1]], options:shuffle(ds.concat(it[0][it[1]]))};
}
// 8 rounds, no word twice; level 2 takes turns between its letter groups, level 3 between vowel and consonant gaps
function plan(li){
  var lv=LEVELS[li], key=function(it){ return li===2?(it[2]==='V'?'V':'C'):it[2]; };
  var by={}, order=[];
  shuffle(lv.items).forEach(function(it){ var k=key(it); if(!by[k]){ by[k]=[]; order.push(k); } by[k].push(it); });
  order=shuffle(order);
  var out=[], used={}, guard=0;
  while(out.length<ROUNDS && guard++<200){
    var k=order[guard%order.length], q=by[k];
    while(q.length && used[q[0][0]]) q.shift();
    if(q.length){ var it=q.shift(); used[it[0]]=1; out.push(deal(lv,it)); }
  }
  return shuffle(out);
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,total:0,rounds:[],missed:false,done:false,started:false};
window.S=S; // game-clicks.js reads S.lvl (0-based)
var roundId=0, cur=null;

function startLevel(i){ S.lvl=i; S.round=0; S.score=0; S.rounds=plan(i); render(); }

function render(){
  var r=S.rounds[S.round], my=++roundId;
  var live=function(){ return my===roundId; };
  S.missed=false; S.done=false;
  app.textContent='';
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  h.appendChild(el('div','hud-label',T('lv'+S.lvl)));
  var dots=el('div','dots');
  for(var i=0;i<ROUNDS;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots); app.appendChild(h);
  var im=el('img','pic'); im.src='/images/'+r.word+'.webp'; im.alt=''; im.width=230; im.height=230; im.draggable=false;
  app.appendChild(im);
  var row=el('div','word-row');
  var gw=el('div','gap-word'); gw.setAttribute('lang','en'); gw.setAttribute('dir','ltr');
  gw.appendChild(document.createTextNode(r.word.slice(0,r.gap)));
  var blank=el('span','blank',' '); gw.appendChild(blank);
  gw.appendChild(document.createTextNode(r.word.slice(r.gap+1)));
  row.appendChild(gw);
  var sb=elh('button','say',IC('volume-2')); sb.id='sayBtn'; sb.type='button'; sb.setAttribute('aria-label',T('again'));
  sb.addEventListener('click',function(){ say(r.word); });
  row.appendChild(sb); app.appendChild(row);
  var opts=el('div','opts n'+r.options.length);
  var fb;
  r.options.forEach(function(l){
    var b=el('button','opt',l); b.type='button'; b.setAttribute('data-letter',l); b.setAttribute('lang','en');
    b.addEventListener('click',function(){
      if(S.done||b.disabled) return;
      if(l===r.answer){
        S.done=true;
        if(!S.missed){ S.score++; S.total++; }
        b.classList.add('ok'); blank.textContent=l; blank.className='blank filled';
        fb.innerHTML=T('right');
        say(r.word);
        setTimeout(function(){ if(!live()) return; if(window.cdeSayDone) window.cdeSayDone(1800,function(){ if(live()) next(); }); else next(); }, 900);
        return;
      }
      // wrong: show the right letter in the gap, say the word again, and wait for the child to tap it
      S.missed=true;
      b.classList.add('no'); b.disabled=true; b.setAttribute('aria-disabled','true');
      blank.textContent=r.answer; blank.className='blank shown';
      var parts=T('nowTap').split('{L}');
      fb.textContent='';
      parts.forEach(function(p,j){ fb.appendChild(document.createTextNode(p)); if(j<parts.length-1) fb.appendChild(el('b','en',r.answer)); });
      say(r.word);
    });
    opts.appendChild(b);
  });
  app.appendChild(opts);
  fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));
  cur=r;
  setTimeout(function(){ if(live()) say(r.word); }, 250);
}

function stars(n){
  var s=n===ROUNDS?3:n>=ROUNDS-2?2:1, box=el('div','stars');
  for(var i=0;i<3;i++){ var sp=elh('span',i<s?'on':'off',IC('star')); box.appendChild(sp); }
  return box;
}

function next(){
  roundId++;
  S.round++;
  if(S.round<ROUNDS) return render();
  cur=null;
  beacon('g_lvl',ID);
  app.textContent='';
  if(S.lvl===LEVELS.length-1){ beacon('g_cmp',ID); return renderEnd(); }
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
  box.appendChild(el('p',null,T('firstTry')));
  var sc=el('p','score',S.total+' / '+(ROUNDS*LEVELS.length)); sc.setAttribute('dir','ltr'); box.appendChild(sc);
  var again=elh('button','primary',T('playAgain')); again.type='button';
  again.addEventListener('click',function(){ S.total=0; startLevel(0); });
  box.appendChild(again);
  app.appendChild(box);
  if(window.CDE_END) CDE_END({game:ID,again:again,good:true}); // all levels done → next game leads
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

document.getElementById('startBtn').addEventListener('click',function(){
  if(!S.started){ S.started=true; beacon('g_start',ID); }
  document.getElementById('menu').hidden=true;
  startLevel(0);
});

/* ---------- test/debug contract (real input paths only) ---------- */
function btn(l){ return app.querySelector('.opt[data-letter="'+l+'"]'); }
window.ML={
  S:S, LEVELS:LEVELS, BLOCK:BLOCK, GROUPS:GROUPS,
  dbg:{
    get lvl(){ return S.lvl; },
    get round(){ return S.round; },
    get item(){ return cur; },
    get score(){ return S.score; },
    get total(){ return S.total; },
    get missed(){ return S.missed; },
    plan:plan, nOpts:function(li,it){ return nOpts(LEVELS[li],it); }, deal:function(li,it){ return deal(LEVELS[li],it); }, decoys:decoys,
    startLevel:startLevel,
    /* tap the right letter through the real button */
    solveForTest:function(){ if(cur&&!S.done){ var b=btn(cur.answer); if(b) b.click(); } },
    /* tap one wrong letter through the real button (a real miss) */
    wrongForTest:function(){ if(!cur||S.done) return; var l=cur.options.filter(function(x){ var b=btn(x); return x!==cur.answer&&b&&!b.disabled; })[0]; if(l) btn(l).click(); }
  }
};
})();
