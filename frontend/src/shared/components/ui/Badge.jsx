import { DIFFICULTY } from '@shared/utils/constants';

const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold';

/**
 * DifficultyBadge - Colored badge for problem difficulty.
 */
export function DifficultyBadge({ difficulty }) {
  const cfg = DIFFICULTY[difficulty] || DIFFICULTY.easy;
  return (
    <span className={`${baseClasses} ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

/**
 * StatusBadge - Colored badge for submission status.
 */
export function StatusBadge({ status }) {
  const statusMap = {
    accepted: 'bg-green-900/30 text-status-accepted border-status-accepted',
    wrong_answer: 'bg-red-900/30 text-status-wrong_answer border-status-wrong_answer',
    pending: 'bg-gray-900/30 text-text-secondary border-border-primary',
    running: 'bg-blue-900/30 text-brand-blue border-brand-blue',
    time_limit: 'bg-yellow-900/30 text-status-time_limit border-status-time_limit',
    memory_limit: 'bg-orange-900/30 text-orange-400 border-orange-600',
    runtime_error: 'bg-purple-900/30 text-status-runtime_error border-status-runtime_error',
    compilation_error: 'bg-orange-900/30 text-status-compilation_error border-orange-600',
    internal_error: 'bg-red-900/30 text-red-500 border-red-700',
  };

  const labelMap = {
    accepted: 'Accepted',
    wrong_answer: 'Wrong Answer',
    pending: 'Pending',
    running: 'Running',
    time_limit: 'TLE',
    memory_limit: 'MLE',
    runtime_error: 'Runtime Error',
    compilation_error: 'Compile Error',
    internal_error: 'Internal Error',
  };

  const classes = statusMap[status] || statusMap.pending;
  return (
    <span className={`${baseClasses} border ${classes}`}>
      {labelMap[status] || status}
    </span>
  );
}

/**
 * ContestStatusBadge
 */
export function ContestStatusBadge({ status }) {
  const map = {
    draft: 'bg-gray-900/30 text-text-secondary border-border-primary',
    upcoming: 'bg-blue-900/30 text-brand-blue border-brand-blue',
    active: 'bg-green-900/30 text-status-accepted border-status-accepted',
    ended: 'bg-gray-900/50 text-text-muted border-border-secondary',
  };
  const labels = { draft: 'Draft', upcoming: 'Upcoming', active: '● LIVE', ended: 'Ended' };
  return (
    <span className={`${baseClasses} border ${map[status] || map.draft}`}>
      {labels[status] || status}
    </span>
  );
}
