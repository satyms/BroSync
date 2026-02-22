/**
 * BattleTimer
 * ============
 * Displays the countdown clock for a live battle.
 * Color shifts: green → amber → red as time runs down.
 */

export default function BattleTimer({ secondsLeft }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const color =
    secondsLeft > 10 * 60
      ? 'text-green-400'
      : secondsLeft > 3 * 60
      ? 'text-amber-400'
      : 'text-red-400 animate-pulse';

  return (
    <div className="flex items-center gap-2">
      <svg className={`w-4 h-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`font-mono text-lg font-bold tabular-nums ${color}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}
