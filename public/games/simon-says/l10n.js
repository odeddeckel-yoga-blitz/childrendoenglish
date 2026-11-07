/* Simon Says — interface strings (see ../cde-l10n.js). The English instructions stay English; the question, the
   Stay still button, the feedback and the other buttons switch. */
var IC=window.CDE_IC||function(){return '';};
window.CDE_STRINGS={
  en:{sub:'Listen to Simon and tap the action. If Simon <b>didn’t</b> say it, stay still!',start:IC("play")+' Start',
      level:'Level',of:'of',ask:'Tap the action',askTrap:'Did Simon say it?',askTwo:'Tap both actions, in order',
      hear:'Hear it again',picture:'Picture',still:'Stay still!',right:IC("check")+' Right!',notQuite:'Not quite.',noSimon:'Simon didn’t say it!',
      next:'Next '+IC("arrow-right"),levelDone:'Level done!',nextLevel:'Next level '+IC("arrow-right"),retry:IC("rotate-ccw")+' Try this level again',
      allDone:IC("trophy")+' Great listening!',allRight:'Simon couldn’t trick you!',endSome:'You played all three levels.',
      playAgain:IC("rotate-ccw")+' Play again',tip:'Tip: tap the speaker to hear it again.'},
  he:{sub:'הקשיבו לסיימון והקישו על הפעולה. אם סיימון <b>לא</b> אמר, אל תזוזו!',start:IC("play")+' מתחילים',
      level:'שלב',of:'מתוך',ask:'הקישו על הפעולה',askTrap:'האם סיימון אמר?',askTwo:'הקישו על שתי הפעולות לפי הסדר',
      hear:'לשמוע שוב',picture:'תמונה',still:'לא זזים!',right:IC("check")+' נכון!',notQuite:'לא בדיוק.',noSimon:'סיימון לא אמר!',
      next:'הבא '+IC("arrow-left"),levelDone:'השלב הושלם!',nextLevel:'לשלב הבא '+IC("arrow-left"),retry:IC("rotate-ccw")+' לנסות את השלב שוב',
      allDone:IC("trophy")+' הקשבה מצוינת!',allRight:'סיימון לא הצליח לבלבל אתכם!',endSome:'שיחקתם בכל שלושת השלבים.',
      playAgain:IC("rotate-ccw")+' לשחק שוב',tip:'טיפ: הקישו על הרמקול כדי לשמוע שוב.'},
  es:{sub:'Escucha a Simón y toca la acción. Si Simón <b>no</b> lo dijo, ¡no te muevas!',start:IC("play")+' Empezar',
      level:'Nivel',of:'de',ask:'Toca la acción',askTrap:'¿Lo dijo Simón?',askTwo:'Toca las dos acciones, en orden',
      hear:'Escuchar otra vez',picture:'Imagen',still:'¡Quieto!',right:IC("check")+' ¡Bien!',notQuite:'Casi.',noSimon:'¡Simón no lo dijo!',
      next:'Siguiente '+IC("arrow-right"),levelDone:'¡Nivel completado!',nextLevel:'Siguiente nivel '+IC("arrow-right"),retry:IC("rotate-ccw")+' Repetir este nivel',
      allDone:IC("trophy")+' ¡Muy bien escuchado!',allRight:'¡Simón no pudo engañarte!',endSome:'Jugaste los tres niveles.',
      playAgain:IC("rotate-ccw")+' Jugar otra vez',tip:'Consejo: toca el altavoz para volver a escucharlo.'}
};
