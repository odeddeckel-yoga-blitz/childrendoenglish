import { Zap, Hammer, Package, Type, Ear, BookOpen, Music, Search, Layers, Pencil, Image, Repeat, CircleCheck, Smile, Blocks, Hand, Target, ClipboardList, Puzzle, Gamepad2 } from 'lucide-react';
import { SPOTLIGHT_GAMES, HUB_ONLY_GAMES } from '../data/arcadeGames';

// Lucide icon per arcade game (the `icon` name in data/arcadeGames.js). The emoji
// stays in the data only for build scripts / spotlight.json; the UI draws these.
const ICONS = { zap: Zap, hammer: Hammer, package: Package, type: Type, ear: Ear, 'book-open': BookOpen, music: Music, search: Search, layers: Layers, pencil: Pencil, image: Image, repeat: Repeat, 'circle-check': CircleCheck, smile: Smile, blocks: Blocks, hand: Hand, target: Target, 'clipboard-list': ClipboardList, puzzle: Puzzle };

export default function ArcadeIcon({ id, className = 'w-4 h-4' }) {
  const name = [...SPOTLIGHT_GAMES, ...HUB_ONLY_GAMES].find((g) => g.id === id)?.icon;
  const Icon = ICONS[name] || Gamepad2;
  return <Icon className={className} aria-hidden="true" />;
}
