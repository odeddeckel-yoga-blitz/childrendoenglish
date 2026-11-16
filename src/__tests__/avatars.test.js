import { describe, it, expect } from 'vitest';
import { AVATAR_IDS, DEFAULT_AVATAR_ID, EMOJI_TO_AVATAR_ID, resolveAvatarId } from '../utils/avatars';

describe('avatars: old emoji -> icon id', () => {
  const OLD_PICKER = ['🦊', '🐱', '🦁', '🐶', '🦄', '🐼', '🐸', '🦋', '🌟', '🚀', '🎨', '🎵'];
  it('every emoji the old picker offered maps to a distinct icon id', () => {
    const ids = OLD_PICKER.map(resolveAvatarId);
    ids.forEach((id) => expect(AVATAR_IDS).toContain(id));
    expect(new Set(ids).size).toBe(OLD_PICKER.length);
    expect(EMOJI_TO_AVATAR_ID['🚀']).toBe('rocket');
  });
  it('accepts icon ids, maps the old default star, and falls back for unknown values', () => {
    expect(resolveAvatarId('cat')).toBe('cat');
    expect(resolveAvatarId('⭐')).toBe('star');
    expect(resolveAvatarId('🛸')).toBe(DEFAULT_AVATAR_ID);
    expect(resolveAvatarId(undefined)).toBe(DEFAULT_AVATAR_ID);
  });
});
