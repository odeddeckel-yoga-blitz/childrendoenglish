import { useState } from 'react';
import AdminLogin from './AdminLogin';
import WordGrid from './WordGrid';

export default function AdminPanel({ onExit }) {
  const [password, setPassword] = useState(null);

  if (!password) {
    return (
      <div>
        <AdminLogin onAuth={setPassword} />
        <button
          onClick={onExit}
          className="mt-4 mx-auto block text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Back to app
        </button>
      </div>
    );
  }

  return <WordGrid password={password} onBack={onExit} />;
}
