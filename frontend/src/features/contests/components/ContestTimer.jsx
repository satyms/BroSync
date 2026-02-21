import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { parseISO, differenceInSeconds } from 'date-fns';

/**
 * ContestTimer - Live countdown timer for ongoing contests.
 */
export default function ContestTimer({ endTime }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const end = parseISO(endTime);
    const tick = () => setRemaining(Math.max(0, differenceInSeconds(end, new Date())));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  const isUrgent = remaining < 300; // < 5 minutes

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm ${
      isUrgent
        ? 'bg-red-900/20 border-brand-red/40 text-brand-red'
        : 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue'
    }`}>
      <ClockIcon className="w-4 h-4" />
      <span className={`font-bold tracking-widest ${isUrgent ? 'animate-pulse' : ''}`}>
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
      {remaining === 0 && <span className="text-xs ml-1">ENDED</span>}
    </div>
  );
}
