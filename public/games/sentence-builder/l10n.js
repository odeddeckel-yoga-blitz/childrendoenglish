/* Sentence Builder — interface strings (see ../cde-l10n.js). The English word tiles and sentences stay English;
   the question, the feedback and the buttons switch. */
var IC=window.CDE_IC||function(){return '';};
window.CDE_STRINGS={
  en:{sub:'Look at the picture and tap the words <b>in order</b> to build the sentence!',start:IC("play")+' Start',
      level:'Level',of:'of',ask:'Build the sentence about the picture',askExtra:'Build the sentence. One word is extra!',hear:'Hear the sentence',
      right:IC("check")+' Right!',notQuite:'Not quite:',
      next:'Next '+IC("arrow-right"),levelDone:'Level done!',nextLevel:'Next level '+IC("arrow-right"),retry:IC("rotate-ccw")+' Try this level again',
      allDone:IC("trophy")+' Sentence master!',allRight:'You built every sentence right!',endSome:'You played all three levels.',
      playAgain:IC("rotate-ccw")+' Play again',tip:'Tip: tap a word in the sentence to send it back.'},
  he:{sub:'הסתכלו על התמונה והקישו על המילים <b>לפי הסדר</b> כדי לבנות את המשפט!',start:IC("play")+' מתחילים',
      level:'שלב',of:'מתוך',ask:'בנו את המשפט על התמונה',askExtra:'בנו את המשפט. מילה אחת מיותרת!',hear:'לשמוע את המשפט',
      right:IC("check")+' נכון!',notQuite:'לא בדיוק:',
      next:'הבא '+IC("arrow-left"),levelDone:'השלב הושלם!',nextLevel:'לשלב הבא '+IC("arrow-left"),retry:IC("rotate-ccw")+' לנסות את השלב שוב',
      allDone:IC("trophy")+' אלופי המשפטים!',allRight:'בניתם נכון את כל המשפטים!',endSome:'שיחקתם בכל שלושת השלבים.',
      playAgain:IC("rotate-ccw")+' לשחק שוב',tip:'טיפ: הקישו על מילה במשפט כדי להחזיר אותה.'},
  es:{sub:'Mira la imagen y toca las palabras <b>en orden</b> para formar la frase.',start:IC("play")+' Empezar',
      level:'Nivel',of:'de',ask:'Forma la frase sobre la imagen',askExtra:'Forma la frase. ¡Sobra una palabra!',hear:'Escuchar la frase',
      right:IC("check")+' ¡Bien!',notQuite:'Casi:',
      next:'Siguiente '+IC("arrow-right"),levelDone:'¡Nivel completado!',nextLevel:'Siguiente nivel '+IC("arrow-right"),retry:IC("rotate-ccw")+' Repetir este nivel',
      allDone:IC("trophy")+' ¡Maestro de las frases!',allRight:'¡Formaste bien todas las frases!',endSome:'Jugaste los tres niveles.',
      playAgain:IC("rotate-ccw")+' Jugar otra vez',tip:'Consejo: toca una palabra de la frase para devolverla.'}
};
