/* Shopping List — the shelf (shared by game.js and e2e/shopping-list.spec.js). Food words of src/data/words.js with a
   photo (/images/<id>.webp, never a drawn picture: one style per shelf) and a Piper clip (/audio/<id>.mp3).
   Left out on purpose: honey (its photo also shows cookies), sandwich (also bread), water (a splash, no clear
   subject), muffin (looks like cake), and anything a child might name with another shelf word.
   SAME: pictures that could be taken for each other — never on one shelf. */
window.SL_WORDS={
  SHELF:['apple','banana','bread','milk','egg','pizza','carrot','cheese','cake','juice','lemon','tomato','potato','onion',
    'pear','corn','cookie','donut','grapes','mushroom','watermelon','strawberry','pineapple','cherry','rice','soup','kiwi','meat','mango'],
  SAME:[['tomato','cherry'],['pear','mango']]
};
