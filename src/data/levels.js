export const LEVELS = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Simple everyday words',
    icon: '🌱',
    color: 'blue',
    unlockScore: 0, // always unlocked
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'More challenging vocabulary',
    icon: '🌿',
    color: 'amber',
    unlockScore: 7, // need 7/10 on beginner
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Complex and longer words',
    icon: '🌳',
    color: 'purple',
    unlockScore: 7, // need 7/10 on intermediate
  },
];

export const getLevelById = (id) => LEVELS.find(l => l.id === id);
export const getLevelIndex = (id) => LEVELS.findIndex(l => l.id === id);
