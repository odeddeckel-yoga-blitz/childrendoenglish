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
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex === (import.meta.env.VITE_ADMIN_HASH || '').trim()) {
        onAuth(password);
      } else {
        setError('Wrong password');
        setPassword('');
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
