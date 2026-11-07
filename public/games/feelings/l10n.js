/* Feelings — interface strings (see ../cde-l10n.js). The English feeling words and stories stay English
   ({w} marks where the asked word goes); the questions, the feedback and the buttons switch. */
var IC=window.CDE_IC||function(){return '';};
window.CDE_STRINGS={
  en:{sub:'Happy, sad, scared or excited? Find the face, the word and <b>how they feel</b>!',start:IC("play")+' Start',
      level:'Level',of:'of',askFace:'Which face is {w}?',askWord:'How does this face feel?',askStory:'How do they feel?',
      hear:'Hear the word',hearSit:'Hear the story',face:'Face',right:IC("check")+' Right!',notQuite:'Not quite. It is',
      next:'Next '+IC("arrow-right"),levelDone:'Level done!',nextLevel:'Next level '+IC("arrow-right"),retry:IC("rotate-ccw")+' Try this level again',
      allDone:IC("trophy")+' Feelings expert!',allRight:'You got every feeling right!',endSome:'You played all three levels.',
      playAgain:IC("rotate-ccw")+' Play again',tip:'Tip: tap the speaker to hear the word again.'},
  he:{sub:'שמחים, עצובים, מפוחדים או נרגשים? מצאו את הפרצוף, את המילה <b>ואיך מרגישים</b>!',start:IC("play")+' מתחילים',
      level:'שלב',of:'מתוך',askFace:'איזה פרצוף הוא {w}?',askWord:'איך מרגיש הפרצוף הזה?',askStory:'איך הם מרגישים?',
      hear:'לשמוע את המילה',hearSit:'לשמוע את הסיפור',face:'פרצוף',right:IC("check")+' נכון!',notQuite:'לא בדיוק. זה',
      next:'הבא '+IC("arrow-left"),levelDone:'השלב הושלם!',nextLevel:'לשלב הבא '+IC("arrow-left"),retry:IC("rotate-ccw")+' לנסות את השלב שוב',
      allDone:IC("trophy")+' מומחים לרגשות!',allRight:'צדקתם בכל הרגשות!',endSome:'שיחקתם בכל שלושת השלבים.',
      playAgain:IC("rotate-ccw")+' לשחק שוב',tip:'טיפ: הקישו על הרמקול כדי לשמוע שוב את המילה.'},
  es:{sub:'¿Contento, triste, asustado o emocionado? ¡Encuentra la cara, la palabra y <b>cómo se sienten</b>!',start:IC("play")+' Empezar',
      level:'Nivel',of:'de',askFace:'¿Qué cara es {w}?',askWord:'¿Cómo se siente esta cara?',askStory:'¿Cómo se sienten?',
      hear:'Escuchar la palabra',hearSit:'Escuchar la historia',face:'Cara',right:IC("check")+' ¡Bien!',notQuite:'Casi. Es',
      next:'Siguiente '+IC("arrow-right"),levelDone:'¡Nivel completado!',nextLevel:'Siguiente nivel '+IC("arrow-right"),retry:IC("rotate-ccw")+' Repetir este nivel',
      allDone:IC("trophy")+' ¡Experto en emociones!',allRight:'¡Acertaste todas las emociones!',endSome:'Jugaste los tres niveles.',
      playAgain:IC("rotate-ccw")+' Jugar otra vez',tip:'Consejo: toca el altavoz para volver a escuchar la palabra.'}
};
