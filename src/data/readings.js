// Graded readers ("Little Readers", RC11 + wave 1 11-18): short original texts written for CDE.
// Each text: a few sentences read aloud (Piper TTS, /audio/s/<sha1-10>.mp3), tap any word for
// its Hebrew or Spanish (readingGlosses.js), then three questions, plus a printable sheet with
// an answer key. `stage` = the reading level 1–5 (READING_STAGES). `level` = the highest Band I
// level, only on the 8 RC11 texts that were checked word by word against the Ministry file
// (a local script that stores nothing; names are the only exception). The wave-1 texts use
// mostly app words (src/data/words.js) and carry no Band I claim.
export const READING_STAGES = [
  { n: 1, cefr: 'Pre-A1', words: [20, 35], grammar: 'present simple, be, have, can' },
  { n: 2, cefr: 'A1', words: [40, 70], grammar: 'present simple' },
  { n: 3, cefr: 'A1', words: [40, 70], grammar: 'present simple' },
  { n: 4, cefr: 'A1+', words: [70, 110], grammar: 'simple past' },
  { n: 5, cefr: 'A2', words: [70, 110], grammar: 'simple past, dialogue' },
];

export const READINGS = [
  {
    slug: 'my-dog', title: 'My Dog', he: 'הכלב שלי', es: 'Mi perro', level: 'c1', stage: 2,
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
    slug: 'breakfast', title: 'Breakfast', he: 'ארוחת בוקר', es: 'El desayuno', level: 'c1', stage: 2,
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
    slug: 'at-the-beach', title: 'At the Beach', he: 'בים', es: 'En la playa', level: 'c2', stage: 3,
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
    slug: 'a-rainy-day', title: 'A Rainy Day', he: 'יום גשום', es: 'Un día de lluvia', level: 'c1', stage: 2,
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
    slug: 'my-birthday-party', title: 'My Birthday Party', he: 'מסיבת יום ההולדת שלי', es: 'Mi fiesta de cumpleaños', level: 'c2', stage: 3,
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
    slug: 'the-new-student', title: 'The New Student', he: 'התלמידה החדשה', es: 'La alumna nueva', level: 'c2', stage: 3,
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
    slug: 'going-to-the-zoo', title: 'Going to the Zoo', he: 'יוצאים לגן החיות', es: 'Vamos al zoológico', level: 'c2', stage: 3,
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
    slug: 'grandpas-farm', title: "Grandpa's Farm", he: 'החווה של סבא', es: 'La granja del abuelo', level: 'c2', stage: 3,
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
  // ---- Wave 1 (11-18): levels 1, 2, 4 and 5 ----
  {
    slug: 'my-cat', title: 'My Cat', he: 'החתולה שלי', es: 'Mi gata', stage: 1,
    text: [
      'I have a cat.', 'Her name is Luna.', 'Luna is small and gray.', 'She has green eyes.',
      'Luna can jump and run.', 'She can not swim.', 'Luna likes milk.', 'I love my cat!',
    ],
    questions: [
      { q: 'What color is Luna?', options: ['gray', 'black', 'white'], answer: 0 },
      { q: 'What color are her eyes?', options: ['green', 'blue', 'brown'], answer: 0 },
      { q: 'What does Luna like?', options: ['milk', 'juice', 'bread'], answer: 0 },
    ],
  },
  {
    slug: 'my-school-bag', title: 'My School Bag', he: 'התיק שלי', es: 'Mi mochila', stage: 1,
    text: [
      'This is my bag.', 'It is blue.', 'I have a book and a pen in my bag.', 'I have a ruler too.',
      'I have an apple for lunch.', 'I can go to school now!',
    ],
    questions: [
      { q: 'What color is the bag?', options: ['blue', 'red', 'green'], answer: 0 },
      { q: 'What is in the bag?', options: ['a book and a pen', 'a ball and a doll', 'a cup and a plate'], answer: 0 },
      { q: 'What is for lunch?', options: ['an apple', 'a banana', 'a sandwich'], answer: 0 },
    ],
  },
  {
    slug: 'my-red-umbrella', title: 'My Red Umbrella', he: 'המטרייה האדומה שלי', es: 'Mi paraguas rojo', stage: 1,
    text: [
      'It is a rainy day.', 'I have a red umbrella.', 'I have a yellow raincoat too.', 'I can play in the rain!',
      'Now the sun is out.', 'Look!', 'A rainbow!',
    ],
    questions: [
      { q: 'What color is the umbrella?', options: ['red', 'yellow', 'blue'], answer: 0 },
      { q: 'What color is the raincoat?', options: ['yellow', 'red', 'green'], answer: 0 },
      { q: 'What is in the sky at the end?', options: ['a rainbow', 'a plane', 'the moon'], answer: 0 },
    ],
  },
  {
    slug: 'my-family', title: 'My Family', he: 'המשפחה שלי', es: 'Mi familia', stage: 1,
    text: [
      'This is my family.', 'I have a mom, a dad and a baby.', 'My mom is a doctor.', 'My dad can cook.',
      'The baby is one.', 'We have a big dog too.',
    ],
    questions: [
      { q: 'Who is a doctor?', options: ['mom', 'dad', 'the baby'], answer: 0 },
      { q: 'How old is the baby?', options: ['one', 'two', 'three'], answer: 0 },
      { q: 'What pet does the family have?', options: ['a dog', 'a cat', 'a fish'], answer: 0 },
    ],
  },
  {
    slug: 'in-the-park', title: 'In the Park', he: 'בפארק', es: 'En el parque', stage: 1,
    text: [
      'I am in the park.', 'It is sunny and warm.', 'I can see a big tree.', 'A bird is in the tree.',
      'My friend has a ball.', 'We play together.', 'The park is fun!',
    ],
    questions: [
      { q: 'What is the weather like?', options: ['sunny and warm', 'rainy and cold', 'snowy'], answer: 0 },
      { q: 'Where is the bird?', options: ['in the tree', 'on the grass', 'in the water'], answer: 0 },
      { q: 'What does my friend have?', options: ['a ball', 'a kite', 'a dog'], answer: 0 },
    ],
  },
  {
    slug: 'lunch-at-school', title: 'Lunch at School', he: 'ארוחת צהריים בבית הספר', es: 'El almuerzo en la escuela', stage: 2,
    text: [
      "It is twelve o'clock.", 'It is lunchtime at school.', 'Ari opens a lunch box.',
      'In the box there is a cheese sandwich, a carrot and a pear.', 'Kim sits next to Ari.', 'Kim has rice and chicken.',
      'Kim gives Ari some rice, and Ari gives Kim the pear.', 'They drink water and talk.', 'Lunch with a friend is fun!',
    ],
    questions: [
      { q: 'What time is it?', options: ["twelve o'clock", "ten o'clock", "five o'clock"], answer: 0 },
      { q: 'Who has rice and chicken?', options: ['Kim', 'Ari', 'the teacher'], answer: 0 },
      { q: 'What does Ari give Kim?', options: ['the pear', 'the carrot', 'the sandwich'], answer: 0 },
    ],
  },
  {
    slug: 'the-lost-teddy', title: 'The Lost Teddy', he: 'הדובי שנעלם', es: 'El osito perdido', stage: 2,
    text: [
      'Mia has a teddy bear.', 'It is brown and soft.', 'Every night Mia sleeps with it.',
      'But tonight the teddy is not on the bed.', 'Mia looks under the bed.', 'It is not there.',
      'She looks in the bathroom.', 'It is not there.', 'Then her dog comes in.', 'The teddy is in his mouth!',
      'She laughs and gives the dog a hug.',
    ],
    questions: [
      { q: 'Where does Mia look first?', options: ['under the bed', 'in the bathroom', 'in the garden'], answer: 0 },
      { q: 'Who has the teddy?', options: ['the dog', 'her brother', 'her mother'], answer: 0 },
      { q: 'What color is the teddy?', options: ['brown', 'white', 'pink'], answer: 0 },
    ],
  },
  {
    slug: 'the-big-storm', title: 'The Big Storm', he: 'הסערה הגדולה', es: 'La gran tormenta', stage: 4,
    text: [
      'Last night there was a big storm.', 'The wind was very strong, and the rain was loud on the windows.',
      'I was a little afraid.', 'Then the lights went out!', 'My dad found a flashlight and some candles.',
      'We sat together in the living room.', 'My mom told us a funny story.', 'My little sister fell asleep on the sofa.',
      'In the morning, the sun came out.', 'There were leaves all over the garden, but our house was fine.',
    ],
    questions: [
      { q: 'What did Dad find?', options: ['a flashlight and some candles', 'a book and a pen', 'an umbrella'], answer: 0 },
      { q: 'Where did my little sister fall asleep?', options: ['on the sofa', 'in her bed', 'in the kitchen'], answer: 0 },
      { q: 'What was in the garden in the morning?', options: ['leaves', 'snow', 'a big dog'], answer: 0 },
    ],
  },
  {
    slug: 'the-little-bird', title: 'The Little Bird', he: 'הציפור הקטנה', es: 'El pajarito', stage: 4,
    text: [
      'Yesterday I walked in the garden after school.', 'Under a tree, I saw a small bird.',
      'It was on the grass, and it could not fly.', 'I called my grandpa.',
      'We put the bird in a small box and took it to the vet.', 'The vet was very kind.',
      'She gave the bird water and food.', 'After one week, the bird could fly again.',
      'We went back to the garden and opened the box.', 'The bird flew up into the tree.', 'I was so happy!',
    ],
    questions: [
      { q: 'Where did I see the bird?', options: ['under a tree', 'on the roof', 'in the kitchen'], answer: 0 },
      { q: 'Who did I call?', options: ['my grandpa', 'my teacher', 'my friend'], answer: 0 },
      { q: 'Where did we take the bird?', options: ['to the vet', 'to school', 'to the zoo'], answer: 0 },
    ],
  },
  {
    slug: 'the-school-show', title: 'The School Show', he: 'ההצגה של הכיתה', es: 'La obra de la escuela', stage: 4,
    text: [
      'Last Thursday, our class had a show for our parents.', 'We practiced for two weeks.',
      'I was a tiger in the show, and my friend Alex was a big green frog.', 'On the day of the show, I was very nervous.',
      'My hands were cold.', 'But when the music started, I felt better.', 'I jumped and roared like a real tiger.',
      'Everybody laughed and clapped.', 'After the show, our teacher gave us cookies.', 'My dad said, "I am proud of you!"',
    ],
    questions: [
      { q: 'Who was the show for?', options: ['our parents', 'a new student', 'the doctors'], answer: 0 },
      { q: 'What was Alex in the show?', options: ['a frog', 'a tiger', 'a bird'], answer: 0 },
      { q: 'What did the teacher give us?', options: ['cookies', 'books', 'flowers'], answer: 0 },
    ],
  },
  {
    slug: 'pancakes-for-grandma', title: 'Pancakes for Grandma', he: 'פנקייקים לסבתא', es: 'Panqueques para la abuela', stage: 4,
    text: [
      'Last Saturday, my brother and I made pancakes for our grandma.', 'First we put flour, milk and two eggs in a big bowl.',
      'My brother mixed everything with a spoon.', 'Then our dad helped us cook the pancakes.',
      'The first pancake was not round, and we laughed.', 'We put honey and strawberries on the pancakes.',
      'When Grandma came, she was very surprised.', 'She ate three pancakes!', 'She said, "These are the best pancakes in the world."',
    ],
    questions: [
      { q: 'What did we put in the bowl?', options: ['flour, milk and eggs', 'rice and water', 'apples and juice'], answer: 0 },
      { q: 'Who helped us cook?', options: ['our dad', 'our grandma', 'our teacher'], answer: 0 },
      { q: 'How many pancakes did Grandma eat?', options: ['three', 'two', 'five'], answer: 0 },
    ],
  },
  {
    slug: 'the-lost-robot', title: 'The Lost Robot', he: 'הרובוט שנעלם', es: 'El robot perdido', stage: 5,
    text: [
      'On Sunday, I took my toy robot to the park.', 'I played with it in the sandbox.',
      'Then my friends called me, and we played ball on the grass.', 'When it was time to go home, I looked in my pocket.',
      'The robot was not there!', 'I looked in the sandbox and under the slide, but I could not find it.', 'I was very sad.',
      'Then a woman with a small dog came to us.', '"Is this your robot?" she asked.', '"My dog found it under a tree."',
      '"Yes! Thank you!" I said.', 'Now I always put my robot in my bag.',
    ],
    questions: [
      { q: 'Where did I play with my robot?', options: ['in the sandbox', 'on the slide', 'in the kitchen'], answer: 0 },
      { q: 'Who found the robot?', options: ['a small dog', 'my friends', 'my mom'], answer: 0 },
      { q: 'Where do I put my robot now?', options: ['in my bag', 'in the sandbox', 'under a tree'], answer: 0 },
    ],
  },
  {
    slug: 'the-surprise-party', title: 'The Surprise Party', he: 'מסיבת ההפתעה', es: 'La fiesta sorpresa', stage: 5,
    text: [
      'Last month, my dad had a birthday.', 'My mom, my sister and I wanted to give him a surprise.',
      'In the morning, Dad went to work, and we started to work too.', 'My sister made a big card with a picture of our family.',
      'I put balloons on the walls, and Mom baked a lemon cake.', "At six o'clock, we heard the door.",
      'We turned off the lights and waited.', 'Dad came in and said, "Why is it so dark?"',
      'We turned on the lights and shouted, "Surprise!"', 'Dad laughed and said, "This is the best birthday ever!"',
    ],
    questions: [
      { q: 'What did my sister make?', options: ['a card', 'a cake', 'a kite'], answer: 0 },
      { q: 'What cake did Mom bake?', options: ['a lemon cake', 'a chocolate cake', 'a banana cake'], answer: 0 },
      { q: 'When did Dad come home?', options: ["at six o'clock", 'in the morning', "at one o'clock"], answer: 0 },
    ],
  },
  {
    slug: 'the-class-rabbit', title: 'The Class Rabbit', he: 'הארנב של הכיתה', es: 'El conejo de la clase', stage: 5,
    text: [
      'In September, our teacher brought a rabbit to class.', 'It was white with black ears, and we called it Cookie.',
      'Every day, two children took care of Cookie.', 'They gave it fresh water, carrots and green leaves.',
      'On Friday, it was my turn with my friend Dana.', 'We cleaned the cage and gave Cookie a big carrot.',
      'Cookie ate it very fast!', 'Then we let it hop on the classroom floor.', 'It jumped over a book and hid under a chair.',
      'Everybody laughed.', 'Taking care of a pet is a big job, but it is fun.',
    ],
    questions: [
      { q: 'What color was the rabbit?', options: ['white with black ears', 'brown with white ears', 'gray'], answer: 0 },
      { q: 'When was my turn?', options: ['on Friday', 'on Monday', 'in September'], answer: 0 },
      { q: 'Where did Cookie hide?', options: ['under a chair', 'in the cage', 'in a bag'], answer: 0 },
    ],
  },
  {
    slug: 'the-picnic', title: 'The Picnic', he: 'הפיקניק', es: 'El pícnic', stage: 5,
    text: [
      'Last Saturday, my family had a picnic in the park.', 'We put a big blanket on the grass under a tree.',
      'Mom brought sandwiches and fruit, and Dad brought lemonade.', 'My cousin Tal brought a ball.',
      'We played ball, and then we sat down to eat.', 'But there were a lot of ants on the blanket!',
      'They walked on the bread and on the fruit.', '"Oh no!" said Mom.', '"The ants want our lunch!"',
      'We laughed, and we moved the food to a table near the lake.', 'The ants stayed on the blanket, and we ate our lunch.',
      'It was a great day.',
    ],
    questions: [
      { q: 'What did Dad bring?', options: ['lemonade', 'sandwiches', 'a ball'], answer: 0 },
      { q: 'What was on the blanket?', options: ['a lot of ants', 'a big dog', 'some snow'], answer: 0 },
      { q: 'Where did we move the food?', options: ['to a table near the lake', 'to the car', 'to the kitchen'], answer: 0 },
    ],
  },
];

// Proper names in the texts (not vocabulary: no gloss lookup, no Band I check).
export const READING_NAMES = new Set(['Dan', 'Max', 'Noa', 'Maya', 'Tom', 'Lia', 'Yoni', 'Luna', 'Ari', 'Kim', 'Mia', 'Alex', 'Dana', 'Tal', 'Cookie']);
