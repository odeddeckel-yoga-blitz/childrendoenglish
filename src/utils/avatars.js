// Player avatars (owner 11-11 emoji cleanup): Lucide line icons in coloured circles.
// Players saved before the cleanup store an emoji string; new players store the icon id.
// Reading accepts both: resolveAvatarId() maps either to an icon id (unknown -> DEFAULT_AVATAR_ID).
export const AVATAR_IDS = ['fox', 'cat', 'lion', 'dog', 'unicorn', 'panda', 'frog', 'butterfly', 'star', 'rocket', 'palette', 'music'];
export const DEFAULT_AVATAR_ID = 'fox';

// Old emoji value -> icon id (includes emoji seen in older builds / fixtures: default star, chick, owl).
export const EMOJI_TO_AVATAR_ID = {
  '🦊': 'fox', '🐱': 'cat', '🦁': 'lion', '🐶': 'dog', '🦄': 'unicorn', '🐼': 'panda',
  '🐸': 'frog', '🦋': 'butterfly', '🌟': 'star', '⭐': 'star', '🚀': 'rocket', '🎨': 'palette', '🎵': 'music',
  '🐣': 'butterfly', '🦉': 'butterfly',
};

export function resolveAvatarId(stored) {
  if (AVATAR_IDS.includes(stored)) return stored;
  return EMOJI_TO_AVATAR_ID[stored] || DEFAULT_AVATAR_ID;
}
