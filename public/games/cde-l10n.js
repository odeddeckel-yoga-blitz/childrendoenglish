/* DOM-chrome localization for the arcade games (CSP-safe external script;
   loaded before each game's l10n.js + game.js). The interface language is the
   app's `cde_lang` (or ?lang= for deep links). GAME CONTENT stays English —
   spoken words, canvas, letter tiles — only menus / HUD labels / overlays and
   the gloss line switch (he → Hebrew gloss, es → Spanish gloss). Elements opt
   in with data-l10n="key"; a key whose string is '' hides the element. */
(function(){
  var lang='en';
  try{ var l=localStorage.getItem('cde_lang'); if(l==='he'||l==='es') lang=l; }catch(e){}
  try{ var q=new URLSearchParams(location.search).get('lang'); if(q==='he'||q==='es'||q==='en') lang=q; }catch(e){}
  window.CDE_LANG=lang;
  window.CDE_T=function(k){ var D=window.CDE_STRINGS||{}; var S=D[lang]||{}; return S[k]!=null?S[k]:(D.en||{})[k]; };
  window.CDE_GLOSS=function(w){ if(!w) return ''; return (lang==='es'&&w.es)?w.es:(w.he||''); };
  function apply(){
    if(lang==='en') return;
    var S=(window.CDE_STRINGS||{})[lang]; if(!S) return;
    document.documentElement.setAttribute('data-cde-lang',lang);
    var els=document.querySelectorAll('[data-l10n]');
    for(var i=0;i<els.length;i++){
      var k=els[i].getAttribute('data-l10n'); if(S[k]==null) continue;
      if(S[k]===''){ els[i].style.display='none'; continue; }
      els[i].innerHTML=S[k]; if(lang==='he') els[i].setAttribute('dir','rtl');
    }
  }
  // Deferred scripts run while readyState is 'interactive', BEFORE the game's
  // l10n.js (the next deferred script) has defined CDE_STRINGS — so wait for
  // DOMContentLoaded unless the document is already complete.
  if(document.readyState==='complete') apply(); else document.addEventListener('DOMContentLoaded',apply);
})();
