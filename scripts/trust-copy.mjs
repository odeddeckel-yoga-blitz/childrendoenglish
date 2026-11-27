// Copy for the static trust pages (scripts/build-trust-pages.mjs): /about/ in en/he/es and the page titles of
// /privacy/ and /terms/. The policy and terms text itself is NOT here: it comes from src/utils/i18n*.js, so the
// static pages and the in-app screens say the same thing. Owner OK 11-18 (audit B §12/§15).
// Facts only (persona P5): no "native speaker" (audio is Piper TTS), no compliance self-claims, no testimonials,
// contact = info@childrendoenglish.com. {placeholders} are filled from the data at build time.
// Markup: [[/path/|link text]] is a link; an email address becomes a mailto link. Everything else is plain text.
// Hebrew/Spanish were checked with the kit i18n consensus (tools/i18n/trust-units.mjs).

export const ABOUT = {
  en: {
    title: 'About Children Do English | Who Makes It and Why',
    description: 'Children Do English is a free, ad-free English vocabulary app for kids ages 6-12, built by Oded Deckelbaum. Who makes it, why, how it is made, and how to get in touch.',
    h1: 'About Children Do English',
    sub: 'Free English vocabulary practice for kids ages 6-12',
    crumbHome: 'Home', crumb: 'About',
    makerTitle: 'Who makes it',
    makerMe: 'I am Oded Deckelbaum, a software engineer and a parent. I build and run Children Do English myself.',
    makerWhy: 'Why: I could not find an English vocabulary app for my own kids that was free, had no ads and focused on real learning, so I made one.',
    makerHow: 'How it is made: every word has a picture, a short definition and an example sentence. The audio is a computer voice (Piper text-to-speech, voice “Jenny (Dioco)”), the same on every device. Some pictures are photos by other photographers, used under their licences; pictures and voices are listed on the [[/image-credits/|Image credits]] page.',
    makerContact: 'Questions or ideas? Email info@childrendoenglish.com.',
    factsTitle: 'Facts at a glance',
    privacyTitle: 'Privacy',
    privacyText: 'There are no accounts and no sign-up, and we collect nothing personal. Learning progress stays on the device. We count visits with cookieless Vercel Web Analytics and an anonymous counter of our own that keeps only daily totals, and error reports help us fix bugs. [[/privacy/|Read the full privacy policy]]',
    cta: 'Start learning',
  },
  he: {
    title: 'אודות Children Do English | מי בונה את האתר ולמה',
    description: 'Children Do English הוא אתר חינמי ללימוד אוצר מילים באנגלית לילדים בגילאי 6–12, בלי פרסומות. מי בונה אותו, למה, איך הוא נעשה ואיך יוצרים קשר.',
    h1: 'אודות Children Do English',
    sub: 'תרגול אוצר מילים באנגלית בחינם לילדים בגילאי 6–12',
    crumbHome: 'דף הבית', crumb: 'אודות',
    makerTitle: 'מי בונה את האתר',
    makerMe: 'אני עודד דקלבאום, מהנדס תוכנה ואבא. אני בונה ומפעיל את Children Do English בעצמי.',
    makerWhy: 'למה: לא מצאתי לילדים שלי אפליקציה לאוצר מילים באנגלית שהיא חינמית, בלי פרסומות וממוקדת בלמידה אמיתית, אז בניתי אחת.',
    makerHow: 'איך זה נעשה: לכל מילה יש תמונה, הגדרה קצרה ומשפט לדוגמה. ההשמעה היא קול ממוחשב (Piper, המרת טקסט לדיבור, הקול Jenny של Dioco), זהה בכל מכשיר. חלק מהתמונות הן צילומים של צלמים אחרים, שמשמשים לפי הרישיונות שלהם; התמונות והקולות מופיעים בדף [[/image-credits/|הקרדיטים לתמונות]].',
    makerContact: 'שאלות או רעיונות? כתבו ל־info@childrendoenglish.com.',
    factsTitle: 'עובדות בקצרה',
    privacyTitle: 'פרטיות',
    privacyText: 'אין חשבונות ואין הרשמה, ואנחנו לא אוספים שום מידע אישי. ההתקדמות בלמידה נשארת במכשיר. אנחנו סופרים כניסות עם Vercel Web Analytics, שפועל בלי עוגיות, ועם מונה אנונימי משלנו ששומר רק סיכומים יומיים, ודוחות שגיאה עוזרים לנו לתקן תקלות. [[/he/privacy/|למדיניות הפרטיות המלאה]]',
    cta: 'להתחיל ללמוד',
  },
  es: {
    title: 'Acerca de Children Do English | Quién lo hace y por qué',
    description: 'Children Do English es una app gratuita y sin anuncios de vocabulario en inglés para niños de 6 a 12 años, creada por Oded Deckelbaum. Quién la hace, por qué, cómo se hace y cómo contactar.',
    h1: 'Acerca de Children Do English',
    sub: 'Práctica gratuita de vocabulario en inglés para niños de 6 a 12 años',
    crumbHome: 'Inicio', crumb: 'Acerca de',
    makerTitle: 'Quién lo hace',
    makerMe: 'Soy Oded Deckelbaum, ingeniero de software y padre. Creo y mantengo Children Do English yo mismo.',
    makerWhy: 'Por qué: no encontraba para mis hijos una app de vocabulario en inglés que fuera gratis, sin anuncios y centrada en aprender de verdad, así que hice una.',
    makerHow: 'Cómo se hace: cada palabra tiene una imagen, una definición corta y una frase de ejemplo. El audio es una voz generada por computadora (texto a voz Piper, voz «Jenny (Dioco)»), la misma en todos los dispositivos. Algunas imágenes son fotos de otros fotógrafos, usadas según sus licencias; las imágenes y las voces están citadas en la página de [[/image-credits/|créditos de las imágenes]].',
    makerContact: '¿Preguntas o ideas? Escribe a info@childrendoenglish.com.',
    factsTitle: 'Datos en breve',
    privacyTitle: 'Privacidad',
    privacyText: 'No hay cuentas ni registro, y no recogemos nada personal. El progreso se queda en el dispositivo. Contamos las visitas con Vercel Web Analytics, que no usa cookies, y con un contador anónimo propio que solo guarda totales diarios, y los informes de errores nos ayudan a corregir fallos. [[/es/privacy/|Lee la política de privacidad completa]]',
    cta: 'Empezar a aprender',
  },
};

