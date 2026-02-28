import { useState, useCallback } from 'react';
import { ArrowLeft, Play, AlertCircle, Share2, Check } from 'lucide-react';
import { WORDS, getWordById } from '../data/words';

export default function PersonalWordList({ onStartQuiz, onBack }) {
  const [input, setInput] = useState('');
  const [matched, setMatched] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [parsed, setParsed] = useState(false);
  const [copiedMode, setCopiedMode] = useState(null);

  const handleShare = useCallback(async (mode) => {
    const ids = matched.map(w => w.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}#quiz/${mode}/${ids}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'English Quiz', url });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(url);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 2000);
  }, [matched]);

  const handleParse = () => {
    const words = input
      .split(/[,\n]+/)
      .map(w => w.trim().toLowerCase())
      .filter(Boolean);

    const matchedWords = [];
    const unmatchedWords = [];

    words.forEach(w => {
      const found = WORDS.find(word => word.word.toLowerCase() === w || word.id === w);
      if (found) {
        if (!matchedWords.find(m => m.id === found.id)) {
          matchedWords.push(found);
        }
      } else {
        if (!unmatchedWords.includes(w)) {
          unmatchedWords.push(w);
        }
      }
    });

    setMatched(matchedWords);
    setUnmatched(unmatchedWords);
    setParsed(true);
  };

  const canQuiz = matched.length >= 4; // Need at least 4 for answer options

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back to menu">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">My Word List</h2>
      </div>

      {/* Input */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <label htmlFor="word-list-input" className="text-sm text-slate-600 block">
          Enter or paste your word list (one word per line or comma-separated):
        </label>
        <textarea
          id="word-list-input"
          value={input}
          onChange={e => { setInput(e.target.value); setParsed(false); }}
          placeholder="cat, dog, apple, tree..."
          rows={5}
          className="w-full rounded-xl bg-white/70 border border-slate-200 p-3 text-sm text-slate-700
                     placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
        <button
          onClick={handleParse}
          disabled={!input.trim()}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold
                     hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Find Words
        </button>
      </div>

      {/* Results */}
      {parsed && (
        <>
          {matched.length > 0 && (
            <div className="glass rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-emerald-600">
                Found {matched.length} word{matched.length !== 1 ? 's' : ''}
              </h3>
              <div className="flex flex-wrap gap-2">
                {matched.map(word => (
                  <span
                    key={word.id}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold"
                  >
                    {word.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {unmatched.length > 0 && (
            <div className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm text-slate-500">Not in word bank yet</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {unmatched.map(word => (
                  <span
                    key={word}
                    className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-full text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Start quiz */}
          {canQuiz ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => onStartQuiz(matched, 'image')}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold
                             hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" /> Image Quiz ({matched.length} words)
                </button>
                <button
                  onClick={() => handleShare('image')}
                  className="px-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                  aria-label={copiedMode === 'image' ? 'Link copied' : 'Share image quiz'}
                >
                  {copiedMode === 'image' ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onStartQuiz(matched, 'word')}
                  className="flex-1 py-3 glass rounded-xl font-semibold text-blue-600 text-sm
                             hover:shadow-md active:scale-95 transition-all"
                >
                  Word Quiz
                </button>
                <button
                  onClick={() => handleShare('word')}
                  className="px-3 glass rounded-xl text-blue-600 hover:shadow-md active:scale-95 transition-all"
                  aria-label={copiedMode === 'word' ? 'Link copied' : 'Share word quiz'}
                >
                  {copiedMode === 'word' ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ) : parsed && matched.length > 0 && (
            <p className="text-sm text-amber-600 text-center">
              Need at least 4 matching words to start a quiz.
            </p>
          )}

          {parsed && matched.length === 0 && (
            <p className="text-sm text-slate-500 text-center">
              None of those words are in our word bank. Try words like: cat, dog, apple, house, car.
            </p>
          )}
        </>
      )}
    </div>
  );
}
