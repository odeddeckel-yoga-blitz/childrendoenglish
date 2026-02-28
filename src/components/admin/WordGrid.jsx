import { useState, useCallback } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { WORDS, CATEGORIES } from '../../data/words';
import { LEVELS } from '../../data/levels';
import { getImageUrl } from '../../utils/images';
import ImageReplacer from './ImageReplacer';

const LEVEL_COLORS = {
  beginner: 'bg-blue-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-purple-500',
};

// Cache-bust all admin images so replaced ones show immediately
const cacheBuster = `?v=${Date.now()}`;
const adminImageUrl = (word) => getImageUrl(word) + cacheBuster;

export default function WordGrid({ password, onBack }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [brokenImages, setBrokenImages] = useState(new Set());
  const [imageOverrides, setImageOverrides] = useState({});

  const filtered = WORDS.filter(w => {
    const matchesSearch = !search || w.word.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCategory || w.category === selectedCategory;
    const matchesLevel = !selectedLevel || w.level === selectedLevel;
    return matchesSearch && matchesCat && matchesLevel;
  });

  const handleImageError = useCallback((wordId) => {
    setBrokenImages(prev => new Set([...prev, wordId]));
  }, []);

  const handleImageReplaced = useCallback((wordId, imageBase64) => {
    setBrokenImages(prev => {
      const next = new Set(prev);
      next.delete(wordId);
      return next;
    });
    if (imageBase64) {
      setImageOverrides(prev => ({ ...prev, [wordId]: `data:image/webp;base64,${imageBase64}` }));
    }
    setSelectedWord(null);
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back to admin panel">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Image Manager</h2>
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} words</span>
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

      {/* Level filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedLevel(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            !selectedLevel ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All levels
        </button>
        {LEVELS.map(lvl => (
          <button
            key={lvl.id}
            onClick={() => setSelectedLevel(lvl.id === selectedLevel ? null : lvl.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedLevel === lvl.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {lvl.name}
          </button>
        ))}
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

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {filtered.map(word => (
          <button
            key={word.id}
            onClick={() => setSelectedWord(word)}
            className="glass rounded-xl overflow-hidden hover:shadow-md active:scale-95 transition-all"
          >
            <div className={`aspect-square bg-slate-100 relative ${brokenImages.has(word.id) ? 'ring-2 ring-red-500' : ''}`}>
              <img
                src={imageOverrides[word.id] || adminImageUrl(word)}
                alt={word.word}
                className="w-full h-full object-cover"
                loading="lazy"
                width={128}
                height={128}
                onError={() => handleImageError(word.id)}
              />
              <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${LEVEL_COLORS[word.level]}`} />
            </div>
            <p className="text-[10px] font-semibold text-slate-700 p-1.5 text-center truncate">
              {word.word}
            </p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>No words found</p>
        </div>
      )}

      {/* ImageReplacer modal */}
      {selectedWord && (
        <ImageReplacer
          word={selectedWord}
          password={password}
          onClose={() => setSelectedWord(null)}
          onReplaced={handleImageReplaced}
        />
      )}
    </div>
  );
}
