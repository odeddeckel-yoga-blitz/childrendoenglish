// 362 curated words across 15 categories, 3 difficulty levels

export const WORDS = [
  // === ANIMALS ===
  // Beginner
  { id: 'cat', word: 'cat', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A small furry pet that purrs', exampleSentence: 'The cat sat on the mat.', phonetic: '/kæt/', hebrewTranslation: 'חתול', imageUrl: '/images/cat.webp' },
  { id: 'dog', word: 'dog', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A friendly pet that barks', exampleSentence: 'The dog wagged its tail.', phonetic: '/dɒɡ/', hebrewTranslation: 'כלב', imageUrl: '/images/dog.webp' },
  { id: 'fish', word: 'fish', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'An animal that lives in water', exampleSentence: 'The fish swam in the pond.', phonetic: '/fɪʃ/', hebrewTranslation: 'דג', imageUrl: '/images/fish.webp' },
  { id: 'bird', word: 'bird', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'An animal with feathers that can fly', exampleSentence: 'A bird sang in the tree.', phonetic: '/bɜːrd/', hebrewTranslation: 'ציפור', imageUrl: '/images/bird.webp' },
  { id: 'rabbit', word: 'rabbit', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A small animal with long ears that hops', exampleSentence: 'The rabbit hopped across the garden.', phonetic: '/ˈræbɪt/', hebrewTranslation: 'ארנב', imageUrl: '/images/rabbit.webp' },
  { id: 'horse', word: 'horse', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A large animal that people ride', exampleSentence: 'The horse ran across the field.', phonetic: '/hɔːrs/', hebrewTranslation: 'סוס', imageUrl: '/images/horse.webp' },
  { id: 'cow', word: 'cow', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A farm animal that gives us milk', exampleSentence: 'The cow stood in the green field.', phonetic: '/kaʊ/', hebrewTranslation: 'פרה', imageUrl: '/images/cow.webp' },
  // Intermediate
  { id: 'elephant', word: 'elephant', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A very large animal with a long trunk', exampleSentence: 'The elephant sprayed water with its trunk.', phonetic: '/ˈɛlɪfənt/', hebrewTranslation: 'פיל', imageUrl: '/images/elephant.webp' },
  { id: 'dolphin', word: 'dolphin', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A smart sea animal that jumps out of water', exampleSentence: 'The dolphin jumped over the wave.', phonetic: '/ˈdɒlfɪn/', hebrewTranslation: 'דולפין', imageUrl: '/images/dolphin.webp' },
  { id: 'penguin', word: 'penguin', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A black and white bird that cannot fly but swims well', exampleSentence: 'The penguin waddled on the ice.', phonetic: '/ˈpɛŋɡwɪn/', hebrewTranslation: 'פינגווין', imageUrl: '/images/penguin.webp' },
  { id: 'giraffe', word: 'giraffe', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'The tallest animal with a very long neck', exampleSentence: 'The giraffe ate leaves from the tall tree.', phonetic: '/dʒɪˈræf/', hebrewTranslation: 'ג\'ירפה', imageUrl: '/images/giraffe.webp' },
  // Advanced
  { id: 'turtle', word: 'turtle', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A slow animal that carries a shell on its back', exampleSentence: 'The turtle walked slowly to the pond.', phonetic: '/ˈtɜːrtəl/', hebrewTranslation: 'צב', imageUrl: '/images/turtle.webp' },
  { id: 'parrot', word: 'parrot', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A colorful bird that can copy words people say', exampleSentence: 'The parrot said hello to everyone.', phonetic: '/ˈpærət/', hebrewTranslation: 'תוכי', imageUrl: '/images/parrot.webp' },
  { id: 'flamingo', word: 'flamingo', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A tall pink bird with long legs', exampleSentence: 'The flamingo stood on one leg.', phonetic: '/fləˈmɪŋɡoʊ/', hebrewTranslation: 'פלמינגו', imageUrl: '/images/flamingo.webp' },
  { id: 'cheetah', word: 'cheetah', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'The fastest animal on land with spotted fur', exampleSentence: 'The cheetah ran faster than any other animal.', phonetic: '/ˈtʃiːtə/', hebrewTranslation: 'צ\'יטה', imageUrl: '/images/cheetah.webp' },
  // Beginner (new)
  { id: 'duck', word: 'duck', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A bird that swims and says quack', exampleSentence: 'The duck swam across the pond.', phonetic: '/dʌk/', hebrewTranslation: 'ברווז', imageUrl: '/images/duck.webp' },
  { id: 'pig', word: 'pig', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A pink farm animal with a curly tail', exampleSentence: 'The pig rolled in the mud.', phonetic: '/pɪɡ/', hebrewTranslation: 'חזיר', imageUrl: '/images/pig.webp' },
  { id: 'hen', word: 'hen', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A farm bird that lays eggs', exampleSentence: 'The hen sat on her eggs.', phonetic: '/hɛn/', hebrewTranslation: 'תרנגולת', imageUrl: '/images/hen.webp' },
  { id: 'ant', word: 'ant', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A tiny insect that lives in big groups', exampleSentence: 'The ant carried a crumb of bread.', phonetic: '/ænt/', hebrewTranslation: 'נמלה', imageUrl: '/images/ant.webp' },
  { id: 'bee', word: 'bee', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A small flying insect that makes honey', exampleSentence: 'The bee flew from flower to flower.', phonetic: '/biː/', hebrewTranslation: 'דבורה', imageUrl: '/images/bee.webp' },
  { id: 'mouse', word: 'mouse', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A very small animal with a long tail', exampleSentence: 'A little mouse ran across the floor.', phonetic: '/maʊs/', hebrewTranslation: 'עכבר', imageUrl: '/images/mouse.webp' },
  // Intermediate (new)
  { id: 'snake', word: 'snake', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A long animal with no legs that slithers on the ground', exampleSentence: 'The snake slid through the grass.', phonetic: '/sneɪk/', hebrewTranslation: 'נחש', imageUrl: '/images/snake.webp' },
  { id: 'tiger', word: 'tiger', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A big wild cat with orange and black stripes', exampleSentence: 'The tiger rested under a tree.', phonetic: '/ˈtaɪɡər/', hebrewTranslation: 'נמר', imageUrl: '/images/tiger.webp' },
  { id: 'zebra', word: 'zebra', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A horse-like animal with black and white stripes', exampleSentence: 'The zebra ran across the savanna.', phonetic: '/ˈziːbrə/', hebrewTranslation: 'זברה', imageUrl: '/images/zebra.webp' },
  { id: 'deer', word: 'deer', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A gentle forest animal with big antlers', exampleSentence: 'A deer stood quietly in the woods.', phonetic: '/dɪr/', hebrewTranslation: 'אייל', imageUrl: '/images/deer.webp' },
  { id: 'goat', word: 'goat', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A farm animal with horns that climbs well', exampleSentence: 'The goat climbed up the rocky hill.', phonetic: '/ɡoʊt/', hebrewTranslation: 'עז', imageUrl: '/images/goat.webp' },
  { id: 'shark', word: 'shark', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A large fish with sharp teeth', exampleSentence: 'The shark swam near the coral reef.', phonetic: '/ʃɑːrk/', hebrewTranslation: 'כריש', imageUrl: '/images/shark.webp' },
  // Advanced (new)
  { id: 'crocodile', word: 'crocodile', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A large reptile with a long snout and strong jaws', exampleSentence: 'The crocodile lay still by the river.', phonetic: '/ˈkrɒkədaɪl/', hebrewTranslation: 'תנין', imageUrl: '/images/crocodile.webp' },
  { id: 'kangaroo', word: 'kangaroo', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'An animal from Australia that hops and carries babies in a pouch', exampleSentence: 'The kangaroo hopped across the field.', phonetic: '/ˌkæŋɡəˈruː/', hebrewTranslation: 'קנגורו', imageUrl: '/images/kangaroo.webp' },
  { id: 'hippo', word: 'hippo', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A huge animal that spends most of its time in water', exampleSentence: 'The hippo opened its enormous mouth.', phonetic: '/ˈhɪpoʊ/', hebrewTranslation: 'היפופוטם', imageUrl: '/images/hippo.webp' },
  { id: 'butterfly', word: 'butterfly', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A beautiful insect with colorful wings', exampleSentence: 'The butterfly landed on a flower.', phonetic: '/ˈbʌtərflaɪ/', hebrewTranslation: 'פרפר', imageUrl: '/images/butterfly.webp' },
  { id: 'camel', word: 'camel', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A large desert animal with one or two humps', exampleSentence: 'The camel walked slowly through the desert.', phonetic: '/ˈkæməl/', hebrewTranslation: 'גמל', imageUrl: '/images/camel.webp' },
  { id: 'panda', word: 'panda', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A black and white bear that eats bamboo', exampleSentence: 'The panda chewed on a stick of bamboo.', phonetic: '/ˈpændə/', hebrewTranslation: 'פנדה', imageUrl: '/images/panda.webp' },

  // === FOOD ===
  // Beginner
  { id: 'apple', word: 'apple', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A round red or green fruit', exampleSentence: 'I ate a red apple for lunch.', phonetic: '/ˈæpəl/', hebrewTranslation: 'תפוח', imageUrl: '/images/apple.webp' },
  { id: 'banana', word: 'banana', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A long yellow fruit', exampleSentence: 'The monkey peeled a banana.', phonetic: '/bəˈnænə/', hebrewTranslation: 'בננה', imageUrl: '/images/banana.webp' },
  { id: 'bread', word: 'bread', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A food made from flour that you bake', exampleSentence: 'We had bread and butter for breakfast.', phonetic: '/brɛd/', hebrewTranslation: 'לחם', imageUrl: '/images/bread.webp' },
  { id: 'milk', word: 'milk', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A white drink that comes from cows', exampleSentence: 'She drank a glass of milk.', phonetic: '/mɪlk/', hebrewTranslation: 'חלב', imageUrl: '/images/milk.webp' },
  { id: 'egg', word: 'egg', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'An oval food that comes from chickens', exampleSentence: 'I had a boiled egg for breakfast.', phonetic: '/ɛɡ/', hebrewTranslation: 'ביצה', imageUrl: '/images/egg.webp' },
  { id: 'rice', word: 'rice', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'Small white grains that you cook and eat', exampleSentence: 'We eat rice with vegetables.', phonetic: '/raɪs/', hebrewTranslation: 'אורז', imageUrl: '/images/rice.webp' },
  // Intermediate
  { id: 'pizza', word: 'pizza', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A flat round food with cheese and toppings', exampleSentence: 'We ordered pizza for dinner.', phonetic: '/ˈpiːtsə/', hebrewTranslation: 'פיצה', imageUrl: '/images/pizza.webp' },
  { id: 'sandwich', word: 'sandwich', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'Food made with two slices of bread and filling', exampleSentence: 'I made a cheese sandwich for lunch.', phonetic: '/ˈsænwɪtʃ/', hebrewTranslation: 'כריך', imageUrl: '/images/sandwich.webp' },
  { id: 'watermelon', word: 'watermelon', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A large green fruit that is red inside', exampleSentence: 'We ate watermelon on a hot summer day.', phonetic: '/ˈwɔːtərˌmɛlən/', hebrewTranslation: 'אבטיח', imageUrl: '/images/watermelon.webp' },
  { id: 'carrot', word: 'carrot', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A long orange vegetable that grows underground', exampleSentence: 'The rabbit ate a crunchy carrot.', phonetic: '/ˈkærət/', hebrewTranslation: 'גזר', imageUrl: '/images/carrot.webp' },
  // Advanced
  { id: 'avocado', word: 'avocado', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A green fruit with a large seed inside', exampleSentence: 'She spread avocado on her toast.', phonetic: '/ˌævəˈkɑːdoʊ/', hebrewTranslation: 'אבוקדו', imageUrl: '/images/avocado.webp' },
  { id: 'broccoli', word: 'broccoli', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A green vegetable that looks like a small tree', exampleSentence: 'Broccoli is very healthy to eat.', phonetic: '/ˈbrɒkəli/', hebrewTranslation: 'ברוקולי', imageUrl: '/images/broccoli.webp' },
  { id: 'pineapple', word: 'pineapple', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A tropical fruit with spiky leaves on top', exampleSentence: 'The pineapple tasted sweet and juicy.', phonetic: '/ˈpaɪnˌæpəl/', hebrewTranslation: 'אננס', imageUrl: '/images/pineapple.webp' },
  { id: 'strawberry', word: 'strawberry', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A small red fruit with tiny seeds on the outside', exampleSentence: 'I picked a ripe strawberry from the garden.', phonetic: '/ˈstrɔːˌbɛri/', hebrewTranslation: 'תות', imageUrl: '/images/strawberry.webp' },
  { id: 'chocolate', word: 'chocolate', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A sweet brown food made from cocoa beans', exampleSentence: 'She loves eating chocolate cake.', phonetic: '/ˈtʃɒklət/', hebrewTranslation: 'שוקולד', imageUrl: '/images/chocolate.webp' },
  // Beginner (new)
  { id: 'orange', word: 'orange', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A round orange fruit full of juice', exampleSentence: 'I peeled an orange for a snack.', phonetic: '/ˈɒrɪndʒ/', hebrewTranslation: 'תפוז', imageUrl: '/images/orange.webp' },
  { id: 'cake', word: 'cake', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A sweet baked treat for celebrations', exampleSentence: 'We had cake at the birthday party.', phonetic: '/keɪk/', hebrewTranslation: 'עוגה', imageUrl: '/images/cake.webp' },
  { id: 'soup', word: 'soup', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A warm liquid food you eat with a spoon', exampleSentence: 'Mom made chicken soup for dinner.', phonetic: '/suːp/', hebrewTranslation: 'מרק', imageUrl: '/images/soup.webp' },
  { id: 'juice', word: 'juice', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A drink made from fruit', exampleSentence: 'I drank a glass of orange juice.', phonetic: '/dʒuːs/', hebrewTranslation: 'מיץ', imageUrl: '/images/juice.webp' },
  { id: 'potato', word: 'potato', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A brown vegetable that grows underground', exampleSentence: 'We had baked potato for dinner.', phonetic: '/pəˈteɪtoʊ/', hebrewTranslation: 'תפוח אדמה', imageUrl: '/images/potato.webp' },
  // Intermediate (new)
  { id: 'salad', word: 'salad', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A dish of mixed raw vegetables', exampleSentence: 'She made a fresh salad for lunch.', phonetic: '/ˈsæləd/', hebrewTranslation: 'סלט', imageUrl: '/images/salad.webp' },
  { id: 'spaghetti', word: 'spaghetti', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'Long thin strings of pasta', exampleSentence: 'We had spaghetti with tomato sauce.', phonetic: '/spəˈɡɛti/', hebrewTranslation: 'ספגטי', imageUrl: '/images/spaghetti.webp' },
  { id: 'cucumber', word: 'cucumber', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A long green vegetable that is crunchy and fresh', exampleSentence: 'She sliced a cucumber for the salad.', phonetic: '/ˈkjuːkʌmbər/', hebrewTranslation: 'מלפפון', imageUrl: '/images/cucumber.webp' },
  { id: 'icecream', word: 'ice cream', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A cold sweet frozen treat', exampleSentence: 'We had ice cream on a hot day.', phonetic: '/ˌaɪs ˈkriːm/', hebrewTranslation: 'גלידה', imageUrl: '/images/icecream.webp' },
  { id: 'popcorn', word: 'popcorn', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'Corn seeds that pop into fluffy white snacks', exampleSentence: 'We ate popcorn while watching the movie.', phonetic: '/ˈpɒpkɔːrn/', hebrewTranslation: 'פופקורן', imageUrl: '/images/popcorn.webp' },
  // Advanced (new)
  { id: 'mushroom', word: 'mushroom', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A small plant with a cap that grows in the shade', exampleSentence: 'We found a mushroom in the forest.', phonetic: '/ˈmʌʃruːm/', hebrewTranslation: 'פטריה', imageUrl: '/images/mushroom.webp' },
  { id: 'lemon', word: 'lemon', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A sour yellow fruit', exampleSentence: 'She squeezed a lemon into her water.', phonetic: '/ˈlɛmən/', hebrewTranslation: 'לימון', imageUrl: '/images/lemon.webp' },
  { id: 'cherry', word: 'cherry', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A small round red fruit with a pit inside', exampleSentence: 'The cherry was sweet and juicy.', phonetic: '/ˈtʃɛri/', hebrewTranslation: 'דובדבן', imageUrl: '/images/cherry.webp' },
  { id: 'pepper', word: 'pepper', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A colorful vegetable that can be sweet or spicy', exampleSentence: 'She cut a red pepper for the stir-fry.', phonetic: '/ˈpɛpər/', hebrewTranslation: 'פלפל', imageUrl: '/images/pepper.webp' },
  { id: 'noodles', word: 'noodles', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'Long thin strips of food made from dough', exampleSentence: 'We slurped noodles from our bowls.', phonetic: '/ˈnuːdəlz/', hebrewTranslation: 'אטריות', imageUrl: '/images/noodles.webp' },

  // === HOME ===
  // Beginner
  { id: 'house', word: 'house', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'A building where people live', exampleSentence: 'We live in a big house.', phonetic: '/haʊs/', hebrewTranslation: 'בית', imageUrl: '/images/house.webp' },
  { id: 'bed', word: 'bed', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'Furniture for sleeping', exampleSentence: 'I go to bed at eight o\'clock.', phonetic: '/bɛd/', hebrewTranslation: 'מיטה', imageUrl: '/images/bed.webp' },
  { id: 'chair', word: 'chair', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'Furniture for sitting on', exampleSentence: 'Please sit on the chair.', phonetic: '/tʃɛər/', hebrewTranslation: 'כיסא', imageUrl: '/images/chair.webp' },
  { id: 'table', word: 'table', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'Furniture with a flat top for eating or working', exampleSentence: 'We eat dinner at the table.', phonetic: '/ˈteɪbəl/', hebrewTranslation: 'שולחן', imageUrl: '/images/table.webp' },
  { id: 'door', word: 'door', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'You open it to go into a room', exampleSentence: 'Please close the door behind you.', phonetic: '/dɔːr/', hebrewTranslation: 'דלת', imageUrl: '/images/door.webp' },
  // Intermediate
  { id: 'window', word: 'window', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'Glass in the wall that lets light in', exampleSentence: 'She looked out the window at the garden.', phonetic: '/ˈwɪndoʊ/', hebrewTranslation: 'חלון', imageUrl: '/images/window.webp' },
  { id: 'lamp', word: 'lamp', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'An object that makes light in a room', exampleSentence: 'Turn on the lamp so we can read.', phonetic: '/læmp/', hebrewTranslation: 'מנורה', imageUrl: '/images/lamp.webp' },
  { id: 'clock', word: 'clock', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'An object that shows you the time', exampleSentence: 'The clock on the wall says three o\'clock.', phonetic: '/klɒk/', hebrewTranslation: 'שעון', imageUrl: '/images/clock.webp' },
  { id: 'mirror', word: 'mirror', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'A glass surface that shows your reflection', exampleSentence: 'She looked at herself in the mirror.', phonetic: '/ˈmɪrər/', hebrewTranslation: 'מראה', imageUrl: '/images/mirror.webp' },
  // Advanced
  { id: 'bookshelf', word: 'bookshelf', level: 'advanced', partOfSpeech: 'noun', category: 'home', definition: 'A piece of furniture for storing books', exampleSentence: 'The bookshelf was full of stories.', phonetic: '/ˈbʊkˌʃɛlf/', hebrewTranslation: 'מדף ספרים', imageUrl: '/images/bookshelf.webp' },
  { id: 'fireplace', word: 'fireplace', level: 'advanced', partOfSpeech: 'noun', category: 'home', definition: 'A place in the wall where you make a fire', exampleSentence: 'We sat by the warm fireplace.', phonetic: '/ˈfaɪərˌpleɪs/', hebrewTranslation: 'אח', imageUrl: '/images/fireplace.webp' },
  { id: 'curtain', word: 'curtain', level: 'advanced', partOfSpeech: 'noun', category: 'home', definition: 'Fabric that hangs over a window', exampleSentence: 'She opened the curtain to let in sunlight.', phonetic: '/ˈkɜːrtən/', hebrewTranslation: 'וילון', imageUrl: '/images/curtain.webp' },
  { id: 'staircase', word: 'staircase', level: 'advanced', partOfSpeech: 'noun', category: 'home', definition: 'Steps that go up to the next floor', exampleSentence: 'He walked up the staircase to his room.', phonetic: '/ˈstɛərˌkeɪs/', hebrewTranslation: 'מדרגות', imageUrl: '/images/staircase.webp' },

  // === TRANSPORT ===
  // Beginner
  { id: 'car', word: 'car', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle with four wheels', exampleSentence: 'Dad drives the car to work.', phonetic: '/kɑːr/', hebrewTranslation: 'מכונית', imageUrl: '/images/car.webp' },
  { id: 'bus', word: 'bus', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A large vehicle that carries many people', exampleSentence: 'I take the bus to school.', phonetic: '/bʌs/', hebrewTranslation: 'אוטובוס', imageUrl: '/images/bus.webp' },
  { id: 'bicycle', word: 'bicycle', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle with two wheels that you pedal', exampleSentence: 'She rode her bicycle to the park.', phonetic: '/ˈbaɪsɪkəl/', hebrewTranslation: 'אופניים', imageUrl: '/images/bicycle.webp' },
  { id: 'airplane', word: 'airplane', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle that flies in the sky', exampleSentence: 'The airplane flew above the clouds.', phonetic: '/ˈɛərˌpleɪn/', hebrewTranslation: 'מטוס', imageUrl: '/images/airplane.webp' },
  { id: 'train', word: 'train', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A long vehicle that moves on tracks', exampleSentence: 'We took the train to the city.', phonetic: '/treɪn/', hebrewTranslation: 'רכבת', imageUrl: '/images/train.webp' },
  // Intermediate
  { id: 'boat', word: 'boat', level: 'intermediate', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle that moves on water', exampleSentence: 'We sailed the boat across the lake.', phonetic: '/boʊt/', hebrewTranslation: 'סירה', imageUrl: '/images/boat.webp' },
  { id: 'helicopter', word: 'helicopter', level: 'intermediate', partOfSpeech: 'noun', category: 'transport', definition: 'An aircraft with spinning blades on top', exampleSentence: 'The helicopter flew over the city.', phonetic: '/ˈhɛlɪˌkɒptər/', hebrewTranslation: 'מסוק', imageUrl: '/images/helicopter.webp' },
  { id: 'motorcycle', word: 'motorcycle', level: 'intermediate', partOfSpeech: 'noun', category: 'transport', definition: 'A fast two-wheeled vehicle with an engine', exampleSentence: 'He rode the motorcycle down the road.', phonetic: '/ˈmoʊtərˌsaɪkəl/', hebrewTranslation: 'אופנוע', imageUrl: '/images/motorcycle.webp' },
  { id: 'scooter', word: 'scooter', level: 'intermediate', partOfSpeech: 'noun', category: 'transport', definition: 'A small vehicle you stand on and push with one foot', exampleSentence: 'She rides her scooter to school.', phonetic: '/ˈskuːtər/', hebrewTranslation: 'קורקינט', imageUrl: '/images/scooter.webp' },
  // Advanced
  { id: 'submarine', word: 'submarine', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle that travels under water', exampleSentence: 'The submarine dove deep into the ocean.', phonetic: '/ˈsʌbməˌriːn/', hebrewTranslation: 'צוללת', imageUrl: '/images/submarine.webp' },
  { id: 'ambulance', word: 'ambulance', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle that takes sick people to the hospital', exampleSentence: 'The ambulance rushed to help the hurt man.', phonetic: '/ˈæmbjələns/', hebrewTranslation: 'אמבולנס', imageUrl: '/images/ambulance.webp' },
  { id: 'tractor', word: 'tractor', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A strong farm vehicle used to pull heavy things', exampleSentence: 'The farmer drove the tractor across the field.', phonetic: '/ˈtræktər/', hebrewTranslation: 'טרקטור', imageUrl: '/images/tractor.webp' },
  { id: 'rocket', word: 'rocket', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A vehicle that flies into space', exampleSentence: 'The rocket blasted off into space.', phonetic: '/ˈrɒkɪt/', hebrewTranslation: 'רקטה', imageUrl: '/images/rocket.webp' },
  { id: 'van', word: 'van', level: 'intermediate', partOfSpeech: 'noun', category: 'transport', definition: 'A big vehicle used to carry people or things', exampleSentence: 'The family drove to the beach in a van.', phonetic: '/væn/', hebrewTranslation: 'טנדר', imageUrl: '/images/van.webp' },
  { id: 'kayak', word: 'kayak', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A small narrow boat you paddle with a double paddle', exampleSentence: 'She paddled the kayak down the river.', phonetic: '/ˈkaɪæk/', hebrewTranslation: 'קייאק', imageUrl: '/images/kayak.webp' },

  // === NATURE ===
  // Beginner
  { id: 'sun', word: 'sun', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'The bright star that shines during the day', exampleSentence: 'The sun is shining today.', phonetic: '/sʌn/', hebrewTranslation: 'שמש', imageUrl: '/images/sun.webp' },
  { id: 'tree', word: 'tree', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'A tall plant with a trunk and branches', exampleSentence: 'The tree has green leaves.', phonetic: '/triː/', hebrewTranslation: 'עץ', imageUrl: '/images/tree.webp' },
  { id: 'flower', word: 'flower', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'The colorful part of a plant', exampleSentence: 'She picked a pretty flower.', phonetic: '/ˈflaʊər/', hebrewTranslation: 'פרח', imageUrl: '/images/flower.webp' },
  { id: 'rain', word: 'rain', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'Water that falls from clouds', exampleSentence: 'The rain made puddles on the ground.', phonetic: '/reɪn/', hebrewTranslation: 'גשם', imageUrl: '/images/rain.webp' },
  { id: 'grass', word: 'grass', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'The green plants that cover the ground', exampleSentence: 'We sat on the soft green grass.', phonetic: '/ɡræs/', hebrewTranslation: 'דשא', imageUrl: '/images/grass.webp' },
  // Intermediate
  { id: 'rainbow', word: 'rainbow', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A colorful arc in the sky after rain', exampleSentence: 'We saw a beautiful rainbow after the storm.', phonetic: '/ˈreɪnˌboʊ/', hebrewTranslation: 'קשת בענן', imageUrl: '/images/rainbow.webp' },
  { id: 'mountain', word: 'mountain', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A very high piece of land', exampleSentence: 'We climbed to the top of the mountain.', phonetic: '/ˈmaʊntən/', hebrewTranslation: 'הר', imageUrl: '/images/mountain.webp' },
  // Advanced
  { id: 'volcano', word: 'volcano', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A mountain that can erupt with hot lava', exampleSentence: 'The volcano erupted with fire and smoke.', phonetic: '/vɒlˈkeɪnoʊ/', hebrewTranslation: 'הר געש', imageUrl: '/images/volcano.webp' },
  { id: 'waterfall', word: 'waterfall', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'Water that falls down from a high place', exampleSentence: 'The waterfall splashed into the river below.', phonetic: '/ˈwɔːtərˌfɔːl/', hebrewTranslation: 'מפל', imageUrl: '/images/waterfall.webp' },
  { id: 'desert', word: 'desert', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A very dry area with lots of sand', exampleSentence: 'It is very hot in the desert.', phonetic: '/ˈdɛzərt/', hebrewTranslation: 'מדבר', imageUrl: '/images/desert.webp' },
  { id: 'forest', word: 'forest', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A large area full of trees', exampleSentence: 'We went for a walk in the forest.', phonetic: '/ˈfɒrɪst/', hebrewTranslation: 'יער', imageUrl: '/images/forest.webp' },
  { id: 'meadow', word: 'meadow', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A field full of grass and wildflowers', exampleSentence: 'Butterflies flew across the green meadow.', phonetic: '/ˈmɛdoʊ/', hebrewTranslation: 'אחו', imageUrl: '/images/meadow.webp' },

  // === COLORS ===
  // Beginner
  { id: 'red', word: 'red', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of strawberries and fire trucks', exampleSentence: 'She wore a red dress to the party.', phonetic: '/rɛd/', hebrewTranslation: 'אדום', imageUrl: '/images/red.webp' },
  { id: 'blue', word: 'blue', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of the sky and the ocean', exampleSentence: 'The sky is blue today.', phonetic: '/bluː/', hebrewTranslation: 'כחול', imageUrl: '/images/blue.webp' },
  { id: 'green', word: 'green', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of grass and leaves', exampleSentence: 'The frog is bright green.', phonetic: '/ɡriːn/', hebrewTranslation: 'ירוק', imageUrl: '/images/green.webp' },
  { id: 'yellow', word: 'yellow', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of the sun and bananas', exampleSentence: 'The yellow duck floated in the bath.', phonetic: '/ˈjɛloʊ/', hebrewTranslation: 'צהוב', imageUrl: '/images/yellow.webp' },
  { id: 'black', word: 'black', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The darkest color, like the night sky', exampleSentence: 'The cat has black fur.', phonetic: '/blæk/', hebrewTranslation: 'שחור', imageUrl: '/images/black.webp' },
  { id: 'white', word: 'white', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of snow and milk', exampleSentence: 'The rabbit has soft white fur.', phonetic: '/waɪt/', hebrewTranslation: 'לבן', imageUrl: '/images/white.webp' },
  // Intermediate
  { id: 'orange_color', word: 'orange', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A warm color between red and yellow', exampleSentence: 'The leaves turned orange in autumn.', phonetic: '/ˈɒrɪndʒ/', hebrewTranslation: 'כתום', imageUrl: '/images/orange_color.webp' },
  { id: 'purple', word: 'purple', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A color made by mixing red and blue', exampleSentence: 'She painted the wall purple.', phonetic: '/ˈpɜːrpəl/', hebrewTranslation: 'סגול', imageUrl: '/images/purple.webp' },
  { id: 'pink', word: 'pink', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A light red color', exampleSentence: 'The flowers in the garden are pink.', phonetic: '/pɪŋk/', hebrewTranslation: 'ורוד', imageUrl: '/images/pink.webp' },
  { id: 'brown', word: 'brown', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of chocolate and tree bark', exampleSentence: 'The bear has brown fur.', phonetic: '/braʊn/', hebrewTranslation: 'חום', imageUrl: '/images/brown.webp' },
  // Advanced
  { id: 'gray', word: 'gray', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A color between black and white', exampleSentence: 'The sky looked gray and cloudy.', phonetic: '/ɡreɪ/', hebrewTranslation: 'אפור', imageUrl: '/images/gray.webp' },
  { id: 'silver', word: 'silver', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A shiny light gray color like metal', exampleSentence: 'She wore a silver necklace.', phonetic: '/ˈsɪlvər/', hebrewTranslation: 'כסוף', imageUrl: '/images/silver.webp' },
  { id: 'golden', word: 'golden', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A shiny warm yellow color like gold', exampleSentence: 'The golden sunset was beautiful.', phonetic: '/ˈɡoʊldən/', hebrewTranslation: 'זהוב', imageUrl: '/images/golden.webp' },
  { id: 'lime', word: 'lime', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A bright yellow-green color like a lime fruit', exampleSentence: 'Her lime green shoes were very bright.', phonetic: '/laɪm/', hebrewTranslation: 'ירוק ליים', imageUrl: '/images/lime.webp' },
  { id: 'indigo', word: 'indigo', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A deep blue-purple color', exampleSentence: 'The night sky turned a deep indigo.', phonetic: '/ˈɪndɪˌɡoʊ/', hebrewTranslation: 'אינדיגו', imageUrl: '/images/indigo.webp' },
  { id: 'amber', word: 'amber', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A warm golden-orange color like honey', exampleSentence: 'The traffic light turned amber.', phonetic: '/ˈæmbər/', hebrewTranslation: 'ענבר', imageUrl: '/images/amber.webp' },

  // === NUMBERS ===
  // Beginner
  { id: 'one', word: 'one', level: 'beginner', partOfSpeech: 'noun', category: 'numbers', definition: 'The first number, a single thing', exampleSentence: 'I have one brother.', phonetic: '/wʌn/', hebrewTranslation: 'אחד', imageUrl: '/images/one.webp' },
  { id: 'two', word: 'two', level: 'beginner', partOfSpeech: 'noun', category: 'numbers', definition: 'The number after one', exampleSentence: 'She has two cats at home.', phonetic: '/tuː/', hebrewTranslation: 'שניים', imageUrl: '/images/two.webp' },
  { id: 'three', word: 'three', level: 'beginner', partOfSpeech: 'noun', category: 'numbers', definition: 'The number after two', exampleSentence: 'There are three birds on the tree.', phonetic: '/θriː/', hebrewTranslation: 'שלוש', imageUrl: '/images/three.webp' },
  { id: 'four', word: 'four', level: 'beginner', partOfSpeech: 'noun', category: 'numbers', definition: 'The number after three', exampleSentence: 'A dog has four legs.', phonetic: '/fɔːr/', hebrewTranslation: 'ארבע', imageUrl: '/images/four.webp' },
  { id: 'five', word: 'five', level: 'beginner', partOfSpeech: 'noun', category: 'numbers', definition: 'The number of fingers on one hand', exampleSentence: 'I have five fingers on each hand.', phonetic: '/faɪv/', hebrewTranslation: 'חמש', imageUrl: '/images/five.webp' },
  // Intermediate
  { id: 'six', word: 'six', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'The number after five', exampleSentence: 'A cube has six sides.', phonetic: '/sɪks/', hebrewTranslation: 'שש', imageUrl: '/images/six.webp' },
  { id: 'seven', word: 'seven', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'The number of days in a week', exampleSentence: 'There are seven days in a week.', phonetic: '/ˈsɛvən/', hebrewTranslation: 'שבע', imageUrl: '/images/seven.webp' },
  { id: 'eight', word: 'eight', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'The number after seven', exampleSentence: 'An octopus has eight arms.', phonetic: '/eɪt/', hebrewTranslation: 'שמונה', imageUrl: '/images/eight.webp' },
  { id: 'nine', word: 'nine', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'The number before ten', exampleSentence: 'Our team has nine players.', phonetic: '/naɪn/', hebrewTranslation: 'תשע', imageUrl: '/images/nine.webp' },
  // Advanced
  { id: 'ten', word: 'ten', level: 'advanced', partOfSpeech: 'noun', category: 'numbers', definition: 'The number of fingers on both hands', exampleSentence: 'I can count to ten.', phonetic: '/tɛn/', hebrewTranslation: 'עשר', imageUrl: '/images/ten.webp' },
  { id: 'twenty', word: 'twenty', level: 'advanced', partOfSpeech: 'noun', category: 'numbers', definition: 'Two groups of ten', exampleSentence: 'There are twenty students in our class.', phonetic: '/ˈtwɛnti/', hebrewTranslation: 'עשרים', imageUrl: '/images/twenty.webp' },
  { id: 'hundred', word: 'hundred', level: 'advanced', partOfSpeech: 'noun', category: 'numbers', definition: 'Ten groups of ten, written as 100', exampleSentence: 'There are a hundred pages in this book.', phonetic: '/ˈhʌndrəd/', hebrewTranslation: 'מאה', imageUrl: '/images/hundred.webp' },
  { id: 'forty', word: 'forty', level: 'advanced', partOfSpeech: 'noun', category: 'numbers', definition: 'Four groups of ten, written as 40', exampleSentence: 'There are forty chairs in the hall.', phonetic: '/ˈfɔːrti/', hebrewTranslation: 'ארבעים', imageUrl: '/images/forty.webp' },
  { id: 'ninety', word: 'ninety', level: 'advanced', partOfSpeech: 'noun', category: 'numbers', definition: 'Nine groups of ten, written as 90', exampleSentence: 'My grandpa is almost ninety years old.', phonetic: '/ˈnaɪnti/', hebrewTranslation: 'תשעים', imageUrl: '/images/ninety.webp' },

  // === BODY ===
  // Beginner
  { id: 'hand', word: 'hand', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your body at the end of your arm', exampleSentence: 'She waved her hand to say hello.', phonetic: '/hænd/', hebrewTranslation: 'יד', imageUrl: '/images/hand.webp' },
  { id: 'foot', word: 'foot', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your body you stand on', exampleSentence: 'He hurt his foot while running.', phonetic: '/fʊt/', hebrewTranslation: 'כף רגל', imageUrl: '/images/foot.webp' },
  { id: 'eye', word: 'eye', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your face you see with', exampleSentence: 'She has brown eyes.', phonetic: '/aɪ/', hebrewTranslation: 'עין', imageUrl: '/images/eye.webp' },
  { id: 'ear', word: 'ear', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your head you hear with', exampleSentence: 'The rabbit has long ears.', phonetic: '/ɪər/', hebrewTranslation: 'אוזן', imageUrl: '/images/ear.webp' },
  // Intermediate
  { id: 'finger', word: 'finger', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'One of the five thin parts at the end of your hand', exampleSentence: 'She pointed her finger at the map.', phonetic: '/ˈfɪŋɡər/', hebrewTranslation: 'אצבע', imageUrl: '/images/finger.webp' },
  { id: 'tooth', word: 'tooth', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A hard white thing in your mouth for chewing', exampleSentence: 'She lost her first baby tooth.', phonetic: '/tuːθ/', hebrewTranslation: 'שן', imageUrl: '/images/tooth.webp' },
  // Advanced

  // === CLOTHING ===
  // Beginner
  { id: 'hat', word: 'hat', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Something you wear on your head', exampleSentence: 'He put on a hat to keep warm.', phonetic: '/hæt/', hebrewTranslation: 'כובע', imageUrl: '/images/hat.webp' },
  { id: 'shirt', word: 'shirt', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Clothing you wear on the top part of your body', exampleSentence: 'He wore a blue shirt to school.', phonetic: '/ʃɜːrt/', hebrewTranslation: 'חולצה', imageUrl: '/images/shirt.webp' },
  { id: 'shoes', word: 'shoes', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'What you wear on your feet to walk outside', exampleSentence: 'Put on your shoes before going out.', phonetic: '/ʃuːz/', hebrewTranslation: 'נעליים', imageUrl: '/images/shoes.webp' },
  { id: 'dress', word: 'dress', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Clothing for girls that covers the body and legs', exampleSentence: 'She wore a pretty dress to the party.', phonetic: '/drɛs/', hebrewTranslation: 'שמלה', imageUrl: '/images/dress.webp' },
  // Intermediate
  { id: 'jacket', word: 'jacket', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A short coat you wear over your clothes', exampleSentence: 'Bring your jacket, it might be cold.', phonetic: '/ˈdʒækɪt/', hebrewTranslation: 'ז\'קט', imageUrl: '/images/jacket.webp' },
  { id: 'gloves', word: 'gloves', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'What you wear on your hands to keep them warm', exampleSentence: 'She wore gloves in the snow.', phonetic: '/ɡlʌvz/', hebrewTranslation: 'כפפות', imageUrl: '/images/gloves.webp' },
  { id: 'scarf', word: 'scarf', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A piece of fabric you wrap around your neck', exampleSentence: 'She tied a warm scarf around her neck.', phonetic: '/skɑːrf/', hebrewTranslation: 'צעיף', imageUrl: '/images/scarf.webp' },
  // Advanced
  { id: 'sweater', word: 'sweater', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'A warm knitted top with long sleeves', exampleSentence: 'She knitted a cozy sweater for winter.', phonetic: '/ˈswɛtər/', hebrewTranslation: 'סוודר', imageUrl: '/images/sweater.webp' },
  { id: 'umbrella', word: 'umbrella', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'Something you hold over your head when it rains', exampleSentence: 'Take an umbrella in case it rains.', phonetic: '/ʌmˈbrɛlə/', hebrewTranslation: 'מטריה', imageUrl: '/images/umbrella.webp' },
  { id: 'backpack', word: 'backpack', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'A bag you carry on your back', exampleSentence: 'She packed her lunch in her backpack.', phonetic: '/ˈbækˌpæk/', hebrewTranslation: 'תיק גב', imageUrl: '/images/backpack.webp' },
  { id: 'sunglasses', word: 'sunglasses', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'Dark glasses that protect your eyes from the sun', exampleSentence: 'He wore sunglasses at the beach.', phonetic: '/ˈsʌnˌɡlæsɪz/', hebrewTranslation: 'משקפי שמש', imageUrl: '/images/sunglasses.webp' },

  // === SCHOOL ===
  // Beginner
  { id: 'book', word: 'book', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'Pages with words and pictures bound together', exampleSentence: 'She read a book before bed.', phonetic: '/bʊk/', hebrewTranslation: 'ספר', imageUrl: '/images/book.webp' },
  { id: 'pen', word: 'pen', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'A tool for writing with ink', exampleSentence: 'Write your name with a pen.', phonetic: '/pɛn/', hebrewTranslation: 'עט', imageUrl: '/images/pen.webp' },
  { id: 'ruler', word: 'ruler', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'A straight tool for measuring and drawing lines', exampleSentence: 'Use a ruler to draw a straight line.', phonetic: '/ˈruːlər/', hebrewTranslation: 'סרגל', imageUrl: '/images/ruler.webp' },
  // Intermediate
  { id: 'pencil', word: 'pencil', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A writing tool made of wood with graphite inside', exampleSentence: 'Sharpen your pencil before the test.', phonetic: '/ˈpɛnsəl/', hebrewTranslation: 'עיפרון', imageUrl: '/images/pencil.webp' },
  { id: 'eraser', word: 'eraser', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A small rubber tool for removing pencil marks', exampleSentence: 'Use the eraser to fix your mistake.', phonetic: '/ɪˈreɪsər/', hebrewTranslation: 'מחק', imageUrl: '/images/eraser.webp' },
  { id: 'crayon', word: 'crayon', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A colored wax stick for drawing', exampleSentence: 'She colored the picture with a red crayon.', phonetic: '/ˈkreɪɒn/', hebrewTranslation: 'צבע', imageUrl: '/images/crayon.webp' },
  { id: 'notebook', word: 'notebook', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A small book with blank pages for writing', exampleSentence: 'Write the homework in your notebook.', phonetic: '/ˈnoʊtˌbʊk/', hebrewTranslation: 'מחברת', imageUrl: '/images/notebook.webp' },
  // Advanced
  { id: 'scissors', word: 'scissors', level: 'advanced', partOfSpeech: 'noun', category: 'school', definition: 'A tool with two blades for cutting paper', exampleSentence: 'Cut along the line with scissors.', phonetic: '/ˈsɪzərz/', hebrewTranslation: 'מספריים', imageUrl: '/images/scissors.webp' },
  { id: 'calculator', word: 'calculator', level: 'advanced', partOfSpeech: 'noun', category: 'school', definition: 'A small machine that does math for you', exampleSentence: 'She used a calculator to add the numbers.', phonetic: '/ˈkælkjəˌleɪtər/', hebrewTranslation: 'מחשבון', imageUrl: '/images/calculator.webp' },
  { id: 'globe', word: 'globe', level: 'advanced', partOfSpeech: 'noun', category: 'school', definition: 'A round model of the Earth', exampleSentence: 'He spun the globe and pointed to a country.', phonetic: '/ɡloʊb/', hebrewTranslation: 'גלובוס', imageUrl: '/images/globe.webp' },
  { id: 'microscope', word: 'microscope', level: 'advanced', partOfSpeech: 'noun', category: 'school', definition: 'A tool that makes tiny things look bigger', exampleSentence: 'We looked at a leaf under the microscope.', phonetic: '/ˈmaɪkrəˌskoʊp/', hebrewTranslation: 'מיקרוסקופ', imageUrl: '/images/microscope.webp' },
  { id: 'stapler', word: 'stapler', level: 'advanced', partOfSpeech: 'noun', category: 'school', definition: 'A tool that pushes metal clips to hold papers together', exampleSentence: 'She used a stapler to attach the pages.', phonetic: '/ˈsteɪplər/', hebrewTranslation: 'מהדק', imageUrl: '/images/stapler.webp' },
  { id: 'paintbrush', word: 'paintbrush', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A brush used to paint pictures', exampleSentence: 'He dipped the paintbrush in red paint.', phonetic: '/ˈpeɪntˌbrʌʃ/', hebrewTranslation: 'מכחול', imageUrl: '/images/paintbrush.webp' },

  // === SPORTS ===
  // Beginner
  { id: 'ball', word: 'ball', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'A round object you throw, kick, or bounce', exampleSentence: 'He kicked the ball into the goal.', phonetic: '/bɔːl/', hebrewTranslation: 'כדור', imageUrl: '/images/ball.webp' },
  { id: 'bat', word: 'bat', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'A stick used to hit a ball in games', exampleSentence: 'She swung the bat and hit the ball.', phonetic: '/bæt/', hebrewTranslation: 'מחבט', imageUrl: '/images/bat.webp' },
  { id: 'rope', word: 'rope', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'A thick string used for jumping or climbing', exampleSentence: 'The kids played jump rope at recess.', phonetic: '/roʊp/', hebrewTranslation: 'חבל', imageUrl: '/images/rope.webp' },
  { id: 'net', word: 'net', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'A mesh used in games like tennis or soccer', exampleSentence: 'The ball flew over the net.', phonetic: '/nɛt/', hebrewTranslation: 'רשת', imageUrl: '/images/net.webp' },
  { id: 'goal', word: 'goal', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'The area where you score in a game', exampleSentence: 'She scored a goal in the last minute.', phonetic: '/ɡoʊl/', hebrewTranslation: 'שער', imageUrl: '/images/goal.webp' },
  // Intermediate
  { id: 'soccer', word: 'soccer', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'A game where you kick a ball into a goal', exampleSentence: 'We play soccer every weekend.', phonetic: '/ˈsɒkər/', hebrewTranslation: 'כדורגל', imageUrl: '/images/soccer.webp' },
  { id: 'basketball', word: 'basketball', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'A game where you throw a ball through a hoop', exampleSentence: 'He is very tall and plays basketball.', phonetic: '/ˈbæskɪtˌbɔːl/', hebrewTranslation: 'כדורסל', imageUrl: '/images/basketball.webp' },
  { id: 'tennis', word: 'tennis', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'A game where you hit a ball over a net with a racket', exampleSentence: 'They played tennis at the park.', phonetic: '/ˈtɛnɪs/', hebrewTranslation: 'טניס', imageUrl: '/images/tennis.webp' },
  { id: 'swimming', word: 'swimming', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'Moving through water using your arms and legs', exampleSentence: 'She goes swimming every morning.', phonetic: '/ˈswɪmɪŋ/', hebrewTranslation: 'שחייה', imageUrl: '/images/swimming.webp' },
  // Advanced
  { id: 'volleyball', word: 'volleyball', level: 'advanced', partOfSpeech: 'noun', category: 'sports', definition: 'A game where teams hit a ball over a high net', exampleSentence: 'We played volleyball on the beach.', phonetic: '/ˈvɒliˌbɔːl/', hebrewTranslation: 'כדורעף', imageUrl: '/images/volleyball.webp' },
  { id: 'gymnastics', word: 'gymnastics', level: 'advanced', partOfSpeech: 'noun', category: 'sports', definition: 'A sport with jumping, flipping, and balancing', exampleSentence: 'She does gymnastics after school.', phonetic: '/dʒɪmˈnæstɪks/', hebrewTranslation: 'התעמלות', imageUrl: '/images/gymnastics.webp' },
  { id: 'surfing', word: 'surfing', level: 'advanced', partOfSpeech: 'noun', category: 'sports', definition: 'Riding waves in the ocean on a board', exampleSentence: 'He learned surfing on his vacation.', phonetic: '/ˈsɜːrfɪŋ/', hebrewTranslation: 'גלישה', imageUrl: '/images/surfing.webp' },
  { id: 'archery', word: 'archery', level: 'advanced', partOfSpeech: 'noun', category: 'sports', definition: 'A sport where you shoot arrows at a target', exampleSentence: 'She practiced archery every afternoon.', phonetic: '/ˈɑːrtʃəri/', hebrewTranslation: 'קשתות', imageUrl: '/images/archery.webp' },

  // === FEELINGS ===
  // Beginner
  { id: 'happy', word: 'happy', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling good and full of joy', exampleSentence: 'She was happy to see her friends.', phonetic: '/ˈhæpi/', hebrewTranslation: 'שמח', imageUrl: '/images/happy.webp' },
  { id: 'sad', word: 'sad', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling unhappy or wanting to cry', exampleSentence: 'He felt sad when his pet was sick.', phonetic: '/sæd/', hebrewTranslation: 'עצוב', imageUrl: '/images/sad.webp' },
  { id: 'angry', word: 'angry', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling mad or upset about something', exampleSentence: 'She was angry when someone broke her toy.', phonetic: '/ˈæŋɡri/', hebrewTranslation: 'כועס', imageUrl: '/images/angry.webp' },
  // Intermediate
  { id: 'tired', word: 'tired', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling like you need to rest or sleep', exampleSentence: 'She was tired after a long day.', phonetic: '/taɪərd/', hebrewTranslation: 'עייף', imageUrl: '/images/tired.webp' },
  { id: 'hungry', word: 'hungry', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling like you need to eat', exampleSentence: 'I am so hungry I could eat a horse!', phonetic: '/ˈhʌŋɡri/', hebrewTranslation: 'רעב', imageUrl: '/images/hungry.webp' },
  { id: 'brave', word: 'brave', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Not afraid to do something difficult', exampleSentence: 'The brave girl saved the kitten from the tree.', phonetic: '/breɪv/', hebrewTranslation: 'אמיץ', imageUrl: '/images/brave.webp' },
  { id: 'proud', word: 'proud', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling good about something you did', exampleSentence: 'She was proud of her painting.', phonetic: '/praʊd/', hebrewTranslation: 'גאה', imageUrl: '/images/proud.webp' },
  // Advanced
  { id: 'excited', word: 'excited', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling very happy about something coming soon', exampleSentence: 'He was excited about his birthday party.', phonetic: '/ɪkˈsaɪtɪd/', hebrewTranslation: 'נרגש', imageUrl: '/images/excited.webp' },
  { id: 'nervous', word: 'nervous', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling worried about something that might happen', exampleSentence: 'She felt nervous before the big test.', phonetic: '/ˈnɜːrvəs/', hebrewTranslation: 'עצבני', imageUrl: '/images/nervous.webp' },
  { id: 'lonely', word: 'lonely', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling sad because you are alone', exampleSentence: 'The new student felt lonely at first.', phonetic: '/ˈloʊnli/', hebrewTranslation: 'בודד', imageUrl: '/images/lonely.webp' },

  // === EVERYDAY ===
  // Beginner
  { id: 'cup', word: 'cup', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A small container for drinking', exampleSentence: 'She drank water from a cup.', phonetic: '/kʌp/', hebrewTranslation: 'כוס', imageUrl: '/images/cup.webp' },
  { id: 'plate', word: 'plate', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A flat dish for putting food on', exampleSentence: 'Put the food on your plate.', phonetic: '/pleɪt/', hebrewTranslation: 'צלחת', imageUrl: '/images/plate.webp' },
  { id: 'key', word: 'key', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A small metal thing used to open a lock', exampleSentence: 'She used the key to open the door.', phonetic: '/kiː/', hebrewTranslation: 'מפתח', imageUrl: '/images/key.webp' },
  { id: 'phone', word: 'phone', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A device used to call and talk to people', exampleSentence: 'Mom talked on the phone.', phonetic: '/foʊn/', hebrewTranslation: 'טלפון', imageUrl: '/images/phone.webp' },
  // Intermediate
  { id: 'fork', word: 'fork', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A tool with prongs used for eating food', exampleSentence: 'He ate his pasta with a fork.', phonetic: '/fɔːrk/', hebrewTranslation: 'מזלג', imageUrl: '/images/fork.webp' },
  { id: 'knife', word: 'knife', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A tool with a sharp blade for cutting', exampleSentence: 'Use a knife to cut the bread.', phonetic: '/naɪf/', hebrewTranslation: 'סכין', imageUrl: '/images/knife.webp' },
  { id: 'spoon', word: 'spoon', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A tool with a small bowl shape for eating soup', exampleSentence: 'She stirred her tea with a spoon.', phonetic: '/spuːn/', hebrewTranslation: 'כף', imageUrl: '/images/spoon.webp' },
  { id: 'towel', word: 'towel', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A piece of fabric for drying yourself', exampleSentence: 'Dry your hands with the towel.', phonetic: '/ˈtaʊəl/', hebrewTranslation: 'מגבת', imageUrl: '/images/towel.webp' },
  // Advanced
  { id: 'toothbrush', word: 'toothbrush', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A small brush for cleaning your teeth', exampleSentence: 'Brush your teeth with your toothbrush twice a day.', phonetic: '/ˈtuːθˌbrʌʃ/', hebrewTranslation: 'מברשת שיניים', imageUrl: '/images/toothbrush.webp' },
  { id: 'envelope', word: 'envelope', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A paper cover for a letter', exampleSentence: 'She put the letter in an envelope.', phonetic: '/ˈɛnvəˌloʊp/', hebrewTranslation: 'מעטפה', imageUrl: '/images/envelope.webp' },
  { id: 'candle', word: 'candle', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A stick of wax with a string that burns to give light', exampleSentence: 'She blew out the candles on her birthday cake.', phonetic: '/ˈkændəl/', hebrewTranslation: 'נר', imageUrl: '/images/candle.webp' },
  { id: 'calendar', word: 'calendar', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A chart that shows the days, weeks, and months', exampleSentence: 'She marked the date on the calendar.', phonetic: '/ˈkæləndər/', hebrewTranslation: 'לוח שנה', imageUrl: '/images/calendar.webp' },

  // === NEW WORDS (102) – bringing total to 300 ===

  // ANIMALS +6
  { id: 'nest', word: 'nest', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A home that a bird builds from twigs and grass', exampleSentence: 'The bird laid eggs in its nest.', phonetic: '/nɛst/', hebrewTranslation: 'קן', imageUrl: '/images/nest.webp' },
  { id: 'lion', word: 'lion', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A big wild cat known as the king of the jungle', exampleSentence: 'The lion roared loudly.', phonetic: '/ˈlaɪən/', hebrewTranslation: 'אריה', imageUrl: '/images/lion.webp' },
  { id: 'frog', word: 'frog', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A small green animal that jumps and lives near water', exampleSentence: 'The frog jumped into the pond.', phonetic: '/frɒɡ/', hebrewTranslation: 'צפרדע', imageUrl: '/images/frog.webp' },
  { id: 'bear', word: 'bear', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A large furry animal that lives in forests', exampleSentence: 'We saw a bear at the zoo.', phonetic: '/bɛr/', hebrewTranslation: 'דוב', imageUrl: '/images/bear.webp' },
  { id: 'whale', word: 'whale', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'The largest animal in the sea', exampleSentence: 'The whale swam deep in the ocean.', phonetic: '/weɪl/', hebrewTranslation: 'לוויתן', imageUrl: '/images/whale.webp' },
  { id: 'octopus', word: 'octopus', level: 'advanced', partOfSpeech: 'noun', category: 'animals', definition: 'A sea creature with eight arms', exampleSentence: 'The octopus has eight long tentacles.', phonetic: '/ˈɒktəpəs/', hebrewTranslation: 'תמנון', imageUrl: '/images/octopus.webp' },

  // FOOD +5
  { id: 'cheese', word: 'cheese', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A food made from milk that can be soft or hard', exampleSentence: 'I put cheese on my sandwich.', phonetic: '/tʃiːz/', hebrewTranslation: 'גבינה', imageUrl: '/images/cheese.webp' },
  { id: 'cookie', word: 'cookie', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A small sweet baked treat', exampleSentence: 'She ate a chocolate chip cookie.', phonetic: '/ˈkʊki/', hebrewTranslation: 'עוגיה', imageUrl: '/images/cookie.webp' },
  { id: 'grape', word: 'grape', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A small round fruit that grows in bunches', exampleSentence: 'We picked grapes from the vine.', phonetic: '/ɡreɪp/', hebrewTranslation: 'ענב', imageUrl: '/images/grape.webp' },
  { id: 'pasta', word: 'pasta', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A food made from flour and water, like spaghetti', exampleSentence: 'We had pasta with tomato sauce.', phonetic: '/ˈpæstə/', hebrewTranslation: 'פסטה', imageUrl: '/images/pasta.webp' },
  { id: 'pancake', word: 'pancake', level: 'advanced', partOfSpeech: 'noun', category: 'food', definition: 'A thin flat cake cooked in a pan', exampleSentence: 'Dad made pancakes for breakfast.', phonetic: '/ˈpænkeɪk/', hebrewTranslation: 'פנקייק', imageUrl: '/images/pancake.webp' },

  // HOME +8
  { id: 'bucket', word: 'bucket', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'A round container with a handle for carrying water', exampleSentence: 'She filled the bucket with water.', phonetic: '/ˈbʌkɪt/', hebrewTranslation: 'דלי', imageUrl: '/images/bucket.webp' },
  { id: 'tent', word: 'tent', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'A shelter made of fabric used for camping', exampleSentence: 'We set up the tent at the campsite.', phonetic: '/tɛnt/', hebrewTranslation: 'אוהל', imageUrl: '/images/tent.webp' },
  { id: 'ladder', word: 'ladder', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'A tool with steps used to climb up high', exampleSentence: 'He climbed the ladder to fix the roof.', phonetic: '/ˈlædər/', hebrewTranslation: 'סולם', imageUrl: '/images/ladder.webp' },
  { id: 'wall', word: 'wall', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'A flat side of a room or building', exampleSentence: 'She painted the wall blue.', phonetic: '/wɔːl/', hebrewTranslation: 'קיר', imageUrl: '/images/wall.webp' },
  { id: 'garden', word: 'garden', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'An area where flowers and plants grow', exampleSentence: 'We played in the garden.', phonetic: '/ˈɡɑːrdən/', hebrewTranslation: 'גינה', imageUrl: '/images/garden.webp' },
  { id: 'pillow', word: 'pillow', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'A soft cushion you rest your head on in bed', exampleSentence: 'She put her head on the pillow.', phonetic: '/ˈpɪloʊ/', hebrewTranslation: 'כרית', imageUrl: '/images/pillow.webp' },
  { id: 'bathtub', word: 'bathtub', level: 'advanced', partOfSpeech: 'noun', category: 'home', definition: 'A large container you fill with water to take a bath', exampleSentence: 'The baby splashed in the bathtub.', phonetic: '/ˈbæθtʌb/', hebrewTranslation: 'אמבטיה', imageUrl: '/images/bathtub.webp' },
  { id: 'chimney', word: 'chimney', level: 'advanced', partOfSpeech: 'noun', category: 'home', definition: 'A pipe above a fireplace that lets smoke go outside', exampleSentence: 'Smoke came out of the chimney.', phonetic: '/ˈtʃɪmni/', hebrewTranslation: 'ארובה', imageUrl: '/images/chimney.webp' },

  // TRANSPORT +7
  { id: 'truck', word: 'truck', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A large vehicle used for carrying heavy things', exampleSentence: 'The truck delivered the packages.', phonetic: '/trʌk/', hebrewTranslation: 'משאית', imageUrl: '/images/truck.webp' },
  { id: 'ship', word: 'ship', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A large boat that travels on the sea', exampleSentence: 'The ship sailed across the ocean.', phonetic: '/ʃɪp/', hebrewTranslation: 'ספינה', imageUrl: '/images/ship.webp' },
  { id: 'taxi', word: 'taxi', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A car you pay to ride in', exampleSentence: 'We took a taxi to the airport.', phonetic: '/ˈtæksi/', hebrewTranslation: 'מונית', imageUrl: '/images/taxi.webp' },
  { id: 'skateboard', word: 'skateboard', level: 'intermediate', partOfSpeech: 'noun', category: 'toys', definition: 'A small board with wheels for riding on', exampleSentence: 'He rode his skateboard to the park.', phonetic: '/ˈskeɪtbɔːrd/', hebrewTranslation: 'סקייטבורד', imageUrl: '/images/skateboard.webp' },
  { id: 'canoe', word: 'canoe', level: 'intermediate', partOfSpeech: 'noun', category: 'transport', definition: 'A light narrow boat moved with paddles', exampleSentence: 'They paddled the canoe down the river.', phonetic: '/kəˈnuː/', hebrewTranslation: 'קאנו', imageUrl: '/images/canoe.webp' },
  { id: 'parachute', word: 'parachute', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A large fabric device used to fall slowly from the sky', exampleSentence: 'The skydiver opened her parachute.', phonetic: '/ˈpærəʃuːt/', hebrewTranslation: 'מצנח', imageUrl: '/images/parachute.webp' },
  { id: 'sailboat', word: 'sailboat', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A boat with sails that uses wind to move', exampleSentence: 'The sailboat glided across the lake.', phonetic: '/ˈseɪlboʊt/', hebrewTranslation: 'מפרשית', imageUrl: '/images/sailboat.webp' },

  // NATURE +9
  { id: 'feather', word: 'feather', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'A light soft thing that covers a bird', exampleSentence: 'She found a colorful feather on the ground.', phonetic: '/ˈfɛðər/', hebrewTranslation: 'נוצה', imageUrl: '/images/feather.webp' },
  { id: 'seashell', word: 'seashell', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A hard shell from a sea creature found on the beach', exampleSentence: 'She collected seashells by the shore.', phonetic: '/ˈsiːʃɛl/', hebrewTranslation: 'צדפה', imageUrl: '/images/seashell.webp' },
  { id: 'river', word: 'river', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'A large stream of water that flows to the sea', exampleSentence: 'We swam in the river.', phonetic: '/ˈrɪvər/', hebrewTranslation: 'נהר', imageUrl: '/images/river.webp' },
  { id: 'moon', word: 'moon', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'The bright round object you see in the night sky', exampleSentence: 'The moon was full and bright.', phonetic: '/muːn/', hebrewTranslation: 'ירח', imageUrl: '/images/moon.webp' },
  { id: 'star', word: 'star', level: 'beginner', partOfSpeech: 'noun', category: 'nature', definition: 'A tiny bright light in the night sky', exampleSentence: 'I can see many stars tonight.', phonetic: '/stɑːr/', hebrewTranslation: 'כוכב', imageUrl: '/images/star.webp' },
  { id: 'lake', word: 'lake', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A large area of water surrounded by land', exampleSentence: 'We had a picnic by the lake.', phonetic: '/leɪk/', hebrewTranslation: 'אגם', imageUrl: '/images/lake.webp' },
  { id: 'island', word: 'island', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A piece of land surrounded by water', exampleSentence: 'We took a boat to the small island.', phonetic: '/ˈaɪlənd/', hebrewTranslation: 'אי', imageUrl: '/images/island.webp' },
  { id: 'cliff', word: 'cliff', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A high steep face of rock', exampleSentence: 'We stood on the cliff and looked at the sea below.', phonetic: '/klɪf/', hebrewTranslation: 'צוק', imageUrl: '/images/cliff.webp' },
  { id: 'glacier', word: 'glacier', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A huge slow-moving mass of ice', exampleSentence: 'The glacier moved slowly down the mountain.', phonetic: '/ˈɡleɪʃər/', hebrewTranslation: 'קרחון', imageUrl: '/images/glacier.webp' },

  // COLORS +7
  { id: 'beige', word: 'beige', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A light sandy brown color', exampleSentence: 'She wore a beige sweater.', phonetic: '/beɪʒ/', hebrewTranslation: 'בז\'', imageUrl: '/images/beige.webp' },
  { id: 'turquoise', word: 'turquoise', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A blue-green color like the sea', exampleSentence: 'The turquoise water was beautiful.', phonetic: '/ˈtɜːrkwɔɪz/', hebrewTranslation: 'טורקיז', imageUrl: '/images/turquoise.webp' },
  { id: 'maroon', word: 'maroon', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A dark reddish-brown color', exampleSentence: 'He wore a maroon jacket.', phonetic: '/məˈruːn/', hebrewTranslation: 'חום-אדמדם', imageUrl: '/images/maroon.webp' },
  { id: 'cream', word: 'cream', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A pale yellowish-white color', exampleSentence: 'The walls are painted cream.', phonetic: '/kriːm/', hebrewTranslation: 'שמנת', imageUrl: '/images/cream.webp' },
  { id: 'navy', word: 'navy', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A very dark blue color', exampleSentence: 'She wore a navy blue dress.', phonetic: '/ˈneɪvi/', hebrewTranslation: 'כחול כהה', imageUrl: '/images/navy.webp' },
  { id: 'peach', word: 'peach', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'A soft pinkish-orange color', exampleSentence: 'The sunset was a lovely peach color.', phonetic: '/piːtʃ/', hebrewTranslation: 'אפרסק', imageUrl: '/images/peach.webp' },
  { id: 'violet', word: 'violet', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A blue-purple color', exampleSentence: 'She picked a bunch of violet flowers.', phonetic: '/ˈvaɪələt/', hebrewTranslation: 'סגול', imageUrl: '/images/violet.webp' },

  // NUMBERS +8
  { id: 'zero', word: 'zero', level: 'beginner', partOfSpeech: 'noun', category: 'numbers', definition: 'The number 0, meaning nothing', exampleSentence: 'The score is zero to zero.', phonetic: '/ˈzɪroʊ/', hebrewTranslation: 'אפס', imageUrl: '/images/zero.webp' },
  { id: 'eleven', word: 'eleven', level: 'beginner', partOfSpeech: 'noun', category: 'numbers', definition: 'The number 11', exampleSentence: 'There are eleven players on a soccer team.', phonetic: '/ɪˈlɛvən/', hebrewTranslation: 'אחת עשרה', imageUrl: '/images/eleven.webp' },
  { id: 'twelve', word: 'twelve', level: 'beginner', partOfSpeech: 'noun', category: 'numbers', definition: 'The number 12', exampleSentence: 'There are twelve months in a year.', phonetic: '/twɛlv/', hebrewTranslation: 'שתים עשרה', imageUrl: '/images/twelve.webp' },
  { id: 'fifteen', word: 'fifteen', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'The number 15', exampleSentence: 'She is fifteen years old.', phonetic: '/ˌfɪfˈtiːn/', hebrewTranslation: 'חמש עשרה', imageUrl: '/images/fifteen.webp' },
  { id: 'thirty', word: 'thirty', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'The number 30', exampleSentence: 'There are thirty days in June.', phonetic: '/ˈθɜːrti/', hebrewTranslation: 'שלושים', imageUrl: '/images/thirty.webp' },
  { id: 'fifty', word: 'fifty', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'The number 50', exampleSentence: 'He ran fifty meters.', phonetic: '/ˈfɪfti/', hebrewTranslation: 'חמישים', imageUrl: '/images/fifty.webp' },
  { id: 'thousand', word: 'thousand', level: 'advanced', partOfSpeech: 'noun', category: 'numbers', definition: 'The number 1000', exampleSentence: 'A thousand people came to the concert.', phonetic: '/ˈθaʊzənd/', hebrewTranslation: 'אלף', imageUrl: '/images/thousand.webp' },
  { id: 'million', word: 'million', level: 'advanced', partOfSpeech: 'noun', category: 'numbers', definition: 'The number 1,000,000', exampleSentence: 'There are millions of stars in the sky.', phonetic: '/ˈmɪljən/', hebrewTranslation: 'מיליון', imageUrl: '/images/million.webp' },

  // BODY +4
  { id: 'thumb', word: 'thumb', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'The short thick finger on the side of your hand', exampleSentence: 'She gave a thumbs up.', phonetic: '/θʌm/', hebrewTranslation: 'אגודל', imageUrl: '/images/thumb.webp' },

  // CLOTHING +8
  { id: 'helmet', word: 'helmet', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A hard hat that protects your head', exampleSentence: 'Always wear a helmet when you ride a bike.', phonetic: '/ˈhɛlmɪt/', hebrewTranslation: 'קסדה', imageUrl: '/images/helmet.webp' },
  { id: 'belt', word: 'belt', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'A strip worn around the waist to hold up pants', exampleSentence: 'He fastened his belt.', phonetic: '/bɛlt/', hebrewTranslation: 'חגורה', imageUrl: '/images/belt.webp' },

  { id: 'socks', word: 'socks', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Soft coverings for your feet worn inside shoes', exampleSentence: 'Put on your socks before your shoes.', phonetic: '/sɒks/', hebrewTranslation: 'גרביים', imageUrl: '/images/socks.webp' },
  { id: 'tie', word: 'tie', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A long narrow piece of cloth worn around the neck', exampleSentence: 'Dad wore a blue tie to work.', phonetic: '/taɪ/', hebrewTranslation: 'עניבה', imageUrl: '/images/tie.webp' },
  { id: 'hoodie', word: 'hoodie', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A sweatshirt with a hood', exampleSentence: 'He pulled on his warm hoodie.', phonetic: '/ˈhʊdi/', hebrewTranslation: 'קפוצ\'ון', imageUrl: '/images/hoodie.webp' },
  { id: 'raincoat', word: 'raincoat', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'A waterproof coat worn in the rain', exampleSentence: 'Wear your raincoat — it is raining outside.', phonetic: '/ˈreɪnkoʊt/', hebrewTranslation: 'מעיל גשם', imageUrl: '/images/raincoat.webp' },

  // SCHOOL +8
  { id: 'compass', word: 'compass', level: 'advanced', partOfSpeech: 'noun', category: 'school', definition: 'A tool with a needle that always points north', exampleSentence: 'We used a compass to find our way.', phonetic: '/ˈkʌmpəs/', hebrewTranslation: 'מצפן', imageUrl: '/images/compass.webp' },
  { id: 'teacher', word: 'teacher', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'A person who teaches children at school', exampleSentence: 'The teacher wrote on the board.', phonetic: '/ˈtiːtʃər/', hebrewTranslation: 'מורה', imageUrl: '/images/teacher.webp' },
  { id: 'whiteboard', word: 'whiteboard', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A white board on the wall for writing with markers', exampleSentence: 'The teacher wrote the answer on the whiteboard.', phonetic: '/ˈwaɪtbɔːrd/', hebrewTranslation: 'לוח לבן', imageUrl: '/images/whiteboard.webp' },
  { id: 'library', word: 'library', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A place with many books you can read or borrow', exampleSentence: 'We go to the library every week.', phonetic: '/ˈlaɪbrɛri/', hebrewTranslation: 'ספרייה', imageUrl: '/images/library.webp' },

  // SPORTS +7
  { id: 'whistle', word: 'whistle', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'A small tool you blow to make a loud sound', exampleSentence: 'The coach blew the whistle to start the game.', phonetic: '/ˈwɪsəl/', hebrewTranslation: 'משרוקית', imageUrl: '/images/whistle.webp' },
  { id: 'trophy', word: 'trophy', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'A shiny cup or prize you win in a contest', exampleSentence: 'The team won a gold trophy.', phonetic: '/ˈtroʊfi/', hebrewTranslation: 'גביע', imageUrl: '/images/trophy.webp' },
  { id: 'hockey', word: 'hockey', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'A game played on ice with sticks and a puck', exampleSentence: 'He plays hockey every winter.', phonetic: '/ˈhɒki/', hebrewTranslation: 'הוקי', imageUrl: '/images/hockey.webp' },
  { id: 'trampoline', word: 'trampoline', level: 'advanced', partOfSpeech: 'noun', category: 'toys', definition: 'A stretchy surface you jump and bounce on', exampleSentence: 'The kids bounced on the trampoline.', phonetic: '/ˈtræmpəliːn/', hebrewTranslation: 'טרמפולינה', imageUrl: '/images/trampoline.webp' },
  { id: 'badminton', word: 'badminton', level: 'advanced', partOfSpeech: 'noun', category: 'sports', definition: 'A sport where you hit a birdie over a net with a racket', exampleSentence: 'We played badminton in the backyard.', phonetic: '/ˈbædmɪntən/', hebrewTranslation: 'בדמינטון', imageUrl: '/images/badminton.webp' },
  { id: 'skiing', word: 'skiing', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'Sliding down snowy mountains on long boards', exampleSentence: 'We went skiing in the mountains.', phonetic: '/ˈskiːɪŋ/', hebrewTranslation: 'סקי', imageUrl: '/images/skiing.webp' },


  // FEELINGS +8
  { id: 'shy', word: 'shy', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling nervous or afraid to talk to others', exampleSentence: 'He was shy on his first day at school.', phonetic: '/ʃaɪ/', hebrewTranslation: 'ביישן', imageUrl: '/images/shy.webp' },
  { id: 'surprised', word: 'surprised', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling amazed because something unexpected happened', exampleSentence: 'She was surprised by the birthday party.', phonetic: '/sərˈpraɪzd/', hebrewTranslation: 'מופתע', imageUrl: '/images/surprised.webp' },
  { id: 'calm', word: 'calm', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling peaceful and relaxed', exampleSentence: 'She felt calm after taking a deep breath.', phonetic: '/kɑːm/', hebrewTranslation: 'רגוע', imageUrl: '/images/calm.webp' },
  { id: 'bored', word: 'bored', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling tired because nothing interesting is happening', exampleSentence: 'He was bored on the rainy afternoon.', phonetic: '/bɔːrd/', hebrewTranslation: 'משועמם', imageUrl: '/images/bored.webp' },
  { id: 'jealous', word: 'jealous', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Wanting what someone else has', exampleSentence: 'She felt jealous of her friend\'s new toy.', phonetic: '/ˈdʒɛləs/', hebrewTranslation: 'קנאי', imageUrl: '/images/jealous.webp' },
  { id: 'grateful', word: 'grateful', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling thankful for something', exampleSentence: 'I am grateful for my wonderful friends.', phonetic: '/ˈɡreɪtfʊl/', hebrewTranslation: 'אסיר תודה', imageUrl: '/images/grateful.webp' },
  { id: 'embarrassed', word: 'embarrassed', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling awkward or ashamed in front of others', exampleSentence: 'He was embarrassed when he tripped.', phonetic: '/ɪmˈbærəst/', hebrewTranslation: 'נבוך', imageUrl: '/images/embarrassed.webp' },
  { id: 'frustrated', word: 'frustrated', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling upset because you cannot do something', exampleSentence: 'She felt frustrated by the difficult puzzle.', phonetic: '/ˈfrʌstreɪtɪd/', hebrewTranslation: 'מתוסכל', imageUrl: '/images/frustrated.webp' },

  // EVERYDAY +13
  { id: 'comb', word: 'comb', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A tool with teeth for making your hair tidy', exampleSentence: 'She used a comb to brush her hair.', phonetic: '/koʊm/', hebrewTranslation: 'מסרק', imageUrl: '/images/comb.webp' },
  { id: 'wallet', word: 'wallet', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A small flat case for carrying money and cards', exampleSentence: 'He put his money in his wallet.', phonetic: '/ˈwɒlɪt/', hebrewTranslation: 'ארנק', imageUrl: '/images/wallet.webp' },
  { id: 'flashlight', word: 'flashlight', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A small light you hold in your hand', exampleSentence: 'He used a flashlight to see in the dark.', phonetic: '/ˈflæʃlaɪt/', hebrewTranslation: 'פנס', imageUrl: '/images/flashlight.webp' },
  { id: 'battery', word: 'battery', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A small object that stores power for devices', exampleSentence: 'The toy needs a new battery.', phonetic: '/ˈbætəri/', hebrewTranslation: 'סוללה', imageUrl: '/images/battery.webp' },
  { id: 'scissors-item', word: 'scissors', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A tool with two blades for cutting paper', exampleSentence: 'She cut the paper with scissors.', phonetic: '/ˈsɪzərz/', hebrewTranslation: 'מספריים', imageUrl: '/images/scissors-item.webp' },
  { id: 'thermometer', word: 'thermometer', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A device that measures temperature', exampleSentence: 'The thermometer showed it was very cold outside.', phonetic: '/θərˈmɒmɪtər/', hebrewTranslation: 'מדחום', imageUrl: '/images/thermometer.webp' },
  { id: 'magnifier', word: 'magnifying glass', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A lens that makes small things look bigger', exampleSentence: 'He used a magnifying glass to read the tiny letters.', phonetic: '/ˈmæɡnɪfaɪɪŋ ɡlæs/', hebrewTranslation: 'זכוכית מגדלת', imageUrl: '/images/magnifier.webp' },
  { id: 'drum', word: 'drum', level: 'beginner', partOfSpeech: 'noun', category: 'toys', definition: 'A musical instrument you hit with sticks', exampleSentence: 'He played the drum in the school band.', phonetic: '/drʌm/', hebrewTranslation: 'תוף', imageUrl: '/images/drum.webp' },
  { id: 'crown', word: 'crown', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A golden circle worn on the head by a king or queen', exampleSentence: 'The queen wore a beautiful crown.', phonetic: '/kraʊn/', hebrewTranslation: 'כתר', imageUrl: '/images/crown.webp' },
  { id: 'guitar', word: 'guitar', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A musical instrument with strings that you strum', exampleSentence: 'She learned to play the guitar.', phonetic: '/ɡɪˈtɑːr/', hebrewTranslation: 'גיטרה', imageUrl: '/images/guitar.webp' },
  { id: 'piano', word: 'piano', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A large musical instrument with black and white keys', exampleSentence: 'She practiced piano every afternoon.', phonetic: '/piˈænoʊ/', hebrewTranslation: 'פסנתר', imageUrl: '/images/piano.webp' },

  // === NEW WORDS ===

  // BODY +13

  // SCHOOL +5 (globe, notebook already exist)
  { id: 'classroom', word: 'classroom', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'A room in a school where lessons happen', exampleSentence: 'The classroom was full of students.', phonetic: '/ˈklæsruːm/', hebrewTranslation: 'כיתה', imageUrl: '/images/classroom.webp' },
  { id: 'crayons', word: 'crayons', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'Colored sticks of wax used for drawing', exampleSentence: 'She colored the picture with crayons.', phonetic: '/ˈkreɪɒnz/', hebrewTranslation: 'צבעי שעווה', imageUrl: '/images/crayons.webp' },

  // CLOTHING +5 (hoodie already exists)
  { id: 'vest', word: 'vest', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A sleeveless jacket worn over a shirt', exampleSentence: 'He wore a warm vest under his coat.', phonetic: '/vɛst/', hebrewTranslation: 'אפודה', imageUrl: '/images/vest.webp' },
  { id: 'mittens', word: 'mittens', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Warm coverings for your hands with one space for the thumb', exampleSentence: 'She wore red mittens in the snow.', phonetic: '/ˈmɪtənz/', hebrewTranslation: 'כפפות', imageUrl: '/images/mittens.webp' },
  { id: 'sandals', word: 'sandals', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Open shoes held on with straps worn in warm weather', exampleSentence: 'She wore sandals to the beach.', phonetic: '/ˈsændəlz/', hebrewTranslation: 'סנדלים', imageUrl: '/images/sandals.webp' },

  // FEELINGS +4
  { id: 'scared', word: 'scared', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling afraid of something', exampleSentence: 'The puppy was scared of the thunder.', phonetic: '/skɛrd/', hebrewTranslation: 'מפוחד', imageUrl: '/images/scared.webp' },
  { id: 'confused', word: 'confused', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Not understanding what is happening', exampleSentence: 'She looked confused by the directions.', phonetic: '/kənˈfjuːzd/', hebrewTranslation: 'מבולבל', imageUrl: '/images/confused.webp' },
  { id: 'curious', word: 'curious', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Wanting to learn or know more about something', exampleSentence: 'The curious cat peeked inside the box.', phonetic: '/ˈkjʊriəs/', hebrewTranslation: 'סקרן', imageUrl: '/images/curious.webp' },
  { id: 'worried', word: 'worried', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling anxious that something bad might happen', exampleSentence: 'He was worried about the exam.', phonetic: '/ˈwɜːrid/', hebrewTranslation: 'מודאג', imageUrl: '/images/worried.webp' },

  // SPORTS +4
  { id: 'running', word: 'running', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'Moving your legs fast to go quickly', exampleSentence: 'She loves running in the park.', phonetic: '/ˈrʌnɪŋ/', hebrewTranslation: 'ריצה', imageUrl: '/images/running.webp' },
  { id: 'bowling', word: 'bowling', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'A game where you roll a heavy ball to knock down pins', exampleSentence: 'We went bowling on Saturday.', phonetic: '/ˈboʊlɪŋ/', hebrewTranslation: 'באולינג', imageUrl: '/images/bowling.webp' },

  // FOOD +3
  { id: 'corn', word: 'corn', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A tall plant with yellow seeds you can eat', exampleSentence: 'We ate corn on the cob for dinner.', phonetic: '/kɔːrn/', hebrewTranslation: 'תירס', imageUrl: '/images/corn.webp' },
  { id: 'tomato', word: 'tomato', level: 'beginner', partOfSpeech: 'noun', category: 'food', definition: 'A round red fruit used in salads and sauces', exampleSentence: 'She sliced a tomato for the salad.', phonetic: '/təˈmeɪtoʊ/', hebrewTranslation: 'עגבנייה', imageUrl: '/images/tomato.webp' },
  { id: 'honey', word: 'honey', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A sweet sticky food made by bees', exampleSentence: 'He put honey on his toast.', phonetic: '/ˈhʌni/', hebrewTranslation: 'דבש', imageUrl: '/images/honey.webp' },

  // TRANSPORT +3
  { id: 'wagon', word: 'wagon', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A small cart with four wheels that you pull', exampleSentence: 'She pulled her toys in a red wagon.', phonetic: '/ˈwæɡən/', hebrewTranslation: 'עגלה', imageUrl: '/images/wagon.webp' },
  { id: 'firetruck', word: 'firetruck', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A big red truck used by firefighters', exampleSentence: 'The firetruck raced down the street.', phonetic: '/ˈfaɪərtrʌk/', hebrewTranslation: 'כבאית', imageUrl: '/images/firetruck.webp' },

  // COLORS +3 (beige already exists)

  // NUMBERS +2 (million already exists)
  { id: 'dozen', word: 'dozen', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'A group of twelve things', exampleSentence: 'We bought a dozen eggs.', phonetic: '/ˈdʌzən/', hebrewTranslation: 'תריסר', imageUrl: '/images/dozen.webp' },

  // ANIMALS +3
  { id: 'sheep', word: 'sheep', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A farm animal with fluffy wool', exampleSentence: 'The sheep grazed in the field.', phonetic: '/ʃiːp/', hebrewTranslation: 'כבשה', imageUrl: '/images/sheep.webp' },
  { id: 'monkey', word: 'monkey', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A playful animal that climbs trees', exampleSentence: 'The monkey swung from branch to branch.', phonetic: '/ˈmʌŋki/', hebrewTranslation: 'קוף', imageUrl: '/images/monkey.webp' },
  { id: 'eagle', word: 'eagle', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A large bird with sharp eyes that hunts from the sky', exampleSentence: 'The eagle soared high above the mountains.', phonetic: '/ˈiːɡəl/', hebrewTranslation: 'נשר', imageUrl: '/images/eagle.webp' },

  // NATURE +3
  { id: 'cave', word: 'cave', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'A large hole in the side of a mountain or underground', exampleSentence: 'The bear slept in the cave all winter.', phonetic: '/keɪv/', hebrewTranslation: 'מערה', imageUrl: '/images/cave.webp' },

  // HOME +3 (chimney already exists)
  { id: 'fence', word: 'fence', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'A barrier around a yard made of wood or metal', exampleSentence: 'The dog jumped over the fence.', phonetic: '/fɛns/', hebrewTranslation: 'גדר', imageUrl: '/images/fence.webp' },
  { id: 'drawer', word: 'drawer', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'A box-shaped part of furniture that slides in and out', exampleSentence: 'She put her socks in the drawer.', phonetic: '/drɔːr/', hebrewTranslation: 'מגירה', imageUrl: '/images/drawer.webp' },

  // EVERYDAY +5 (envelope, battery already exist)
  { id: 'magnet', word: 'magnet', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A piece of metal that attracts other metal things', exampleSentence: 'The magnet stuck to the fridge.', phonetic: '/ˈmæɡnɪt/', hebrewTranslation: 'מגנט', imageUrl: '/images/magnet.webp' },
  { id: 'broom', word: 'broom', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A long stick with bristles used for sweeping floors', exampleSentence: 'She swept the floor with a broom.', phonetic: '/bruːm/', hebrewTranslation: 'מטאטא', imageUrl: '/images/broom.webp' },
  { id: 'stamp', word: 'stamp', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A small sticker you put on a letter before mailing it', exampleSentence: 'He put a stamp on the envelope.', phonetic: '/stæmp/', hebrewTranslation: 'בול', imageUrl: '/images/stamp.webp' },
  // === TOYS ===
  // Beginner
  { id: 'kite', word: 'kite', level: 'beginner', partOfSpeech: 'noun', category: 'toys', definition: 'A toy that flies in the wind on a string', exampleSentence: 'We flew a kite at the beach.', phonetic: '/kaɪt/', hebrewTranslation: 'עפיפון', imageUrl: '/images/kite.webp' },
  { id: 'doll', word: 'doll', level: 'beginner', partOfSpeech: 'noun', category: 'toys', definition: 'A small toy that looks like a person', exampleSentence: 'She dressed up her doll.', phonetic: '/dɒl/', hebrewTranslation: 'בובה', imageUrl: '/images/doll.webp' },
  { id: 'teddy', word: 'teddy bear', level: 'beginner', partOfSpeech: 'noun', category: 'toys', definition: 'A soft stuffed toy bear you can hug', exampleSentence: 'He sleeps with his teddy bear.', phonetic: '/ˈtɛdi bɛər/', hebrewTranslation: 'דובי', imageUrl: '/images/teddy.webp' },
  { id: 'balloon', word: 'balloon', level: 'beginner', partOfSpeech: 'noun', category: 'toys', definition: 'A rubber bag you blow up with air', exampleSentence: 'The red balloon floated into the sky.', phonetic: '/bəˈluːn/', hebrewTranslation: 'בלון', imageUrl: '/images/balloon.webp' },
  { id: 'slide', word: 'slide', level: 'beginner', partOfSpeech: 'noun', category: 'toys', definition: 'A smooth slope you sit on and slide down', exampleSentence: 'He went down the slide at the park.', phonetic: '/slaɪd/', hebrewTranslation: 'מגלשה', imageUrl: '/images/slide.webp' },
  // Intermediate
  { id: 'puzzle', word: 'puzzle', level: 'intermediate', partOfSpeech: 'noun', category: 'toys', definition: 'A game where you fit pieces together to make a picture', exampleSentence: 'She finished the jigsaw puzzle.', phonetic: '/ˈpʌzəl/', hebrewTranslation: 'פאזל', imageUrl: '/images/puzzle.webp' },
  { id: 'robot', word: 'robot', level: 'intermediate', partOfSpeech: 'noun', category: 'toys', definition: 'A toy machine that can move and make sounds', exampleSentence: 'His toy robot walks and talks.', phonetic: '/ˈroʊbɒt/', hebrewTranslation: 'רובוט', imageUrl: '/images/robot.webp' },
  { id: 'yoyo', word: 'yo-yo', level: 'intermediate', partOfSpeech: 'noun', category: 'toys', definition: 'A round toy that goes up and down on a string', exampleSentence: 'She did tricks with her yo-yo.', phonetic: '/ˈjoʊjoʊ/', hebrewTranslation: 'יו-יו', imageUrl: '/images/yoyo.webp' },
  // Advanced
  { id: 'sandbox', word: 'sandbox', level: 'advanced', partOfSpeech: 'noun', category: 'toys', definition: 'A box filled with sand for kids to play in', exampleSentence: 'The children built castles in the sandbox.', phonetic: '/ˈsændbɒks/', hebrewTranslation: 'ארגז חול', imageUrl: '/images/sandbox.webp' },
  { id: 'dollhouse', word: 'dollhouse', level: 'advanced', partOfSpeech: 'noun', category: 'toys', definition: 'A tiny house with small furniture for dolls', exampleSentence: 'She arranged the rooms in her dollhouse.', phonetic: '/ˈdɒlhaʊs/', hebrewTranslation: 'בית בובות', imageUrl: '/images/dollhouse.webp' },
  { id: 'tricycle', word: 'tricycle', level: 'intermediate', partOfSpeech: 'noun', category: 'toys', definition: 'A small bike with three wheels for young children', exampleSentence: 'She rode her tricycle around the yard.', phonetic: '/ˈtraɪsɪkəl/', hebrewTranslation: 'תלת אופן', imageUrl: '/images/tricycle.webp' },
  { id: 'frisbee', word: 'frisbee', level: 'intermediate', partOfSpeech: 'noun', category: 'toys', definition: 'A flat round disc you throw and catch', exampleSentence: 'They played frisbee at the park.', phonetic: '/ˈfrɪzbiː/', hebrewTranslation: 'פריזבי', imageUrl: '/images/frisbee.webp' },
  { id: 'bubbles', word: 'bubbles', level: 'beginner', partOfSpeech: 'noun', category: 'toys', definition: 'Round balls of soap and air that float away', exampleSentence: 'She blew bubbles in the garden.', phonetic: '/ˈbʌbəlz/', hebrewTranslation: 'בועות', imageUrl: '/images/bubbles.webp' },
  { id: 'dice', word: 'dice', level: 'intermediate', partOfSpeech: 'noun', category: 'toys', definition: 'Small cubes with dots on each side used in games', exampleSentence: 'He rolled the dice and got a six.', phonetic: '/daɪs/', hebrewTranslation: 'קוביות משחק', imageUrl: '/images/dice.webp' },

  // +26 NEW WORDS
  // SCHOOL +3
  { id: 'folder', word: 'folder', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A cover used to keep papers organized', exampleSentence: 'She put her homework in a blue folder.', phonetic: '/ˈfoʊldər/', hebrewTranslation: 'תיקייה', imageUrl: '/images/folder.webp' },
  { id: 'locker', word: 'locker', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A small cupboard at school where you keep your things', exampleSentence: 'He put his bag in his locker.', phonetic: '/ˈlɒkər/', hebrewTranslation: 'לוקר', imageUrl: '/images/locker.webp' },

  // CLOTHING +3

  // SPORTS +3
  { id: 'climbing', word: 'climbing', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'Going up something high using your hands and feet', exampleSentence: 'He went rock climbing at the gym.', phonetic: '/ˈklaɪmɪŋ/', hebrewTranslation: 'טיפוס', imageUrl: '/images/climbing.webp' },

  // FEELINGS +2

  // FOOD +2
  { id: 'pretzel', word: 'pretzel', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A salty baked snack twisted into a knot shape', exampleSentence: 'He ate a warm pretzel at the fair.', phonetic: '/ˈprɛtsəl/', hebrewTranslation: 'בייגלה', imageUrl: '/images/pretzel.webp' },
  { id: 'muffin', word: 'muffin', level: 'intermediate', partOfSpeech: 'noun', category: 'food', definition: 'A small sweet cake baked in a cup shape', exampleSentence: 'She had a blueberry muffin for breakfast.', phonetic: '/ˈmʌfɪn/', hebrewTranslation: 'מאפין', imageUrl: '/images/muffin.webp' },

  // COLORS +2
  { id: 'scarlet', word: 'scarlet', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A bright vivid red color', exampleSentence: 'The scarlet leaves fell from the tree.', phonetic: '/ˈskɑːrlɪt/', hebrewTranslation: 'שני', imageUrl: '/images/scarlet.webp' },
  { id: 'magenta', word: 'magenta', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A bright pinkish-purple color', exampleSentence: 'She colored the flower magenta.', phonetic: '/məˈdʒɛntə/', hebrewTranslation: 'מג\'נטה', imageUrl: '/images/magenta.webp' },

  // ANIMALS +2
  { id: 'fox', word: 'fox', level: 'beginner', partOfSpeech: 'noun', category: 'animals', definition: 'A clever wild animal with a bushy tail', exampleSentence: 'The fox ran through the forest.', phonetic: '/fɒks/', hebrewTranslation: 'שועל', imageUrl: '/images/fox.webp' },
  { id: 'owl', word: 'owl', level: 'intermediate', partOfSpeech: 'noun', category: 'animals', definition: 'A bird with big eyes that comes out at night', exampleSentence: 'The owl hooted from the tree.', phonetic: '/aʊl/', hebrewTranslation: 'ינשוף', imageUrl: '/images/owl.webp' },

  // HOME +1

  // NATURE +1

  // NUMBERS +1
  { id: 'sixty', word: 'sixty', level: 'intermediate', partOfSpeech: 'noun', category: 'numbers', definition: 'Six groups of ten, written as 60', exampleSentence: 'There are sixty seconds in a minute.', phonetic: '/ˈsɪksti/', hebrewTranslation: 'שישים', imageUrl: '/images/sixty.webp' },

  // TRANSPORT +1

  // === ACTIONS (verbs) ===
  // Beginner
  { id: 'run', word: 'run', level: 'beginner', partOfSpeech: 'verb', category: 'actions', definition: 'To move your legs fast to go quickly', exampleSentence: 'She likes to run in the park.', phonetic: '/rʌn/', hebrewTranslation: 'לרוץ', imageUrl: '/images/run.webp' },
  // Intermediate
  { id: 'read_verb', word: 'read', level: 'intermediate', partOfSpeech: 'verb', category: 'actions', definition: 'To look at words and understand them', exampleSentence: 'She loves to read books.', phonetic: '/riːd/', hebrewTranslation: 'לקרוא', imageUrl: '/images/read_verb.webp' },
  { id: 'write', word: 'write', level: 'intermediate', partOfSpeech: 'verb', category: 'actions', definition: 'To make words on paper with a pen or pencil', exampleSentence: 'He writes in his notebook every day.', phonetic: '/raɪt/', hebrewTranslation: 'לכתוב', imageUrl: '/images/write.webp' },
  { id: 'cook_verb', word: 'cook', level: 'intermediate', partOfSpeech: 'verb', category: 'actions', definition: 'To make food by heating it', exampleSentence: 'Mom cooks dinner in the kitchen.', phonetic: '/kʊk/', hebrewTranslation: 'לבשל', imageUrl: '/images/cook_verb.webp' },
  { id: 'climb_verb', word: 'climb', level: 'intermediate', partOfSpeech: 'verb', category: 'actions', definition: 'To go up something using your hands and feet', exampleSentence: 'He climbs the tall tree.', phonetic: '/klaɪm/', hebrewTranslation: 'לטפס', imageUrl: '/images/climb_verb.webp' },
  // Advanced
  { id: 'draw_verb', word: 'draw', level: 'advanced', partOfSpeech: 'verb', category: 'actions', definition: 'To make a picture with a pen or pencil', exampleSentence: 'She draws a picture of a flower.', phonetic: '/drɔː/', hebrewTranslation: 'לצייר', imageUrl: '/images/draw_verb.webp' },
  { id: 'paint_verb', word: 'paint', level: 'advanced', partOfSpeech: 'verb', category: 'actions', definition: 'To make a picture using colors and a brush', exampleSentence: 'He paints a beautiful sunset.', phonetic: '/peɪnt/', hebrewTranslation: 'לצבוע', imageUrl: '/images/paint_verb.webp' },
  { id: 'throw', word: 'throw', level: 'advanced', partOfSpeech: 'verb', category: 'actions', definition: 'To send something through the air with your hand', exampleSentence: 'She throws the ball to her friend.', phonetic: '/θroʊ/', hebrewTranslation: 'לזרוק', imageUrl: '/images/throw.webp' },
  { id: 'catch_verb', word: 'catch', level: 'advanced', partOfSpeech: 'verb', category: 'actions', definition: 'To grab something that is moving through the air', exampleSentence: 'He catches the ball with both hands.', phonetic: '/kætʃ/', hebrewTranslation: 'לתפוס', imageUrl: '/images/catch_verb.webp' },
  { id: 'build', word: 'build', level: 'advanced', partOfSpeech: 'verb', category: 'actions', definition: 'To make something by putting pieces together', exampleSentence: 'They build a tower with blocks.', phonetic: '/bɪld/', hebrewTranslation: 'לבנות', imageUrl: '/images/build.webp' },
  { id: 'dig', word: 'dig', level: 'advanced', partOfSpeech: 'verb', category: 'actions', definition: 'To make a hole in the ground', exampleSentence: 'The dog digs a hole in the garden.', phonetic: '/dɪɡ/', hebrewTranslation: 'לחפור', imageUrl: '/images/dig.webp' },

  // === BODY (new entries) ===
  // Beginner
  { id: 'head', word: 'head', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The top part of your body where your brain is', exampleSentence: 'She nodded her head to say yes.', phonetic: '/hɛd/', hebrewTranslation: 'ראש', imageUrl: '/images/head.webp' },
  { id: 'arm', word: 'arm', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The long part of your body between your shoulder and hand', exampleSentence: 'He raised his arm to ask a question.', phonetic: '/ɑːrm/', hebrewTranslation: 'זרוע', imageUrl: '/images/arm.webp' },
  { id: 'nose', word: 'nose', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your face you breathe and smell with', exampleSentence: 'The clown had a big red nose.', phonetic: '/noʊz/', hebrewTranslation: 'אף', imageUrl: '/images/nose.webp' },
  { id: 'mouth', word: 'mouth', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your face you use to eat and talk', exampleSentence: 'She opened her mouth to sing.', phonetic: '/maʊθ/', hebrewTranslation: 'פה', imageUrl: '/images/mouth.webp' },
  { id: 'knee', word: 'knee', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The middle part of your leg that bends', exampleSentence: 'He scraped his knee when he fell.', phonetic: '/niː/', hebrewTranslation: 'ברך', imageUrl: '/images/knee.webp' },
  // Intermediate
  { id: 'shoulder', word: 'shoulder', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'The top part of your arm where it connects to your body', exampleSentence: 'She carried the bag on her shoulder.', phonetic: '/ˈʃoʊldər/', hebrewTranslation: 'כתף', imageUrl: '/images/shoulder.webp' },
  { id: 'elbow', word: 'elbow', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'The middle part of your arm that bends', exampleSentence: 'He bumped his elbow on the table.', phonetic: '/ˈɛlboʊ/', hebrewTranslation: 'מרפק', imageUrl: '/images/elbow.webp' },

  // TOYS (new)
  { id: 'stickers', word: 'stickers', level: 'intermediate', partOfSpeech: 'noun', category: 'toys', definition: 'Small pictures with sticky backs you can stick on things', exampleSentence: 'She decorated her notebook with stickers.', phonetic: '/ˈstɪkərz/', hebrewTranslation: 'מדבקות', imageUrl: '/images/stickers.webp' },
  { id: 'costume', word: 'costume', level: 'advanced', partOfSpeech: 'noun', category: 'toys', definition: 'Special clothes you wear to look like someone else', exampleSentence: 'She wore a princess costume for the party.', phonetic: '/ˈkɒstjuːm/', hebrewTranslation: 'תחפושת', imageUrl: '/images/costume.webp' },

  // CLOTHING (new)
  { id: 'pajamas', word: 'pajamas', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Soft clothes you wear to sleep in', exampleSentence: 'She put on her pajamas before bed.', phonetic: '/pəˈdʒɑːməz/', hebrewTranslation: 'פיג\'מה', imageUrl: '/images/pajamas.webp' },
  { id: 'zipper', word: 'zipper', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'A metal or plastic fastener that opens and closes', exampleSentence: 'He pulled up the zipper on his jacket.', phonetic: '/ˈzɪpər/', hebrewTranslation: 'רוכסן', imageUrl: '/images/zipper.webp' },
  { id: 'pocket', word: 'pocket', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A small bag sewn into clothes for carrying things', exampleSentence: 'She put the coin in her pocket.', phonetic: '/ˈpɒkɪt/', hebrewTranslation: 'כיס', imageUrl: '/images/pocket.webp' },
  { id: 'collar', word: 'collar', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'The part of a shirt that goes around your neck', exampleSentence: 'He straightened his shirt collar.', phonetic: '/ˈkɒlər/', hebrewTranslation: 'צווארון', imageUrl: '/images/collar.webp' },
  { id: 'uniform', word: 'uniform', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'Special matching clothes worn for school or work', exampleSentence: 'She wears a uniform to school.', phonetic: '/ˈjuːnɪfɔːrm/', hebrewTranslation: 'מדים', imageUrl: '/images/uniform.webp' },

  // HOME (new)
  { id: 'roof', word: 'roof', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'The top part of a building that covers it', exampleSentence: 'The cat sat on the roof.', phonetic: '/ruːf/', hebrewTranslation: 'גג', imageUrl: '/images/roof.webp' },
  { id: 'stairs', word: 'stairs', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'Steps you walk up and down to change floors', exampleSentence: 'She ran up the stairs to her room.', phonetic: '/stɛrz/', hebrewTranslation: 'מדרגות', imageUrl: '/images/stairs.webp' },
  { id: 'basement', word: 'basement', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'A room under the ground floor of a house', exampleSentence: 'We keep old toys in the basement.', phonetic: '/ˈbeɪsmənt/', hebrewTranslation: 'מרתף', imageUrl: '/images/basement.webp' },
];

export const CATEGORIES = [
  'animals', 'food', 'home', 'transport', 'nature',
  'colors', 'numbers', 'clothing', 'school',
  'sports', 'feelings', 'everyday', 'toys',
  'actions', 'body',
];

export const getWordsByLevel = (level) => WORDS.filter(w => w.level === level);
export const getWordsByCategory = (category) => WORDS.filter(w => w.category === category);
const WORD_MAP = new Map(WORDS.map(w => [w.id, w]));
const WORD_NAME_MAP = new Map(WORDS.map(w => [w.word.toLowerCase(), w]));
export const getWordById = (id) => WORD_MAP.get(id);
export const getWordByName = (name) => WORD_NAME_MAP.get(name?.toLowerCase());

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
