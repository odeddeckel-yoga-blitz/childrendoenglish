/* Opposites — interface strings (see ../cde-l10n.js). The English describing words stay English
   ({w} marks where the asked word goes); the question, the feedback and the buttons switch. */
var IC=window.CDE_IC||function(){return '';};
window.CDE_STRINGS={
  en:{sub:'Hot or cold? Big or small? Find the picture, the word and the <b>opposite</b>!',start:IC("play")+' Start',
      level:'Level',of:'of',askWhich:'Which one is {w}?',askWord:'Which word fits the picture?',askOpp:'What is the opposite of {w}?',
      hear:'Hear the word',picture:'Picture',right:IC("check")+' Right!',notQuite:'Not quite:',
      next:'Next '+IC("arrow-right"),levelDone:'Level done!',nextLevel:'Next level '+IC("arrow-right"),retry:IC("rotate-ccw")+' Try this level again',
      allDone:IC("trophy")+' Opposites expert!',allRight:'You got every opposite right!',endSome:'You played all three levels.',
      playAgain:IC("rotate-ccw")+' Play again',tip:'Tip: tap the speaker to hear the word again.'},
  he:{sub:'חם או קר? גדול או קטן? מצאו את התמונה, את המילה ואת <b>ההפך</b>!',start:IC("play")+' מתחילים',
      level:'שלב',of:'מתוך',askWhich:'איזו תמונה היא {w}?',askWord:'איזו מילה מתאימה לתמונה?',askOpp:'מה ההפך של {w}?',
      hear:'לשמוע את המילה',picture:'תמונה',right:IC("check")+' נכון!',notQuite:'לא בדיוק:',
      next:'הבא '+IC("arrow-left"),levelDone:'השלב הושלם!',nextLevel:'לשלב הבא '+IC("arrow-left"),retry:IC("rotate-ccw")+' לנסות את השלב שוב',
      allDone:IC("trophy")+' מומחים להפכים!',allRight:'צדקתם בכל ההפכים!',endSome:'שיחקתם בכל שלושת השלבים.',
      playAgain:IC("rotate-ccw")+' לשחק שוב',tip:'טיפ: הקישו על הרמקול כדי לשמוע שוב את המילה.'},
  es:{sub:'¿Caliente o frío? ¿Grande o pequeño? ¡Encuentra la imagen, la palabra y el <b>contrario</b>!',start:IC("play")+' Empezar',
      level:'Nivel',of:'de',askWhich:'¿Cuál es {w}?',askWord:'¿Qué palabra va con la imagen?',askOpp:'¿Cuál es el contrario de {w}?',
      hear:'Escuchar la palabra',picture:'Imagen',right:IC("check")+' ¡Bien!',notQuite:'Casi:',
      next:'Siguiente '+IC("arrow-right"),levelDone:'¡Nivel completado!',nextLevel:'Siguiente nivel '+IC("arrow-right"),retry:IC("rotate-ccw")+' Repetir este nivel',
      allDone:IC("trophy")+' ¡Experto en contrarios!',allRight:'¡Acertaste todos los contrarios!',endSome:'Jugaste los tres niveles.',
      playAgain:IC("rotate-ccw")+' Jugar otra vez',tip:'Consejo: toca el altavoz para volver a escuchar la palabra.'}
};
