/* Rhyme Time — interface strings (see ../cde-l10n.js). The words, pictures and
   spoken audio stay English; only the chrome switches. {t} {r} {w} = English words. */
var IC=window.CDE_IC||function(){return '';};
window.CDE_STRINGS={
  en:{sub:'Look, listen, and tap the picture that <b>rhymes</b>. Cat rhymes with hat: they end with the same sound.',start:IC("play")+' Start rhyming',
      level:'Level',of:'of',lv1:'short words',lv2:'longer words',lv3:'tricky mix',
      prompt:'Which picture rhymes with it?',again:'Hear it again',hearIt:'Hear this word',right:IC("check")+' It rhymes!',
      tipNo:'{t} and {r} end with the same sound. {w} ends differently.',hearBoth:IC("volume-2")+' Hear both',next:'Next '+IC("arrow-right"),
      levelDone:'Level done!',nextLevel:'Next level '+IC("arrow-right"),retry:IC("rotate-ccw")+' Try this level again',allDone:IC("trophy")+' Rhyme champion!',
      hardest:'The trickiest level for you:',allRight:'You found every rhyme!',playAgain:IC("rotate-ccw")+' Play again'},
  he:{sub:'מסתכלים, מקשיבים ומקישים על התמונה <b>שמתחרזת</b>. <bdi dir="ltr">cat</bdi> מתחרזת עם <bdi dir="ltr">hat</bdi>: הן נגמרות באותו צליל.',start:IC("play")+' מתחילים לחרוז',
      level:'שלב',of:'מתוך',lv1:'מילים קצרות',lv2:'מילים ארוכות יותר',lv3:'ערבוב מאתגר',
      prompt:'איזו תמונה מתחרזת איתה?',again:'לשמוע שוב',hearIt:'לשמוע את המילה',right:IC("check")+' מתחרז!',
      tipNo:'{t} ו-{r} נגמרות באותו צליל. {w} נגמרת אחרת.',hearBoth:IC("volume-2")+' לשמוע את שתיהן',next:'הבא '+IC("arrow-left"),
      levelDone:'השלב הושלם!',nextLevel:'לשלב הבא '+IC("arrow-left"),retry:IC("rotate-ccw")+' לנסות את השלב שוב',allDone:IC("trophy")+' אלופי החרוזים!',
      hardest:'השלב הכי מאתגר בשבילכם:',allRight:'מצאתם את כל החרוזים!',playAgain:IC("rotate-ccw")+' לשחק שוב'},
  es:{sub:'Mira, escucha y toca la imagen que <b>rima</b>. Cat rima con hat: terminan con el mismo sonido.',start:IC("play")+' Empezar a rimar',
      level:'Nivel',of:'de',lv1:'palabras cortas',lv2:'palabras más largas',lv3:'mezcla difícil',
      prompt:'¿Qué imagen rima con ella?',again:'Escuchar otra vez',hearIt:'Escuchar esta palabra',right:IC("check")+' ¡Rima!',
      tipNo:'{t} y {r} terminan con el mismo sonido. {w} termina distinto.',hearBoth:IC("volume-2")+' Escuchar las dos',next:'Siguiente '+IC("arrow-right"),
      levelDone:'¡Nivel completado!',nextLevel:'Siguiente nivel '+IC("arrow-right"),retry:IC("rotate-ccw")+' Repetir este nivel',allDone:IC("trophy")+' ¡Campeón de rimas!',
      hardest:'El nivel más difícil para ti:',allRight:'¡Encontraste todas las rimas!',playAgain:IC("rotate-ccw")+' Jugar otra vez'}
};
