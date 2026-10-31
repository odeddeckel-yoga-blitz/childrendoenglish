// RC11 short reading texts (pre-Unseen): original texts written for CDE, every word
// on Band I (checked locally against the Ministry file with a script that stores
// nothing; names are the only exception). Each text: a few sentences read aloud
// (Piper, /audio/s/<sha1-10>.mp3), tap any word for its Hebrew (readingGlosses.js),
// then three questions. `level` = the highest Band I level the text uses.
export const READINGS = [
  {
    slug: 'my-dog', title: 'My Dog', he: 'הכלב שלי', level: 'c1',
    text: [
      'My name is Dan.', 'I am ten years old.', 'I have a dog.', 'His name is Max.',
      'Max is big and brown.', 'He likes to run in the park.', 'Every morning we go to the park together.',
      'Max plays with a ball.', 'Then we come back home and Max drinks water.', 'I like my dog a lot!',
    ],
    questions: [
      { q: 'How old is Dan?', options: ['ten', 'eight', 'twelve'], answer: 0 },
      { q: 'What color is Max?', options: ['brown', 'black', 'white'], answer: 0 },
      { q: 'Where do Dan and Max go every morning?', options: ['to the park', 'to the zoo', 'to the beach'], answer: 0 },
    ],
  },
  {
    slug: 'breakfast', title: 'Breakfast', he: 'ארוחת בוקר', level: 'c1',
    text: [
      'It is Sunday morning.', 'Noa is hungry.', 'She goes into the kitchen.', 'Her mother is there.',
      '"What would you like for breakfast?" asks her mother.', '"An egg and bread, please," says Noa.',
      'Her brother wants a banana and milk.', 'They eat together at the table.', 'After breakfast, Noa and her brother go to the park.',
    ],
    questions: [
      { q: 'What day is it?', options: ['Sunday', 'Friday', 'Monday'], answer: 0 },
      { q: 'What does Noa want for breakfast?', options: ['an egg and bread', 'a banana and milk', 'pizza'], answer: 0 },
      { q: 'Where do they eat?', options: ['at the table', 'in the garden', 'in the car'], answer: 0 },
    ],
  },
  {
    slug: 'at-the-beach', title: 'At the Beach', he: 'בים', level: 'c2',
    text: [
      'It is summer and it is very hot.', 'Maya and her family go to the beach.',
      'The sea is blue and the sun is in the sky.', 'Maya swims in the sea with her father.',
      'Her little brother sits under a big umbrella and eats ice cream.',
      "At five o'clock they go home.", 'Maya is tired but happy.',
    ],
    questions: [
      { q: 'What is the weather like?', options: ['hot', 'cold', 'rainy'], answer: 0 },
      { q: 'Who swims with Maya?', options: ['her father', 'her mother', 'her friend'], answer: 0 },
      { q: 'What does her little brother eat?', options: ['ice cream', 'a sandwich', 'an apple'], answer: 0 },
    ],
  },
  {
    slug: 'a-rainy-day', title: 'A Rainy Day', he: 'יום גשום', level: 'c1',
    text: [
      'Today is a cold winter day.', 'It is rainy and windy.', 'Tom can not play outside.',
      'He stays at home with his sister.', 'They read books and draw pictures.', 'Tom draws a big horse.',
      'His sister draws a tree with red apples.', 'In the evening, their father makes hot chocolate.',
      '"This is a good day," says Tom.',
    ],
    questions: [
      { q: 'Why does Tom stay at home?', options: ['It is rainy.', 'He is sick.', 'It is his birthday.'], answer: 0 },
      { q: 'What does Tom draw?', options: ['a horse', 'a tree', 'a house'], answer: 0 },
      { q: 'What does their father make?', options: ['hot chocolate', 'a cake', 'a salad'], answer: 0 },
    ],
  },
  {
    slug: 'my-birthday-party', title: 'My Birthday Party', he: 'מסיבת יום ההולדת שלי', level: 'c2',
    text: [
      'My birthday is in May.', 'This year I am nine.', 'I have a party in the garden.',
      "My friends come at four o'clock.", 'We play games and sing songs.',
      'My grandmother bakes a big chocolate cake.', 'My best friend gives me a present: a new book about animals.',
      'It is a wonderful day!',
    ],
    questions: [
      { q: 'When is the birthday?', options: ['in May', 'in June', 'in December'], answer: 0 },
      { q: 'Who bakes the cake?', options: ['my grandmother', 'my mother', 'my best friend'], answer: 0 },
      { q: 'What is the present?', options: ['a book', 'a ball', 'a doll'], answer: 0 },
    ],
  },
  {
    slug: 'the-new-student', title: 'The New Student', he: 'התלמידה החדשה', level: 'c2',
    text: [
      'There is a new student in our class.', 'Her name is Lia.', 'She comes from a small village in the north.',
      'On the first day, Lia sits alone.', 'She is a little afraid.',
      'At lunchtime I say, "Hi! Do you want to sit with us?"', 'Lia smiles.',
      'Now she is my friend, and we do our homework together.',
    ],
    questions: [
      { q: 'Where does Lia come from?', options: ['a village in the north', 'a big city', 'a farm near the sea'], answer: 0 },
      { q: 'How does Lia feel on the first day?', options: ['afraid', 'happy', 'hungry'], answer: 0 },
      { q: 'What do they do together now?', options: ['their homework', 'their dinner', 'a party'], answer: 0 },
    ],
  },
  {
    slug: 'going-to-the-zoo', title: 'Going to the Zoo', he: 'יוצאים לגן החיות', level: 'c2',
    text: [
      'On Friday our class goes to the zoo by bus.', 'We see a lot of animals.', 'The elephant is huge and gray.',
      'The monkeys jump from tree to tree and make a lot of noise.', 'A long snake sleeps near the water.',
      'My favorite animals are the monkeys.', 'They are very clever!',
      'We eat lunch in the park and take the bus back to class.',
    ],
    questions: [
      { q: 'How does the class go to the zoo?', options: ['by bus', 'by train', 'by car'], answer: 0 },
      { q: 'What color is the elephant?', options: ['gray', 'brown', 'white'], answer: 0 },
      { q: 'Where does the snake sleep?', options: ['near the water', 'in a tree', 'on the bus'], answer: 0 },
    ],
  },
  {
    slug: 'grandpas-farm', title: "Grandpa's Farm", he: 'החווה של סבא', level: 'c2',
    text: [
      'Every holiday, Yoni visits his grandfather.', 'His grandfather lives on a farm near a river.',
      'He has three cows, ten sheep and a lot of chickens.', 'In the morning, Yoni helps him feed the animals.',
      'In the afternoon, they walk to the river and catch fish.',
      'In the evening, they sit outside and look at the stars.', 'Yoni loves the farm.',
    ],
    questions: [
      { q: 'Where does his grandfather live?', options: ['on a farm', 'in a city', 'near the sea'], answer: 0 },
      { q: 'How many cows are there?', options: ['three', 'ten', 'one'], answer: 0 },
      { q: 'What do they do in the evening?', options: ['look at the stars', 'watch television', 'cook dinner'], answer: 0 },
    ],
  },
];

// Proper names in the texts (not vocabulary: no gloss lookup, no Band I check).
export const READING_NAMES = new Set(['Dan', 'Max', 'Noa', 'Maya', 'Tom', 'Lia', 'Yoni']);
