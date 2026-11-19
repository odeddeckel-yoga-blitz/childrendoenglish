// /es/primaria/ — "Inglés para niños de primaria" (audit 11-18 idea 12, Spanish parity; owner OK 11-18).
// One Spanish door to everything CDE has for Spanish speakers: the 13 /vocabulary/<cat>/spanish/ lists, the Spanish
// printable flashcards, the week packs (/es/fichas/), the games with a Spanish interface (?lang=es), the 8 readings
// with tap-for-Spanish (/es/lecturas/), and a short section for parents and teachers. Demand (Bing/GSC 90d, 0 clicks):
// "inglés para niños gratis", "vocabulario en inglés para niños", "ejercicios de vocabulario en inglés",
// "tarjetas de vocabulario en inglés". No hreflang: no other language has this page.
import { join } from 'path';
import { mkdirSync } from 'fs';
import { wordSetKit } from './build-unit-pages.mjs';
import { WORD_COUNT } from '../src/data/wordCount.js';
import { readingOrder } from './build-reading-pages.mjs';

// Game names stay English (they are the games' names); one line each in Spanish.
const GAME_ES = {
  'word-zapper': 'Escucha la palabra y atrapa su imagen.',
  'spelling-forge': 'Arma la palabra letra por letra.',
  'category-conveyor': 'Ordena cada palabra en su tema.',
  'letter-twins': 'Mira la imagen y elige la primera letra (b, d, p, q…).',
  'sound-pairs': 'Escucha y elige entre dos palabras que suenan parecido.',
  'read-it': 'Lee palabras cortas como cat o ship y elige la imagen.',
  'rhyme-time': 'Encuentra las palabras que riman.',
  'odd-one-out': '¿Cuál no es del grupo?',
  'word-memory': 'Memoria: une cada palabra con su imagen.',
  'missing-letter': 'Completa la letra que falta.',
  'picture-bingo': 'Bingo de imágenes con audio.',
  opposites: 'Une cada palabra con su opuesto.',
  'true-or-false': 'Una imagen y una oración: ¿verdadero o falso?',
  feelings: 'Emociones con caras, palabras e historias cortas.',
  'sentence-builder': 'Ordena las palabras y arma la oración.',
  'beginning-sounds': 'Mira una letra y toca la imagen que empieza con ella.',
  'simon-says': 'Escucha la orden y toca la acción.',
  'letter-drop': 'Atrapa las letras de la palabra, en orden.',
  'shopping-list': 'Escucha la lista de compras y elige los alimentos en orden.',
};

