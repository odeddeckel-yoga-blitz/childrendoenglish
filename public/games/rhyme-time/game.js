/* Rhyme Time (/games/rhyme-time/, wave 1, 11-07). A picture + word is shown and
   spoken ("cat"); the child taps the one of three pictures that RHYMES (hat).
   Options are pictures only (the word appears after the answer), so a child must
   listen to the ending, not match letters. A wrong tap plays both words (target,
   then the tapped one) and a one-line tip; a right tap plays the rhyming pair.
   Families are curated by PRONUNCIATION (American English), never by spelling:
   one rhymes with sun (not bone), bear/pear/chair rhyme, ear is not used.
   Level 1 = short-vowel families, level 2 = longer families, level 3 = all of
   them, and the wrong pictures start with the target's first sound or share its
   vowel sound, so only the ending tells them apart.
   Oracle guards: the answer's slot is uniform-random, the target's own picture is
   never an option, no distractor rhymes with the target (or is a near-rhyme like
   car/shark, tie/kite), and the answer is never the only photo among drawings or
   the only drawing among photos (STYLE below).
   Audio = /audio/<word>.mp3 via cdeSay (Piper TTS); every hand-off to the next
   round waits on cdeSayDone (kit §8g).
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open /
   g_start / g_lvl / g_cmp @ rhyme-time, and rt @ <level>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var LANG=window.CDE_LANG||'en';
var GAME='rhyme-time';

// rime families: [level, words]. Every word = CDE app word with a photo/drawing + audio.
var FAM={
  // level 1: short vowels
  at:[1,['cat','hat','bat']], ig:[1,['pig','fig']], en:[1,['hen','ten','pen']], an:[1,['van','can','fan']],
  un:[1,['sun','run','one']], et:[1,['net','jet','vet']], ed:[1,['bed','bread']], ox:[1,['fox','box','socks']],
  og:[1,['dog','frog']], ap:[1,['cap','map']], ag:[1,['bag','flag']], uck:[1,['duck','truck']],
  ad:[1,['sad','dad']], ock:[1,['clock','lock']], amp:[1,['lamp','stamp']], ing:[1,['king','ring']], est:[1,['nest','vest']],
  // level 2: longer families (long vowels, r-vowels, -all, -ouse)
  ake:[2,['snake','cake','lake']], ain:[2,['train','rain']], oat:[2,['goat','boat']], ar:[2,['car','star','jar']],
  ee:[2,['bee','tree','three','key','pea']], ite:[2,['kite','knight','write']], oon:[2,['moon','spoon','balloon']],
  all:[2,['ball','wall']], ouse:[2,['mouse','house']], ark:[2,['shark','park']], ice:[2,['rice','dice']],
  one:[2,['phone','bone','drone']], ie:[2,['tie','pie']], eep:[2,['sheep','jeep']], ail:[2,['nail','snail','whale','quail']],
  ate:[2,['plate','gate','eight']], air:[2,['bear','pear','chair']], oose:[2,['goose','juice']]
};
// near-rhymes (one rime = the other + a consonant): never a distractor for each other
var NEAR=[['ar','ark'],['ie','ite'],['ie','ice'],['ee','eep']];
// word → first sound, vowel sound, picture style (p = photo, d = drawing)
var PH={
  cat:'k ae p',hat:'h ae p',bat:'b ae p',pig:'p i p',fig:'f i p',hen:'h e p',ten:'t e d',pen:'p e p',van:'v ae p',can:'k ae d',fan:'f ae p',
  sun:'s u p',run:'r u p',one:'w u d',net:'n e p',jet:'j e p',vet:'v e d',bed:'b e p',bread:'b e p',fox:'f o p',box:'b o d',socks:'s o p',
  dog:'d aw p',frog:'f aw p',cap:'k ae d',map:'m ae d',bag:'b ae p',flag:'f ae d',duck:'d u p',truck:'t u p',sad:'s ae d',dad:'d ae d',
  clock:'k o p',lock:'l o p',lamp:'l ae p',stamp:'s ae p',king:'k i p',ring:'r i p',nest:'n e p',vest:'v e p',
  snake:'s ei p',cake:'k ei p',lake:'l ei p',train:'t ei p',rain:'r ei p',goat:'g ou p',boat:'b ou p',car:'k ar p',star:'s ar d',jar:'j ar d',
  bee:'b ii p',tree:'t ii p',three:'th ii d',key:'k ii p',pea:'p ii p',kite:'k ai p',knight:'n ai d',write:'r ai p',
  moon:'m uu p',spoon:'s uu p',balloon:'b uu d',ball:'b aw p',wall:'w aw p',mouse:'m au p',house:'h au p',shark:'sh ar p',park:'p ar p',
  rice:'r ai p',dice:'d ai p',phone:'f ou p',bone:'b ou d',drone:'d ou p',tie:'t ai p',pie:'p ai p',sheep:'sh ii p',jeep:'j ii p',
  nail:'n ei p',snail:'s ei p',whale:'w ei p',quail:'k ei p',plate:'p ei p',gate:'g ei p',eight:'- ei d',bear:'b air p',pear:'p air p',chair:'ch air p',
  goose:'g uu p',juice:'j uu p'
};
var RIME={}; Object.keys(FAM).forEach(function(f){ FAM[f][1].forEach(function(w){ RIME[w]=f; }); });
// picture style comes from the site-wide map (public/games/image-style.js, generated from IMAGE_SOURCES) when loaded;
// the third PH tag is the fallback
var ph=function(w){ var a=PH[w].split(' '); var st=window.CDE_DRAWN?(window.CDE_DRAWN.indexOf(w)>=0?'d':'p'):a[2]; return {on:a[0],vo:a[1],st:st}; };
var near=function(a,b){ return NEAR.some(function(p){ return (p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a); }); };
var LEVELS=[{id:'short'},{id:'long'},{id:'mixed'}];
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
beacon('g_open',GAME);

function tts(w){ try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(w); u.lang='en-US'; u.rate=0.85; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){} }
function say(w){ if(window.cdeSay) window.cdeSay(w,function(){ tts(w); }); else tts(w); }
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(1800,cb); else setTimeout(cb,900); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words, names or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };
// fill {t} {r} {w} in a translated line with English words, each bidi-isolated
function fill(s,o){ return s.replace(/\{(\w)\}/g,function(m,k){ return '⁦'+(o[k]||'')+'⁩'; }); }

// Distractors for a target. Never: a word of the target's family, a near-rhyme, a repeat of a rime.
// Levels 1–2: words from the same level with a DIFFERENT vowel sound (easy to hear apart).
// Level 3: words that share the target's first sound or vowel sound (only the ending differs).
function candidates(target, lvl){
  var r=RIME[target], p=ph(target);
  return Object.keys(RIME).filter(function(w){
    var f=RIME[w], q=ph(w);
    if(f===r||near(f,r)) return false;
    if(lvl<2) return FAM[f][0]===lvl+1 && q.vo!==p.vo;
    return q.on===p.on || q.vo===p.vo;
  });
}
// one dealt round: {target, answer, options[3], fam}
function deal(fam, lvl){
  var words=FAM[fam][1];
  // level 3: a target needs 2+ hard distractors (three, sheep, shark, chair have fewer: they are only answers there)
  var targets=lvl===2?words.filter(function(w){ return candidates(w,lvl).length>=2; }):words;
  if(!targets.length) return null;
  for(var tries=0;tries<60;tries++){
    var target=pick(targets), answer=pick(words.filter(function(w){ return w!==target; }));
    var c=shuffle(candidates(target,lvl));
    var st=ph(answer).st;
    // level 3: lead with a vowel-sharing distractor when there is one
    if(lvl===2){ var v=c.filter(function(w){ return ph(w).vo===ph(target).vo; }); if(v.length) c=[v[0]].concat(c.filter(function(w){ return w!==v[0]; })); }
    var d1=null,d2=null;
    for(var i=0;i<c.length&&!d2;i++){
      var w=c[i];
      if(d1&&(RIME[w]===RIME[d1]||near(RIME[w],RIME[d1]))) continue;
      if(!d1){ d1=w; continue; }
      // the answer's picture style must be shared by at least one distractor
      if(ph(d1).st!==st && ph(w).st!==st) continue;
      d2=w;
    }
    if(d2) return {fam:fam, target:target, answer:answer, options:shuffle([answer,d1,d2])};
  }
  return null;
}
function famsOf(lvl){ return Object.keys(FAM).filter(function(f){ return lvl===2 || FAM[f][0]===lvl+1; }); }
function plan(lvl){
  var fams=shuffle(famsOf(lvl)), out=[];
  if(lvl===2){ // mixed: half short, half long families
    var s=fams.filter(function(f){ return FAM[f][0]===1; }), l=fams.filter(function(f){ return FAM[f][0]===2; });
    fams=shuffle(s.slice(0,ROUNDS/2).concat(l.slice(0,ROUNDS/2)));
  }
  for(var i=0;i<fams.length&&out.length<ROUNDS;i++){ var r=deal(fams[i],lvl); if(r) out.push(r); }
  return out;
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:{},answered:false,started:false};
var roundId=0;

function startLevel(i){ S.lvl=i; S.round=0; S.score=0; S.rounds=plan(i); render(); }

function header(){
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length+' · '+T('lv'+(S.lvl+1))));
  var dots=el('div','dots');
  for(var i=0;i<S.rounds.length;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots);
  return h;
}
function img(w,size){ var im=el('img'); im.src='/images/'+w+'.webp'; im.alt=''; im.width=size; im.height=size; im.draggable=false; return im; }

function render(){
  var r=S.rounds[S.round], my=++roundId;
  var live=function(){ return my===roundId; };
  S.answered=false;
  app.textContent='';
  app.appendChild(header());
  var tg=el('div','target'); tg.id='rtTarget'; tg.setAttribute('data-word',r.target);
  tg.appendChild(img(r.target,120));
  var side=el('div','tside');
  var tw=el('div','tword',r.target); tw.setAttribute('dir','ltr'); tw.setAttribute('lang','en'); side.appendChild(tw);
  var sb=elh('button','say',IC('volume-2')); sb.type='button'; sb.id='sayBtn'; sb.setAttribute('aria-label',T('again'));
  sb.addEventListener('click',function(){ say(r.target); });
  side.appendChild(sb); tg.appendChild(side);
  app.appendChild(tg);
  app.appendChild(el('p','prompt',T('prompt')));
  var opts=el('div','opts'); opts.setAttribute('dir','ltr');
  var fb, row, cards={};
  r.options.forEach(function(w){
    var c=el('div','optc');
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',w); b.setAttribute('aria-label',w);
    b.appendChild(img(w,160));
    var hear=el('button','hear'); hear.type='button'; hear.setAttribute('aria-label',T('hearIt'));
    hear.innerHTML=IC('volume-2');
    var lab=el('span','lab',w); lab.setAttribute('lang','en'); hear.appendChild(lab);
    hear.addEventListener('click',function(){ say(w); });
    b.addEventListener('click',function(){ choose(w); });
    c.appendChild(b); c.appendChild(hear); opts.appendChild(c); cards[w]=b;
  });
  app.appendChild(opts);
  fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  row=el('div','row'); app.appendChild(row);

  function choose(w){
    if(S.answered||!live()) return; S.answered=true;
    var ok=w===r.answer;
    beacon('rt',LEVELS[S.lvl].id+'_'+(ok?'ok':'no'));
    opts.classList.add('done');
    cards[r.answer].classList.add('ok');
    // both words, one after the other: the target, then the tapped picture
    var both=function(second,after){
      if(!live()) return;
      say(r.target);
      sayDone(function(){ if(!live()) return; setTimeout(function(){ if(!live()) return; say(second); if(after) sayDone(function(){ if(live()) after(); }); },120); });
    };
    if(ok){
      S.score++;
      fb.innerHTML=T('right')+' ';
      var pair=el('b','en',r.target+' · '+r.answer); pair.setAttribute('dir','ltr'); fb.appendChild(pair);
      both(r.answer,function(){ setTimeout(function(){ if(live()) next(); },350); });
      return;
    }
    S.misses[LEVELS[S.lvl].id]=(S.misses[LEVELS[S.lvl].id]||0)+1;
    cards[w].classList.add('no');
    fb.textContent=fill(T('tipNo'),{t:r.target,r:r.answer,w:w});
    var again=elh('button','ghost',T('hearBoth')); again.type='button';
    again.addEventListener('click',function(){ both(w); });
    var nx=elh('button','next',T('next')); nx.type='button'; nx.id='nextBtn';
    nx.addEventListener('click',function(){ nx.disabled=true; sayDone(function(){ if(live()) next(); }); });
    row.appendChild(again); row.appendChild(nx);
    both(w);
  }
  S.choose=choose;
  setTimeout(function(){ if(live()) say(r.target); }, 250);
}

function next(){
  roundId++;
  S.round++;
  if(S.round<S.rounds.length) return render();
  beacon('g_lvl',GAME);
  var n=S.rounds.length, stars=S.score===n?3:S.score>=n-2?2:1;
  app.textContent='';
  if(S.lvl===LEVELS.length-1){ beacon('g_cmp',GAME); return renderEnd(); }
  var box=el('div','card');
  var st=el('div','stars'); for(var i=0;i<3;i++) st.appendChild(elh('span',i<stars?'on':'off',IC('star')));
  box.appendChild(st);
  box.appendChild(el('h2',null,T('levelDone')));
  var sc=el('p','score',S.score+' / '+n); sc.setAttribute('dir','ltr'); box.appendChild(sc);
  var nx=elh('button','primary',T('nextLevel')); nx.type='button'; nx.id='nextLevelBtn'; nx.addEventListener('click',function(){ startLevel(S.lvl+1); });
  var again=elh('button','ghost',T('retry')); again.type='button'; again.addEventListener('click',function(){ startLevel(S.lvl); });
  box.appendChild(nx); box.appendChild(again);
  app.appendChild(box); nx.focus();
}

function renderEnd(){
  var box=el('div','card');
  box.appendChild(elh('h2',null,T('allDone')));
  var worst=null; LEVELS.forEach(function(l){ if((S.misses[l.id]||0)>(worst?S.misses[worst.id]:0)) worst=l; });
  box.appendChild(el('p',null, worst ? T('hardest')+' '+T('lv'+(LEVELS.indexOf(worst)+1)) : T('allRight')));
  var again=elh('button','primary',T('playAgain')); again.type='button';
  again.addEventListener('click',function(){ S.misses={}; startLevel(0); });
  box.appendChild(again);
  app.appendChild(box);
  if(window.CDE_END) CDE_END({game:GAME,again:again,good:true}); // all levels done → next game leads
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

function go(lvl){
  if(!S.started){ S.started=true; beacon('g_start',GAME); }
  document.getElementById('menu').hidden=true;
  document.body.classList.add('playing');
  startLevel(lvl);
}
document.getElementById('startBtn').addEventListener('click',function(){ go(0); });

/* test/debug contract (real input paths only) */
window.RT={
  get state(){ return S; },
  FAM:FAM, PH:PH, NEAR:NEAR, RIME:RIME,
  dbg:{
    get round(){ var r=S.rounds[S.round]; return r?{target:r.target,answer:r.answer,options:r.options.slice(),fam:r.fam}:null; },
    get lvl(){ return S.lvl; },
    // many dealt rounds for a level, without touching the screen (oracle checks)
    dealForTest:function(lvl,n){ var out=[]; while(out.length<n) out=out.concat(plan(lvl)); return out.slice(0,n); },
    // every family member as target: can a level-3 round be dealt for it?
    candidatesForTest:function(w,lvl){ return candidates(w,lvl); },
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return; var b=app.querySelector('.opt[data-word="'+r.answer+'"]'); if(b) b.click(); },
    wrongForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return; var w=r.options.filter(function(o){ return o!==r.answer; })[0]; var b=app.querySelector('.opt[data-word="'+w+'"]'); if(b) b.click(); }
  }
};
})();
