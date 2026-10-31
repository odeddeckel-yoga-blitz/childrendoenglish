// Hebrew topic word pages (src/data/heTopics.js): every word resolves, has
// audio on disk, a sentence that contains it, a distinct gloss in its topic,
// and nothing from the never-re-add list (CLAUDE.md "Removed Words").
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { WORDS } from '../data/words';
import { HE_TOPICS } from '../data/heTopics';
import { heTopicWords } from '../../scripts/build-he-topic-pages.mjs';
import { sentenceUsable } from '../../scripts/build-unit-pages.mjs';

const byId = new Map(WORDS.map((w) => [w.id, w]));
const audio = (en) => path.resolve(import.meta.dirname, '../../public/audio', en.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '.mp3');
const NEVER = ['head', 'nose', 'mouth', 'arm', 'shoulder', 'knee', 'neck', 'back', 'teeth', 'lips', 'leg', 'face', 'toe', 'tongue', 'hair', 'baby', 'cheek', 'belly', 'tummy', 'chin', 'forehead', 'elbow', 'ankle', 'wrist', 'chest', 'hip', 'palm'];

describe('Hebrew topic pages data', () => {
  for (const t of HE_TOPICS) {
    it(`${t.slug}: words resolve, audio exists, sentences usable, glosses distinct`, () => {
      const words = heTopicWords(t, byId);
      expect(words.length).toBeGreaterThanOrEqual(7);
      for (const w of words) {
        expect(w.en && w.he).toBeTruthy();
        expect(fs.existsSync(audio(w.en)), `audio for ${w.en}`).toBe(true);
        expect(sentenceUsable(w), `sentence for ${w.en}: ${w.ex}`).toBe(true);
        expect(NEVER).not.toContain(w.en.toLowerCase());
      }
      expect(new Set(words.map((w) => w.he)).size).toBe(words.length);
      expect(new Set(words.map((w) => w.en.toLowerCase())).size).toBe(words.length);
    });
  }
  it('ABC covers A–Z once each, in order', () => {
    const abc = heTopicWords(HE_TOPICS.find((t) => t.letters), byId);
    expect(abc.map((w) => w.en[0].toUpperCase()).join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });
});
