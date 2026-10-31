/* Crossword layout for the printable sheets (E2). CSP-safe external file, no DOM:
 * window.cdeCrossword.make(words, opts) → { rows, cols, grid, placed, unplaced }.
 *   words: [{ en, x?, ... }] — answers are en lowercased; only a–z words of 3..maxLen fit;
 *   x lists look-alike words (crocodile/alligator) that never go in one puzzle.
 *   placed: [{ w, word, r, c, dir: 'across'|'down', n }] with clue numbers n (row-major).
 *   unplaced: the words that could not cross the grid (reported, never silently dropped).
 * Rules: every new word crosses at least one placed word (except the first); letters
 * at a crossing agree; a non-crossing letter never touches another word side-on, and
 * nothing sits right before a word's first letter or after its last, so every run of
 * 2+ letters in the grid is exactly one answer (no stray "words").
 * Random tie-breaks: every print is a new layout. Tests: src/__tests__/crossword.test.js. */
(function (root) {
  'use strict';
  var N = 40; // working canvas; cropped to the used area at the end

  function emptyGrid() {
    var g = [];
    for (var r = 0; r < N; r++) { g.push([]); for (var c = 0; c < N; c++) g[r].push(''); }
    return g;
  }
  function at(g, r, c) { return r >= 0 && c >= 0 && r < N && c < N ? g[r][c] : ''; }

  // How many crossings placing word at (r, c, dir) makes, or -1 if it breaks a rule.
  function fit(g, word, r, c, dir) {
    var dr = dir === 'down' ? 1 : 0, dc = dir === 'down' ? 0 : 1, cross = 0;
    if (r < 0 || c < 0 || r + dr * (word.length - 1) >= N || c + dc * (word.length - 1) >= N) return -1;
    if (at(g, r - dr, c - dc) || at(g, r + dr * word.length, c + dc * word.length)) return -1;
    for (var k = 0; k < word.length; k++) {
      var rr = r + dr * k, cc = c + dc * k, ch = g[rr][cc];
      if (ch) {
        if (ch !== word[k]) return -1;
        cross++;
      } else if (at(g, rr + dc, cc + dr) || at(g, rr - dc, cc - dr)) {
        return -1; // a new letter would touch a neighbour side-on
      }
    }
    return cross;
  }
  function put(g, word, r, c, dir) {
    for (var k = 0; k < word.length; k++) g[r + (dir === 'down' ? k : 0)][c + (dir === 'down' ? 0 : k)] = word[k];
  }

  function attempt(list, rnd) {
    var g = emptyGrid(), placed = [], unplaced = [];
    list.forEach(function (w, i) {
      var word = w.en.toLowerCase();
      if (i === 0) {
        var r0 = Math.floor(N / 2), c0 = Math.floor((N - word.length) / 2);
        put(g, word, r0, c0, 'across');
        placed.push({ w: w, word: word, r: r0, c: c0, dir: 'across' });
        return;
      }
      var best = null, bestScore = 0;
      placed.forEach(function (p) {
        for (var a = 0; a < p.word.length; a++) {
          for (var b = 0; b < word.length; b++) {
            if (p.word[a] !== word[b]) continue;
            var dir = p.dir === 'across' ? 'down' : 'across';
            var pr = p.r + (p.dir === 'down' ? a : 0), pc = p.c + (p.dir === 'down' ? 0 : a);
            var r = dir === 'down' ? pr - b : pr, c = dir === 'down' ? pc : pc - b;
            var n = fit(g, word, r, c, dir);
            if (n < 1) continue;
            var score = n + rnd() * 0.9; // more crossings first, random among equals
            if (score > bestScore) { bestScore = score; best = { r: r, c: c, dir: dir }; }
          }
        }
      });
      if (best) { put(g, word, best.r, best.c, best.dir); placed.push({ w: w, word: word, r: best.r, c: best.c, dir: best.dir }); }
      else unplaced.push(w);
    });
    return { g: g, placed: placed, unplaced: unplaced };
  }

  function crop(res) {
    var minR = N, minC = N, maxR = 0, maxC = 0;
    res.placed.forEach(function (p) {
      var endR = p.r + (p.dir === 'down' ? p.word.length - 1 : 0), endC = p.c + (p.dir === 'down' ? 0 : p.word.length - 1);
      minR = Math.min(minR, p.r); minC = Math.min(minC, p.c); maxR = Math.max(maxR, endR); maxC = Math.max(maxC, endC);
    });
    var grid = [];
    for (var r = minR; r <= maxR; r++) grid.push(res.g[r].slice(minC, maxC + 1));
    var placed = res.placed.map(function (p) { return { w: p.w, word: p.word, r: p.r - minR, c: p.c - minC, dir: p.dir }; });
    // clue numbers: row-major order of start cells; across + down from one cell share a number
    var starts = {};
    placed.slice().sort(function (a, b) { return a.r - b.r || a.c - b.c; }).forEach(function (p) {
      var k = p.r + ',' + p.c;
      if (!starts[k]) starts[k] = Object.keys(starts).length + 1;
      p.n = starts[k];
    });
    return { rows: grid.length, cols: grid[0].length, grid: grid, placed: placed, unplaced: res.unplaced };
  }

  // x = words a child can't tell apart from this one (same picture/meaning): never both
  function clash(a, b) {
    var ea = a.en.toLowerCase(), eb = b.en.toLowerCase();
    return (a.x || []).some(function (s) { return s.toLowerCase() === eb; }) || (b.x || []).some(function (s) { return s.toLowerCase() === ea; });
  }
  function shuffle(a, rnd) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }

  // opts: { max: words to try (12), maxLen: longest answer (12), tries: layouts (60),
  //         maxSide: largest grid side that fits a page (15), rnd: Math.random }
  function make(words, opts) {
    opts = opts || {};
    var rnd = opts.rnd || Math.random, max = opts.max || 12, maxLen = opts.maxLen || 12;
    var maxSide = opts.maxSide || 15, tries = opts.tries || 60;
    var ok = words.filter(function (w) { return new RegExp('^[a-z]{3,' + maxLen + '}$', 'i').test(w.en); });
    var seen = {};
    ok = ok.filter(function (w) { var k = w.en.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
    var rejected = words.filter(function (w) { return ok.indexOf(w) < 0; });
    var best = null;
    for (var t = 0; t < tries; t++) {
      // longest first gives the layout a spine; shuffle within the pick for variety
      var pick = [];
      shuffle(ok, rnd).forEach(function (w) {
        if (pick.length < max && !pick.some(function (k) { return clash(w, k); })) pick.push(w);
      });
      pick.sort(function (a, b) { return b.en.length - a.en.length || rnd() - 0.5; });
      if (!pick.length) break;
      var res = crop(attempt(pick, rnd));
      if (res.rows > maxSide || res.cols > maxSide) continue;
      var key = res.placed.length * 1000 - res.rows * res.cols;
      if (!best || key > best.key) { best = res; best.key = key; }
    }
    if (!best) return null;
    delete best.key;
    best.skipped = rejected; // not a–z or too long/short: never offered to the layout
    return best;
  }

  root.cdeCrossword = { make: make };
})(typeof window !== 'undefined' ? window : globalThis);
