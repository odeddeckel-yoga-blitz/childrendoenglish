import { Zap, Hammer, Package, Type, Ear, BookOpen, Gamepad2 } from 'lucide-react';
import { SPOTLIGHT_GAMES } from '../data/arcadeGames';

// Lucide icon per arcade game (the `icon` name in data/arcadeGames.js). The emoji
// stays in the data only for build scripts / spotlight.json; the UI draws these.
const ICONS = { zap: Zap, hammer: Hammer, package: Package, type: Type, ear: Ear, 'book-open': BookOpen };

export default function ArcadeIcon({ id, className = 'w-4 h-4' }) {
  const name = SPOTLIGHT_GAMES.find((g) => g.id === id)?.icon;
  const Icon = ICONS[name] || Gamepad2;
  return <Icon className={className} aria-hidden="true" />;
}
