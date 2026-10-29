/* Sound Pairs — minimal-pair listening game (/games/sound-pairs/).
   One word plays; the child taps which of two near-identical words it was.
   Each level is one sound contrast Hebrew speakers merge (p/b, a/u, e/a, th,
   ee/i). A wrong tap replays the heard word and its partner so the difference
   is audible. Audio = /audio/pairs/<word>.mp3, rendered for this game and
   whisper-checked to be heard as itself and never as its partner (2026-10-29).
   v/w is held: whisper can't confirm a clear "v" (vest/vet) — needs an ear-check.
   Beacons (cookieless aggregates, same guards as land-beacon.js): g_open /
   g_start / g_lvl / g_cmp @ sound-pairs, and mp @ <contrast>_<ok|no>. */
(function(){
'use strict';
var T=function(k){ return window.CDE_T?window.CDE_T(k):k; };
var LANG=window.CDE_LANG||'en';

// [word, he, es]
var W={
  pear:['אגס','pera'],bear:['דוב','oso'],pea:['אפונה','guisante'],bee:['דבורה','abeja'],pig:['חזיר','cerdo'],big:['גדול','grande'],
  pack:['לארוז','empacar'],back:['גב','espalda'],park:['פארק','parque'],bark:['לנבוח','ladrar'],
  cat:['חתול','gato'],cut:['לחתוך','cortar'],cap:['כובע מצחייה','gorra'],cup:['כוס','taza'],bag:['תיק','bolsa'],bug:['חרק','bicho'],
  hat:['כובע','sombrero'],hut:['בקתה','cabaña'],fan:['מאוורר','ventilador'],fun:['כיף','diversión'],ran:['רץ (בעבר)','corrió'],run:['לרוץ','correr'],
  pen:['עט','bolígrafo'],pan:['מחבת','sartén'],bed:['מיטה','cama'],bad:['רע','malo'],ten:['עשר','diez'],tan:['שזוף','bronceado'],
  men:['גברים','hombres'],man:['איש','hombre'],pet:['חיית מחמד','mascota'],pat:['ללטף','acariciar'],
  three:['שלוש','tres'],tree:['עץ','árbol'],thin:['רזה','delgado'],tin:['פח','lata'],think:['לחשוב','pensar'],sink:['כיור','fregadero'],
  mouth:['פה','boca'],mouse:['עכבר','ratón'],thank:['להודות','agradecer'],tank:['טנק','tanque'],path:['שביל','sendero'],pass:['לעבור','pasar'],
  sheep:['כבשה','oveja'],ship:['ספינה','barco'],seat:['מושב','asiento'],sit:['לשבת','sentarse'],feet:['כפות רגליים','pies'],fit:['להתאים','quedar bien'],
  heel:['עקב','talón'],hill:['גבעה','colina'],eat:['לאכול','comer'],it:['זה','eso']
};
var LEVELS=[
  {id:'p-b', label:{en:'P or B?',he:'P או B',es:'¿P o B?'}, pairs:[['pear','bear'],['pea','bee'],['pig','big'],['pack','back'],['park','bark']]},
  {id:'a-u', label:{en:'a (cat) or u (cut)?',he:'a (cat) או u (cut)',es:'¿a (cat) o u (cut)?'}, pairs:[['cat','cut'],['cap','cup'],['bag','bug'],['hat','hut'],['fan','fun'],['ran','run']]},
  {id:'e-a', label:{en:'e (pen) or a (pan)?',he:'e (pen) או a (pan)',es:'¿e (pen) o a (pan)?'}, pairs:[['pen','pan'],['bed','bad'],['ten','tan'],['men','man'],['pet','pat']]},
  {id:'th', label:{en:'th (three) or t/s (tree)?',he:'th (three) או t/s (tree)',es:'¿th (three) o t/s (tree)?'}, pairs:[['three','tree'],['thin','tin'],['think','sink'],['mouth','mouse'],['thank','tank'],['path','pass']]},
  {id:'ee-i', label:{en:'ee (sheep) or i (ship)?',he:'ee (sheep) או i (ship)',es:'¿ee (sheep) o i (ship)?'}, pairs:[['sheep','ship'],['seat','sit'],['feet','fit'],['heel','hill'],['eat','it']]}
];
var ROUNDS=8;
window.SP_LEVELS=LEVELS; // read by the audio-coverage test harness

function beacon(ev,item){
  try{
    if(navigator.webdriver) return;
    if(localStorage.getItem('cde_internal')==='1') return;
    if(!navigator.sendBeacon) return;
    var l=LANG==='he'||LANG==='es'?LANG:'en';
    navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:ev,i:item}], l:l}));
  }catch(e){}
}
beacon('g_open','sound-pairs');

var clip=null;
function play(word, done){
  try{
    if(clip){ clip.onended=null; clip.pause(); }
    clip=new Audio('/audio/pairs/'+word+'.mp3');
    if(done) clip.onended=done;
    var p=clip.play(); if(p&&p.catch) p.catch(function(){ if(done) done(); });
  }catch(e){ if(done) done(); }
}
function shuffle(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=b[i]; b[i]=b[j]; b[j]=t; } return b; }
function el(tag,cls,text){ var n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; }
function gloss(w){ return LANG==='he'?W[w][0]:LANG==='es'?W[w][1]:''; }

var app=document.getElementById('app');
var S={lvl:0,round:0,score:0,rounds:[],misses:{},started:false};

function plan(level){
  // every pair at least once, then random pairs; target side random
  var ps=shuffle(level.pairs), out=[];
  while(out.length<ROUNDS) out=out.concat(shuffle(level.pairs));
  ps=out.slice(0,ROUNDS);
  return ps.map(function(p){ var t=Math.random()<0.5?0:1; return {target:p[t], other:p[1-t], order:shuffle(p)}; });
}

