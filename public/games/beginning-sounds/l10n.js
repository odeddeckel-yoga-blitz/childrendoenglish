/* Beginning Sounds — interface strings (see ../cde-l10n.js). The letters and English words stay English
   ({l} marks where the letter goes); the question, the feedback and the buttons switch. */
var IC=window.CDE_IC||function(){return '';};
window.CDE_STRINGS={
  en:{sub:'See the letter, hear the words and tap the picture that <b>starts with it</b>!',start:IC("play")+' Start',
      level:'Level',of:'of',ask:'Which one starts with {l}?',hear:'Hear word',picture:'Picture',right:IC("check")+' Right!',notQuite:'Not quite. It is',
      next:'Next '+IC("arrow-right"),levelDone:'Level done!',nextLevel:'Next level '+IC("arrow-right"),retry:IC("rotate-ccw")+' Try this level again',
      allDone:IC("trophy")+' Super listener!',allRight:'You found every first letter!',endSome:'You played all three levels.',
      playAgain:IC("rotate-ccw")+' Play again',tip:'Tip: tap a speaker to hear the word.'},
  he:{sub:'ראו את האות, שמעו את המילים והקישו על התמונה <b>שמתחילה בה</b>!',start:IC("play")+' מתחילים',
      level:'שלב',of:'מתוך',ask:'מה מתחיל באות {l}?',hear:'לשמוע מילה',picture:'תמונה',right:IC("check")+' נכון!',notQuite:'לא בדיוק. זה',
      next:'הבא '+IC("arrow-left"),levelDone:'השלב הושלם!',nextLevel:'לשלב הבא '+IC("arrow-left"),retry:IC("rotate-ccw")+' לנסות את השלב שוב',
      allDone:IC("trophy")+' אוזן מצוינת!',allRight:'מצאתם את כל האותיות הראשונות!',endSome:'שיחקתם בכל שלושת השלבים.',
      playAgain:IC("rotate-ccw")+' לשחק שוב',tip:'טיפ: הקישו על רמקול כדי לשמוע את המילה.'},
  es:{sub:'Mira la letra, escucha las palabras y toca la imagen que <b>empieza por ella</b>.',start:IC("play")+' Empezar',
      level:'Nivel',of:'de',ask:'¿Cuál empieza por {l}?',hear:'Escuchar palabra',picture:'Imagen',right:IC("check")+' ¡Bien!',notQuite:'Casi. Es',
      next:'Siguiente '+IC("arrow-right"),levelDone:'¡Nivel completado!',nextLevel:'Siguiente nivel '+IC("arrow-right"),retry:IC("rotate-ccw")+' Repetir este nivel',
      allDone:IC("trophy")+' ¡Muy buen oído!',allRight:'¡Encontraste todas las primeras letras!',endSome:'Jugaste los tres niveles.',
      playAgain:IC("rotate-ccw")+' Jugar otra vez',tip:'Consejo: toca un altavoz para escuchar la palabra.'}
};
