import { useState, useRef } from 'react';
import { ArrowLeft, Search, Grid3X3, BookOpen, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { WORDS, CATEGORIES } from '../data/words';
import { getImageUrl } from '../utils/images';
import { speakWord } from '../utils/sound';

export default function LearnMode({ stats, onBack }) {
  const [view, setView] = useState('grid'); // 'grid' | 'detail'
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailIndex, setDetailIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });

  const filtered = WORDS.filter(w => {
    const matchesSearch = !search || w.word.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCategory || w.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const currentWord = filtered[detailIndex];

  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0 && detailIndex > 0) {
        setDetailIndex(i => i - 1);
        setImgLoaded(false);
      } else if (dx < 0 && detailIndex < filtered.length - 1) {
        setDetailIndex(i => i + 1);
        setImgLoaded(false);
      }
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back to menu">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">Learn Words</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
            aria-label="Grid view"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView('detail')}
            className={`p-2 rounded-lg transition-colors ${view === 'detail' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
            aria-label="Detail view"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search words..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 border border-slate-200
                     text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2
                     focus:ring-blue-400 transition-all"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            !selectedCategory ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
              selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((word, i) => (
            <button
              key={word.id}
              onClick={() => { setDetailIndex(i); setView('detail'); setImgLoaded(false); }}
              className="glass rounded-xl overflow-hidden hover:shadow-md active:scale-95 transition-all"
            >
              <div className="aspect-square bg-slate-100 relative">
                <img
                  src={getImageUrl(word)}
                  alt={word.word}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={170}
                  height={170}
                />
              </div>
              <p className="text-xs font-semibold text-slate-700 p-2 text-center truncate">
                {word.word}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Detail view */}
      {view === 'detail' && currentWord && (
        <div
          className="space-y-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setDetailIndex(i => Math.max(0, i - 1)); setImgLoaded(false); }}
              disabled={detailIndex === 0}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
              aria-label="Previous word"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm text-slate-500">{detailIndex + 1} / {filtered.length}</span>
            <button
              onClick={() => { setDetailIndex(i => Math.min(filtered.length - 1, i + 1)); setImgLoaded(false); }}
              disabled={detailIndex === filtered.length - 1}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors"
              aria-label="Next word"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Card */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="aspect-square bg-slate-100 relative">
              {!imgLoaded && <div className="absolute inset-0 skeleton-pulse bg-slate-200" />}
              <img
                src={getImageUrl(currentWord)}
                alt={currentWord.word}
                className={`w-full h-full object-cover transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                width={512}
                height={512}
              />
              <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/40 text-white text-xs font-semibold capitalize">
                {currentWord.category}
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800">{currentWord.word}</h3>
                <button
                  onClick={() => speakWord(currentWord.word)}
                  className="p-2.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                  aria-label="Pronounce word"
                >
                  <Volume2 className="w-5 h-5 text-blue-600" />
                </button>
              </div>
              <p className="text-sm text-slate-500 font-mono">{currentWord.phonetic}</p>
              <p className="text-slate-600">{currentWord.definition}</p>
              <p className="text-sm text-slate-500 italic">"{currentWord.exampleSentence}"</p>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-lg text-right font-semibold text-blue-600" dir="rtl">
                  {currentWord.hebrewTranslation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>No words found</p>
        </div>
      )}
    </div>
  );
}
