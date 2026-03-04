import { WORDS } from './words';

const CATEGORY_EMOJI = {
  animals: '🐾',
  food: '🍎',
  home: '🏠',
  transport: '🚗',
  nature: '🌿',
  colors: '🎨',
  numbers: '🔢',
  body: '🦶',
  clothing: '👕',
  school: '📚',
  sports: '⚽',

  feelings: '😊',
  everyday: '🔑',
  toys: '🧸',
};

const CATEGORY_TITLES = {
  animals: { en: 'Animals', he: 'חיות' },
  food: { en: 'Food', he: 'אוכל' },
  home: { en: 'My Home', he: 'הבית שלי' },
  transport: { en: 'Transport', he: 'תחבורה' },
  nature: { en: 'Nature', he: 'טבע' },
  colors: { en: 'Colors', he: 'צבעים' },
  numbers: { en: 'Numbers', he: 'מספרים' },
  body: { en: 'My Body', he: 'הגוף שלי' },
  clothing: { en: 'Clothing', he: 'בגדים' },
  school: { en: 'School', he: 'בית ספר' },
  sports: { en: 'Sports', he: 'ספורט' },

  feelings: { en: 'Feelings', he: 'רגשות' },
  everyday: { en: 'Everyday', he: 'יומיומי' },
  toys: { en: 'Toys', he: 'צעצועים' },
};

// Build lessons automatically: group words by category + level, split into lessons of 6-10 words
function buildLessons() {
  const lessons = [];
  let order = 0;
  const levelOrder = ['beginner', 'intermediate', 'advanced'];
  const categories = Object.keys(CATEGORY_TITLES);

  for (const category of categories) {
    for (const level of levelOrder) {
      const words = WORDS.filter(w => w.category === category && w.level === level);
      if (words.length === 0) continue;

      // Split into chunks of <=8
      for (let i = 0; i < words.length; i += 8) {
        const chunk = words.slice(i, i + 8);
        const partNum = Math.floor(i / 8) + 1;
        const totalParts = Math.ceil(words.length / 8);
        const suffix = totalParts > 1 ? ` ${partNum}` : '';

        const titles = CATEGORY_TITLES[category] || { en: category, he: category };
        lessons.push({
          id: `${category}-${level}${suffix ? `-${partNum}` : ''}`,
          title: `${titles.en}${suffix}`,
          titleHe: `${titles.he}${suffix}`,
          category,
          emoji: CATEGORY_EMOJI[category] || '📖',
          level,
          wordIds: chunk.map(w => w.id),
          order: order++,
        });
      }
    }
  }
  return lessons;
}

export const LESSONS = buildLessons();

/**
 * Get lesson status based on word progress
 * @returns 'completed' | 'in-progress' | 'available' | 'locked'
 */
export function getLessonStatus(lesson, wordProgress, lessonIndex, allLessons = LESSONS) {
  const wp = wordProgress || {};
  const mastered = lesson.wordIds.filter(id => wp[id]?.interval >= 14).length;
  const seen = lesson.wordIds.filter(id => wp[id]).length;

  if (mastered === lesson.wordIds.length) return 'completed';
  if (seen > 0) return 'in-progress';
  if (lessonIndex === 0) return 'available';

  // Lock if previous lesson is neither completed nor in-progress
  const prev = allLessons[lessonIndex - 1];
  if (prev) {
    const prevStatus = getLessonStatus(prev, wp, lessonIndex - 1, allLessons);
    if (prevStatus !== 'completed' && prevStatus !== 'in-progress') return 'locked';
  }
  return 'available';
}