function startLevel(i){
  S.lvl=i; S.round=0; S.score=0; S.rounds=plan(LEVELS[i]);
  renderRound();
}

function header(){
  var lv=LEVELS[S.lvl];
  var h=el('div','hud');
  h.appendChild(el('div','hud-level',T('level')+' '+(S.lvl+1)+' '+T('of')+' '+LEVELS.length));
  var lab=el('div','hud-label',lv.label[LANG]||lv.label.en); lab.setAttribute('dir','ltr');
  h.appendChild(lab);
  var dots=el('div','dots');
  for(var i=0;i<ROUNDS;i++) dots.appendChild(el('span','dot'+(i<S.round?' done':'')+(i===S.round?' now':'')));
  h.appendChild(dots);
  return h;
}

function renderRound(){
  var r=S.rounds[S.round], lv=LEVELS[S.lvl];
  app.textContent='';
  app.appendChild(header());
  var say=el('button','big-say','🔊'); say.id='sayBtn'; say.type='button'; say.setAttribute('aria-label',T('again'));
  say.addEventListener('click',function(){ play(r.target); });
  app.appendChild(say);
  var opts=el('div','opts');
  var answered=false;
  r.order.forEach(function(w){
    var b=el('button','opt'); b.type='button'; b.setAttribute('data-word',w);
    b.appendChild(el('span','opt-en',w));
    var g=gloss(w); if(g) b.appendChild(el('span','opt-gl',g));
    b.addEventListener('click',function(){
      if(answered) return; answered=true;
      var ok=w===r.target;
      beacon('mp',lv.id+'_'+(ok?'ok':'no'));
      if(ok){
        S.score++; b.classList.add('ok');
        fb.textContent=T('right');
        setTimeout(nextRound, 900);
      } else {
        S.misses[lv.id]=(S.misses[lv.id]||0)+1;
        b.classList.add('no');
        var right=opts.querySelector('[data-word="'+r.target+'"]'); right.classList.add('ok');
        fb.textContent='';
        fb.appendChild(document.createTextNode(T('youHeard')+' '));
        fb.appendChild(el('b','en',r.target));
        fb.appendChild(document.createTextNode(' — '+T('notWord')+' '));
        fb.appendChild(el('b','en',r.other));
        var both=el('button','ghost',T('listenBoth')); both.type='button';
        var hearBoth=function(){ right.classList.add('pulse'); play(r.target,function(){ right.classList.remove('pulse'); b.classList.add('pulse'); setTimeout(function(){ play(r.other,function(){ b.classList.remove('pulse'); }); },350); }); };
        both.addEventListener('click',hearBoth);
        var nx=el('button','next',T('next')); nx.type='button';
        nx.addEventListener('click',nextRound);
        row.appendChild(both); row.appendChild(nx);
        setTimeout(hearBoth, 500);
      }
    });
    opts.appendChild(b);
  });
  app.appendChild(opts);
  var fb=el('p','feedback'); fb.setAttribute('role','status'); app.appendChild(fb);
  var row=el('div','row'); app.appendChild(row);
  if(S.round===0) app.appendChild(el('p','tip',T('tip')));
  setTimeout(function(){ play(r.target); }, 250);
}

function nextRound(){
  S.round++;
  if(S.round<ROUNDS) return renderRound();
  beacon('g_lvl','sound-pairs');
  var stars=S.score===ROUNDS?3:S.score>=6?2:1;
  try{ var best=JSON.parse(localStorage.getItem('cde_sp_best')||'{}'); var k=LEVELS[S.lvl].id; if(!(best[k]>=stars)){ best[k]=stars; localStorage.setItem('cde_sp_best',JSON.stringify(best)); } }catch(e){}
  app.textContent='';
  var last=S.lvl===LEVELS.length-1;
  if(last){ beacon('g_cmp','sound-pairs'); return renderEnd(); }
  var box=el('div','card');
  box.appendChild(el('div','stars','⭐'.repeat(stars)+'☆'.repeat(3-stars)));
  box.appendChild(el('h2',null,T('levelDone')));
  box.appendChild(el('p','score',S.score+' / '+ROUNDS));
  var nx=el('button','primary',T('nextLevel')); nx.type='button'; nx.addEventListener('click',function(){ startLevel(S.lvl+1); });
  var again=el('button','ghost',T('retry')); again.type='button'; again.addEventListener('click',function(){ startLevel(S.lvl); });
  box.appendChild(nx); box.appendChild(again);
  app.appendChild(box); nx.focus();
}

function renderEnd(){
  var box=el('div','card');
  box.appendChild(el('h2',null,T('allDone')));
  var worst=null; LEVELS.forEach(function(l){ if((S.misses[l.id]||0)>(worst?S.misses[worst.id]:0)) worst=l; });
  if(worst){ box.appendChild(el('p',null,T('hardest'))); var w=el('p','hard',worst.label[LANG]||worst.label.en); w.setAttribute('dir','ltr'); box.appendChild(w); }
  else box.appendChild(el('p',null,T('allRight')));
  var again=el('button','primary',T('playAgain')); again.type='button';
  again.addEventListener('click',function(){ S.misses={}; startLevel(0); });
  var more=el('a','ghost',T('moreGames')); more.href='/games/';
  box.appendChild(again); box.appendChild(more);
  app.appendChild(box); again.focus();
}

document.getElementById('startBtn').addEventListener('click',function(){
  if(!S.started){ S.started=true; beacon('g_start','sound-pairs'); }
  document.getElementById('menu').hidden=true;
  startLevel(0);
});
})();
