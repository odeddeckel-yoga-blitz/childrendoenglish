import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Share2, Check, X, Link, BookOpen, Layers } from 'lucide-react';
import { WORDS, getWordByName } from '../data/words';
import { t } from '../utils/i18n';

export default function PersonalWordList({ lang = 'en', onStartQuiz, onLearn, onFlashcard, onBack, initialWords }) {
  const [words, setWords] = useState(() => initialWords || []);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [copiedMode, setCopiedMode] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedIds = useMemo(() => new Set(words.map(w => w.id)), [words]);

  const suggestions = query.length >= 1
    ? WORDS.filter(w =>
        !selectedIds.has(w.id) &&
        (w.word.toLowerCase().startsWith(query.toLowerCase()) ||
         w.hebrewTranslation?.includes(query))
      ).slice(0, 8)
    : [];

  // Scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  const addWord = useCallback((word) => {
    if (!selectedIds.has(word.id)) {
      setWords(prev => [...prev, word]);
    }
    setQuery('');
    setShowSuggestions(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  }, [selectedIds]);

  const removeWord = useCallback((id) => {
    setWords(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        addWord(suggestions[highlightIndex]);
      } else if (suggestions.length === 1) {
        addWord(suggestions[0]);
      } else {
        // Try exact match
        const exact = getWordByName(query);
        if (exact && !selectedIds.has(exact.id)) {
          addWord(exact);
        }
      }
    } else if (e.key === 'Backspace' && query === '' && words.length > 0) {
      removeWord(words[words.length - 1].id);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightIndex(-1);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
    setHighlightIndex(-1);
  };

  const handleShare = useCallback(async (mode) => {
    const ids = words.map(w => w.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}#quiz/${mode}/${ids}`;

    await navigator.clipboard.writeText(url);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 2000);
  }, [words]);

  const handleShareList = useCallback(async () => {
    const ids = words.map(w => w.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}#words/${ids}`;

    await navigator.clipboard.writeText(url);
    setCopiedMode('list');
    setTimeout(() => setCopiedMode(null), 2000);
  }, [words]);

  const canQuiz = words.length >= 4;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="flex-1 text-xl font-bold text-slate-800">{t('myWordList', lang)}</h2>
        {words.length > 0 && (
          <button
            onClick={handleShareList}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            aria-label={copiedMode === 'list' ? t('linkCopied', lang) : t('shareWordList', lang)}
          >
            {copiedMode === 'list'
              ? <Check className="w-5 h-5 text-emerald-600" />
              : <Link className="w-5 h-5 text-slate-500" />}
          </button>
        )}
      </div>

      {/* Word input with chips */}
      <div className="glass rounded-2xl p-4 space-y-3 relative z-10">
        <label htmlFor="word-input" className="text-sm text-slate-600 block">
          {t('enterWords', lang)}
        </label>

        <div
          className="min-h-[48px] w-full rounded-xl bg-white/70 border border-slate-200 p-2
                     flex flex-wrap gap-1.5 items-center cursor-text
                     focus-within:ring-2 focus-within:ring-blue-400"
          onClick={() => inputRef.current?.focus()}
        >
          {words.map(word => (
            <span
              key={word.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700
                         rounded-lg text-sm font-medium group"
            >
              {word.word}
              <button
                onClick={(e) => { e.stopPropagation(); removeWord(word.id); }}
                className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center
                           opacity-60 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${word.word}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <div className="relative flex-1 min-w-[120px]">
            <input
              ref={inputRef}
              id="word-input"
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={words.length === 0 ? t('wordListPlaceholder', lang) : ''}
              className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-blue-400 rounded py-1 px-1"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-autocomplete="list"
              aria-controls="word-suggestions"
              aria-activedescendant={highlightIndex >= 0 ? `suggestion-${highlightIndex}` : undefined}
            />

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                ref={listRef}
                id="word-suggestions"
                role="listbox"
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg
                           border border-slate-200 max-h-48 overflow-y-auto z-20"
              >
                {suggestions.map((word, i) => (
                  <li
                    key={word.id}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={i === highlightIndex}
                    onMouseDown={(e) => { e.preventDefault(); addWord(word); }}
                    className={`px-3 py-2 flex items-center gap-3 cursor-pointer text-sm
                               ${i === highlightIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <img
                      src={word.imageUrl}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-800">{word.word}</span>
                      {lang === 'he' && word.hebrewTranslation && (
                        <span className="text-slate-400 ms-2">{word.hebrewTranslation}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{word.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {words.length > 0 && words.length < 4 && (
          <p className="text-xs text-amber-600">
            {t('needMinWords', lang)}
          </p>
        )}
      </div>

      {/* Selected words count */}
      {words.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-600">
              {words.length === 1
                ? t('foundWords', lang, { count: words.length })
                : t('foundWordsPlural', lang, { count: words.length })}
            </h3>
            <button
              onClick={() => setWords([])}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {t('clearAll', lang)}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map(word => (
              <span
                key={word.id}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold
                           flex items-center gap-1.5"
              >
                <img src={word.imageUrl} alt="" className="w-5 h-5 rounded object-cover" loading="lazy" />
                {word.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Start quiz */}
      {canQuiz && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => onStartQuiz(words, 'image')}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold
                         hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" /> {t('imageQuizCount', lang, { count: words.length })}
            </button>
            <button
              onClick={() => handleShare('image')}
              className="px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
              aria-label={copiedMode === 'image' ? t('linkCopied', lang) : t('shareImageQuiz', lang)}
            >
              {copiedMode === 'image' ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onStartQuiz(words, 'word')}
              className="flex-1 py-3 glass rounded-xl font-semibold text-blue-600 text-sm
                         hover:shadow-md active:scale-95 transition-all"
            >
              {t('wordQuiz', lang)}
            </button>
            <button
              onClick={() => handleShare('word')}
              className="px-3 glass rounded-xl text-blue-600 hover:shadow-md active:scale-95 transition-all"
              aria-label={copiedMode === 'word' ? t('linkCopied', lang) : t('shareWordQuiz', lang)}
            >
              {copiedMode === 'word' ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Learn & Flashcard */}
      {words.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => onLearn(words)}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold
                       hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" /> {t('learnTheseWords', lang)}
          </button>
          <button
            onClick={() => onFlashcard(words)}
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold
                       hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Layers className="w-5 h-5" /> {t('flashcardTheseWords', lang)}
          </button>
        </div>
      )}
    </div>
  );
}
