// ~30 manually curated words for MVP (expand to ~300 via build script later)
// Each category has 4+ words per level for distractor generation

export const WORDS = [
  // === ANIMALS ===
  // Beginner
  { id: 'cat', word: 'cat', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A small furry pet that purrs', exampleSentence: 'The cat sat on the mat.', phonetic: '/kæt/', hebrewTranslation: 'חתול', imageUrl: '/images/cat.webp' },
  { id: 'dog', word: 'dog', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A friendly pet that barks', exampleSentence: 'The dog wagged its tail.', phonetic: '/dɒɡ/', hebrewTranslation: 'כלב', imageUrl: '/images/dog.webp' },
  { id: 'fish', word: 'fish', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'An animal that lives in water', exampleSentence: 'The fish swam in the pond.', phonetic: '/fɪʃ/', hebrewTranslation: 'דג', imageUrl: '/images/fish.webp' },
  { id: 'bird', word: 'bird', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'An animal with feathers that can fly', exampleSentence: 'A bird sang in the tree.', phonetic: '/bɜːrd/', hebrewTranslation: 'ציפור', imageUrl: '/images/bird.webp' },
  { id: 'rabbit', word: 'rabbit', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A small animal with long ears that hops', exampleSentence: 'The rabbit hopped across the garden.', phonetic: '/ˈræbɪt/', hebrewTranslation: 'ארנב', imageUrl: '/images/rabbit.webp' },
  // Intermediate
  { id: 'elephant', word: 'elephant', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A very large animal with a long trunk', exampleSentence: 'The elephant sprayed water with its trunk.', phonetic: '/ˈɛlɪfənt/', hebrewTranslation: 'פיל', imageUrl: '/images/elephant.webp' },
  { id: 'dolphin', word: 'dolphin', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A smart sea animal that jumps out of water', exampleSentence: 'The dolphin jumped over the wave.', phonetic: '/ˈdɒlfɪn/', hebrewTranslation: 'דולפין', imageUrl: '/images/dolphin.webp' },
  { id: 'penguin', word: 'penguin', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A black and white bird that cannot fly but swims well', exampleSentence: 'The penguin waddled on the ice.', phonetic: '/ˈpɛŋɡwɪn/', hebrewTranslation: 'פינגווין', imageUrl: '/images/penguin.webp' },
  { id: 'giraffe', word: 'giraffe', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'The tallest animal with a very long neck', exampleSentence: 'The giraffe ate leaves from the tall tree.', phonetic: '/dʒɪˈræf/', hebrewTranslation: 'ג\'ירפה', imageUrl: '/images/giraffe.webp' },

  // === FOOD ===
  // Beginner
  { id: 'apple', word: 'apple', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A round red or green fruit', exampleSentence: 'I ate a red apple for lunch.', phonetic: '/ˈæpəl/', hebrewTranslation: 'תפוח', imageUrl: '/images/apple.webp' },
  { id: 'banana', word: 'banana', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A long yellow fruit', exampleSentence: 'The monkey peeled a banana.', phonetic: '/bəˈnænə/', hebrewTranslation: 'בננה', imageUrl: '/images/banana.webp' },
  { id: 'bread', word: 'bread', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A food made from flour that you bake', exampleSentence: 'We had bread and butter for breakfast.', phonetic: '/brɛd/', hebrewTranslation: 'לחם', imageUrl: '/images/bread.webp' },
  { id: 'milk', word: 'milk', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A white drink that comes from cows', exampleSentence: 'She drank a glass of milk.', phonetic: '/mɪlk/', hebrewTranslation: 'חלב', imageUrl: '/images/milk.webp' },
  // Intermediate
  { id: 'pizza', word: 'pizza', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A flat round food with cheese and toppings', exampleSentence: 'We ordered pizza for dinner.', phonetic: '/ˈpiːtsə/', hebrewTranslation: 'פיצה', imageUrl: '/images/pizza.webp' },
  { id: 'sandwich', word: 'sandwich', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'Food made with two slices of bread and filling', exampleSentence: 'I made a cheese sandwich for lunch.', phonetic: '/ˈsænwɪtʃ/', hebrewTranslation: 'כריך', imageUrl: '/images/sandwich.webp' },
  { id: 'watermelon', word: 'watermelon', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A large green fruit that is red inside', exampleSentence: 'We ate watermelon on a hot summer day.', phonetic: '/ˈwɔːtərˌmɛlən/', hebrewTranslation: 'אבטיח', imageUrl: '/images/watermelon.webp' },
  { id: 'carrot', word: 'carrot', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A long orange vegetable that grows underground', exampleSentence: 'The rabbit ate a crunchy carrot.', phonetic: '/ˈkærət/', hebrewTranslation: 'גזר', imageUrl: '/images/carrot.webp' },

  // === HOME ===
  // Beginner
  { id: 'house', word: 'house', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'A building where people live', exampleSentence: 'We live in a big house.', phonetic: '/haʊs/', hebrewTranslation: 'בית', imageUrl: '/images/house.webp' },
  { id: 'bed', word: 'bed', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'Furniture for sleeping', exampleSentence: 'I go to bed at eight o\'clock.', phonetic: '/bɛd/', hebrewTranslation: 'מיטה', imageUrl: '/images/bed.webp' },
  { id: 'chair', word: 'chair', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'Furniture for sitting on', exampleSentence: 'Please sit on the chair.', phonetic: '/tʃɛər/', hebrewTranslation: 'כיסא', imageUrl: '/images/chair.webp' },
  { id: 'table', word: 'table', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'Furniture with a flat top for eating or working', exampleSentence: 'We eat dinner at the table.', phonetic: '/ˈteɪbəl/', hebrewTranslation: 'שולחן', imageUrl: '/images/table.webp' },

  // === TRANSPORT ===
  // Beginner
  { id: 'car', word: 'car', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle with four wheels', exampleSentence: 'Dad drives the car to work.', phonetic: '/kɑːr/', hebrewTranslation: 'מכונית', imageUrl: '/images/car.webp' },
  { id: 'bus', word: 'bus', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A large vehicle that carries many people', exampleSentence: 'I take the bus to school.', phonetic: '/bʌs/', hebrewTranslation: 'אוטובוס', imageUrl: '/images/bus.webp' },
  { id: 'bicycle', word: 'bicycle', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle with two wheels that you pedal', exampleSentence: 'She rode her bicycle to the park.', phonetic: '/ˈbaɪsɪkəl/', hebrewTranslation: 'אופניים', imageUrl: '/images/bicycle.webp' },
  { id: 'airplane', word: 'airplane', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle that flies in the sky', exampleSentence: 'The airplane flew above the clouds.', phonetic: '/ˈɛərˌpleɪn/', hebrewTranslation: 'מטוס', imageUrl: '/images/airplane.webp' },

  // === NATURE ===
  // Beginner
  { id: 'sun', word: 'sun', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'The bright star that shines during the day', exampleSentence: 'The sun is shining today.', phonetic: '/sʌn/', hebrewTranslation: 'שמש', imageUrl: '/images/sun.webp' },
  { id: 'tree', word: 'tree', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'A tall plant with a trunk and branches', exampleSentence: 'The tree has green leaves.', phonetic: '/triː/', hebrewTranslation: 'עץ', imageUrl: '/images/tree.webp' },
  { id: 'flower', word: 'flower', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'The colorful part of a plant', exampleSentence: 'She picked a pretty flower.', phonetic: '/ˈflaʊər/', hebrewTranslation: 'פרח', imageUrl: '/images/flower.webp' },
  { id: 'rain', word: 'rain', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'Water that falls from clouds', exampleSentence: 'The rain made puddles on the ground.', phonetic: '/reɪn/', hebrewTranslation: 'גשם', imageUrl: '/images/rain.webp' },
  // Intermediate
  { id: 'rainbow', word: 'rainbow', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A colorful arc in the sky after rain', exampleSentence: 'We saw a beautiful rainbow after the storm.', phonetic: '/ˈreɪnˌboʊ/', hebrewTranslation: 'קשת בענן', imageUrl: '/images/rainbow.webp' },
  { id: 'mountain', word: 'mountain', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A very high piece of land', exampleSentence: 'We climbed to the top of the mountain.', phonetic: '/ˈmaʊntən/', hebrewTranslation: 'הר', imageUrl: '/images/mountain.webp' },
  { id: 'ocean', word: 'ocean', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A very large body of salt water', exampleSentence: 'The ocean waves crashed on the beach.', phonetic: '/ˈoʊʃən/', hebrewTranslation: 'אוקיינוס', imageUrl: '/images/ocean.webp' },
  { id: 'butterfly', word: 'butterfly', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'An insect with large colorful wings', exampleSentence: 'A butterfly landed on the flower.', phonetic: '/ˈbʌtərˌflaɪ/', hebrewTranslation: 'פרפר', imageUrl: '/images/butterfly.webp' },
];

export const CATEGORIES = [
  'animals', 'food', 'home', 'transport', 'nature',
];

export const getWordsByLevel = (level) => WORDS.filter(w => w.level === level);
export const getWordsByCategory = (category) => WORDS.filter(w => w.category === category);
export const getWordById = (id) => WORDS.find(w => w.id === id);

// Get distractor words for quiz — same category preferred, then same level, then any
export const getDistractors = (word, count = 3) => {
  const sameCategoryLevel = WORDS.filter(
    w => w.id !== word.id && w.category === word.category && w.level === word.level
  );
  if (sameCategoryLevel.length >= count) {
    return fisherYatesShuffleInline(sameCategoryLevel).slice(0, count);
  }

  const sameCategory = WORDS.filter(
    w => w.id !== word.id && w.category === word.category
  );
  if (sameCategory.length >= count) {
    return fisherYatesShuffleInline(sameCategory).slice(0, count);
  }

  const sameLevel = WORDS.filter(
    w => w.id !== word.id && w.level === word.level
  );
  return fisherYatesShuffleInline(sameLevel).slice(0, count);
};

function fisherYatesShuffleInline(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
