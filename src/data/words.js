// ~200 curated words across 15 categories, 3 difficulty levels

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
  { id: 'butterfly', word: 'butterfly', level: 'intermediate', partOfSpeech: 'noun', category: 'nature', definition: 'An insect with large colorful wings', exampleSentence: 'A butterfly landed on the flower.', phonetic: '/ˈbʌtərˌflaɪ/', hebrewTranslation: 'פרפר', imageUrl: '/images/butterfly.webp' },
  // Advanced
  { id: 'volcano', word: 'volcano', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A mountain that can erupt with hot lava', exampleSentence: 'The volcano erupted with fire and smoke.', phonetic: '/vɒlˈkeɪnoʊ/', hebrewTranslation: 'הר געש', imageUrl: '/images/volcano.webp' },
  { id: 'waterfall', word: 'waterfall', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'Water that falls down from a high place', exampleSentence: 'The waterfall splashed into the river below.', phonetic: '/ˈwɔːtərˌfɔːl/', hebrewTranslation: 'מפל', imageUrl: '/images/waterfall.webp' },
  { id: 'desert', word: 'desert', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A very dry area with lots of sand', exampleSentence: 'It is very hot in the desert.', phonetic: '/ˈdɛzərt/', hebrewTranslation: 'מדבר', imageUrl: '/images/desert.webp' },
  { id: 'forest', word: 'forest', level: 'advanced', partOfSpeech: 'noun', category: 'nature', definition: 'A large area full of trees', exampleSentence: 'We went for a walk in the forest.', phonetic: '/ˈfɒrɪst/', hebrewTranslation: 'יער', imageUrl: '/images/forest.webp' },

  // === COLORS ===
  // Beginner
  { id: 'red', word: 'red', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of strawberries and fire trucks', exampleSentence: 'She wore a red dress to the party.', phonetic: '/rɛd/', hebrewTranslation: 'אדום', imageUrl: '/images/red.webp' },
  { id: 'blue', word: 'blue', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of the sky and the ocean', exampleSentence: 'The sky is blue today.', phonetic: '/bluː/', hebrewTranslation: 'כחול', imageUrl: '/images/blue.webp' },
  { id: 'green', word: 'green', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of grass and leaves', exampleSentence: 'The frog is bright green.', phonetic: '/ɡriːn/', hebrewTranslation: 'ירוק', imageUrl: '/images/green.webp' },
  { id: 'yellow', word: 'yellow', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of the sun and bananas', exampleSentence: 'The yellow duck floated in the bath.', phonetic: '/ˈjɛloʊ/', hebrewTranslation: 'צהוב', imageUrl: '/images/yellow.webp' },
  { id: 'black', word: 'black', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The darkest color, like the night sky', exampleSentence: 'The cat has black fur.', phonetic: '/blæk/', hebrewTranslation: 'שחור', imageUrl: '/images/black.webp' },
  { id: 'white', word: 'white', level: 'beginner', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of snow and milk', exampleSentence: 'The rabbit has soft white fur.', phonetic: '/waɪt/', hebrewTranslation: 'לבן', imageUrl: '/images/white.webp' },
  // Intermediate
  { id: 'orange', word: 'orange', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A warm color between red and yellow', exampleSentence: 'The leaves turned orange in autumn.', phonetic: '/ˈɒrɪndʒ/', hebrewTranslation: 'כתום', imageUrl: '/images/orange.webp' },
  { id: 'purple', word: 'purple', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A color made by mixing red and blue', exampleSentence: 'She painted the wall purple.', phonetic: '/ˈpɜːrpəl/', hebrewTranslation: 'סגול', imageUrl: '/images/purple.webp' },
  { id: 'pink', word: 'pink', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'A light red color', exampleSentence: 'The flowers in the garden are pink.', phonetic: '/pɪŋk/', hebrewTranslation: 'ורוד', imageUrl: '/images/pink.webp' },
  { id: 'brown', word: 'brown', level: 'intermediate', partOfSpeech: 'adjective', category: 'colors', definition: 'The color of chocolate and tree bark', exampleSentence: 'The bear has brown fur.', phonetic: '/braʊn/', hebrewTranslation: 'חום', imageUrl: '/images/brown.webp' },
  // Advanced
  { id: 'gray', word: 'gray', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A color between black and white', exampleSentence: 'The sky looked gray and cloudy.', phonetic: '/ɡreɪ/', hebrewTranslation: 'אפור', imageUrl: '/images/gray.webp' },
  { id: 'silver', word: 'silver', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A shiny light gray color like metal', exampleSentence: 'She wore a silver necklace.', phonetic: '/ˈsɪlvər/', hebrewTranslation: 'כסוף', imageUrl: '/images/silver.webp' },
  { id: 'golden', word: 'golden', level: 'advanced', partOfSpeech: 'adjective', category: 'colors', definition: 'A shiny warm yellow color like gold', exampleSentence: 'The golden sunset was beautiful.', phonetic: '/ˈɡoʊldən/', hebrewTranslation: 'זהוב', imageUrl: '/images/golden.webp' },

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

  // === BODY ===
  // Beginner
  { id: 'hand', word: 'hand', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your body at the end of your arm', exampleSentence: 'She waved her hand to say hello.', phonetic: '/hænd/', hebrewTranslation: 'יד', imageUrl: '/images/hand.webp' },
  { id: 'foot', word: 'foot', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your body you stand on', exampleSentence: 'He hurt his foot while running.', phonetic: '/fʊt/', hebrewTranslation: 'כף רגל', imageUrl: '/images/foot.webp' },
  { id: 'eye', word: 'eye', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your face you see with', exampleSentence: 'She has brown eyes.', phonetic: '/aɪ/', hebrewTranslation: 'עין', imageUrl: '/images/eye.webp' },
  { id: 'ear', word: 'ear', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your head you hear with', exampleSentence: 'The rabbit has long ears.', phonetic: '/ɪər/', hebrewTranslation: 'אוזן', imageUrl: '/images/ear.webp' },
  { id: 'nose', word: 'nose', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part of your face you smell with', exampleSentence: 'The clown had a big red nose.', phonetic: '/noʊz/', hebrewTranslation: 'אף', imageUrl: '/images/nose.webp' },
  { id: 'arm', word: 'arm', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The long part of your body between your shoulder and hand', exampleSentence: 'He raised his arm to ask a question.', phonetic: '/ɑːrm/', hebrewTranslation: 'זרוע', imageUrl: '/images/arm.webp' },
  // Intermediate
  { id: 'mouth', word: 'mouth', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'The part of your face you eat and talk with', exampleSentence: 'Open your mouth wide at the dentist.', phonetic: '/maʊθ/', hebrewTranslation: 'פה', imageUrl: '/images/mouth.webp' },
  { id: 'head', word: 'head', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'The top part of your body above your neck', exampleSentence: 'She nodded her head to say yes.', phonetic: '/hɛd/', hebrewTranslation: 'ראש', imageUrl: '/images/head.webp' },
  { id: 'finger', word: 'finger', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'One of the five thin parts at the end of your hand', exampleSentence: 'She pointed her finger at the map.', phonetic: '/ˈfɪŋɡər/', hebrewTranslation: 'אצבע', imageUrl: '/images/finger.webp' },
  { id: 'knee', word: 'knee', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'The joint in the middle of your leg', exampleSentence: 'He scraped his knee when he fell.', phonetic: '/niː/', hebrewTranslation: 'ברך', imageUrl: '/images/knee.webp' },
  { id: 'tooth', word: 'tooth', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'A hard white thing in your mouth for chewing', exampleSentence: 'She lost her first baby tooth.', phonetic: '/tuːθ/', hebrewTranslation: 'שן', imageUrl: '/images/tooth.webp' },
  // Advanced
  { id: 'shoulder', word: 'shoulder', level: 'advanced', partOfSpeech: 'noun', category: 'body', definition: 'The joint where your arm meets your body', exampleSentence: 'He carried the bag on his shoulder.', phonetic: '/ˈʃoʊldər/', hebrewTranslation: 'כתף', imageUrl: '/images/shoulder.webp' },
  { id: 'elbow', word: 'elbow', level: 'advanced', partOfSpeech: 'noun', category: 'body', definition: 'The joint in the middle of your arm', exampleSentence: 'She bumped her elbow on the table.', phonetic: '/ˈɛlboʊ/', hebrewTranslation: 'מרפק', imageUrl: '/images/elbow.webp' },
  { id: 'ankle', word: 'ankle', level: 'advanced', partOfSpeech: 'noun', category: 'body', definition: 'The joint between your leg and your foot', exampleSentence: 'She twisted her ankle while dancing.', phonetic: '/ˈæŋkəl/', hebrewTranslation: 'קרסול', imageUrl: '/images/ankle.webp' },
  { id: 'wrist', word: 'wrist', level: 'advanced', partOfSpeech: 'noun', category: 'body', definition: 'The joint between your hand and your arm', exampleSentence: 'She wore a watch on her wrist.', phonetic: '/rɪst/', hebrewTranslation: 'פרק כף יד', imageUrl: '/images/wrist.webp' },

  // === CLOTHING ===
  // Beginner
  { id: 'hat', word: 'hat', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Something you wear on your head', exampleSentence: 'He put on a hat to keep warm.', phonetic: '/hæt/', hebrewTranslation: 'כובע', imageUrl: '/images/hat.webp' },
  { id: 'shirt', word: 'shirt', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Clothing you wear on the top part of your body', exampleSentence: 'He wore a blue shirt to school.', phonetic: '/ʃɜːrt/', hebrewTranslation: 'חולצה', imageUrl: '/images/shirt.webp' },
  { id: 'shoes', word: 'shoes', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'What you wear on your feet to walk outside', exampleSentence: 'Put on your shoes before going out.', phonetic: '/ʃuːz/', hebrewTranslation: 'נעליים', imageUrl: '/images/shoes.webp' },
  { id: 'pants', word: 'pants', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Clothing that covers your legs', exampleSentence: 'He wore long pants on the cold day.', phonetic: '/pænts/', hebrewTranslation: 'מכנסיים', imageUrl: '/images/pants.webp' },
  { id: 'dress', word: 'dress', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Clothing for girls that covers the body and legs', exampleSentence: 'She wore a pretty dress to the party.', phonetic: '/drɛs/', hebrewTranslation: 'שמלה', imageUrl: '/images/dress.webp' },
  // Intermediate
  { id: 'jacket', word: 'jacket', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A short coat you wear over your clothes', exampleSentence: 'Bring your jacket, it might be cold.', phonetic: '/ˈdʒækɪt/', hebrewTranslation: 'ז\'קט', imageUrl: '/images/jacket.webp' },
  { id: 'gloves', word: 'gloves', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'What you wear on your hands to keep them warm', exampleSentence: 'She wore gloves in the snow.', phonetic: '/ɡlʌvz/', hebrewTranslation: 'כפפות', imageUrl: '/images/gloves.webp' },
  { id: 'scarf', word: 'scarf', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A piece of fabric you wrap around your neck', exampleSentence: 'She tied a warm scarf around her neck.', phonetic: '/skɑːrf/', hebrewTranslation: 'צעיף', imageUrl: '/images/scarf.webp' },
  { id: 'boots', word: 'boots', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'Strong shoes that cover your ankles or legs', exampleSentence: 'He wore rain boots in the puddles.', phonetic: '/buːts/', hebrewTranslation: 'מגפיים', imageUrl: '/images/boots.webp' },
  // Advanced
  { id: 'sweater', word: 'sweater', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'A warm knitted top with long sleeves', exampleSentence: 'She knitted a cozy sweater for winter.', phonetic: '/ˈswɛtər/', hebrewTranslation: 'סוודר', imageUrl: '/images/sweater.webp' },
  { id: 'umbrella', word: 'umbrella', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'Something you hold over your head when it rains', exampleSentence: 'Take an umbrella in case it rains.', phonetic: '/ʌmˈbrɛlə/', hebrewTranslation: 'מטריה', imageUrl: '/images/umbrella.webp' },
  { id: 'backpack', word: 'backpack', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'A bag you carry on your back', exampleSentence: 'She packed her lunch in her backpack.', phonetic: '/ˈbækˌpæk/', hebrewTranslation: 'תיק גב', imageUrl: '/images/backpack.webp' },
  { id: 'sunglasses', word: 'sunglasses', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'Dark glasses that protect your eyes from the sun', exampleSentence: 'He wore sunglasses at the beach.', phonetic: '/ˈsʌnˌɡlæsɪz/', hebrewTranslation: 'משקפי שמש', imageUrl: '/images/sunglasses.webp' },

  // === SCHOOL ===
  // Beginner
  { id: 'book', word: 'book', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'Pages with words and pictures bound together', exampleSentence: 'She read a book before bed.', phonetic: '/bʊk/', hebrewTranslation: 'ספר', imageUrl: '/images/book.webp' },
  { id: 'pen', word: 'pen', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'A tool for writing with ink', exampleSentence: 'Write your name with a pen.', phonetic: '/pɛn/', hebrewTranslation: 'עט', imageUrl: '/images/pen.webp' },
  { id: 'paper', word: 'paper', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'A thin flat material you write or draw on', exampleSentence: 'She drew a picture on the paper.', phonetic: '/ˈpeɪpər/', hebrewTranslation: 'נייר', imageUrl: '/images/paper.webp' },
  { id: 'desk', word: 'desk', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'A table where you sit and do your work', exampleSentence: 'The teacher sat at her desk.', phonetic: '/dɛsk/', hebrewTranslation: 'שולחן כתיבה', imageUrl: '/images/desk.webp' },
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

  // === WEATHER ===
  // Beginner
  { id: 'cloud', word: 'cloud', level: 'beginner', partOfSpeech: 'noun', category: 'weather', definition: 'A white or gray thing floating in the sky', exampleSentence: 'The cloud looks like a bunny.', phonetic: '/klaʊd/', hebrewTranslation: 'ענן', imageUrl: '/images/cloud.webp' },
  { id: 'snow', word: 'snow', level: 'beginner', partOfSpeech: 'noun', category: 'weather', definition: 'Soft white flakes that fall from the sky when it is cold', exampleSentence: 'The children played in the snow.', phonetic: '/snoʊ/', hebrewTranslation: 'שלג', imageUrl: '/images/snow.webp' },
  { id: 'wind', word: 'wind', level: 'beginner', partOfSpeech: 'noun', category: 'weather', definition: 'Air that moves and blows things around', exampleSentence: 'The wind blew the leaves off the tree.', phonetic: '/wɪnd/', hebrewTranslation: 'רוח', imageUrl: '/images/wind.webp' },
  { id: 'ice', word: 'ice', level: 'beginner', partOfSpeech: 'noun', category: 'weather', definition: 'Frozen water that is very cold and hard', exampleSentence: 'Be careful, there is ice on the road.', phonetic: '/aɪs/', hebrewTranslation: 'קרח', imageUrl: '/images/ice.webp' },
  // Intermediate
  { id: 'storm', word: 'storm', level: 'intermediate', partOfSpeech: 'noun', category: 'weather', definition: 'Very bad weather with strong wind and rain', exampleSentence: 'We stayed inside during the storm.', phonetic: '/stɔːrm/', hebrewTranslation: 'סערה', imageUrl: '/images/storm.webp' },
  { id: 'fog', word: 'fog', level: 'intermediate', partOfSpeech: 'noun', category: 'weather', definition: 'A thick cloud near the ground that makes it hard to see', exampleSentence: 'The morning fog covered the valley.', phonetic: '/fɒɡ/', hebrewTranslation: 'ערפל', imageUrl: '/images/fog.webp' },
  { id: 'hail', word: 'hail', level: 'intermediate', partOfSpeech: 'noun', category: 'weather', definition: 'Small balls of ice that fall from the sky', exampleSentence: 'The hail made a loud noise on the roof.', phonetic: '/heɪl/', hebrewTranslation: 'ברד', imageUrl: '/images/hail.webp' },
  { id: 'thunder', word: 'thunder', level: 'intermediate', partOfSpeech: 'noun', category: 'weather', definition: 'The loud sound you hear during a storm', exampleSentence: 'The thunder was so loud it shook the house.', phonetic: '/ˈθʌndər/', hebrewTranslation: 'רעם', imageUrl: '/images/thunder.webp' },
  // Advanced
  { id: 'hurricane', word: 'hurricane', level: 'advanced', partOfSpeech: 'noun', category: 'weather', definition: 'A very powerful storm with extremely strong winds', exampleSentence: 'The hurricane knocked down many trees.', phonetic: '/ˈhʌrɪˌkeɪn/', hebrewTranslation: 'הוריקן', imageUrl: '/images/hurricane.webp' },
  { id: 'tornado', word: 'tornado', level: 'advanced', partOfSpeech: 'noun', category: 'weather', definition: 'A spinning column of wind that touches the ground', exampleSentence: 'The tornado moved across the field.', phonetic: '/tɔːrˈneɪdoʊ/', hebrewTranslation: 'טורנדו', imageUrl: '/images/tornado.webp' },
  { id: 'blizzard', word: 'blizzard', level: 'advanced', partOfSpeech: 'noun', category: 'weather', definition: 'A very bad snowstorm with strong wind', exampleSentence: 'School was closed because of the blizzard.', phonetic: '/ˈblɪzərd/', hebrewTranslation: 'סופת שלגים', imageUrl: '/images/blizzard.webp' },
  { id: 'frost', word: 'frost', level: 'advanced', partOfSpeech: 'noun', category: 'weather', definition: 'A thin layer of ice that forms on cold surfaces', exampleSentence: 'There was frost on the windows this morning.', phonetic: '/frɒst/', hebrewTranslation: 'כפור', imageUrl: '/images/frost.webp' },

  // === FAMILY ===
  // Beginner
  { id: 'mom', word: 'mom', level: 'beginner', partOfSpeech: 'noun', category: 'family', definition: 'Your mother, the woman who takes care of you', exampleSentence: 'Mom made breakfast for everyone.', phonetic: '/mɒm/', hebrewTranslation: 'אמא', imageUrl: '/images/mom.webp' },
  { id: 'dad', word: 'dad', level: 'beginner', partOfSpeech: 'noun', category: 'family', definition: 'Your father, the man who takes care of you', exampleSentence: 'Dad reads me a story every night.', phonetic: '/dæd/', hebrewTranslation: 'אבא', imageUrl: '/images/dad.webp' },
  { id: 'baby', word: 'baby', level: 'beginner', partOfSpeech: 'noun', category: 'family', definition: 'A very young child', exampleSentence: 'The baby smiled and laughed.', phonetic: '/ˈbeɪbi/', hebrewTranslation: 'תינוק', imageUrl: '/images/baby.webp' },
  { id: 'sister', word: 'sister', level: 'beginner', partOfSpeech: 'noun', category: 'family', definition: 'A girl who has the same parents as you', exampleSentence: 'My sister and I play together.', phonetic: '/ˈsɪstər/', hebrewTranslation: 'אחות', imageUrl: '/images/sister.webp' },
  { id: 'friend', word: 'friend', level: 'beginner', partOfSpeech: 'noun', category: 'family', definition: 'A person you like and enjoy being with', exampleSentence: 'She is my best friend.', phonetic: '/frɛnd/', hebrewTranslation: 'חבר', imageUrl: '/images/friend.webp' },
  // Intermediate
  { id: 'brother', word: 'brother', level: 'intermediate', partOfSpeech: 'noun', category: 'family', definition: 'A boy who has the same parents as you', exampleSentence: 'My brother is older than me.', phonetic: '/ˈbrʌðər/', hebrewTranslation: 'אח', imageUrl: '/images/brother.webp' },
  { id: 'grandma', word: 'grandma', level: 'intermediate', partOfSpeech: 'noun', category: 'family', definition: 'Your mother\'s or father\'s mother', exampleSentence: 'Grandma baked cookies for us.', phonetic: '/ˈɡrænˌmɑː/', hebrewTranslation: 'סבתא', imageUrl: '/images/grandma.webp' },
  { id: 'grandpa', word: 'grandpa', level: 'intermediate', partOfSpeech: 'noun', category: 'family', definition: 'Your mother\'s or father\'s father', exampleSentence: 'Grandpa told us a funny story.', phonetic: '/ˈɡrænˌpɑː/', hebrewTranslation: 'סבא', imageUrl: '/images/grandpa.webp' },
  { id: 'uncle', word: 'uncle', level: 'intermediate', partOfSpeech: 'noun', category: 'family', definition: 'Your parent\'s brother', exampleSentence: 'Uncle David took us to the zoo.', phonetic: '/ˈʌŋkəl/', hebrewTranslation: 'דוד', imageUrl: '/images/uncle.webp' },
  // Advanced
  { id: 'aunt', word: 'aunt', level: 'advanced', partOfSpeech: 'noun', category: 'family', definition: 'Your parent\'s sister', exampleSentence: 'Aunt Sarah brought us a gift.', phonetic: '/ænt/', hebrewTranslation: 'דודה', imageUrl: '/images/aunt.webp' },
  { id: 'cousin', word: 'cousin', level: 'advanced', partOfSpeech: 'noun', category: 'family', definition: 'The child of your uncle or aunt', exampleSentence: 'My cousin came to visit for the weekend.', phonetic: '/ˈkʌzən/', hebrewTranslation: 'בן דוד', imageUrl: '/images/cousin.webp' },
  { id: 'nephew', word: 'nephew', level: 'advanced', partOfSpeech: 'noun', category: 'family', definition: 'Your brother\'s or sister\'s son', exampleSentence: 'My nephew just started first grade.', phonetic: '/ˈnɛfjuː/', hebrewTranslation: 'אחיין', imageUrl: '/images/nephew.webp' },
  { id: 'niece', word: 'niece', level: 'advanced', partOfSpeech: 'noun', category: 'family', definition: 'Your brother\'s or sister\'s daughter', exampleSentence: 'My niece loves to draw pictures.', phonetic: '/niːs/', hebrewTranslation: 'אחיינית', imageUrl: '/images/niece.webp' },

  // === FEELINGS ===
  // Beginner
  { id: 'happy', word: 'happy', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling good and full of joy', exampleSentence: 'She was happy to see her friends.', phonetic: '/ˈhæpi/', hebrewTranslation: 'שמח', imageUrl: '/images/happy.webp' },
  { id: 'sad', word: 'sad', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling unhappy or wanting to cry', exampleSentence: 'He felt sad when his pet was sick.', phonetic: '/sæd/', hebrewTranslation: 'עצוב', imageUrl: '/images/sad.webp' },
  { id: 'angry', word: 'angry', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling mad or upset about something', exampleSentence: 'She was angry when someone broke her toy.', phonetic: '/ˈæŋɡri/', hebrewTranslation: 'כועס', imageUrl: '/images/angry.webp' },
  { id: 'scared', word: 'scared', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling afraid of something', exampleSentence: 'The loud noise made the child scared.', phonetic: '/skɛərd/', hebrewTranslation: 'מפוחד', imageUrl: '/images/scared.webp' },
  // Intermediate
  { id: 'tired', word: 'tired', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling like you need to rest or sleep', exampleSentence: 'She was tired after a long day.', phonetic: '/taɪərd/', hebrewTranslation: 'עייף', imageUrl: '/images/tired.webp' },
  { id: 'hungry', word: 'hungry', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling like you need to eat', exampleSentence: 'I am so hungry I could eat a horse!', phonetic: '/ˈhʌŋɡri/', hebrewTranslation: 'רעב', imageUrl: '/images/hungry.webp' },
  { id: 'brave', word: 'brave', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Not afraid to do something difficult', exampleSentence: 'The brave girl saved the kitten from the tree.', phonetic: '/breɪv/', hebrewTranslation: 'אמיץ', imageUrl: '/images/brave.webp' },
  { id: 'proud', word: 'proud', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling good about something you did', exampleSentence: 'She was proud of her painting.', phonetic: '/praʊd/', hebrewTranslation: 'גאה', imageUrl: '/images/proud.webp' },
  // Advanced
  { id: 'excited', word: 'excited', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling very happy about something coming soon', exampleSentence: 'He was excited about his birthday party.', phonetic: '/ɪkˈsaɪtɪd/', hebrewTranslation: 'נרגש', imageUrl: '/images/excited.webp' },
  { id: 'nervous', word: 'nervous', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling worried about something that might happen', exampleSentence: 'She felt nervous before the big test.', phonetic: '/ˈnɜːrvəs/', hebrewTranslation: 'עצבני', imageUrl: '/images/nervous.webp' },
  { id: 'lonely', word: 'lonely', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling sad because you are alone', exampleSentence: 'The new student felt lonely at first.', phonetic: '/ˈloʊnli/', hebrewTranslation: 'בודד', imageUrl: '/images/lonely.webp' },
  { id: 'confused', word: 'confused', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Not understanding what is happening', exampleSentence: 'He was confused by the difficult question.', phonetic: '/kənˈfjuːzd/', hebrewTranslation: 'מבולבל', imageUrl: '/images/confused.webp' },

  // === EVERYDAY ===
  // Beginner
  { id: 'cup', word: 'cup', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A small container for drinking', exampleSentence: 'She drank water from a cup.', phonetic: '/kʌp/', hebrewTranslation: 'כוס', imageUrl: '/images/cup.webp' },
  { id: 'plate', word: 'plate', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A flat dish for putting food on', exampleSentence: 'Put the food on your plate.', phonetic: '/pleɪt/', hebrewTranslation: 'צלחת', imageUrl: '/images/plate.webp' },
  { id: 'key', word: 'key', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A small metal thing used to open a lock', exampleSentence: 'She used the key to open the door.', phonetic: '/kiː/', hebrewTranslation: 'מפתח', imageUrl: '/images/key.webp' },
  { id: 'phone', word: 'phone', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A device used to call and talk to people', exampleSentence: 'Mom talked on the phone.', phonetic: '/foʊn/', hebrewTranslation: 'טלפון', imageUrl: '/images/phone.webp' },
  { id: 'soap', word: 'soap', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'Something you use with water to wash and get clean', exampleSentence: 'Wash your hands with soap and water.', phonetic: '/soʊp/', hebrewTranslation: 'סבון', imageUrl: '/images/soap.webp' },
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

  // ANIMALS +5
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

  // HOME +7
  { id: 'roof', word: 'roof', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'The top part of a building that covers it', exampleSentence: 'The cat climbed onto the roof.', phonetic: '/ruːf/', hebrewTranslation: 'גג', imageUrl: '/images/roof.webp' },
  { id: 'wall', word: 'wall', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'A flat side of a room or building', exampleSentence: 'She painted the wall blue.', phonetic: '/wɔːl/', hebrewTranslation: 'קיר', imageUrl: '/images/wall.webp' },
  { id: 'garden', word: 'garden', level: 'beginner', partOfSpeech: 'noun', category: 'home', definition: 'An area where flowers and plants grow', exampleSentence: 'We played in the garden.', phonetic: '/ˈɡɑːrdən/', hebrewTranslation: 'גינה', imageUrl: '/images/garden.webp' },
  { id: 'pillow', word: 'pillow', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'A soft cushion you rest your head on in bed', exampleSentence: 'She put her head on the pillow.', phonetic: '/ˈpɪloʊ/', hebrewTranslation: 'כרית', imageUrl: '/images/pillow.webp' },
  { id: 'blanket', word: 'blanket', level: 'intermediate', partOfSpeech: 'noun', category: 'home', definition: 'A large soft cover for keeping warm', exampleSentence: 'She wrapped herself in a warm blanket.', phonetic: '/ˈblæŋkɪt/', hebrewTranslation: 'שמיכה', imageUrl: '/images/blanket.webp' },
  { id: 'bathtub', word: 'bathtub', level: 'advanced', partOfSpeech: 'noun', category: 'home', definition: 'A large container you fill with water to take a bath', exampleSentence: 'The baby splashed in the bathtub.', phonetic: '/ˈbæθtʌb/', hebrewTranslation: 'אמבטיה', imageUrl: '/images/bathtub.webp' },
  { id: 'chimney', word: 'chimney', level: 'advanced', partOfSpeech: 'noun', category: 'home', definition: 'A pipe above a fireplace that lets smoke go outside', exampleSentence: 'Smoke came out of the chimney.', phonetic: '/ˈtʃɪmni/', hebrewTranslation: 'ארובה', imageUrl: '/images/chimney.webp' },

  // TRANSPORT +7
  { id: 'truck', word: 'truck', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A large vehicle used for carrying heavy things', exampleSentence: 'The truck delivered the packages.', phonetic: '/trʌk/', hebrewTranslation: 'משאית', imageUrl: '/images/truck.webp' },
  { id: 'ship', word: 'ship', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A large boat that travels on the sea', exampleSentence: 'The ship sailed across the ocean.', phonetic: '/ʃɪp/', hebrewTranslation: 'ספינה', imageUrl: '/images/ship.webp' },
  { id: 'taxi', word: 'taxi', level: 'beginner', partOfSpeech: 'noun', category: 'transport', definition: 'A car you pay to ride in', exampleSentence: 'We took a taxi to the airport.', phonetic: '/ˈtæksi/', hebrewTranslation: 'מונית', imageUrl: '/images/taxi.webp' },
  { id: 'skateboard', word: 'skateboard', level: 'intermediate', partOfSpeech: 'noun', category: 'transport', definition: 'A small board with wheels for riding on', exampleSentence: 'He rode his skateboard to the park.', phonetic: '/ˈskeɪtbɔːrd/', hebrewTranslation: 'סקייטבורד', imageUrl: '/images/skateboard.webp' },
  { id: 'canoe', word: 'canoe', level: 'intermediate', partOfSpeech: 'noun', category: 'transport', definition: 'A light narrow boat moved with paddles', exampleSentence: 'They paddled the canoe down the river.', phonetic: '/kəˈnuː/', hebrewTranslation: 'קאנו', imageUrl: '/images/canoe.webp' },
  { id: 'parachute', word: 'parachute', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A large fabric device used to fall slowly from the sky', exampleSentence: 'The skydiver opened her parachute.', phonetic: '/ˈpærəʃuːt/', hebrewTranslation: 'מצנח', imageUrl: '/images/parachute.webp' },
  { id: 'sailboat', word: 'sailboat', level: 'advanced', partOfSpeech: 'noun', category: 'transport', definition: 'A boat with sails that uses wind to move', exampleSentence: 'The sailboat glided across the lake.', phonetic: '/ˈseɪlboʊt/', hebrewTranslation: 'מפרשית', imageUrl: '/images/sailboat.webp' },

  // NATURE +7
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

  // BODY +5
  { id: 'neck', word: 'neck', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The part that connects your head to your body', exampleSentence: 'She wore a necklace around her neck.', phonetic: '/nɛk/', hebrewTranslation: 'צוואר', imageUrl: '/images/neck.webp' },
  { id: 'back', word: 'back', level: 'beginner', partOfSpeech: 'noun', category: 'body', definition: 'The rear part of your body from shoulders to waist', exampleSentence: 'He carried the bag on his back.', phonetic: '/bæk/', hebrewTranslation: 'גב', imageUrl: '/images/back.webp' },
  { id: 'chin', word: 'chin', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'The bottom part of your face below your mouth', exampleSentence: 'He rested his chin on his hand.', phonetic: '/tʃɪn/', hebrewTranslation: 'סנטר', imageUrl: '/images/chin.webp' },
  { id: 'thumb', word: 'thumb', level: 'intermediate', partOfSpeech: 'noun', category: 'body', definition: 'The short thick finger on the side of your hand', exampleSentence: 'She gave a thumbs up.', phonetic: '/θʌm/', hebrewTranslation: 'אגודל', imageUrl: '/images/thumb.webp' },
  { id: 'forehead', word: 'forehead', level: 'advanced', partOfSpeech: 'noun', category: 'body', definition: 'The flat area of your face above your eyebrows', exampleSentence: 'Mom kissed the baby on the forehead.', phonetic: '/ˈfɔːrhɛd/', hebrewTranslation: 'מצח', imageUrl: '/images/forehead.webp' },

  // CLOTHING +7
  { id: 'belt', word: 'belt', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'A strip worn around the waist to hold up pants', exampleSentence: 'He fastened his belt.', phonetic: '/bɛlt/', hebrewTranslation: 'חגורה', imageUrl: '/images/belt.webp' },
  { id: 'skirt', word: 'skirt', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'A piece of clothing that hangs from the waist', exampleSentence: 'She wore a red skirt.', phonetic: '/skɜːrt/', hebrewTranslation: 'חצאית', imageUrl: '/images/skirt.webp' },
  { id: 'socks', word: 'socks', level: 'beginner', partOfSpeech: 'noun', category: 'clothing', definition: 'Soft coverings for your feet worn inside shoes', exampleSentence: 'Put on your socks before your shoes.', phonetic: '/sɒks/', hebrewTranslation: 'גרביים', imageUrl: '/images/socks.webp' },
  { id: 'tie', word: 'tie', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A long narrow piece of cloth worn around the neck', exampleSentence: 'Dad wore a blue tie to work.', phonetic: '/taɪ/', hebrewTranslation: 'עניבה', imageUrl: '/images/tie.webp' },
  { id: 'hoodie', word: 'hoodie', level: 'intermediate', partOfSpeech: 'noun', category: 'clothing', definition: 'A sweatshirt with a hood', exampleSentence: 'He pulled on his warm hoodie.', phonetic: '/ˈhʊdi/', hebrewTranslation: 'קפוצ\'ון', imageUrl: '/images/hoodie.webp' },
  { id: 'raincoat', word: 'raincoat', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'A waterproof coat worn in the rain', exampleSentence: 'Wear your raincoat — it is raining outside.', phonetic: '/ˈreɪnkoʊt/', hebrewTranslation: 'מעיל גשם', imageUrl: '/images/raincoat.webp' },
  { id: 'pajamas', word: 'pajamas', level: 'advanced', partOfSpeech: 'noun', category: 'clothing', definition: 'Comfortable clothes you wear to sleep', exampleSentence: 'She put on her pajamas before bed.', phonetic: '/pəˈdʒɑːməz/', hebrewTranslation: 'פיג\'מה', imageUrl: '/images/pajamas.webp' },

  // SCHOOL +7
  { id: 'teacher', word: 'teacher', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'A person who teaches children at school', exampleSentence: 'The teacher wrote on the board.', phonetic: '/ˈtiːtʃər/', hebrewTranslation: 'מורה', imageUrl: '/images/teacher.webp' },
  { id: 'homework', word: 'homework', level: 'beginner', partOfSpeech: 'noun', category: 'school', definition: 'Work that a student does at home for school', exampleSentence: 'I finished my homework after dinner.', phonetic: '/ˈhoʊmwɜːrk/', hebrewTranslation: 'שיעורי בית', imageUrl: '/images/homework.webp' },
  { id: 'whiteboard', word: 'whiteboard', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A white board on the wall for writing with markers', exampleSentence: 'The teacher wrote the answer on the whiteboard.', phonetic: '/ˈwaɪtbɔːrd/', hebrewTranslation: 'לוח לבן', imageUrl: '/images/whiteboard.webp' },
  { id: 'library', word: 'library', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A place with many books you can read or borrow', exampleSentence: 'We go to the library every week.', phonetic: '/ˈlaɪbrɛri/', hebrewTranslation: 'ספרייה', imageUrl: '/images/library.webp' },
  { id: 'lunchbox', word: 'lunchbox', level: 'intermediate', partOfSpeech: 'noun', category: 'school', definition: 'A container for carrying food to school', exampleSentence: 'She packed her lunchbox with a sandwich.', phonetic: '/ˈlʌntʃbɒks/', hebrewTranslation: 'קופסת אוכל', imageUrl: '/images/lunchbox.webp' },
  { id: 'gymnasium', word: 'gymnasium', level: 'advanced', partOfSpeech: 'noun', category: 'school', definition: 'A large room for sports and exercise at school', exampleSentence: 'We played basketball in the gymnasium.', phonetic: '/dʒɪmˈneɪziəm/', hebrewTranslation: 'אולם ספורט', imageUrl: '/images/gymnasium.webp' },
  { id: 'principal', word: 'principal', level: 'advanced', partOfSpeech: 'noun', category: 'school', definition: 'The person who is in charge of a school', exampleSentence: 'The principal welcomed the new students.', phonetic: '/ˈprɪnsəpəl/', hebrewTranslation: 'מנהל בית ספר', imageUrl: '/images/principal.webp' },

  // SPORTS +7
  { id: 'running', word: 'running', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'Moving fast on your feet', exampleSentence: 'She loves running in the park.', phonetic: '/ˈrʌnɪŋ/', hebrewTranslation: 'ריצה', imageUrl: '/images/running.webp' },
  { id: 'dancing', word: 'dancing', level: 'beginner', partOfSpeech: 'noun', category: 'sports', definition: 'Moving your body to music', exampleSentence: 'She took dancing lessons after school.', phonetic: '/ˈdænsɪŋ/', hebrewTranslation: 'ריקוד', imageUrl: '/images/dancing.webp' },
  { id: 'hockey', word: 'hockey', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'A game played on ice with sticks and a puck', exampleSentence: 'He plays hockey every winter.', phonetic: '/ˈhɒki/', hebrewTranslation: 'הוקי', imageUrl: '/images/hockey.webp' },
  { id: 'karate', word: 'karate', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'A martial art that uses kicks and punches', exampleSentence: 'She got a green belt in karate.', phonetic: '/kəˈrɑːti/', hebrewTranslation: 'קראטה', imageUrl: '/images/karate.webp' },
  { id: 'trampoline', word: 'trampoline', level: 'advanced', partOfSpeech: 'noun', category: 'sports', definition: 'A stretchy surface you jump and bounce on', exampleSentence: 'The kids bounced on the trampoline.', phonetic: '/ˈtræmpəliːn/', hebrewTranslation: 'טרמפולינה', imageUrl: '/images/trampoline.webp' },
  { id: 'badminton', word: 'badminton', level: 'advanced', partOfSpeech: 'noun', category: 'sports', definition: 'A sport where you hit a birdie over a net with a racket', exampleSentence: 'We played badminton in the backyard.', phonetic: '/ˈbædmɪntən/', hebrewTranslation: 'בדמינטון', imageUrl: '/images/badminton.webp' },
  { id: 'skiing', word: 'skiing', level: 'intermediate', partOfSpeech: 'noun', category: 'sports', definition: 'Sliding down snowy mountains on long boards', exampleSentence: 'We went skiing in the mountains.', phonetic: '/ˈskiːɪŋ/', hebrewTranslation: 'סקי', imageUrl: '/images/skiing.webp' },

  // WEATHER +8
  { id: 'sunny', word: 'sunny', level: 'beginner', partOfSpeech: 'adjective', category: 'weather', definition: 'When the sun is shining and the sky is clear', exampleSentence: 'It is a sunny day today.', phonetic: '/ˈsʌni/', hebrewTranslation: 'שמשי', imageUrl: '/images/sunny.webp' },
  { id: 'cloudy', word: 'cloudy', level: 'beginner', partOfSpeech: 'adjective', category: 'weather', definition: 'When the sky is full of clouds', exampleSentence: 'It was cloudy all morning.', phonetic: '/ˈklaʊdi/', hebrewTranslation: 'מעונן', imageUrl: '/images/cloudy.webp' },
  { id: 'windy', word: 'windy', level: 'beginner', partOfSpeech: 'adjective', category: 'weather', definition: 'When there is a lot of wind blowing', exampleSentence: 'It is too windy to fly a kite safely.', phonetic: '/ˈwɪndi/', hebrewTranslation: 'סוער', imageUrl: '/images/windy.webp' },
  { id: 'rainy', word: 'rainy', level: 'beginner', partOfSpeech: 'adjective', category: 'weather', definition: 'When rain is falling from the sky', exampleSentence: 'Bring an umbrella on rainy days.', phonetic: '/ˈreɪni/', hebrewTranslation: 'גשום', imageUrl: '/images/rainy.webp' },
  { id: 'drizzle', word: 'drizzle', level: 'intermediate', partOfSpeech: 'noun', category: 'weather', definition: 'Very light rain', exampleSentence: 'A light drizzle started falling.', phonetic: '/ˈdrɪzəl/', hebrewTranslation: 'טפטוף', imageUrl: '/images/drizzle.webp' },
  { id: 'breeze', word: 'breeze', level: 'intermediate', partOfSpeech: 'noun', category: 'weather', definition: 'A gentle soft wind', exampleSentence: 'A cool breeze blew through the window.', phonetic: '/briːz/', hebrewTranslation: 'משב רוח', imageUrl: '/images/breeze.webp' },
  { id: 'drought', word: 'drought', level: 'advanced', partOfSpeech: 'noun', category: 'weather', definition: 'A long time with no rain', exampleSentence: 'The drought dried up the lake.', phonetic: '/draʊt/', hebrewTranslation: 'בצורת', imageUrl: '/images/drought.webp' },
  { id: 'avalanche', word: 'avalanche', level: 'advanced', partOfSpeech: 'noun', category: 'weather', definition: 'A large mass of snow falling down a mountain', exampleSentence: 'The loud noise caused an avalanche.', phonetic: '/ˈævəlæntʃ/', hebrewTranslation: 'מפולת שלג', imageUrl: '/images/avalanche.webp' },

  // FAMILY +7
  { id: 'son', word: 'son', level: 'beginner', partOfSpeech: 'noun', category: 'family', definition: 'A male child of a parent', exampleSentence: 'She has one son and one daughter.', phonetic: '/sʌn/', hebrewTranslation: 'בן', imageUrl: '/images/son.webp' },
  { id: 'daughter', word: 'daughter', level: 'beginner', partOfSpeech: 'noun', category: 'family', definition: 'A female child of a parent', exampleSentence: 'Their daughter is five years old.', phonetic: '/ˈdɔːtər/', hebrewTranslation: 'בת', imageUrl: '/images/daughter.webp' },
  { id: 'husband', word: 'husband', level: 'intermediate', partOfSpeech: 'noun', category: 'family', definition: 'A married man; a woman\'s partner in marriage', exampleSentence: 'Her husband cooked dinner tonight.', phonetic: '/ˈhʌzbənd/', hebrewTranslation: 'בעל', imageUrl: '/images/husband.webp' },
  { id: 'wife', word: 'wife', level: 'intermediate', partOfSpeech: 'noun', category: 'family', definition: 'A married woman; a man\'s partner in marriage', exampleSentence: 'His wife works at the hospital.', phonetic: '/waɪf/', hebrewTranslation: 'אישה', imageUrl: '/images/wife.webp' },
  { id: 'twin', word: 'twin', level: 'intermediate', partOfSpeech: 'noun', category: 'family', definition: 'One of two children born at the same time to the same mother', exampleSentence: 'She and her twin sister look exactly alike.', phonetic: '/twɪn/', hebrewTranslation: 'תאום', imageUrl: '/images/twin.webp' },
  { id: 'stepmother', word: 'stepmother', level: 'advanced', partOfSpeech: 'noun', category: 'family', definition: 'A woman who marries your father but is not your birth mother', exampleSentence: 'Her stepmother is very kind.', phonetic: '/ˈstɛpˌmʌðər/', hebrewTranslation: 'אם חורגת', imageUrl: '/images/stepmother.webp' },
  { id: 'ancestor', word: 'ancestor', level: 'advanced', partOfSpeech: 'noun', category: 'family', definition: 'A person in your family who lived a long time ago', exampleSentence: 'Our ancestors came from faraway lands.', phonetic: '/ˈænsɛstər/', hebrewTranslation: 'אב קדמון', imageUrl: '/images/ancestor.webp' },

  // FEELINGS +8
  { id: 'shy', word: 'shy', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling nervous or afraid to talk to others', exampleSentence: 'He was shy on his first day at school.', phonetic: '/ʃaɪ/', hebrewTranslation: 'ביישן', imageUrl: '/images/shy.webp' },
  { id: 'surprised', word: 'surprised', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling amazed because something unexpected happened', exampleSentence: 'She was surprised by the birthday party.', phonetic: '/sərˈpraɪzd/', hebrewTranslation: 'מופתע', imageUrl: '/images/surprised.webp' },
  { id: 'calm', word: 'calm', level: 'beginner', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling peaceful and relaxed', exampleSentence: 'She felt calm after taking a deep breath.', phonetic: '/kɑːm/', hebrewTranslation: 'רגוע', imageUrl: '/images/calm.webp' },
  { id: 'bored', word: 'bored', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling tired because nothing interesting is happening', exampleSentence: 'He was bored on the rainy afternoon.', phonetic: '/bɔːrd/', hebrewTranslation: 'משועמם', imageUrl: '/images/bored.webp' },
  { id: 'jealous', word: 'jealous', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Wanting what someone else has', exampleSentence: 'She felt jealous of her friend\'s new toy.', phonetic: '/ˈdʒɛləs/', hebrewTranslation: 'קנאי', imageUrl: '/images/jealous.webp' },
  { id: 'grateful', word: 'grateful', level: 'intermediate', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling thankful for something', exampleSentence: 'I am grateful for my wonderful friends.', phonetic: '/ˈɡreɪtfʊl/', hebrewTranslation: 'אסיר תודה', imageUrl: '/images/grateful.webp' },
  { id: 'embarrassed', word: 'embarrassed', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling awkward or ashamed in front of others', exampleSentence: 'He was embarrassed when he tripped.', phonetic: '/ɪmˈbærəst/', hebrewTranslation: 'נבוך', imageUrl: '/images/embarrassed.webp' },
  { id: 'frustrated', word: 'frustrated', level: 'advanced', partOfSpeech: 'adjective', category: 'feelings', definition: 'Feeling upset because you cannot do something', exampleSentence: 'She felt frustrated by the difficult puzzle.', phonetic: '/ˈfrʌstreɪtɪd/', hebrewTranslation: 'מתוסכל', imageUrl: '/images/frustrated.webp' },

  // EVERYDAY +7
  { id: 'comb', word: 'comb', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A tool with teeth for making your hair tidy', exampleSentence: 'She used a comb to brush her hair.', phonetic: '/koʊm/', hebrewTranslation: 'מסרק', imageUrl: '/images/comb.webp' },
  { id: 'wallet', word: 'wallet', level: 'beginner', partOfSpeech: 'noun', category: 'everyday', definition: 'A small flat case for carrying money and cards', exampleSentence: 'He put his money in his wallet.', phonetic: '/ˈwɒlɪt/', hebrewTranslation: 'ארנק', imageUrl: '/images/wallet.webp' },
  { id: 'flashlight', word: 'flashlight', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A small light you hold in your hand', exampleSentence: 'He used a flashlight to see in the dark.', phonetic: '/ˈflæʃlaɪt/', hebrewTranslation: 'פנס', imageUrl: '/images/flashlight.webp' },
  { id: 'battery', word: 'battery', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A small object that stores power for devices', exampleSentence: 'The toy needs a new battery.', phonetic: '/ˈbætəri/', hebrewTranslation: 'סוללה', imageUrl: '/images/battery.webp' },
  { id: 'scissors-item', word: 'scissors', level: 'intermediate', partOfSpeech: 'noun', category: 'everyday', definition: 'A tool with two blades for cutting paper', exampleSentence: 'She cut the paper with scissors.', phonetic: '/ˈsɪzərz/', hebrewTranslation: 'מספריים', imageUrl: '/images/scissors-item.webp' },
  { id: 'thermometer', word: 'thermometer', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A device that measures temperature', exampleSentence: 'The thermometer showed it was very cold outside.', phonetic: '/θərˈmɒmɪtər/', hebrewTranslation: 'מדחום', imageUrl: '/images/thermometer.webp' },
  { id: 'magnifier', word: 'magnifying glass', level: 'advanced', partOfSpeech: 'noun', category: 'everyday', definition: 'A lens that makes small things look bigger', exampleSentence: 'He used a magnifying glass to read the tiny letters.', phonetic: '/ˈmæɡnɪfaɪɪŋ ɡlæs/', hebrewTranslation: 'זכוכית מגדלת', imageUrl: '/images/magnifier.webp' },
];

export const CATEGORIES = [
  'animals', 'food', 'home', 'transport', 'nature',
  'colors', 'numbers', 'body', 'clothing', 'school',
  'sports', 'weather', 'family', 'feelings', 'everyday',
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
