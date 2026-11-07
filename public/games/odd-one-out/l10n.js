/* Odd One Out — interface strings (see ../cde-l10n.js). The English words under the
   pictures stay English; the question, the reveal and the buttons switch. */
var IC=window.CDE_IC||function(){return '';};
window.CDE_STRINGS={
  en:{sub:'Four pictures. Three go together and <b>one doesn’t belong</b>. Tap the odd one out!',start:IC("play")+' Start',
      level:'Level',of:'of',ask:'Which one doesn’t belong?',hear:'Hear the word',right:IC("check")+' Right!',notQuite:'This one is different:',
      next:'Next '+IC("arrow-right"),levelDone:'Level done!',nextLevel:'Next level '+IC("arrow-right"),retry:IC("rotate-ccw")+' Try this level again',
      allDone:IC("trophy")+' Sharp eyes!',allRight:'You found every odd one out!',endSome:'You played all three levels.',
      playAgain:IC("rotate-ccw")+' Play again',tip:'Tip: tap the speaker to hear a word.'},
  he:{sub:'ארבע תמונות. שלוש שייכות לאותה קבוצה <b>ואחת יוצאת דופן</b>. הקישו על יוצא הדופן!',start:IC("play")+' מתחילים',
      level:'שלב',of:'מתוך',ask:'מה יוצא דופן?',hear:'לשמוע את המילה',right:IC("check")+' נכון!',notQuite:'זה יוצא הדופן:',
      next:'הבא '+IC("arrow-left"),levelDone:'השלב הושלם!',nextLevel:'לשלב הבא '+IC("arrow-left"),retry:IC("rotate-ccw")+' לנסות את השלב שוב',
      allDone:IC("trophy")+' עין חדה!',allRight:'מצאתם את כל יוצאי הדופן!',endSome:'שיחקתם בכל שלושת השלבים.',
      playAgain:IC("rotate-ccw")+' לשחק שוב',tip:'טיפ: הקישו על הרמקול כדי לשמוע מילה.'},
  es:{sub:'Cuatro imágenes. Tres van juntas y <b>una no pertenece al grupo</b>. ¡Toca el intruso!',start:IC("play")+' Empezar',
      level:'Nivel',of:'de',ask:'¿Cuál es el intruso?',hear:'Escuchar la palabra',right:IC("check")+' ¡Bien!',notQuite:'Este es el diferente:',
      next:'Siguiente '+IC("arrow-right"),levelDone:'¡Nivel completado!',nextLevel:'Siguiente nivel '+IC("arrow-right"),retry:IC("rotate-ccw")+' Repetir este nivel',
      allDone:IC("trophy")+' ¡Qué buen ojo!',allRight:'¡Encontraste todos los intrusos!',endSome:'Jugaste los tres niveles.',
      playAgain:IC("rotate-ccw")+' Jugar otra vez',tip:'Consejo: toca el altavoz para escuchar una palabra.'}
};
