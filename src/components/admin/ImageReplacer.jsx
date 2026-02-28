import { useState } from 'react';
import { X, Search, Check, Loader2, ExternalLink } from 'lucide-react';
import { getImageUrl } from '../../utils/images';

export default function ImageReplacer({ word, password, onClose, onReplaced }) {
  const [queries, setQueries] = useState(word.word);
  const [candidates, setCandidates] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSearch = async () => {
    const queryList = queries.split('\n').map(q => q.trim()).filter(Boolean);
    if (queryList.length === 0) return;

    setSearching(true);
    setCandidates([]);
    setSelected(null);
    setStatus(null);

    try {
      const res = await fetch('/api/fetch-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ queries: queryList }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setStatus({ type: 'error', message: err.error || `HTTP ${res.status}` });
        return;
      }

      const data = await res.json();
      setCandidates(data.results || []);
      if (!data.results?.length) {
        setStatus({ type: 'error', message: 'No images found. Try different search terms.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSearching(false);
    }
  };

  const handleApply = async () => {
    if (selected === null) return;

    const candidate = candidates[selected];
    setCommitting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/commit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({
          wordId: word.id,
          imageBase64: candidate.imageBase64,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Commit failed' }));
        setStatus({ type: 'error', message: err.error || `HTTP ${res.status}` });
        return;
      }

      const data = await res.json();
      setStatus({
        type: 'success',
        message: `Committed! SHA: ${data.commitSha?.slice(0, 7)}. Site will redeploy shortly.`,
      });

      setTimeout(() => onReplaced(word.id, candidate.imageBase64), 2000);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4 pt-8">
      <div className="glass rounded-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{word.word}</h3>
            <p className="text-xs text-slate-400 capitalize">{word.category} &middot; {word.level}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current image */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Current image</p>
            <div className="w-48 h-48 rounded-xl overflow-hidden bg-slate-100">
              <img
                src={getImageUrl(word) + '?v=' + Date.now()}
                alt={word.word}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Search */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Search queries (one per line, max 3)</p>
            <textarea
              value={queries}
              onChange={e => setQueries(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-white/70 border border-slate-200
                         text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2
                         focus:ring-blue-400 transition-all resize-none font-mono"
              placeholder="e.g. tabby cat face portrait"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !queries.trim()}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white
                         text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {searching ? 'Searching...' : 'Search Wikimedia'}
            </button>
          </div>

          {/* Candidates */}
          {candidates.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Candidates (click to select)</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {candidates.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`flex-shrink-0 rounded-xl overflow-hidden transition-all ${
                      selected === i ? 'ring-3 ring-blue-600 scale-105' : 'ring-1 ring-slate-200 hover:ring-blue-300'
                    }`}
                  >
                    <div className="w-36 h-36 bg-slate-100">
                      <img
                        src={`data:image/webp;base64,${c.imageBase64}`}
                        alt={c.query}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 text-left">
                      <p className="text-[10px] text-slate-500 truncate">{c.query}</p>
                      <p className="text-[10px] text-slate-400">{c.sizeKB} KB</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected preview */}
          {selected !== null && candidates[selected] && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Preview</p>
              <div className="w-64 h-64 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={`data:image/webp;base64,${candidates[selected].imageBase64}`}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              {candidates[selected].sourceUrl && (
                <a
                  href={candidates[selected].sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs text-blue-500 hover:underline"
                >
                  Source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Status */}
          {status && (
            <div className={`p-3 rounded-xl text-sm ${
              status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {status.message}
            </div>
          )}

          {/* Apply button */}
          {selected !== null && status?.type !== 'success' && (
            <button
              onClick={handleApply}
              disabled={committing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white
                         text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {committing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {committing ? 'Committing...' : 'Apply to Repository'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
