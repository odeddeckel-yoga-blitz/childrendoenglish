/* Odd One Out (/games/odd-one-out/). Four word pictures, three share a group and one
   doesn't; the child taps the one that doesn't belong, then a reveal names the groups
   ("3 animals, 1 food") in the interface language. Each picture has its English word
   under it and a speaker button that says it (/audio/<word>.mp3 via word-audio.js).
   Level 1 = far-apart groups (animals / food / vehicles / clothes), level 2 = closer
   groups (food vs home things, toys vs sports, clothes vs school things), level 3 = near
   groups (farm vs sea animals, fruit vs vegetables, colours vs numbers, land / water /
   air vehicles). 8 rounds per level.
   Oracle guards (kit "no giveaway"), all asserted in e2e/odd-one-out.spec.js:
   · picture style: the CDE pictures are mostly photos, some are drawn. A round's styles are
     4-0 or 2-2, never 3-1, so no card is the only drawing / only photo (the odd one never is).
   · ambiguity: words that fit two groups of any pair (orange = colour + fruit, drone = toy +
     vehicle, hen = animal + food, tomato = fruit + vegetable, …) are left out of every
     group (AMBIGUOUS below, with the reason), and each pair's two groups share no word.
   · the odd card's position is uniform (shuffled), never highlighted before the answer.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open / g_start /
   g_lvl / g_cmp @ odd-one-out, and oo @ <pair>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var LANG=window.CDE_LANG||'en';
var GAME='odd-one-out';

// Group words: ids of src/data/words.js (picture /images/<id>.webp, audio /audio/<id>.mp3).
var GROUPS={
  animals:['cat','dog','horse','cow','elephant','giraffe','lion','monkey','zebra','rabbit','bear','sheep','penguin','frog','owl','fox','camel','kangaroo','koala','gorilla','tiger','pig','hippo','panda','hedgehog','peacock','parrot','eagle','wolf','deer','goat','donkey','snake','crocodile','butterfly','ladybug'],
  food:['apple','banana','bread','egg','rice','pizza','sandwich','watermelon','carrot','cheese','cookie','cake','pear','strawberry','pineapple','cherry','mango','kiwi','grapes','potato','broccoli','onion','donut','muffin','pancake','pretzel','spaghetti','soup','popcorn','burger','sausage','pie','ketchup'],
  transport:['car','bus','bicycle','airplane','train','boat','helicopter','motorcycle','submarine','ambulance','tractor','van','truck','ship','taxi','sailboat','firetruck','jet','jeep','kayak','canoe','rocket','unicycle'],
  clothing:['hat','shirt','shoes','dress','jacket','gloves','scarf','sweater','sunglasses','belt','socks','tie','hoodie','raincoat','vest','mittens','sandals','boot','shorts','pants','cap','jeans'],
  home:['bed','chair','table','lamp','sofa','armchair','bathtub','pillow','mirror','clock','bookshelf','fireplace','curtain','vase','kettle','toaster','fridge','iron','hanger','fan','door','window','oven','box'],
  school:['book','pen','ruler','pencil','eraser','notebook','scissors','calculator','globe','microscope','stapler','paintbrush','crayons','folder'],
  toys:['doll','robot','puzzle','kite','dollhouse','dice','board-game'],   // balloon left out: the only drawn toy, so it could never be dealt without standing out
  sports:['soccer','tennis','swimming','volleyball','gymnastics','hockey','skiing','bowling','archery','surfing','running','climbing','table-tennis','skateboarding'],
  farm:['cow','pig','sheep','horse','goat','donkey','rooster'],
  sea:['dolphin','whale','shark','octopus','jellyfish'],
  fruit:['apple','banana','pear','watermelon','strawberry','pineapple','cherry','mango','kiwi','grapes','lemon','fig'],
  veg:['carrot','potato','broccoli','onion','pea','bean'],
  colors:['red','blue','green','yellow','black','white','purple','pink','brown','gray'],
  numbers:['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','twenty'],
  land:['car','bus','train','truck','taxi','van','tractor','jeep','motorcycle','bicycle','ambulance','firetruck','unicycle'],
  water:['boat','ship','submarine','kayak','canoe','sailboat'],
  air:['airplane','helicopter','jet','rocket']
};
// (penguin is in animals but kept out of farm / sea: it fits neither cleanly.)
// Left out on purpose: each fits two groups (or no clear group), so a round could have two defensible answers.
var AMBIGUOUS={
  orange:'colour and fruit', peach:'colour and fruit', lime:'colour and fruit', olive:'colour and food', cream:'colour and food',
  lemonade:'drink, not food', juice:'drink', milk:'drink', water:'drink and nature', honey:'food and colour (honey-coloured)', chocolate:'food and colour',
  chicken:'animal and food', hen:'animal and food', fish:'animal and food', duck:'farm and water animal', goose:'farm and water animal',
  turtle:'sea and land animal', snail:'animal and food (escargot)',
  bat:'animal and sports', mouse:'animal and computer mouse', crab:'not in the word list',
  tomato:'fruit and vegetable', avocado:'fruit and vegetable', pumpkin:'fruit and vegetable', cucumber:'fruit and vegetable', corn:'vegetable and grain',
  pepper:'vegetable and spice', mushroom:'neither fruit nor vegetable (nature)', coconut:'fruit and nut', nut:'food and hardware',
  drone:'toy and vehicle', tricycle:'toy and vehicle', wagon:'toy and vehicle', scooter:'toy and vehicle', skateboard:'toy and sport',
  ball:'toy and sports', basketball:'toy (a ball) and sport', baseball:'toy (a ball) and sport', frisbee:'toy and sport', trampoline:'toy and sport',
  'jump-rope':'toy and sport', badminton:'picture is rackets (sports gear or toy)', fishing:'sport and hobby (picture is a reel)',
  parachute:'vehicle?', cab:'same thing as taxi', helmet:'clothing and sports gear', umbrella:'not clothing', uniform:'clothing and school',
  necklace:'jewellery', ring:'jewellery', jar:'home thing and food container', can:'food and container', drawer:'picture is a desk',
  compass:'picture is a navigation compass, not the school one', bell:'school and home', map:'school and travel', locker:'school and gym',
  whiteboard:'picture unclear', quilt:'picture unclear (looks like a rug)', carpet:'picture unclear (looks like a quilt)',
  unicorn:'not a toy (a creature)', dragon:'not a toy (a creature)', drum:'toy and instrument', ukulele:'toy and instrument',
  mask:'toy and costume', bubbles:'not clearly a toy', slide:'playground, not a toy', seesaw:'playground, not a toy', sandbox:'playground, not a toy'
};
// Drawn pictures (own illustrations / Twemoji, plus Commons files that are drawings, not photos — checked by eye
// 11-07: table, pencil, microscope, folder). Every other picture used here is a photo.
// The site-wide style map (public/games/image-style.js, generated from IMAGE_SOURCES) wins; the list below is the
// fallback if that script fails to load.
var DRAWN=window.CDE_DRAWN||['unicycle','cap','jeans','ketchup','table','oven','box','pencil','microscope','folder',
  'red','blue','green','yellow','black','white','purple','pink','brown','gray',
  'one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','twenty'];
function style(id){ return DRAWN.indexOf(id)>=0?'D':'P'; }

// Group names in the interface language: [singular, plural]
var NAMES={
  en:{animals:['animal','animals'],food:['food','foods'],transport:['vehicle','vehicles'],clothing:['thing to wear','things to wear'],
      home:['home thing','home things'],school:['school thing','school things'],toys:['toy','toys'],sports:['sport','sports'],
      farm:['farm animal','farm animals'],sea:['sea animal','sea animals'],fruit:['fruit','fruits'],veg:['vegetable','vegetables'],
      colors:['color','colors'],numbers:['number','numbers'],land:['land vehicle','land vehicles'],water:['water vehicle','water vehicles'],air:['flying vehicle','flying vehicles']},
  he:{animals:['חיה','חיות'],food:['מאכל','מאכלים'],transport:['כלי תחבורה','כלי תחבורה'],clothing:['בגד','בגדים'],
      home:['חפץ בבית','חפצים בבית'],school:['חפץ לבית הספר','חפצים לבית הספר'],toys:['צעצוע','צעצועים'],sports:['ענף ספורט','ענפי ספורט'],
      farm:['חיית משק','חיות משק'],sea:['חיית ים','חיות ים'],fruit:['פרי','פירות'],veg:['ירק','ירקות'],
      colors:['צבע','צבעים'],numbers:['מספר','מספרים'],land:['כלי רכב יבשתי','כלי רכב יבשתיים'],water:['כלי שיט','כלי שיט'],air:['כלי טיס','כלי טיס']},
  es:{animals:['animal','animales'],food:['comida','comidas'],transport:['vehículo','vehículos'],clothing:['prenda de ropa','prendas de ropa'],
      home:['cosa de casa','cosas de casa'],school:['cosa del colegio','cosas del colegio'],toys:['juguete','juguetes'],sports:['deporte','deportes'],
      farm:['animal de granja','animales de granja'],sea:['animal marino','animales marinos'],fruit:['fruta','frutas'],veg:['verdura','verduras'],
      colors:['color','colores'],numbers:['número','números'],land:['vehículo terrestre','vehículos terrestres'],water:['vehículo acuático','vehículos acuáticos'],air:['vehículo aéreo','vehículos aéreos']}
};
function gname(g,pl){ var N=NAMES[LANG]||NAMES.en; return N[g][pl?1:0]; }

var LEVELS=[
  {id:'far',  pairs:[['animals','food'],['animals','transport'],['food','transport'],['animals','clothing'],['clothing','transport'],['food','clothing']]},
  {id:'close',pairs:[['food','home'],['toys','sports'],['clothing','school']]},
  {id:'near', pairs:[['farm','sea'],['fruit','veg'],['colors','numbers'],['land','water'],['land','air']]}
];
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

function say(word){ if(window.cdeSay) window.cdeSay(word, function(){ tts(word); }); else tts(word); }
function tts(word){
  try{ if(!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(word); u.lang='en-US'; u.rate=0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(e){}
}
function sayDone(cb){ if(window.cdeSayDone) window.cdeSayDone(1800,cb); else cb(); }
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
// own static strings only (they carry drawn-icon markup) — never words, names or scores
function elh(tag,cls,html){ var n=document.createElement(tag); if(cls) n.className=cls; n.innerHTML=html; return n; }
var IC=window.CDE_IC||function(){ return ''; };

// A round: 3 words of group g + 1 of group o, styles 4-0 or 2-2, shuffled. `used` = words already dealt this level
// (avoided while possible). Returns {g,o,odd,cards:[ids]}.
function dealRound(pair, used){
  // Built, not sampled (11-07): pick a style structure the pair can fill, then the cards for it.
  //   all photos · all drawings · 2+2 with a drawn odd one · 2+2 with a photo odd one
  // A 2+2 round is only dealt when BOTH 2+2 kinds are possible, and then each half the time, so the style mix never
  // points at the odd one; a lone drawing or lone photo never happens.
  var flip=Math.random()<0.5, g=flip?pair[1]:pair[0], o=flip?pair[0]:pair[1];
  for(var pass=0;pass<2;pass++){
    var fresh=pass===0;
    var G=GROUPS[g].filter(function(w){ return GROUPS[o].indexOf(w)<0 && (!fresh||!used[w]); });
    var O=GROUPS[o].filter(function(w){ return GROUPS[g].indexOf(w)<0 && (!fresh||!used[w]); });
    var isD=function(w){ return style(w)==='D'; };
    var Gd=G.filter(isD), Gp=G.filter(function(w){ return !isD(w); }), Od=O.filter(isD), Op=O.filter(function(w){ return !isD(w); });
    var modes=[];
    if(Gp.length>=3&&Op.length) modes.push('P');
    if(Gd.length>=3&&Od.length) modes.push('D');
    if(Od.length&&Gd.length>=1&&Gp.length>=2&&Op.length&&Gd.length>=2&&Gp.length>=1) modes.push('mD','mP');
    if(!modes.length) continue;
    var m=pick(modes), three, odd;
    if(m==='P'){ three=shuffle(Gp).slice(0,3); odd=pick(Op); }
    else if(m==='D'){ three=shuffle(Gd).slice(0,3); odd=pick(Od); }
    else if(m==='mD'){ three=shuffle(Gd).slice(0,1).concat(shuffle(Gp).slice(0,2)); odd=pick(Od); }
    else { three=shuffle(Gd).slice(0,2).concat(shuffle(Gp).slice(0,1)); odd=pick(Op); }
    return {g:g,o:o,odd:odd,pair:pair[0]+'-'+pair[1],cards:shuffle(three.concat([odd]))};
  }
  return null;
}
function plan(level){
  var seq=[]; while(seq.length<ROUNDS) seq=seq.concat(shuffle(level.pairs));
  seq=seq.slice(0,ROUNDS);
  var used={}, out=[];
  seq.forEach(function(p){
    var r=dealRound(p,used)||dealRound(level.pairs[0],used);
    r.cards.forEach(function(w){ used[w]=1; });
    out.push(r);
  });
  return out;
}

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:{},started:false,answered:false};
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

function startLevel(i){ S.lvl=i; S.round=0; S.score=0; S.rounds=plan(LEVELS[i]); renderRound(); }

function renderRound(){
  var r=S.rounds[S.round], my=++roundId;
  var live=function(){ return my===roundId; };
  S.answered=false;
  app.textContent='';
  app.appendChild(header());
  var grid=el('div','grid'); grid.setAttribute('dir','ltr');
  var fb, row;
  r.cards.forEach(function(w){
    var card=el('div','oo-card'); card.setAttribute('data-word',w);
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',w); b.setAttribute('aria-label',w);
    var im=el('img'); im.src='/images/'+w+'.webp'; im.alt=''; im.width=200; im.height=150; im.decoding='async';
    b.appendChild(im);
    var wd=el('span','word',w); wd.setAttribute('lang','en'); wd.setAttribute('dir','ltr'); b.appendChild(wd);
    var tag=el('span','tag'); b.appendChild(tag);
    var sp=elh('button','say',IC('volume-2')); sp.type='button'; sp.setAttribute('aria-label',T('hear')+': '+w);
    sp.addEventListener('click',function(e){ e.stopPropagation(); say(w); });
    b.addEventListener('click',function(){ answer(w,b); });
    card.appendChild(b); card.appendChild(sp);
    grid.appendChild(card);
  });
  app.appendChild(grid);
  fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  row=el('div','row'); app.appendChild(row);
  if(S.round===0&&S.lvl===0) app.appendChild(el('p','tip',T('tip')));

  function answer(w,b){
    if(S.answered||!live()) return; S.answered=true;
    var ok=w===r.odd;
    beacon('oo',r.pair+'_'+(ok?'ok':'no'));
    var cards=grid.querySelectorAll('.oo-card');
    for(var i=0;i<cards.length;i++){
      var cw=cards[i].getAttribute('data-word'), isOdd=cw===r.odd;
      cards[i].classList.add('shown', isOdd?'is-odd':'is-group');
      cards[i].querySelector('.tag').textContent=gname(isOdd?r.o:r.g,false);
    }
    say(r.odd);
    var oddBtn=grid.querySelector('.opt[data-word="'+r.odd+'"]');
    oddBtn.classList.add('ok');
    fb.textContent='';
    var lead=elh('span','lead',T(ok?'right':'notQuite')); fb.appendChild(lead);
    fb.appendChild(document.createTextNode(' '));
    var rev=el('span','reveal','3 '+gname(r.g,true)+', 1 '+gname(r.o,false)); fb.appendChild(rev);
    if(ok){
      S.score++;
      setTimeout(function(){ if(live()) sayDone(function(){ if(live()) next(); }); }, 1500);
    } else {
      S.misses[LEVELS[S.lvl].id]=(S.misses[LEVELS[S.lvl].id]||0)+1;
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
  try{ var best=JSON.parse(localStorage.getItem('cde_oo_best')||'{}'); var k=LEVELS[S.lvl].id; if(!(best[k]>=st)){ best[k]=st; localStorage.setItem('cde_oo_best',JSON.stringify(best)); } }catch(e){}
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
  var miss=0; for(var k in S.misses) miss+=S.misses[k];
  box.appendChild(el('p',null,T(miss?'endSome':'allRight')));
  var again=elh('button','primary',T('playAgain')); again.type='button'; again.id='againBtn';
  again.addEventListener('click',function(){ S.misses={}; startLevel(0); });
  box.appendChild(again);
  app.appendChild(box);
  if(window.CDE_END) CDE_END({game:GAME,again:again,good:miss<=6});
  (box.querySelector('[data-kdm-primary]')||again).focus();
}

document.getElementById('startBtn').addEventListener('click',function(){
  if(!S.started){ S.started=true; beacon('g_start',GAME); }
  document.getElementById('menu').hidden=true;
  startLevel(0);
});

// test/debug contract (Playwright spec; no gameplay shortcuts — solveForTest taps the real card)
window.OO={
  S:S, LEVELS:LEVELS, GROUPS:GROUPS, AMBIGUOUS:AMBIGUOUS, DRAWN:DRAWN, NAMES:NAMES, ROUNDS:ROUNDS,
  dbg:{
    get state(){ return S; },
    get round(){ return S.rounds[S.round]||null; },
    get roundKey(){ var r=S.rounds[S.round]; return (r&&document.getElementById('menu').hidden)?S.lvl+':'+S.round:''; },
    style:style,
    plan:function(lvl){ return plan(LEVELS[lvl]); },
    solveForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var b=app.querySelector('.opt[data-word="'+r.odd+'"]'); if(b) b.click(); return !!b; },
    missForTest:function(){ var r=S.rounds[S.round]; if(!r||S.answered) return false; var w=r.cards.filter(function(c){ return c!==r.odd; })[0]; app.querySelector('.opt[data-word="'+w+'"]').click(); return true; }
  }
};
})();
