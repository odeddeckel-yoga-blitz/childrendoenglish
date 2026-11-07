/* True or False — word pool (shared by game.js, e2e/true-or-false.spec.js and scripts/true-or-false-audio.py).
   Ids of src/data/words.js (picture /images/<id>.webp). Only words that read naturally after "This is a/an":
   no plurals (shoes, scissors, grapes) and no uncountables (bread, rice, soup). Groups come from Odd One Out's
   ambiguity-checked groups, so a word belongs to exactly one of them.
   SIMILAR: look-alikes within a group. Level 3 says the name of another word from the SAME group, never one from
   the picture's own look-alike set (a jeep is never called a car, a muffin never a cake).
   Left out: vase and ladybug — Piper's clips for them were misheard by whisper (vase → "face") at every speed tried. */
window.TF_WORDS={
  GROUPS:{
    animal:['cat','dog','horse','cow','elephant','giraffe','lion','monkey','zebra','rabbit','bear','sheep','penguin','frog','owl','fox','camel','kangaroo','koala','gorilla','tiger','pig','hippo','panda','hedgehog','peacock','parrot','eagle','wolf','deer','goat','donkey','snake','crocodile','butterfly','dolphin','whale','shark','octopus'],
    fruit:['apple','banana','pear','watermelon','strawberry','pineapple','cherry','mango','kiwi','lemon'],
    vegetable:['carrot','potato','onion'],
    vehicle:['car','bus','bicycle','airplane','train','boat','helicopter','motorcycle','submarine','ambulance','tractor','van','truck','ship','taxi','sailboat','firetruck','jet','jeep','kayak','rocket'],
    toy:['doll','robot','puzzle','kite','dollhouse'],
    clothes:['hat','shirt','dress','jacket','scarf','sweater','belt','tie','hoodie','raincoat','vest','cap'],
    home:['bed','chair','lamp','sofa','armchair','bathtub','pillow','mirror','clock','bookshelf','fireplace','curtain','kettle','toaster','fridge','iron','fan','door','window'],
    school:['book','pen','ruler','pencil','eraser','notebook','calculator','globe','microscope','stapler','paintbrush','folder'],
    food:['egg','pizza','sandwich','cookie','cake','donut','muffin','pancake','pretzel','burger','sausage','pie']
  },
  // "A cat is an animal." — level 2 uses only these groups (each a plain category noun)
  KINDS:['animal','fruit','vegetable','vehicle','toy'],
  SIMILAR:[
    ['horse','donkey','zebra'],['sheep','goat','deer'],['wolf','fox','dog'],['lion','tiger','cat'],['eagle','owl','parrot','peacock'],
    ['bear','panda','koala'],['gorilla','monkey'],['dolphin','whale','shark'],['crocodile','snake'],['hippo','elephant'],
    ['apple','pear'],['cherry','strawberry'],['mango','kiwi','lemon'],['watermelon','pineapple'],['potato','onion'],
    ['car','taxi','jeep','van'],['van','truck','firetruck','ambulance','bus'],['tractor','truck'],['airplane','jet','rocket','helicopter'],
    ['boat','ship','sailboat','kayak','submarine'],['motorcycle','bicycle'],['train','bus'],
    ['doll','dollhouse'],
    ['hat','cap'],['shirt','sweater','jacket','hoodie','raincoat','vest','dress'],['scarf','tie','belt'],
    ['sofa','armchair','chair','bed'],['bed','pillow'],['mirror','window','door'],['fireplace','toaster','kettle','fridge'],['lamp','fan'],['clock','globe'],
    ['book','notebook','folder'],['pen','pencil','paintbrush'],['ruler','eraser','stapler','calculator'],
    ['cookie','cake','muffin','donut','pie','pancake'],['burger','sandwich','pizza'],['sausage','pretzel']
  ]
};
