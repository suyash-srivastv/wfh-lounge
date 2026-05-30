import { useMemo } from 'react';

const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF9F1C','#2EC4B6','#F72585'];

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    id: i,
    left:         `${Math.random() * 100}%`,
    duration:     `${2.2 + Math.random() * 2}s`,
    delay:        `${Math.random() * 0.7}s`,
    color:        COLORS[Math.floor(Math.random() * COLORS.length)],
    size:         `${6 + Math.random() * 7}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    skew:         `skewX(${Math.random() * 20 - 10}deg)`,
  })), []);

  return (
    <div className="confetti-wrap">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: p.left,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: p.borderRadius,
          transform: p.skew,
          animationDuration: p.duration,
          animationDelay: p.delay,
        }}/>
      ))}
    </div>
  );
}

export default Confetti;
