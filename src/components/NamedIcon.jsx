import {
  Target, Search, BadgeCheck, Library, Trophy, Flame, Globe, Sprout, Leaf, Trees, PawPrint, Apple, House, Car,
  Palette, Hash, Shirt, Volleyball, Smile, Key, Blocks, BookOpen,
} from 'lucide-react';

// Lucide icon by NAME, for data tables (data/badges.js, levels.js, lessons.js) that
// keep a plain-string `icon` field so they stay importable from Node scripts/tests.
const ICONS = {
  target: Target, search: Search, 'badge-check': BadgeCheck, library: Library, trophy: Trophy, flame: Flame,
  globe: Globe, sprout: Sprout, leaf: Leaf, trees: Trees, 'paw-print': PawPrint, apple: Apple, house: House,
  car: Car, palette: Palette, hash: Hash, shirt: Shirt, volleyball: Volleyball, smile: Smile, key: Key,
  blocks: Blocks, 'book-open': BookOpen,
};

export default function NamedIcon({ name, className = 'w-5 h-5' }) {
  const Icon = ICONS[name] || BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}
