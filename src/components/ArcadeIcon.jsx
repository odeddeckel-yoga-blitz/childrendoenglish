import { Zap, Hammer, Package, Gamepad2 } from 'lucide-react';
import { ARCADE } from '../data/arcadeGames';

// Lucide icon per arcade game (the `icon` name in data/arcadeGames.js). The emoji
// stays in the data only for build scripts / spotlight.json; the UI draws these.
const ICONS = { zap: Zap, hammer: Hammer, package: Package };

export default function ArcadeIcon({ id, className = 'w-4 h-4' }) {
  const name = ARCADE.find((g) => g.id === id)?.icon;
  const Icon = ICONS[name] || Gamepad2;
  return <Icon className={className} aria-hidden="true" />;
}
