import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestsService } from '../services/contestsService';
import { ContestStatusBadge } from '@shared/components/ui/Badge';
import { PageLoader } from '@shared/components/ui/Spinner';
import { formatDateTime, formatDuration } from '@shared/utils/formatters';
import EmptyState from '@shared/components/ui/EmptyState';
import { TrophyIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';

const STATUS_TABS = ['', 'upcoming', 'active', 'ended'];
const STATUS_LABELS = { '': 'All', upcoming: 'Upcoming', active: 'Live', ended: 'Ended' };

export default function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = activeStatus ? { status: activeStatus } : {};
    contestsService.getContests(params)
      .then((data) => setContests(data.results || data || []))
      .catch(() => setContests([]))
      .finally(() => setLoading(false));
  }, [activeStatus]);

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-text-primary text-xl font-bold">Contests</h1>
        <p className="text-text-secondary text-sm mt-0.5">Compete, solve, and climb the leaderboard</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-bg-card border border-border-primary rounded-xl p-1 w-fit">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-4 py-2 text-sm font-mono rounded-lg transition-colors
              ${activeStatus === status
                ? 'bg-brand-blue text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Contest cards */}
      {loading ? (
        <PageLoader />
      ) : contests.length === 0 ? (
        <EmptyState
          icon={TrophyIcon}
          title="No contests found"
          description="Check back later for upcoming contests."
        />
      ) : (
        <div className="grid gap-4">
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContestCard({ contest }) {
  const isActive = contest.status === 'active';
  return (
    <div className={`bg-bg-card border rounded-xl p-5 hover:border-brand-blue/50 transition-all cursor-pointer group
      ${isActive ? 'border-difficulty-easy/50 shadow-lg shadow-green-900/10' : 'border-border-primary'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <ContestStatusBadge status={contest.status} />
            {isActive && (
              <span className="flex items-center gap-1 text-xs text-status-accepted font-mono animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-status-accepted" />
                LIVE NOW
              </span>
            )}
          </div>
          <Link
            to={`/contests/${contest.slug}`}
            className="text-text-primary font-bold text-base hover:text-brand-blue transition-colors group-hover:text-brand-blue"
          >
            {contest.title}
          </Link>
          {contest.description && (
            <p className="text-text-secondary text-sm mt-1 line-clamp-2">{contest.description}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted font-mono">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5" />
              {formatDateTime(contest.start_time)} → {formatDateTime(contest.end_time)}
            </span>
            <span className="flex items-center gap-1.5">
              ⏱ {formatDuration(contest.duration_minutes)}
            </span>
            {contest.max_participants > 0 && (
              <span className="flex items-center gap-1.5">
                <UsersIcon className="w-3.5 h-3.5" />
                Max {contest.max_participants}
              </span>
            )}
          </div>
        </div>

        <Link
          to={`/contests/${contest.slug}`}
          className={`flex-shrink-0 text-xs font-mono px-4 py-2 rounded-lg border transition-colors
            ${isActive
              ? 'bg-difficulty-easy/10 text-status-accepted border-difficulty-easy/40 hover:bg-difficulty-easy/20'
              : 'text-brand-blue border-brand-blue/40 hover:bg-brand-blue/10'
            }`}
        >
          {isActive ? 'ENTER →' : 'VIEW →'}
        </Link>
      </div>
    </div>
  );
}
