/* Simon Says — actions and level-3 pairs (shared by game.js, e2e/simon-says.spec.js and scripts/simon-says-audio.py).
   Pictures: Microsoft Fluent Emoji 3D (MIT), /games/simon-says/img/<id>.webp, picked 11-08 for clear actions (bow,
   kneel and stand were left out: tiny or unclear figures). SIMILAR actions never share a round.
   Clips (Piper, whisper-checked, /games/simon-says/audio/<slug>.mp3): "Simon says, clap your hands!" and the trap
   "Clap your hands!" for every action, and level 3's fixed pairs: SAYS_PAIRS with "Simon says", TRAP_PAIRS without. */
window.SIMON_DATA={
  ACTIONS:{
   "clap": {
    "say": "clap your hands",
    "icon": "Clapping hands"
   },
   "wave": {
    "say": "wave",
    "icon": "Waving hand"
   },
   "run": {
    "say": "run",
    "icon": "Person running"
   },
   "walk": {
    "say": "walk",
    "icon": "Person walking"
   },
   "swim": {
    "say": "swim",
    "icon": "Person swimming"
   },
   "dance": {
    "say": "dance",
    "icon": "Woman dancing"
   },
   "climb": {
    "say": "climb",
    "icon": "Person climbing"
   },
   "sleep": {
    "say": "sleep",
    "icon": "Person in bed"
   },
   "laugh": {
    "say": "laugh",
    "icon": "Face with tears of joy"
   },
   "cry": {
    "say": "cry",
    "icon": "Loudly crying face"
   },
   "yawn": {
    "say": "yawn",
    "icon": "Yawning face"
   },
   "wink": {
    "say": "wink",
    "icon": "Winking face"
   },
   "sneeze": {
    "say": "sneeze",
    "icon": "Sneezing face"
   },
   "hug": {
    "say": "hug",
    "icon": "People hugging"
   },
   "write": {
    "say": "write your name",
    "icon": "Writing hand"
   },
   "ride": {
    "say": "ride a bike",
    "icon": "Person biking"
   }
  },
  SIMILAR:[["run", "walk"], ["laugh", "cry"], ["yawn", "sleep"]],
  SAYS_PAIRS:[["clap", "ride"], ["clap", "wave"], ["climb", "cry"], ["climb", "laugh"], ["climb", "run"], ["climb", "sneeze"], ["climb", "swim"], ["cry", "climb"], ["cry", "hug"], ["cry", "walk"], ["dance", "clap"], ["dance", "laugh"], ["dance", "ride"], ["dance", "run"], ["dance", "sleep"], ["laugh", "swim"], ["laugh", "wink"], ["laugh", "yawn"], ["ride", "climb"], ["run", "laugh"], ["run", "sleep"], ["run", "swim"], ["run", "wave"], ["run", "wink"], ["run", "write"], ["sleep", "clap"], ["sleep", "sneeze"], ["sneeze", "swim"], ["swim", "dance"], ["swim", "wave"]],
  TRAP_PAIRS:[["walk", "climb"], ["wave", "cry"], ["wave", "sneeze"], ["wave", "yawn"], ["cry", "wink"], ["dance", "wink"], ["ride", "wink"], ["run", "wink"], ["walk", "wink"], ["write", "climb"], ["write", "sneeze"], ["write", "wink"], ["yawn", "climb"], ["yawn", "hug"], ["yawn", "wave"]]
};
