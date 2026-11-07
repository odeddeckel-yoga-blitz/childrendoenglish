/* Feelings — words and level-3 situations (shared by game.js, e2e/feelings.spec.js and scripts/feelings-audio.py).
   Pictures: Microsoft Fluent Emoji 3D faces (MIT), /games/feelings/img/<word>.webp, chosen 11-08 so no two faces read
   alike. Left out on purpose: sleepy (same face as tired), confused (reads as worried), proud (the only face for it wears
   sunglasses = "cool"), calm (reads as happy).
   SITUATIONS: one short sentence per feeling, said by Piper (/games/feelings/audio/<slug>.mp3, whisper-checked).
   `also` = feelings that could fairly fit the same situation too; they are never offered next to it, so a level-3
   round has one defensible answer. */
window.FEEL_DATA={
  WORDS:['happy','sad','angry','scared','surprised','tired','bored','excited','sick','worried','shy','silly','hungry'],
  FACE:{happy:'Grinning face with big eyes',sad:'Crying face',angry:'Angry face',scared:'Fearful face',surprised:'Astonished face',
    tired:'Sleepy face',bored:'Unamused face',excited:'Partying face',sick:'Face with thermometer',worried:'Worried face',
    shy:'Flushed face',silly:'Zany face',hungry:'Face savoring food'},
  SITUATIONS:[
    {feel:'happy',    text:'I got a new puppy!',                        also:['excited','surprised']},
    {feel:'sad',      text:'My ice cream fell on the floor.',           also:['angry','surprised']},
    {feel:'angry',    text:'My brother broke my toy on purpose.',       also:['sad']},
    {feel:'scared',   text:'There is a monster under my bed!',          also:['worried','surprised']},
    {feel:'surprised',text:'Wow, it is snowing in summer!',             also:['excited','happy','silly']},
    {feel:'tired',    text:'I played football all day.',                also:['hungry','happy']},
    {feel:'bored',    text:'There is nothing to do today.',             also:['sad','tired']},
    {feel:'excited',  text:'Tomorrow is my birthday party!',            also:['happy']},
    {feel:'sick',     text:'I have a fever and a cough.',               also:['tired','sad']},
    {feel:'worried',  text:'I cannot find my mom in the shop.',        also:['scared','sad']},
    {feel:'shy',      text:'I am new in class and I do not know anyone.',also:['worried','scared','sad']},
    {feel:'silly',    text:'I am wearing my shoes on my hands!',        also:['happy','surprised']},
    {feel:'hungry',   text:'I did not eat breakfast or lunch.',         also:['tired','sad','sick']}
  ]
};