// Spanish "Facts at a glance" (the en/he lists live in generate-seo-pages.js as FACTS_EN / FACTS_HE).
export const FACTS_ES = {
  words: 'Children Do English tiene {words} palabras en inglés en {cats} temas, cada una con una imagen, audio, una definición sencilla y una frase de ejemplo.',
  glossAll: 'Todas las palabras tienen traducción al hebreo y al español.',
  glossSome: 'Todas las palabras tienen traducción al hebreo, y {es} tienen traducción al español.',
  audio: 'El audio de todas las palabras usa una sola voz generada por computadora (texto a voz Piper), la misma en todos los dispositivos.',
  ladder: 'Cada grupo de 10 palabras sube una escalera de práctica de 11 pasos: tarjetas, quizzes de escuchar y de leer, ortografía, un paso con frases y juegos arcade.',
  games: 'Hay {games} juegos arcade gratis y una Class Battle en vivo para el aula.',
  band1: '{band1} de las palabras están asignadas a los niveles de vocabulario Band I de Israel, y {units} unidades de libros de texto tienen su propia página de palabras.',
  free: 'Es gratis, no tiene anuncios, no necesita cuenta ni registro y guarda el progreso en el dispositivo.',
};

// <title>/description of the static policy pages and the footer link labels (labels reuse the app's strings).
export const LEGAL_META = {
  en: {
    privacyTitle: 'Privacy Policy | Children Do English',
    privacyDesc: 'What Children Do English keeps and what it does not: no accounts, no cookies, progress stays on the device, only anonymous daily totals and error reports. Your rights and how to delete data.',
    termsTitle: 'Terms of Service | Children Do English',
    termsDesc: 'The terms for using Children Do English, a free English vocabulary app for kids ages 6-12.',
    about: 'About',
  },
  he: {
    privacyTitle: 'מדיניות פרטיות | Children Do English',
    privacyDesc: 'מה Children Do English שומר ומה לא: אין חשבונות ואין עוגיות, ההתקדמות נשארת במכשיר, ונשלחים רק סיכומים יומיים אנונימיים ודוחות שגיאה. הזכויות שלכם ואיך מוחקים את המידע.',
    termsTitle: 'תנאי שימוש | Children Do English',
    termsDesc: 'תנאי השימוש ב־Children Do English, אפליקציה חינמית ללימוד אוצר מילים באנגלית לילדים בגילאי 6–12.',
    about: 'אודות',
  },
  es: {
    privacyTitle: 'Política de privacidad | Children Do English',
    privacyDesc: 'Qué guarda Children Do English y qué no: sin cuentas ni cookies, el progreso se queda en el dispositivo y solo se envían totales diarios anónimos e informes de errores. Tus derechos y cómo borrar los datos.',
    termsTitle: 'Términos de servicio | Children Do English',
    termsDesc: 'Los términos de uso de Children Do English, una app gratuita de vocabulario en inglés para niños de 6 a 12 años.',
    about: 'Acerca de',
  },
};
