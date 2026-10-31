// Sync QR → inline SVG for printables (R2C18): a printed sheet links back to its
// page, tagged ?src=print so print-btn.js can count QR arrivals. Built at build
// time (no runtime library, CSP stays 'self').
import QRCode from 'qrcode';

export function qrSvg(url, px = 96) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: 'M' });
  const n = modules.size, q = 2; // 2-module quiet zone
  let d = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!modules.get(y, x)) continue;
      let w = 1; while (x + w < n && modules.get(y, x + w)) w++;   // one rect per dark run
      d += `M${x + q} ${y + q}h${w}v1h-${w}z`; x += w - 1;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

// The print-only block: QR + one line of text, in the page language.
export function printQrBlock(pageUrl, text, dir = 'ltr') {
  const url = pageUrl + (pageUrl.includes('?') ? '&' : '?') + 'src=print';
  return `<div class="print-qr" dir="${dir}">${qrSvg(url)}<p>${text}</p></div>`;
}
export const PRINT_QR_CSS = '.print-qr{display:none}@media print{.print-qr{display:flex;align-items:center;gap:10px;margin:8px 0;break-inside:avoid}.print-qr p{margin:0;font-size:12px;color:#000}}';
