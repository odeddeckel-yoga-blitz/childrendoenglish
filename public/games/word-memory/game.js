/* Word Memory (/games/word-memory/, wave 1, 11-07) — a memory (concentration) game.
   Face-down cards: half are pictures, half are the English words. Flip two; a picture
   with its own word is a pair. A word card says its word when it turns over, and a
   found pair says the word again if the word was turned first. Levels: 3, 4 and 6 pairs
   (6 / 8 / 12 cards), all from one topic per run (menu picker or ?topic=; "mixed" = all).
   Stars by moves (one move = two cards turned).
   No oracle: a face-down card carries nothing about its face — same markup, same class,
   a generic "card N, face down" label; the picture/word node is created only when the card
   turns and removed when it turns back. Deal = Fisher-Yates (uniform); nothing starts up.
   Speech: a tap waits for the word still playing (cdeSayDone) before the next card turns,
   a wrong pair turns back only after its word ends, and a level ends only after the last
   word — a word never runs over the next card.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start /
   g_lvl / g_cmp @ word-memory. Test hook: window.WM (S, dbg.solveForTest()). */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var LANG=window.CDE_LANG||'en';

// [id (= /images/<id>.webp and /audio/<id>.mp3), shown word, he, es] — CDE words with a photo and audio
var TOPICS={
  animals:[
    ["cat","cat","חתול","gato"],
    ["dog","dog","כלב","perro"],
    ["fish","fish","דג","pez"],
    ["bird","bird","ציפור","pájaro"],
    ["rabbit","rabbit","ארנב","conejo"],
    ["horse","horse","סוס","caballo"],
    ["cow","cow","פרה","vaca"],
    ["duck","duck","ברווז","pato"],
    ["pig","pig","חזיר","cerdo"],
    ["frog","frog","צפרדע","rana"],
    ["bear","bear","דוב","oso"],
    ["sheep","sheep","כבשה","oveja"],
    ["monkey","monkey","קוף","mono"],
    ["bee","bee","דבורה","abeja"],
    ["elephant","elephant","פיל","elefante"],
    ["giraffe","giraffe","ג'ירפה","jirafa"],
    ["lion","lion","אריה","león"],
    ["penguin","penguin","פינגווין","pingüino"],
    ["turtle","turtle","צב","tortuga"],
    ["snake","snake","נחש","serpiente"]
  ],
  food:[
    ["apple","apple","תפוח","manzana"],
    ["banana","banana","בננה","banana"],
    ["bread","bread","לחם","pan"],
    ["milk","milk","חלב","leche"],
    ["egg","egg","ביצה","huevo"],
    ["cake","cake","עוגה","pastel"],
    ["cheese","cheese","גבינה","queso"],
    ["corn","corn","תירס","maíz"],
    ["tomato","tomato","עגבנייה","tomate"],
    ["pizza","pizza","פיצה","pizza"],
    ["carrot","carrot","גזר","zanahoria"],
    ["watermelon","watermelon","אבטיח","sandía"],
    ["strawberry","strawberry","תות","fresa"],
    ["cookie","cookie","עוגיה","galleta"],
    ["burger","burger","המבורגר","hamburguesa"]
  ],
  toys:[
    ["drum","drum","תוף","tambor"],
    ["kite","kite","עפיפון","cometa"],
    ["doll","doll","בובה","muñeca"],
    ["balloon","balloon","בלון","globo"],
    ["bubbles","bubbles","בועות","burbujas"],
    ["skateboard","skateboard","סקייטבורד","patineta"],
    ["puzzle","puzzle","פאזל","rompecabezas"],
    ["robot","robot","רובוט","robot"],
    ["dice","dice","קוביות משחק","dados"],
    ["jump-rope","jump rope","חבל קפיצה","cuerda de saltar"],
    ["tricycle","tricycle","תלת אופן","triciclo"],
    ["frisbee","frisbee","פריזבי","frisbee"]
  ],
  home:[
    ["house","house","בית","casa"],
    ["bed","bed","מיטה","cama"],
    ["chair","chair","כיסא","silla"],
    ["table","table","שולחן","mesa"],
    ["door","door","דלת","puerta"],
    ["window","window","חלון","ventana"],
    ["lamp","lamp","מנורה","lámpara"],
    ["clock","clock","שעון","reloj"],
    ["mirror","mirror","מראה","espejo"],
    ["sofa","sofa","ספה","sofá"],
    ["fridge","fridge","מקרר","refrigerador"],
    ["oven","oven","תנור","horno"],
    ["bathtub","bathtub","אמבטיה","bañera"],
    ["pillow","pillow","כרית","almohada"]
  ],
  clothing:[
    ["hat","hat","כובע","sombrero"],
    ["shirt","shirt","חולצה","camisa"],
    ["shoes","shoes","נעליים","zapatos"],
    ["dress","dress","שמלה","vestido"],
    ["socks","socks","גרביים","calcetines"],
    ["jacket","jacket","ז'קט","chaqueta"],
    ["gloves","gloves","כפפות","guantes"],
    ["scarf","scarf","צעיף","bufanda"],
    ["sweater","sweater","סוודר","suéter"],
    ["umbrella","umbrella","מטריה","paraguas"],
    ["sunglasses","sunglasses","משקפי שמש","lentes de sol"],
    ["jeans","jeans","ג'ינס","jeans"],
    ["shorts","shorts","מכנסיים קצרים","pantalones cortos"],
    ["belt","belt","חגורה","cinturón"],
    ["helmet","helmet","קסדה","casco"]
  ],
  transport:[
    ["car","car","מכונית","carro"],
    ["bus","bus","אוטובוס","autobús"],
    ["bicycle","bicycle","אופניים","bicicleta"],
    ["airplane","airplane","מטוס","avión"],
    ["train","train","רכבת","tren"],
    ["truck","truck","משאית","camión"],
    ["boat","boat","סירה","bote"],
    ["helicopter","helicopter","מסוק","helicóptero"],
    ["motorcycle","motorcycle","אופנוע","motocicleta"],
    ["tractor","tractor","טרקטור","tractor"],
    ["rocket","rocket","רקטה","cohete"],
    ["ambulance","ambulance","אמבולנס","ambulancia"],
    ["scooter","scooter","קורקינט","patinete"],
    ["submarine","submarine","צוללת","submarino"]
  ]
};
var LEVELS=[3,4,6]; // pairs per level
var ORDER=['animals','food','toys','home','clothing','transport','mixed'];

