/* Print buttons on the static printable pages. External file because the CSP
 * (script-src 'self') blocks inline onclick handlers — the inline
 * onclick="window.print()" these pages shipped with never ran. */
document.addEventListener('click', function (ev) {
  if (ev.target.closest && ev.target.closest('[data-print]')) window.print();
});
