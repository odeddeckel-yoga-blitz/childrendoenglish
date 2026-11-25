// Chant cards — PILOT (audit 11-18 idea 13, owner OK 11-18): /chants/ + /chants/<slug>/ ×3, built noindex and linked
// from nowhere until someone has heard them (the audit's risk: TTS prosody can sound robotic). Read-along on a beat:
// public/chant.js plays one Piper clip per line and lights the line's 4 beat groups in time with the clip (the CSS
// does the timing from --dur / --n / --i); a beat dot pulses with it; the child claps on each lit group. A print card
// with the lines comes out of the same page. Never call it a song; the voice is a computer voice.
import { join } from 'path';
import { mkdirSync } from 'fs';
import { sentenceAudio } from './sentence-audio.mjs';
import { pageLd } from './page-ld.mjs';
import { chantLine } from '../src/data/chants.js';

export const CHANTS_INDEX = false; // pilot: noindex until the ear check

const CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.6; }
    .header { background: #2563eb; color: #fff; padding: 1.75rem 1rem; text-align: center; }
    .header h1 { font-size: 1.7rem; } .header p { opacity: 0.95; }
    .pilot { display: inline-block; background: #fef3c7; color: #92400e; font-weight: 800; font-size: 0.8rem; padding: 0.1rem 0.6rem; border-radius: 999px; margin-bottom: 0.4rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #4b5a6e; max-width: 760px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; }
    .container { max-width: 760px; margin: 0 auto; padding: 0 1rem 2rem; }
    .intro { color: #475569; margin-bottom: 1rem; }
    .tools { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin: 0.5rem 0 1.25rem; }
    .tools button { min-height: 48px; padding: 0.5rem 1.3rem; border-radius: 999px; border: 2px solid #2563eb; background: #fff; color: #1e40af; font-weight: 800; font-size: 1.05rem; cursor: pointer; font-family: inherit; }
    .tools .go { background: #2563eb; color: #fff; }
    .tools button[aria-pressed="true"] { background: #dbeafe; }
    .card { background: #fff; border-radius: 1rem; padding: 1.25rem 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .cl { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.5rem; border-radius: 0.7rem; font-size: 1.45rem; font-weight: 800; flex-wrap: wrap; }
    .cl.on { background: #fef9c3; }
    .beat { width: 14px; height: 14px; border-radius: 50%; background: #cbd5e1; flex: none; }
    .bg { padding: 0.05rem 0.3rem; border-radius: 0.4rem; }
    .cl.on .beat { animation: pulse calc(var(--dur) / var(--n)) linear infinite; background: #f59e0b; }
    .cl.on .bg { animation: hit calc(var(--dur) / var(--n)) ease-out both; animation-delay: calc(var(--dur) * var(--i) / var(--n)); }
    @keyframes hit { 0% { background: #fde047; transform: scale(1.12); } 100% { background: transparent; transform: none; } }
    @keyframes pulse { 0% { transform: scale(1.5); } 60% { transform: scale(1); } 100% { transform: scale(1); } }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    @media (max-width: 480px) { .cl { font-size: 1.15rem; gap: 0.2rem 0.3rem; } }
    @media (prefers-reduced-motion: reduce) { .cl.on .bg, .cl.on .beat { animation: none; } .cl.on .bg { text-decoration: underline; } }
    .how { margin-top: 1.25rem; color: #475569; }
    .how li { margin-left: 1.2rem; }
    .list a { display: block; background: #fff; border-radius: 0.75rem; padding: 1rem 1.2rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); color: #1e40af; font-weight: 800; text-decoration: none; }
    .list span { display: block; font-weight: 400; color: #475569; font-size: 0.9rem; }
    .footer { text-align: center; padding: 2rem 1rem; color: #5b6779; font-size: 0.8rem; }
    @media print { .header, .breadcrumb, .tools, .intro, .how, .footer { display: none !important; } body { background: #fff; } .card { box-shadow: none; border: 2px dashed #64748b; } .cl { font-size: 20pt; } .beat { background: #94a3b8; } }
`;

function shell({ SITE, path, title, description, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="${CHANTS_INDEX ? 'index, follow' : 'noindex'}" />
  <link rel="canonical" href="${SITE}${path}" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  ${pageLd({ type: path === '/chants/' ? 'CollectionPage' : 'WebPage', name: title, description, path })}
  <style>${CSS}</style>
</head>
<body>
${body}
  <div class="footer"><span dir="ltr">&copy; ${new Date().getFullYear()} Children Do English</span> &middot; <a href="/about/" style="color:#5b6779">About</a> &middot; <a href="/privacy" style="color:#5b6779">Privacy</a></div>
</body>
</html>`;
}

export function buildChantPages({ SITE, distDir, writePage, escapeHtml, CHANTS }) {
  const out = [];
  const icon = (n) => `<svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-${n}"/></svg>`;
  for (const [ci, c] of CHANTS.entries()) {
    const path = `/chants/${c.slug}/`;
    for (const beats of c.lines) if (beats.length !== 4) throw new Error(`chant ${c.slug}: every line needs 4 beat groups`);
    const lines = c.lines.map((beats, k) => {
      const src = sentenceAudio(chantLine(beats));
      if (!src) throw new Error(`chant ${c.slug}: no audio for "${chantLine(beats)}" — run ~/.venvs/whisper/bin/python scripts/chant-audio.py`);
      return `<p class="cl" data-k="${k}" data-src="${src}" style="--n:${beats.length};--dur:3000ms"><span class="sr">${escapeHtml(chantLine(beats))}</span><span class="beat" aria-hidden="true"></span>${beats.map((b, i) => `<span class="bg" style="--i:${i}" aria-hidden="true">${escapeHtml(b)}</span>`).join(' ')}</p>`;
    }).join('\n      ');
    const next = CHANTS[ci + 1];
    const body = `  <div class="header"><span class="pilot">Pilot</span><h1>Chant: ${escapeHtml(c.title)}</h1><p>A read-along chant on a beat: ${escapeHtml(c.what)}.</p></div>
  <div class="breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/chants/">Chants</a> &rsaquo; ${escapeHtml(c.title)}</div>
  <main class="container" data-chant="${c.slug}">
    <p class="intro">Press Start. Each line lights up on the beat: say it with the computer voice and clap on every lit part. Then try it again, faster, without the voice.</p>
    <div class="tools"><button type="button" class="go" data-chant-play>${icon('play')} Start</button><button type="button" data-chant-slow aria-pressed="false">${icon('turtle')} Slower</button><button type="button" data-print>${icon('printer')} Print the card</button></div>
    <div class="card" lang="en">
      ${lines}
    </div>
    <ol class="how">
      <li>First time: listen and clap on each lit part.</li>
      <li>Second time: say the lines with the voice.</li>
      <li>Third time: press Slower, or say it on your own while a friend claps the beat.</li>
    </ol>
    <p class="intro" style="margin-top:1rem">${next ? `Next chant: <a href="/chants/${next.slug}/">${escapeHtml(next.title)}</a>` : '<a href="/chants/">All chants</a>'}</p>
  </main>
  <script defer src="/chant.js"></script>
  <script defer src="/print-btn.js"></script>`;
    const dir = join(distDir, 'chants', c.slug);
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), shell({ SITE, path, title: `Chant for Kids: ${escapeHtml(c.title)} (read-along on a beat) | Children Do English`,
      description: `A short read-along chant for kids learning English: ${escapeHtml(c.what)}. Each line lights up on the beat; clap along.`, body }));
    out.push(path);
  }
  const dir = join(distDir, 'chants');
  mkdirSync(dir, { recursive: true });
  writePage(join(dir, 'index.html'), shell({ SITE, path: '/chants/', title: 'Chants for Kids Learning English (pilot) | Children Do English',
    description: 'Short read-along chants on a beat for kids learning English: days of the week, colors and numbers.',
    body: `  <div class="header"><span class="pilot">Pilot</span><h1>Chants</h1><p>Short read-along lines on a beat. Clap along!</p></div>
  <div class="breadcrumb"><a href="/">Home</a> &rsaquo; Chants</div>
  <main class="container"><p class="intro">Three chants to try. Each line is four beats; the voice is a computer voice.</p><div class="list">${CHANTS.map((c) => `<a href="/chants/${c.slug}/">${escapeHtml(c.title)}<span>${escapeHtml(c.what)}</span></a>`).join('')}</div></main>` }));
  out.push('/chants/');
  return out;
}