export function buildEsHub({ SITE, distDir, writePage, escapeHtml, WORDS, collides, CATEGORIES, CATEGORY_NAMES_ES, ES_GLOSSES, GAMES, READINGS }) {
  const kit = wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides });
  const path = '/es/primaria/';
  const count = (c) => WORDS.filter((w) => w.category === c && ES_GLOSSES[w.id]).length;

  const games = GAMES.filter((g) => GAME_ES[g.id]);
  const faq = [
    ['¿Es gratis?', 'Sí. Todo es gratis: sin anuncios, sin compras dentro de la app y sin registro. Las fichas y las tarjetas se imprimen desde el navegador.'],
    ['¿Para qué edad es?', 'Para niños de primaria, de 6 a 12 años. Los más pequeños empiezan con colores, animales y números; los mayores siguen con lecturas cortas y las fichas de ejercicios.'],
    ['¿Necesito saber inglés para ayudar a mi hijo?', 'No. Cada palabra tiene su audio en inglés y su traducción al español, así que el niño escucha la pronunciación y tú ves el significado. El audio es una voz generada por computadora, la misma para todas las palabras.'],
    ['¿Hay ejercicios de vocabulario en inglés para imprimir?', `Sí. Hay un paquete de 5 páginas para cada uno de los ${CATEGORIES.length} temas (tarjetas, unir, completar letras, sopa de letras, lee y dibuja y hoja de respuestas) y tarjetas de vocabulario en inglés y español para cada tema.`],
  ];
  const faqLd = kit.faq(faq);
  const card = (href, strong, span) => `<a class="unit-card" href="${href}"><strong>${strong}</strong><span>${span}</span></a>`;
  const topicRows = CATEGORIES.map((c) => `<tr><td><a href="/vocabulary/${c}/spanish/">${escapeHtml(CATEGORY_NAMES_ES[c] || c)}</a></td><td>${count(c)}</td><td><a href="/printable-flashcards/${c}/spanish/">Tarjetas</a></td><td><a href="/es/fichas/${c}/">Fichas</a></td></tr>`).join('');
  const body = `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/es/">Español</a> › Inglés para primaria</nav>
  <header class="hero"><h1>Inglés para niños de primaria</h1>
    <p class="answer">Inglés para niños gratis, en español: más de ${WORD_COUNT} palabras en inglés con su traducción al español en ${CATEGORIES.length} temas, tarjetas y fichas de ejercicios para imprimir, ${games.length} juegos y ${READINGS.length} lecturas cortas. Sin anuncios y sin registro.</p>
    <p class="jump-row"><a class="jump-btn" href="/new-player?lang=es&amp;utm_source=seo&amp;utm_medium=cta_top&amp;utm_content=es_primaria">Empezar a jugar</a></p></header>
  <main class="container">
    <section class="section" aria-labelledby="voc-h">
      <h2 id="voc-h" class="section-title">Vocabulario en inglés para niños, por temas</h2>
      <p class="center">Cada tema tiene la lista de palabras con imagen, audio en inglés y traducción al español, las tarjetas para imprimir y un paquete de fichas.</p>
      <table class="words es-topics"><thead><tr><th scope="col">Tema</th><th scope="col">Palabras</th><th scope="col">Para imprimir</th><th scope="col">Ejercicios</th></tr></thead><tbody>${topicRows}</tbody></table>
    </section>
    <section class="section" aria-labelledby="print-h">
      <h2 id="print-h" class="section-title">Ejercicios y tarjetas para imprimir</h2>
      <div class="unit-grid">
        ${card('/es/fichas/', 'Fichas de ejercicios de vocabulario en inglés', `Un paquete de 5 páginas por tema, con hoja de respuestas (${CATEGORIES.length} temas).`)}
        ${card('/printable-flashcards/spanish/', 'Tarjetas de vocabulario en inglés', 'Tarjetas con imagen, la palabra en inglés y la traducción al español, para recortar.')}
        ${card('/tools/flashcard-maker/', 'Crea tus propias tarjetas', 'Elige las palabras y arma tarjetas a doble cara.')}
      </div>
    </section>
    <section class="section" aria-labelledby="games-h">
      <h2 id="games-h" class="section-title">Juegos en inglés, con las instrucciones en español</h2>
      <div class="unit-grid">${games.map((g) => card(`/games/${g.id}/?lang=es`, `<span lang="en">${escapeHtml(g.name)}</span>`, escapeHtml(GAME_ES[g.id]))).join('\n        ')}
      </div>
    </section>
    <section class="section" aria-labelledby="read-h">
      <h2 id="read-h" class="section-title">Lecturas cortas en inglés</h2>
      <p class="center">Textos cortos con audio frase por frase: toca cualquier palabra para verla en español y responde 3 preguntas.</p>
      <div class="unit-grid">${readingOrder(READINGS).map((r) => card(`/es/lecturas/${r.slug}/`, `<span lang="en">${escapeHtml(r.title)}</span>`, escapeHtml(r.es))).join('\n        ')}
      </div>
      <p class="center"><a href="/es/lecturas/">Todas las lecturas &rarr;</a></p>
    </section>
    <section class="section" aria-labelledby="parents-h">
      <h2 id="parents-h" class="section-title">Para madres, padres y maestros</h2>
      <div class="faq">
        <div class="faq-item"><h3>Diez minutos al día</h3><p>Es mejor poco y seguido: 3 a 5 palabras nuevas al día, escuchadas en voz alta, y un repaso corto al día siguiente. La app repite sola las palabras justo antes de que se olviden.</p></div>
        <div class="faq-item"><h3>Primero escuchar, después leer</h3><p>Deja que el niño escuche la palabra en inglés y la repita antes de leerla. La traducción al español sirve para entender, no para memorizar palabra por palabra.</p></div>
        <div class="faq-item"><h3>Una ficha para el fin de semana</h3><p>Imprime el paquete del tema de la semana: las tarjetas sirven para jugar en familia y la hoja de respuestas te deja revisar sin saber inglés.</p></div>
        <div class="faq-item"><h3>Lo que guarda la app</h3><p>No hace falta crear una cuenta. El progreso del niño se guarda en este dispositivo.</p></div>
      </div>
    </section>
    <section class="section" aria-labelledby="faq-h">
      <h2 id="faq-h" class="section-title">Preguntas frecuentes</h2>
      <div class="faq">${faq.map(([q, a]) => `
        <div class="faq-item"><h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p></div>`).join('')}
      </div>
    </section>
    <p class="center more"><a class="cta" href="/new-player?lang=es&amp;utm_source=seo&amp;utm_medium=cta&amp;utm_content=es_primaria">Practicar en la app, gratis →</a></p>
  </main>`;
  const css = `
    .es-topics td a { font-weight: 700; } .es-topics th, .es-topics td { text-align: left; }
    .jump-btn { margin-top: 0.4rem; }
  `;
  const dir = join(distDir, 'es', 'primaria');
  mkdirSync(dir, { recursive: true });
  writePage(join(dir, 'index.html'), kit.shell({
    path, test: false, lang: 'es', css,
    footerNote: 'El audio en inglés es una voz generada por computadora. Las traducciones, oraciones y fichas son de Children Do English.',
    title: 'Inglés para niños de primaria: vocabulario, juegos y fichas gratis | Children Do English',
    description: `Inglés para niños gratis: vocabulario en inglés con traducción al español en ${CATEGORIES.length} temas, tarjetas y fichas de ejercicios para imprimir, juegos y lecturas cortas. Para primaria, sin registro.`,
    schemas: [kit.crumbs([['Español', '/es/'], ['Inglés para primaria', path]]), faqLd],
    body,
  }));
  return path;
}