function beacon(ev,item){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(!navigator.sendBeacon) return;
    var l=LANG==='he'||LANG==='es'?LANG:'en';
    navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:item}], l:l}));
  }catch(e){}
}
beacon('g_open','word-memory');

function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words, names or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };
function fill(s,o){ return String(s).replace(/\{(\w)\}/g,function(m,k){ return o[k]!=null?o[k]:m; }); }

function pool(topic){
  if(topic!=='mixed') return TOPICS[topic];
  var all=[]; ORDER.forEach(function(t){ if(TOPICS[t]) all=all.concat(TOPICS[t]); }); return all;
}
function tts(word){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(word); u.lang='en-US'; u.rate=0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
// The word starts a frame AFTER its card is drawn (show, then say); until then sayDone counts it as playing.
// The device voice is only a stand-in for a clip that failed to load, and only for the current word: a clip
// cut short by the next word must not come back as TTS.
var sayTok=0, sayPending=false;
function say(w){
  var my=++sayTok; sayPending=true;
  requestAnimationFrame(function(){ setTimeout(function(){
    sayPending=false; if(my!==sayTok) return;
    if(window.cdeSay) cdeSay(w[0],function(){ if(my===sayTok) tts(w[1]); }); else tts(w[1]);
  },30); });
}
function sayDone(cap,cb){
  if(sayPending) return setTimeout(function(){ sayDone(cap,cb); },40);
  if(window.cdeSayDone) cdeSayDone(cap,cb); else cb();
}

var app=document.getElementById('app');
var TOPIC=(function(){ try{ var q=new URLSearchParams(location.search).get('topic'); return (TOPICS[q]||q==='mixed')?q:'animals'; }catch(e){ return 'animals'; } })();
var S={lvl:0,topic:TOPIC,deck:[],up:[],found:0,moves:0,lock:false,phase:'menu',used:{},stars:[],totalMoves:0,started:false};
var cards=[], board=null, hud=null, boardId=0, tapQ=[], busy=false;

// n words for a level: unused ones first (a run of 13 pairs repeats nothing when the topic has 13+)
function pickWords(n){
  var p=shuffle(pool(S.topic)), fresh=p.filter(function(w){ return !S.used[w[0]]; }), old=p.filter(function(w){ return S.used[w[0]]; });
  var out=fresh.concat(old).slice(0,n); out.forEach(function(w){ S.used[w[0]]=1; }); return out;
}
function deal(words){
  var d=[]; words.forEach(function(w){ d.push({w:w,kind:'p',up:false,done:false}); d.push({w:w,kind:'w',up:false,done:false}); });
  return shuffle(d);
}
function preload(words){
  // in alphabetical order, off-DOM: the cache order says nothing about where a card lies
  words.map(function(w){ return w[0]; }).sort().forEach(function(id){ var im=new Image(); im.src='/images/'+id+'.webp'; });
}

function startLevel(i){
  boardId++; tapQ=[]; busy=false;
  S.lvl=i; S.found=0; S.moves=0; S.up=[]; S.lock=false; S.phase='play';
  var words=pickWords(LEVELS[i]);
  S.deck=deal(words); preload(words);
  document.body.classList.add('playing');
  render();
}

function hudHtml(){
  hud.textContent='';
  var a=el('span'); a.appendChild(document.createTextNode(T('level')+' ')); a.appendChild(el('b',null,(S.lvl+1)+' '+T('of')+' '+LEVELS.length)); hud.appendChild(a);
  var b=el('span'); b.appendChild(document.createTextNode(T('moves')+': ')); var bm=el('b',null,String(S.moves)); bm.id='wmMoves'; b.appendChild(bm); hud.appendChild(b);
  var c=el('span'); c.appendChild(document.createTextNode(T('pairs')+': ')); c.appendChild(el('b',null,S.found+' / '+LEVELS[S.lvl])); hud.appendChild(c);
  hud.querySelectorAll('b').forEach(function(x){ x.setAttribute('dir','ltr'); });
}

function render(){
  app.textContent='';
  hud=el('div','hud'); hud.id='wmHud'; app.appendChild(hud); hudHtml();
  board=el('div','board'); board.id='wmBoard'; board.setAttribute('dir','ltr'); app.appendChild(board);
  cards=S.deck.map(function(c,i){
    var b=el('button','mc'); b.type='button'; b.setAttribute('data-i',String(i));
    b.setAttribute('aria-label',fill(T('cardDown'),{n:i+1}));
    b.appendChild(elh('span','back',IC('sparkles')));
    b.addEventListener('click',function(){ tap(i); });
    board.appendChild(b); return b;
  });
  if(S.lvl===0) app.appendChild(el('p','tip',T('tip')));
  fit();
}

// biggest cards that fit the screen (phone: 12 cards in 3x4, cards >= 44 px; projector: 4x3)
function fit(){
  if(!board||!board.isConnected) return;
  var n=cards.length, g=8;
  var W=Math.min(app.clientWidth||window.innerWidth-32, 1100);
  var tip=app.querySelector('.tip'), tipH=tip?tip.offsetHeight+8:0;
  var top=board.getBoundingClientRect().top+(window.scrollY||0);
  var H=Math.max(120, window.innerHeight-top-tipH-10);
  var best=null;
  for(var c=2;c<=Math.min(n,6);c++){
    var r=Math.ceil(n/c), cw=(W-g*(c-1))/c, ch=(H-g*(r-1))/r, s=Math.min(cw,ch);
    if(!best||s>best.s) best={c:c,cw:cw,ch:ch,s:s};
  }
  var w=Math.floor(Math.max(44,Math.min(best.cw,best.ch*1.1,240)));
  var h=Math.floor(Math.max(44,Math.min(best.ch,w*1.3)));
  board.style.gridTemplateColumns='repeat('+best.c+','+w+'px)';
  board.style.gridAutoRows=h+'px';
  S.cardW=w; S.cardH=h;
  cards.forEach(function(b){ var t=b.querySelector('.w'); if(t) sizeWord(t); });
}
function sizeWord(t){
  var len=t.textContent.length||1;
  t.style.fontSize=Math.max(12,Math.floor(Math.min(S.cardH*0.26,(S.cardW-14)/(len*0.6))))+'px';
}
window.addEventListener('resize',function(){ if(S.phase==='play') fit(); });

function tap(i){
  if(S.phase!=='play') return;
  var c=S.deck[i];
  if(!c||c.up||c.done||S.lock) return;
  if(tapQ.indexOf(i)>=0||tapQ.length+S.up.length>=2) return;
  tapQ.push(i); cards[i].classList.add('wait');
  pump();
}
// one card at a time, each after the word still playing has ended (kit §8g)
function pump(){
  if(busy||!tapQ.length) return;
  busy=true; var my=boardId;
  sayDone(2500,function(){
    busy=false; if(my!==boardId) return;
    var i=tapQ.shift(); cards[i].classList.remove('wait');
    reveal(i); pump();
  });
}

function showFace(i){
  var c=S.deck[i], b=cards[i];
  c.up=true; b.classList.add('up');
  var f=el('span','face');
  if(c.kind==='p'){
    var im=el('img'); im.src='/images/'+c.w[0]+'.webp'; im.alt=''; im.draggable=false; f.appendChild(im);
    b.setAttribute('aria-label',fill(T('cardPic'),{n:i+1,w:c.w[1]}));
  } else {
    var t=el('span','w',c.w[1]); t.setAttribute('lang','en'); f.appendChild(t);
    b.setAttribute('aria-label',fill(T('cardWord'),{n:i+1,w:c.w[1]}));
    b.appendChild(f); sizeWord(t); return;
  }
  b.appendChild(f);
}
function hideFace(i){
  var c=S.deck[i], b=cards[i];
  c.up=false; b.classList.remove('up','miss');
  var f=b.querySelector('.face'); if(f) f.remove();
  b.setAttribute('aria-label',fill(T('cardDown'),{n:i+1}));
}

function reveal(i){
  var c=S.deck[i];
  showFace(i); S.up.push(i);
  if(c.kind==='w') say(c.w);
  if(S.up.length<2) return;
  S.moves++;
  var a=S.deck[S.up[0]], b=S.deck[S.up[1]], pair=S.up.slice();
  if(a.w[0]===b.w[0]){
    S.up=[];
    a.done=b.done=true; S.found++;
    pair.forEach(function(k){ cards[k].classList.add('done'); cards[k].disabled=true; });
    var wi=a.kind==='w'?pair[0]:pair[1], gl=LANG==='he'?a.w[2]:LANG==='es'?a.w[3]:'';
    if(gl){ var g=el('span','gl',gl); g.setAttribute('lang',LANG); g.setAttribute('dir',LANG==='he'?'rtl':'ltr'); cards[wi].querySelector('.face').appendChild(g); }
    if(b.kind==='p') say(a.w); // the word was turned first: say it again for the pair
    hudHtml();
    if(S.found===LEVELS[S.lvl]){
      S.phase='done'; var my=boardId;
      setTimeout(function(){ sayDone(2500,function(){ if(my===boardId) levelDone(); }); },700);
    }
    return;
  }
  hudHtml();
  S.lock=true; var mine=boardId;
  pair.forEach(function(k){ cards[k].classList.add('miss'); });
  setTimeout(function(){
    sayDone(2500,function(){
      if(mine!==boardId) return;
      pair.forEach(hideFace); S.up=[]; S.lock=false; pump();
    });
  },1000);
}

// stars by moves: a perfect memory needs n moves; blind luck on n pairs needs about 2n
function starsFor(n,m){ return m<=2*n-1?3:m<=3*n?2:1; }
function starRow(s){
  var d=el('div','stars'); d.setAttribute('role','img'); d.setAttribute('aria-label',fill(T('starsOf'),{s:s}));
  for(var i=0;i<3;i++){ var x=elh('span',i<s?'on':'off',IC('star')); d.appendChild(x); }
  return d;
}

function levelDone(){
  boardId++;
  var n=LEVELS[S.lvl], st=starsFor(n,S.moves);
  S.stars[S.lvl]=st; S.totalMoves+=S.moves;
  beacon('g_lvl','word-memory');
  try{ var best=JSON.parse(localStorage.getItem('cde_wm_best')||'{}'); var k=S.topic+'_'+S.lvl; if(!(best[k]>=st)){ best[k]=st; localStorage.setItem('cde_wm_best',JSON.stringify(best)); } }catch(e){}
  app.textContent=''; board=null; cards=[];
  if(S.lvl===LEVELS.length-1){ S.phase='end'; beacon('g_cmp','word-memory'); return renderEnd(); }
  S.phase='level';
  var box=el('div','card');
  box.appendChild(starRow(st));
  box.appendChild(el('h2',null,T('levelDone')));
  var sc=el('p','score',fill(T('movesLine'),{m:S.moves})); box.appendChild(sc);
  var nx=elh('button','primary',T('nextLevel')); nx.type='button'; nx.id='wmNext'; nx.addEventListener('click',function(){ startLevel(S.lvl+1); });
  var again=elh('button','ghost',T('retry')); again.type='button'; again.addEventListener('click',function(){ S.totalMoves-=S.moves; startLevel(S.lvl); });
  box.appendChild(nx); box.appendChild(again);
  app.appendChild(box); nx.focus();
}

function renderEnd(){
  var box=el('div','card');
  var sum=S.stars.reduce(function(a,b){ return a+(b||0); },0), avg=Math.round(sum/LEVELS.length);
  box.appendChild(starRow(avg));
  box.appendChild(elh('h2',null,T('allDone')));
  box.appendChild(el('p','score',fill(T('totalMoves'),{m:S.totalMoves})));
  var again=elh('button','primary',T('playAgain')); again.type='button'; again.id='wmAgain';
  again.addEventListener('click',function(){ resetRun(); startLevel(0); });
  var other=elh('button','ghost',T('otherTopic')); other.type='button';
  other.addEventListener('click',function(){ resetRun(); toMenu(); });
  box.appendChild(again); box.appendChild(other);
  app.appendChild(box);
  if(window.CDE_END) CDE_END({game:'word-memory',again:again,good:sum>=2*LEVELS.length});
  (box.querySelector('[data-kdm-primary]')||again).focus();
}
function resetRun(){ S.used={}; S.stars=[]; S.totalMoves=0; }
function toMenu(){
  boardId++; S.phase='menu'; app.textContent=''; board=null; cards=[];
  document.body.classList.remove('playing');
  document.getElementById('menu').hidden=false; window.scrollTo(0,0);
}

// topic picker on the menu (Start plays the picked topic)
var picks=document.querySelectorAll('[data-topic]');
var grp=document.querySelector('.topics'); if(grp) grp.setAttribute('aria-label',String(T('pickTopic')).replace(/:$/,''));
function markTopic(){ for(var i=0;i<picks.length;i++) picks[i].setAttribute('aria-pressed', String(picks[i].getAttribute('data-topic')===S.topic)); }
for(var i=0;i<picks.length;i++) picks[i].addEventListener('click',function(){ S.topic=this.getAttribute('data-topic'); markTopic(); });
markTopic();

document.getElementById('startBtn').addEventListener('click',function(){
  if(!S.started){ S.started=true; beacon('g_start','word-memory'); }
  document.getElementById('menu').hidden=true;
  resetRun(); startLevel(0);
});

// test hook: state + one correct move through the real tap path
window.WM={
  S:S, TOPICS:TOPICS, LEVELS:LEVELS,
  dbg:{
    get state(){ return {lvl:S.lvl,phase:S.phase,topic:S.topic,moves:S.moves,found:S.found,lock:S.lock,up:S.up.slice(),queued:tapQ.slice(),
      deck:S.deck.map(function(c){ return {id:c.w[0],kind:c.kind,up:c.up,done:c.done}; })}; },
    restartForTest:function(lvl){ resetRun(); startLevel(lvl||0); },
    solveForTest:function(){
      if(S.phase!=='play'||S.lock) return false;
      var pend=S.up.concat(tapQ);
      if(pend.length>=2) return false;
      var target;
      if(pend.length===1){ var id=S.deck[pend[0]].w[0]; target=S.deck.findIndex(function(c,k){ return k!==pend[0]&&!c.done&&c.w[0]===id; }); cards[target].click(); return true; }
      var a=S.deck.findIndex(function(c){ return !c.done&&!c.up; }); if(a<0) return false;
      target=S.deck.findIndex(function(c,k){ return k!==a&&!c.done&&c.w[0]===S.deck[a].w[0]; });
      cards[a].click(); cards[target].click(); return true;
    }
  }
};
})();
