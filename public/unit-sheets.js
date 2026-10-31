/* Printable class activity sheets, built in the browser from the page's own word
 * list, so every print is a fresh random set. Used on every word-set page (units,
 * Band I topics/review, grades, /he/english-words — data in #unit-data) and on the
 * printable-flashcard category pages (#sheet-data, Hebrew and English):
 *   bingo  — N different 4×4 cards (2 per page) + a teacher call list
 *   search — a word search (11×11, right / down / diagonal only, for grades 3–6)
 *            + an answer-key page
 *   cross  — a crossword (public/crossword.js): picture + meaning clues, English
 *            answers, numbered grid + an answer-key page
 * #sheets-out data-lang="he" (default) or "en" picks the sheet text.
 * Printing: body.printing-sheets shows only #sheets-out (moved to the end of <body>
 * first, so it is a direct child even where the page wraps content in <main>);
 * afterprint clears it. Use is counted as a cookieless aggregate (sheet @ kind). */
(function () {
  'use strict';
  var out = document.getElementById('sheets-out');
  var dataEl = document.getElementById('sheet-data') || document.getElementById('unit-data');
  if (!out || !dataEl) return;
  var items;
  try { items = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var unitName = out.getAttribute('data-name') || '';
  var EN = out.getAttribute('data-lang') === 'en';
  var T = EN ? {
    calls: 'Teacher call list · ', callsNote: 'Call out a word (or its meaning, for a challenge) and tick it here. A full row, column or diagonal wins — BINGO!',
    search: 'Word Search · ', searchNote: 'Find the words: left to right →, top to bottom ↓ or diagonally ↘', key: 'Answer key · ',
    cross: 'Crossword · ', crossNote: 'Write the English word for each picture.', across: 'Across →', down: 'Down ↓',
  } : {
    calls: 'רשימת קריאה למורה · ', callsNote: 'קוראים מילה (באנגלית, או את הפירוש בעברית לאתגר) ומסמנים אותה כאן. מי שמסמן שורה, טור או אלכסון — צועק BINGO!',
    search: 'Word Search · ', searchNote: 'מצאו את המילים: משמאל לימין →, מלמעלה למטה ↓ או באלכסון ↘', key: 'פתרון · ',
    cross: 'Crossword · ', crossNote: 'כתבו באנגלית את המילה של כל תמונה ותרגום. Across = מאוזן →, Down = מאונך ↓', across: 'Across →', down: 'Down ↓',
  };
  // he = the Hebrew meaning (word-set pages: the correct hear-and-pick option);
  // img = a photo for picture clues when the word has one; def = English clue (en pages)
  var words = items.map(function (it) {
    return { en: it.en, he: it.he || (it.opts ? it.opts[it.ans] : ''), img: it.img || null, def: it.def || '' };
  });

  function beacon(kind) {
    try {
      if (navigator.webdriver || localStorage.getItem('cde_internal') === '1' || !navigator.sendBeacon) return;
      navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: 'sheet', i: kind }], l: 'he' }));
    } catch (e) { /* never break the page */ }
  }
  function shuffle(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function page(title) {
    var p = el('div', 'sheet-page');
    p.appendChild(el('div', 'sheet-head', title));
    out.appendChild(p);
    return p;
  }
  function print(kind) {
    beacon(kind);
    document.body.appendChild(out);
    document.body.classList.add('printing-sheets');
    // picture clues: wait (≤4 s) for the photos so they make it onto the paper
    var imgs = Array.prototype.slice.call(out.querySelectorAll('img'));
    var waits = imgs.map(function (im) {
      return im.complete ? null : new Promise(function (res) { im.onload = im.onerror = res; });
    }).filter(Boolean);
    if (!waits.length) { window.print(); return; }
    Promise.race([Promise.all(waits), new Promise(function (res) { setTimeout(res, 4000); })]).then(function () { window.print(); });
  }
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('printing-sheets');
    out.textContent = '';
  });

  // --- bingo ---
  function bingo(n) {
    out.textContent = '';
    var pool = words.filter(function (w) { return w.en.length <= 14; });
    if (pool.length < 16) return false;
    var p = null;
    for (var c = 0; c < n; c++) {
      if (c % 2 === 0) p = page('');
      var card = el('div', 'bingo-card');
      card.appendChild(el('div', 'bingo-title', 'BINGO · ' + unitName));
      card.appendChild(el('div', 'bingo-name', 'Name: ______________________'));
      var grid = el('div', 'bingo-grid');
      shuffle(pool).slice(0, 16).forEach(function (w) { grid.appendChild(el('div', 'bingo-cell', w.en)); });
      card.appendChild(grid);
      p.appendChild(card);
    }
    var calls = page(T.calls + unitName);
    calls.appendChild(el('p', 'sheet-note' + (EN ? ' sheet-note-en' : ''), T.callsNote));
    var list = el('ol', 'call-list');
    shuffle(pool).forEach(function (w) {
      var li = el('li');
      li.appendChild(el('span', 'call-box', '☐'));
      li.appendChild(el('span', 'call-en', w.en));
      li.appendChild(el('span', 'call-he', w.he));
      list.appendChild(li);
    });
    calls.appendChild(list);
    return true;
  }

  // --- word search ---
  var SIZE = 11, DIRS = [[0, 1], [1, 0], [1, 1]];
  function makeSearch() {
    var pool = shuffle(words.filter(function (w) { return /^[a-z]{3,9}$/i.test(w.en); }));
    for (var attempt = 0; attempt < 30; attempt++) {
      var grid = [], placed = [];
      for (var r = 0; r < SIZE; r++) { grid.push([]); for (var c = 0; c < SIZE; c++) grid[r].push(''); }
      var picks = pool.slice(0, 14).sort(function (a, b) { return b.en.length - a.en.length; });
      for (var i = 0; i < picks.length && placed.length < 10; i++) {
        var w = picks[i].en.toLowerCase();
        for (var tryN = 0; tryN < 80; tryN++) {
          var d = DIRS[Math.floor(Math.random() * DIRS.length)];
          var r0 = Math.floor(Math.random() * (SIZE - d[0] * (w.length - 1)));
          var c0 = Math.floor(Math.random() * (SIZE - d[1] * (w.length - 1)));
          var ok = true;
          for (var k = 0; k < w.length; k++) {
            var ch = grid[r0 + d[0] * k][c0 + d[1] * k];
            if (ch && ch !== w[k]) { ok = false; break; }
          }
          if (!ok) continue;
          var cells = [];
          for (k = 0; k < w.length; k++) { grid[r0 + d[0] * k][c0 + d[1] * k] = w[k]; cells.push((r0 + d[0] * k) + ',' + (c0 + d[1] * k)); }
          placed.push({ w: picks[i], cells: cells });
          break;
        }
      }
      if (placed.length >= Math.min(10, pool.length) && fill(grid)) return { grid: grid, placed: placed };
    }
    return null;
  }
  // Random filler letters must never spell a rude word in any direction (kids'
  // sheet): refill the free cells until no blocked string uses a filler letter.
  // (Matches made only of placed letters are the unit's own words — "kitten",
  // "grass" — and are fine.)
  var BLOCK = /sex|fuck|fuk|shit|piss|cock|dick|cunt|tit|ass|fag|cum|porn|nazi|kill|die|dead|gun|hate|poo|pee|butt|boob|anal|anus|nude|rape|slut|whore|hell|damn|crap|turd|kkk|wtf|xxx/g;
  function lines(g, isFree) {
    var out = [], n = SIZE, r, c, k;
    var run = function (cells) {
      out.push({ s: cells.map(function (x) { return g[x[0]][x[1]]; }).join(''), f: cells.map(function (x) { return isFree[x[0]][x[1]]; }) });
      var rev = cells.slice().reverse();
      out.push({ s: rev.map(function (x) { return g[x[0]][x[1]]; }).join(''), f: rev.map(function (x) { return isFree[x[0]][x[1]]; }) });
    };
    for (r = 0; r < n; r++) { var row = []; for (c = 0; c < n; c++) row.push([r, c]); run(row); }
    for (c = 0; c < n; c++) { var col = []; for (r = 0; r < n; r++) col.push([r, c]); run(col); }
    for (k = -(n - 1); k < n; k++) {
      var d1 = [], d2 = [];
      for (r = 0; r < n; r++) { c = r + k; if (c >= 0 && c < n) d1.push([r, c]); c = n - 1 - r + k; if (c >= 0 && c < n) d2.push([r, c]); }
      run(d1); run(d2);
    }
    return out;
  }
  function rude(g, isFree) {
    return lines(g, isFree).some(function (l) {
      var m; BLOCK.lastIndex = 0;
      while ((m = BLOCK.exec(l.s))) {
        for (var i = m.index; i < m.index + m[0].length; i++) if (l.f[i]) return true;
        BLOCK.lastIndex = m.index + 1;
      }
      return false;
    });
  }
  function fill(grid) {
    var abc = 'abcdefghijklmnopqrstuvwxyz', free = [], isFree = [], r, c;
    for (r = 0; r < SIZE; r++) { isFree.push([]); for (c = 0; c < SIZE; c++) { isFree[r].push(!grid[r][c]); if (!grid[r][c]) free.push([r, c]); } }
    for (var t = 0; t < 300; t++) {
      free.forEach(function (x) { grid[x[0]][x[1]] = abc[Math.floor(Math.random() * 26)]; });
      if (!rude(grid, isFree)) return true;
    }
    free.forEach(function (x) { grid[x[0]][x[1]] = ''; });
    return false;
  }
  function drawGrid(p, s, key) {
    var on = {};
    if (key) s.placed.forEach(function (x) { x.cells.forEach(function (c) { on[c] = 1; }); });
    var g = el('div', 'ws-grid');
    for (var r = 0; r < SIZE; r++) for (var c = 0; c < SIZE; c++) {
      g.appendChild(el('div', 'ws-cell' + (on[r + ',' + c] ? ' ws-on' : ''), s.grid[r][c]));
    }
    p.appendChild(g);
  }
  function search() {
    out.textContent = '';
    var s = makeSearch();
    if (!s) return false;
    var p = page(T.search + unitName);
    p.appendChild(el('div', 'bingo-name', 'Name: ______________________'));
    drawGrid(p, s, false);
    p.appendChild(el('p', 'sheet-note' + (EN ? ' sheet-note-en' : ''), T.searchNote));
    var list = el('ul', 'ws-list');
    s.placed.forEach(function (x) {
      var li = el('li');
      li.appendChild(el('span', 'call-en', x.w.en));
      li.appendChild(el('span', 'call-he', x.w.he));
      list.appendChild(li);
    });
    p.appendChild(list);
    var keyPage = page(T.key + 'Word Search · ' + unitName);
    drawGrid(keyPage, s, true);
    return true;
  }


  // --- crossword ---
  function drawCross(p, s, key) {
    var num = {};
    s.placed.forEach(function (x) { num[x.r + ',' + x.c] = x.n; });
    var cell = Math.min(1.1, Math.floor((17 / s.cols) * 10) / 10);
    var g = el('div', 'cw-grid');
    g.style.gridTemplateColumns = 'repeat(' + s.cols + ', ' + cell + 'cm)';
    for (var r = 0; r < s.rows; r++) for (var c = 0; c < s.cols; c++) {
      var ch = s.grid[r][c];
      var d = el('div', ch ? 'cw-cell' : 'cw-cell cw-block');
      d.style.width = d.style.height = cell + 'cm';
      if (ch && num[r + ',' + c]) d.appendChild(el('span', 'cw-n', String(num[r + ',' + c])));
      if (ch && key) d.appendChild(el('span', 'cw-l', ch));
      g.appendChild(d);
    }
    p.appendChild(g);
  }
  function clueList(dir, s) {
    var box = el('div', 'cw-clues');
    box.appendChild(el('h3', 'cw-h', dir === 'across' ? T.across : T.down));
    var ol = el('ol', 'cw-list');
    s.placed.filter(function (x) { return x.dir === dir; }).sort(function (a, b) { return a.n - b.n; }).forEach(function (x) {
      var li = el('li');
      li.appendChild(el('b', 'cw-num', x.n + '.'));
      if (x.w.img) { var im = el('img', 'cw-img'); im.src = x.w.img; im.alt = ''; li.appendChild(im); }
      var clue = EN ? (x.w.img ? '' : x.w.def) : x.w.he;
      if (clue) li.appendChild(el('span', EN ? 'cw-def' : 'call-he', clue));
      li.appendChild(el('span', 'cw-len', '(' + x.word.length + ')'));
      ol.appendChild(li);
    });
    box.appendChild(ol);
    return box;
  }
  function cross() {
    out.textContent = '';
    if (!window.cdeCrossword) return false;
    // picture clues when most words have a photo; otherwise meaning clues for all
    var withImg = words.filter(function (w) { return w.img; });
    var pool = withImg.length >= 8 ? withImg : words.map(function (w) { return { en: w.en, he: w.he, def: w.def, img: null }; });
    if (EN) pool = pool.filter(function (w) { return w.img || w.def; });
    var s = window.cdeCrossword.make(pool, { max: 12, maxSide: 15 });
    if (!s || s.placed.length < 4) return false;
    var p = page(T.cross + unitName);
    p.appendChild(el('div', 'bingo-name', 'Name: ______________________'));
    drawCross(p, s, false);
    p.appendChild(el('p', 'sheet-note' + (EN ? ' sheet-note-en' : ''), T.crossNote));
    var clues = el('div', 'cw-cols');
    clues.appendChild(clueList('across', s));
    clues.appendChild(clueList('down', s));
    p.appendChild(clues);
    var keyPage = page(T.key + 'Crossword · ' + unitName);
    drawCross(keyPage, s, true);
    return true;
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-sheet]');
    if (!b) return;
    var kind = b.getAttribute('data-sheet');
    var done = false;
    if (kind === 'bingo') {
      var sel = document.getElementById('bingo-n');
      done = bingo(Math.max(2, Math.min(40, parseInt(sel && sel.value, 10) || 10)));
    } else if (kind === 'search') {
      done = search();
    } else if (kind === 'cross') {
      done = cross();
    }
    if (done) print(kind);
  });
})();
