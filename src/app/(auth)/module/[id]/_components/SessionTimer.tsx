'use client';

import { useState, useEffect } from 'react';

export default function SessionTimer({ suggestedMax, startTime }: { suggestedMax?: number; startTime: number }) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startTime) / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const exceeding = suggestedMax != null && mins >= suggestedMax;
  const approaching = suggestedMax != null && !exceeding && mins >= suggestedMax * 0.8;

  return (
    <div className={`flex items-center gap-xs font-sans text-xs tabular-nums transition-colors duration-200 ${
      exceeding ? 'text-amber-400' : approaching ? 'text-text-secondary' : 'text-text-muted'
    }`}>
      <span>⏱</span>
      <span>{mins}:{secs.toString().padStart(2, '0')}</span>
      {suggestedMax != null && (
        <span className="text-text-muted">/ {suggestedMax}m</span>
      )}
    </div>
  );
}
