// Chant cards — PILOT of 3 (audit 11-18 idea 13, owner OK 11-18): short rhythmic read-along lines, written for CDE
// (original text, our own vocabulary). Each line is 4 beats; `beats` splits it into the 4 groups that light up on
// the beat. Audio: one Piper clip per line (/audio/s/<sha1-10>.mp3, scripts/chant-audio.py, whisper-checked).
// Never call these songs, and never claim a human voice: it is a computer voice reading on a beat.
export const CHANTS = [
  {
    slug: 'days-of-the-week', title: 'Days of the Week', what: 'the seven days, with an action on each line',
    lines: [
      ['Monday,', 'Tuesday,', 'clap, clap,', 'clap!'],
      ['Wednesday,', 'Thursday,', 'tap, tap,', 'tap!'],
      ['Friday,', 'Saturday,', 'jump up', 'high!'],
      ['Sunday,', 'Sunday,', 'wave', 'goodbye!'],
    ],
  },
  {
    slug: 'colors-all-around', title: 'Colors All Around', what: 'five colors and the things that have them',
    lines: [
      ['Red like', 'an apple,', 'red, red,', 'red!'],
      ['Blue like', 'the sky', 'over my', 'head!'],
      ['Green like', 'a leaf,', 'yellow like', 'the sun!'],
      ['Colors,', 'colors,', 'one by', 'one!'],
    ],
  },
  {
    slug: 'count-with-me', title: 'Count With Me', what: 'the numbers one to ten',
    lines: [
      ['One,', 'two,', 'three,', 'count with me!'],
      ['Four,', 'five,', 'six,', 'kick, kick, kick!'],
      ['Seven,', 'eight,', 'nine,', 'stand in line!'],
      ['Ten,', 'ten,', "let's count", 'again!'],
    ],
  },
];

// the spoken text of a line (= the sentence-audio key)
export const chantLine = (beats) => beats.join(' ');
