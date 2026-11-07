/* Beginning Sounds — word pool per first letter (shared by game.js and e2e/beginning-sounds.spec.js). Ids of
   src/data/words.js, photos only (one picture style per round) with an audio clip. Chosen 11-08 so the first LETTER
   is also the first SOUND: no ch / sh / th / wh / ph / kn / wr / qu starts, no soft c or g (circle, giraffe), no vowels
   (their sounds vary).
   Left out on purpose: pictures a child may name with another word that starts differently — parrot / goose ("bird",
   "duck"), koala / panda ("bear"), gorilla ("monkey"), jeep / taxi / van ("car"), muffin ("cake"), sofa ("couch"),
   noodles ("pasta"), rooster ("chicken"), rabbit ("bunny"), boat ("ship"), cup ("mug"), kettle ("teapot"), jacket
   ("coat"), computer ("laptop"), notebook ("book"), burger ("hamburger"), gate / fence (each other), kayak ("canoe"),
   wagon ("cart"), flamingo ("bird").
   PARTNER: letters whose sounds learners mix up (voiced / unvoiced, nasal); level 3 puts one partner-letter picture
   in every round. C and K make the same sound here, so they are never in one round. */
window.BS_WORDS={
  LETTERS:{
    b:['bird','bee','banana','bed','bus','book','ball','bear','bucket','button'],
    c:['cat','cow','camel','carrot','cake','car','candle','cookie','corn','camera'],
    d:['dog','dolphin','duck','deer','door','dress','drum','doll','donut','dinosaur'],
    f:['fish','flower','fork','frog','feather','fox','fan','fire'],
    g:['goat','globe','guitar','grapes'],
    h:['horse','hippo','house','helicopter','hat','helmet','hammer','hedgehog'],
    j:['jellyfish','jam','juice'],
    k:['kangaroo','key','kite','kiwi'],
    l:['lemon','lamp','lion','ladder','leaf','lock','lollipop','lizard'],
    m:['mouse','milk','mushroom','mirror','monkey','moon','magnet','mango'],
    n:['nest','nut','net','necklace','nail'],
    p:['penguin','pig','pizza','pineapple','potato','pen','pillow','piano','pear'],
    r:['rocket','rainbow','ruler','rope','ring','radio'],
    s:['snake','sandwich','strawberry','sun','spoon','star','snail','spider','scissors'],
    t:['turtle','tiger','train','tractor','tree','towel','tent','truck','tomato','toaster'],
    v:['volcano','vest','violin'],
    w:['watermelon','window','wolf','worm','watch'],
    z:['zebra','zipper']
  },
  LEVEL_LETTERS:[
    ['b','c','d','f','h','l','m','p','r','s','t'],
    ['b','c','d','f','g','h','j','k','l','m','n','p','r','s','t','v','w','z'],
    ['b','p','d','t','f','v','m','n','g','k','c','s','z']
  ],
  PARTNER:{b:['p'],p:['b'],d:['t'],t:['d'],f:['v'],v:['f'],m:['n'],n:['m'],g:['k','c'],k:['g'],c:['g'],s:['z'],z:['s']},
  SAME_SOUND:[['c','k']]
};
