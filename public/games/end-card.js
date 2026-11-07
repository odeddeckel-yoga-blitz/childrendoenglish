/* Shared arcade end card (persona standard P1, UX audit CUX5). Each game keeps its
   own "play again" button (its listeners stay) and calls CDE_END when its end
   screen opens. The card then shows ONE primary action, picked by the result:
     good run → "Next game: <name>" (play icon); otherwise → the game's "play again".
   The other one is a smaller secondary, and a "My menu" link (house icon) (the app for a
   child with a player, else create-player in the page language) replaces the old
   domain-name link. Game names stay English everywhere (one name per game). */
(function(){
  var ORDER=['beginning-sounds','sound-pairs','read-it','letter-twins','spelling-forge','word-zapper','category-conveyor','picture-bingo','simon-says','word-memory','rhyme-time','odd-one-out','opposites','feelings','missing-letter','true-or-false','sentence-builder'];
  var NAMES={'sound-pairs':'Sound Pairs','read-it':'Read It!','letter-twins':'Letter Twins','spelling-forge':'Spelling Forge','word-zapper':'Word Zapper','category-conveyor':'Category Conveyor','picture-bingo':'Picture Bingo','word-memory':'Word Memory','rhyme-time':'Rhyme Time','odd-one-out':'Odd One Out','missing-letter':'Missing Letter','opposites':'Opposites','true-or-false':'True or False','feelings':'Feelings','sentence-builder':'Sentence Builder','beginning-sounds':'Beginning Sounds','simon-says':'Simon Says'};
  // Plain labels; the drawn icons (CDE_IC from cde-l10n.js) are added as markup next to them.
  var STR={
    en:{next:'Next game: ',menu:'My menu',start:'More English practice',home:'Children Do English',ladder:'Back to my words'},
    he:{next:'המשחק הבא: ',menu:'לתפריט שלי',start:'עוד תרגול באנגלית',home:'Children Do English',ladder:'חזרה למילים שלי'},
    es:{next:'Siguiente juego: ',menu:'Mi menú',start:'Más práctica de inglés',home:'Children Do English',ladder:'Volver a mis palabras'}
  };
  function ic(n){ return window.CDE_IC?window.CDE_IC(n)+' ':''; }
  // label (our own static text) → innerHTML with a leading icon
  function labelled(a,icon,text){ a.innerHTML=ic(icon); a.appendChild(document.createTextNode(text)); }
  // ge beacon (same cookieless tally as the games' own beacons): what a child does
  // at the end card — <game>_<view-good|view-low|next|again|menu>.
  function ge(item){
    try{
      if(navigator.webdriver||localStorage.getItem('cde_internal')==='1'||!navigator.sendBeacon) return;
      var l=window.CDE_LANG==='he'||window.CDE_LANG==='es'?window.CDE_LANG:'en';
      navigator.sendBeacon('/api/land', JSON.stringify({batch:[{e:'ge',i:item}], l:l}));
    }catch(e){}
  }
  // Opened as a step of the app's learning ladder (?words=…&from=ladder)? Then the ladder's next step is back in the
  // app: 11-07 read, conv 45 launched → lf1 8 done, and every conveyor exit since 11-04 went to ANOTHER game.
  function fromLadder(){ try{ return new URLSearchParams(location.search).get('from')==='ladder'; }catch(e){ return false; } }
  function hasPlayer(){ try{ var r=JSON.parse(localStorage.getItem('childrendoenglish-players')||'null'); return !!(r&&r.players&&r.players.length); }catch(e){ return false; } }
  function primary(b){ b.setAttribute('data-kdm-primary',''); b.style.cssText=b.getAttribute('data-cde-css')||''; }
  function secondary(b){
    b.removeAttribute('data-kdm-primary'); b.classList.remove('primary');
    b.style.cssText=(b.getAttribute('data-cde-css')||'')+';background:transparent;box-shadow:none;border:2px solid currentColor;color:inherit;font-size:0.85em;padding:8px 18px;height:auto;min-height:0;width:auto;line-height:1.3;text-decoration:none';
  }
  // o = { game, again: <button>, good: bool, hide: [elements] }
  window.CDE_END=function(o){
    var lang=window.CDE_LANG||'en', L=STR[lang]||STR.en, again=o.again;
    if(!again||!again.parentNode) return;
    if(lang==='he') again.parentNode.setAttribute('dir','rtl'); // score lines, punctuation
    (o.hide||[]).forEach(function(e){ if(e) e.style.display='none'; });
    // first call: remember the button's own look, so a later run can restore it
    if(!again.hasAttribute('data-cde-css')){ again.setAttribute('data-cde-css',again.style.cssText||''); again.setAttribute('data-cde-cls',again.className); }
    again.className=again.getAttribute('data-cde-cls');
    var wrap=again.parentNode.querySelector('.cde-end');
    if(!wrap){ wrap=document.createElement('div'); wrap.className='cde-end'; again.parentNode.insertBefore(wrap,again); }
    wrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:6px;';
    wrap.textContent='';
    var nid=ORDER[(ORDER.indexOf(o.game)+1)%ORDER.length];
    var next=document.createElement('a');
    next.className=again.className;
    next.href='/games/'+nid+'/'+(lang!=='en'?'?lang='+lang:'');
    labelled(next,'play',L.next); var nm=document.createElement('bdi'); nm.textContent=NAMES[nid]; next.appendChild(nm);
    next.setAttribute('data-cde-css','text-decoration:none;display:inline-block');
    var home=document.createElement('a');
    var player=hasPlayer();
    home.href=player?'/app':(lang==='en'?'/new-player':'/new-player?lang='+lang);
    labelled(home,'house',player?L.menu:L.start);
    home.style.cssText='font-weight:700;text-decoration:underline;font-size:15px;color:inherit';
    ge(o.game+(o.good?'_view-good':'_view-low'));
    next.addEventListener('click',function(){ ge(o.game+'_next'); });
    home.addEventListener('click',function(){ ge(o.game+'_menu'); });
    if(!again.hasAttribute('data-cde-ge')){ again.setAttribute('data-cde-ge','1'); again.addEventListener('click',function(){ ge(o.game+'_again'); }); }
    if(player&&fromLadder()){
      // Ladder child: the primary action continues the ladder; play-again stays as the secondary, no "next game".
      var back=document.createElement('a');
      back.className=again.className; back.href='/app';
      labelled(back,lang==='he'?'arrow-left':'arrow-right',L.ladder);
      back.setAttribute('data-cde-css','text-decoration:none;display:inline-block');
      back.setAttribute('data-cde-ladder','');
      back.addEventListener('click',function(){ ge(o.game+'_ladder'); });
      primary(back); wrap.appendChild(back); wrap.appendChild(again); secondary(again);
      return;
    }
    if(o.good){ primary(next); wrap.appendChild(next); wrap.appendChild(again); secondary(again); }
    else { primary(again); wrap.appendChild(again); wrap.appendChild(next); secondary(next); }
    wrap.appendChild(home);
  };
  // The top-left pill: "My menu" with a house icon back into the app for a child with a player
  // (one name for home), else the site name — never a bare domain with an arrow.
  // Runs before game.js, whose leave-guard remembers this label.
  var pill=document.getElementById('homePill');
  if(pill){
    var L0=STR[window.CDE_LANG||'en']||STR.en;
    if(hasPlayer()&&fromLadder()){ pill.href='/app'; labelled(pill,'house',L0.ladder); pill.setAttribute('aria-label',L0.ladder); }
    else if(hasPlayer()){ pill.href='/app'; labelled(pill,'house',L0.menu); pill.setAttribute('aria-label',L0.menu); }
    else { labelled(pill,'house',L0.home); pill.setAttribute('aria-label',L0.home); }
  }
})();
