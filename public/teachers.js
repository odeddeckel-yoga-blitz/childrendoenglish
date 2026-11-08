/* /teachers/ — keeps the flashcard-maker preview in step with the form (topic, back of the card, cards per page,
 * picture style). External file: the CSP blocks inline scripts. The form itself is a plain GET to
 * /tools/flashcard-maker/, so it works without this file. Data: data-fm on #tFmPrev, built from the word list. */
(function () {
  var prev = document.getElementById('tFmPrev');
  var form = document.getElementById('tFm');
  if (!prev || !form) return;
  var data;
  try { data = JSON.parse(prev.getAttribute('data-fm') || '{}'); } catch (e) { return; }
  var cap = document.getElementById('tFmCap');
  function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function render() {
    var cat = form.elements.cat.value, back = val('back'), per = Number(val('per')) || 6, pics = val('pics');
    var d = data[cat]; if (!d) return;
    // one picture style per sheet: page 1 is the photo sheet unless only drawings are asked for (or there are no photos)
    var useDrawn = pics === 'drawn' || (!d.p.length && d.d.length);
    var list = (useDrawn ? d.d : d.p).slice(0, per);
    var total = pics === 'photo' ? d.np : pics === 'drawn' ? d.nd : d.n;
    prev.className = 'sheet per' + per;
    prev.textContent = '';
    list.forEach(function (w) {
      var c = document.createElement('div'); c.className = 'cell';
      var img = document.createElement('img'); img.src = '/images/' + w[0] + '.webp'; img.alt = ''; img.width = 56; img.height = 56;
      var b = document.createElement('b'); b.textContent = w[1];
      c.appendChild(img); c.appendChild(b);
      if (back === 'he' || back === 'es') {
        var s = document.createElement('span'); s.textContent = back === 'he' ? w[2] : w[3];
        s.lang = back; if (back === 'he') s.dir = 'rtl';
        c.appendChild(s);
      }
      prev.appendChild(c);
    });
    var opt = form.elements.cat.options[form.elements.cat.selectedIndex];
    var name = opt ? opt.textContent.replace(/\s*\(\d+ words\)$/, '') : cat;
    if (cap) cap.textContent = 'Preview · first page · ' + total + ' ' + name + ' cards';
  }
  form.addEventListener('change', render);
  render();
})();
