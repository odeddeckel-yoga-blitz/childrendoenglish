import { Squirrel, Cat, Crown, Dog, Sparkles, Panda, Turtle, Flower, Star, Rocket, Palette, Music } from 'lucide-react';
import { resolveAvatarId } from '../utils/avatars';

const ICONS = {
  fox: [Squirrel, 'bg-orange-100 text-orange-600'],
  cat: [Cat, 'bg-amber-100 text-amber-600'],
  lion: [Crown, 'bg-yellow-100 text-yellow-600'],
  dog: [Dog, 'bg-stone-200 text-stone-600'],
  unicorn: [Sparkles, 'bg-fuchsia-100 text-fuchsia-600'],
  panda: [Panda, 'bg-slate-200 text-slate-700'],
  frog: [Turtle, 'bg-green-100 text-green-600'],
  butterfly: [Flower, 'bg-pink-100 text-pink-600'],
  star: [Star, 'bg-yellow-100 text-yellow-600'],
  rocket: [Rocket, 'bg-sky-100 text-sky-600'],
  palette: [Palette, 'bg-violet-100 text-violet-600'],
  music: [Music, 'bg-rose-100 text-rose-600'],
};

// stored = icon id or a legacy emoji; size = Tailwind size classes for the circle (the icon is 60% of it).
export default function AvatarIcon({ stored, size = 'w-12 h-12', className = '' }) {
  const [Icon, tone] = ICONS[resolveAvatarId(stored)];
  return (
    <span className={`inline-flex items-center justify-center rounded-full shrink-0 ${size} ${tone} ${className}`} aria-hidden="true">
      <Icon className="w-3/5 h-3/5" strokeWidth={2} />
    </span>
  );
}
