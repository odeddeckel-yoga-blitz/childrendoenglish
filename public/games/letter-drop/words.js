/* Letter Drop — words per level (shared by game.js and e2e/letter-drop.spec.js). Ids of src/data/words.js with a photo
   (/images/<id>.webp) whose subject is clear on its own, and a Piper clip (/audio/<id>.mp3). No body parts, nothing from
   the removed-words list. Level 1 = 3 letters, level 2 = 4, level 3 = 5.
   Left out on purpose: eye / ear (body parts), ship (boat is in), star (a flat drawing), ring (too small in its photo),
   cab (looks like car), and words whose photo needs its caption. */
window.LD_WORDS={
  LEVELS:[
    ['cat','dog','pig','hen','bee','egg','bed','bus','sun','hat','cup','fox','owl','ant','jam','van','fan','key','car'],
    ['fish','bird','duck','goat','frog','lion','bear','milk','cake','door','lamp','boat','tree','book','ball','moon','kite','doll','drum','nest','corn'],
    ['horse','mouse','snake','tiger','zebra','shark','camel','panda','apple','bread','pizza','lemon','house','chair','clock','train','truck','shirt','spoon','whale','sheep','piano']
  ],
  // letters a child mixes up with this one (decoys), on top of the word's own other letters
  CONFUSE:{a:'eo',b:'dp',c:'oe',d:'bp',e:'ao',f:'t',g:'qy',h:'nb',i:'lj',j:'i',k:'x',l:'it',m:'nw',n:'mhu',o:'ac',p:'bqd',q:'pg',r:'n',s:'z',t:'fl',u:'nv',v:'uw',w:'vm',x:'k',y:'gv',z:'s'}
};
