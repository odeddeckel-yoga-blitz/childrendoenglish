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
