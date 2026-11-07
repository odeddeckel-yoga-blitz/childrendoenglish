/* True or False — interface strings (see ../cde-l10n.js). The English sentences stay English;
   the question, the buttons and the feedback switch. */
var IC=window.CDE_IC||function(){return '';};
window.CDE_STRINGS={
  en:{sub:'Look at the picture and read the sentence. Is it <b>true</b> or <b>false</b>?',start:IC("play")+' Start',
      level:'Level',of:'of',ask:'Is the sentence true?',hear:'Hear the sentence',true:'True',false:'False',
      right:IC("check")+' Right!',notQuite:'Not quite.',
      next:'Next '+IC("arrow-right"),levelDone:'Level done!',nextLevel:'Next level '+IC("arrow-right"),retry:IC("rotate-ccw")+' Try this level again',
      allDone:IC("trophy")+' Great reading!',allRight:'You got every sentence right!',endSome:'You played all three levels.',
      playAgain:IC("rotate-ccw")+' Play again',tip:'Tip: tap the speaker to hear the sentence again.'},
  he:{sub:'הסתכלו על התמונה וקראו את המשפט. האם הוא <b>נכון</b> או <b>לא נכון</b>?',start:IC("play")+' מתחילים',
      level:'שלב',of:'מתוך',ask:'האם המשפט נכון?',hear:'לשמוע את המשפט',true:'נכון',false:'לא נכון',
      right:IC("check")+' נכון!',notQuite:'לא בדיוק.',
      next:'הבא '+IC("arrow-left"),levelDone:'השלב הושלם!',nextLevel:'לשלב הבא '+IC("arrow-left"),retry:IC("rotate-ccw")+' לנסות את השלב שוב',
      allDone:IC("trophy")+' קריאה מצוינת!',allRight:'צדקתם בכל המשפטים!',endSome:'שיחקתם בכל שלושת השלבים.',
      playAgain:IC("rotate-ccw")+' לשחק שוב',tip:'טיפ: הקישו על הרמקול כדי לשמוע שוב את המשפט.'},
  es:{sub:'Mira la imagen y lee la frase. ¿Es <b>verdadera</b> o <b>falsa</b>?',start:IC("play")+' Empezar',
      level:'Nivel',of:'de',ask:'¿La frase es verdadera?',hear:'Escuchar la frase',true:'Verdadero',false:'Falso',
      right:IC("check")+' ¡Bien!',notQuite:'Casi.',
      next:'Siguiente '+IC("arrow-right"),levelDone:'¡Nivel completado!',nextLevel:'Siguiente nivel '+IC("arrow-right"),retry:IC("rotate-ccw")+' Repetir este nivel',
      allDone:IC("trophy")+' ¡Muy buena lectura!',allRight:'¡Acertaste todas las frases!',endSome:'Jugaste los tres niveles.',
      playAgain:IC("rotate-ccw")+' Jugar otra vez',tip:'Consejo: toca el altavoz para volver a escuchar la frase.'}
};
