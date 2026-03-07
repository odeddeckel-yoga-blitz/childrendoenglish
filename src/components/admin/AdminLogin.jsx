import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

export default function AdminLogin({ onAuth }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setChecking(true);

    try {
      const res = await fetch('/api/fetch-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ queries: [] }),
      });

      if (res.status === 401) {
        setError('Wrong password');
        setPassword('');
      } else {
        // Any non-401 response (including 400 for empty queries) means auth passed
        onAuth(password);
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="glass rounded-2xl p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Admin Access</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="admin-password" className="sr-only">Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-3 rounded-xl bg-white/70 border border-slate-200
                       text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2
                       focus:ring-blue-400 transition-all"
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!password || checking}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       bg-blue-600 text-white font-semibold hover:bg-blue-700
                       disabled:opacity-50 transition-colors"
          >
            {checking ? 'Checking...' : 'Sign In'}
            {!checking && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
