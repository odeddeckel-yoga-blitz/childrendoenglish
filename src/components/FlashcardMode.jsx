import { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Volume2, RotateCcw, Check, X as XIcon } from 'lucide-react';
import { WORDS } from '../data/words';
import { spacedRepetitionSort, updateWordSR } from '../utils/spaced-repetition';
import { getImageUrl } from '../utils/images';
import { speakWord } from '../utils/sound';
import { haptic } from '../utils/haptic';

export default function FlashcardMode({ stats, onUpdateStats, onBack }) {
  const sorted = spacedRepetitionSort(WORDS, stats.wordProgress || {});
  const [cards] = useState(sorted);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [swipeOverlay, setSwipeOverlay] = useState(null); // 'know' | 'learning' | null
  const [known, setKnown] = useState(0);
  const [learning, setLearning] = useState(0);
  const [finished, setFinished] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const touchStart = useRef({ x: 0, y: 0 });
  const swiping = useRef(false);

  const currentCard = cards[currentIdx];

  const handleKnow = useCallback(() => {
    if (swiping.current || !currentCard) return;
    swiping.current = true;

    setSwipeOverlay('know');
    setKnown(k => k + 1);
    haptic('success');

    // Update SR
    onUpdateStats(prev => ({
      ...prev,
      wordProgress: updateWordSR(prev.wordProgress || {}, currentCard.id, true),
    }));

    setTimeout(() => {
      setSwipeOverlay(null);
      setFlipped(false);
      setImgLoaded(false);
      if (currentIdx + 1 >= cards.length) {
        setFinished(true);
      } else {
        setCurrentIdx(i => i + 1);
      }
      swiping.current = false;
    }, 400);
  }, [currentCard, currentIdx, cards.length, onUpdateStats]);

  const handleLearning = useCallback(() => {
    if (swiping.current || !currentCard) return;
    swiping.current = true;

    setSwipeOverlay('learning');
    setLearning(l => l + 1);
    haptic('error');

    onUpdateStats(prev => ({
      ...prev,
      wordProgress: updateWordSR(prev.wordProgress || {}, currentCard.id, false),
    }));

    setTimeout(() => {
      setSwipeOverlay(null);
      setFlipped(false);
      setImgLoaded(false);
      if (currentIdx + 1 >= cards.length) {
        setFinished(true);
      } else {
        setCurrentIdx(i => i + 1);
      }
      swiping.current = false;
    }, 400);
  }, [currentCard, currentIdx, cards.length, onUpdateStats]);

  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) handleKnow();
      else handleLearning();
    }
  };

  if (finished || cards.length === 0) {
    return (
      <div className="animate-fade-in space-y-6 text-center">
        <div className="glass rounded-3xl p-8 space-y-4">
          <div className="text-6xl">🎴</div>
          <h2 className="text-2xl font-bold text-slate-800">
            {cards.length === 0 ? 'No cards to review!' : 'Session Complete!'}
          </h2>
          {cards.length > 0 && (
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-600">{known}</p>
                <p className="text-xs text-slate-500">Know it</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-amber-600">{learning}</p>
                <p className="text-xs text-slate-500">Still learning</p>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onBack}
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold
                     hover:bg-blue-700 active:scale-95 transition-all"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back to menu">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-sm text-slate-500">{currentIdx + 1} / {cards.length}</span>
        <div className="flex gap-3 text-sm">
          <span className="text-emerald-600 font-semibold">{known} ✓</span>
          <span className="text-amber-600 font-semibold">{learning} ✗</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx) / cards.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        className="flashcard-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`flashcard-inner relative w-full cursor-pointer ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          style={{ minHeight: '380px' }}
        >
          {/* Front */}
          <div className="flashcard-front absolute inset-0">
            <div className="glass rounded-2xl overflow-hidden h-full">
              <div className="aspect-square bg-slate-100 relative">
                {!imgLoaded && <div className="absolute inset-0 skeleton-pulse bg-slate-200" />}
                <img
                  src={getImageUrl(currentCard)}
                  alt=""
                  className={`w-full h-full object-cover transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImgLoaded(true)}
                  width={512}
                  height={512}
                />
                <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/40 text-white text-xs font-semibold capitalize">
                  {currentCard.category}
                </span>
              </div>
              <div className="p-4 text-center">
                <p className="text-slate-400 text-sm">Tap to flip</p>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="flashcard-back absolute inset-0">
            <div className="glass rounded-2xl p-6 h-full flex flex-col justify-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <h3 className="text-3xl font-black text-slate-800">{currentCard.word}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
                  className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                  aria-label="Pronounce word"
                >
                  <Volume2 className="w-5 h-5 text-blue-600" />
                </button>
              </div>
              <p className="text-center text-slate-500 font-mono text-sm">{currentCard.phonetic}</p>
              <p className="text-center text-slate-600">{currentCard.definition}</p>
              <p className="text-center text-sm text-slate-500 italic">"{currentCard.exampleSentence}"</p>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xl text-center font-semibold text-blue-600" dir="rtl">
                  {currentCard.hebrewTranslation}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Swipe overlay */}
        {swipeOverlay && (
          <div className={`absolute inset-0 rounded-2xl flex items-center justify-center text-4xl font-black
                          ${swipeOverlay === 'know' ? 'bg-emerald-400/30 text-emerald-600' : 'bg-amber-400/30 text-amber-600'}`}>
            {swipeOverlay === 'know' ? '✓ Know it!' : '✗ Learning'}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleLearning}
          className="flex-1 py-3 rounded-xl border-2 border-amber-400 text-amber-600 font-semibold
                     hover:bg-amber-50 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <XIcon className="w-5 h-5" /> Still Learning
        </button>
        <button
          onClick={handleKnow}
          className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold
                     hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" /> Know It
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">Swipe right = Know it, Swipe left = Still learning</p>
    </div>
  );
}
