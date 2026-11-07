// The standalone vocabulary arcade (static pages under /games/<id>/, outside
// the SPA). One registry for every in-app door: Menu card, ResultScreen CTA,
// the build-time spotlight picker (scripts/pick-spotlight.mjs).
// `icon` = Lucide name the UI draws (components/ArcadeIcon.jsx); `emoji` is kept only for
// build scripts (SEO pages, spotlight.json) that still read it.
export const ARCADE = [
  { id: 'word-zapper', name: 'Word Zapper', icon: 'zap', emoji: '⚡' },
  { id: 'spelling-forge', name: 'Spelling Forge', icon: 'hammer', emoji: '🔨' },
  { id: 'category-conveyor', name: 'Category Conveyor', icon: 'package', emoji: '📦' },
];

// Home spotlight candidates (owner 11-07): every game on /games/, not only the three with in-app doors. With just
// ARCADE the picker had one candidate left (one current, one on cooldown) and spotlighted the most-played game.
export const SPOTLIGHT_GAMES = [
  ...ARCADE,
  { id: 'letter-twins', name: 'Letter Twins', icon: 'type', emoji: '🔤' },
  { id: 'sound-pairs', name: 'Sound Pairs', icon: 'ear', emoji: '👂' },
  { id: 'read-it', name: 'Read It!', icon: 'book-open', emoji: '📖' },
];
