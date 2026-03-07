import { useEffect, useState } from 'react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];
const PIECE_COUNT = 40;

export default function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) { setPieces([]); return; }
    setPieces(
      Array.from({ length: PIECE_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 6,
        duration: 1.5 + Math.random() * 2,
        delay: Math.random() * 0.5,
      }))
    );
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.5,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
