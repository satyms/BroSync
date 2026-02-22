import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contestsService } from '../services/contestsService';
import { ContestStatusBadge, DifficultyBadge } from '@shared/components/ui/Badge';
import { PageLoader, Spinner } from '@shared/components/ui/Spinner';
import { formatDateTime, formatDuration, formatNumber, ordinal } from '@shared/utils/formatters';
import { ClockIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';
import ContestTimer from '../components/ContestTimer';
import { useSelector } from 'react-redux';

export default function ContestDetailPage() {
  const { slug } = useParams();
  const { user } = useSelector((s) => s.auth);
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('problems');

  useEffect(() => {
    contestsService.getContest(slug)
      .then(setContest)
      .catch(() => toast.error('Contest not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const fetchLeaderboard = useCallback(() => {
    contestsService.getLeaderboard(slug)
      .then((data) => setLeaderboard(data.results || data || []))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [activeTab, fetchLeaderboard]);

  const handleJoin = async () => {
    setJoining(true);
    // For private contests, prompt for join code
    let body = {};
    if (contest.visibility === 'private') {
      const code = window.prompt('This is a private contest. Enter the join code:');
      if (!code) { setJoining(false); return; }
      body = { join_code: code };
    }
    try {
      await contestsService.joinContest(slug, body);
      toast.success('You have joined the contest!');
      setContest((c) => ({ ...c, user_joined: true }));
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to join contest');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!contest) return (
    <div className="text-center py-20 text-text-muted">
      Contest not found. <Link to="/contests" className="text-brand-blue">Back</Link>
    </div>
  );

  const problems = contest.problems || [];
  const isActive = contest.status === 'active';

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* ── Contest Header ─────────────────────────────── */}
      <div className={`bg-bg-card border rounded-2xl p-6 ${isActive ? 'border-difficulty-easy/40' : 'border-border-primary'}`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ContestStatusBadge status={contest.status} />
            </div>
            <h1 className="text-text-primary text-2xl font-bold mb-2">{contest.title}</h1>
            <p className="text-text-secondary text-sm">{contest.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-text-muted font-mono">
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5" />
                {formatDateTime(contest.start_time)} — {formatDateTime(contest.end_time)}
              </span>
              <span>Duration: {formatDuration(contest.duration_minutes)}</span>
              <span>Penalty: {contest.penalty_time_minutes} min / wrong answer</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {isActive && <ContestTimer endTime={contest.end_time} />}
            {isActive && !contest.user_joined && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex items-center gap-2 bg-status-accepted/20 hover:bg-status-accepted/30 text-status-accepted border border-status-accepted/40 text-sm font-mono px-5 py-2.5 rounded-lg transition-colors"
              >
                {joining ? <Spinner size="sm" /> : <TrophyIcon className="w-4 h-4" />}
                Join Contest
              </button>
            )}
            {contest.user_joined && (
              <span className="text-xs text-status-accepted font-mono">✓ Registered</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border-primary">
        {['problems', 'leaderboard'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-mono capitalize border-b-2 transition-colors -mb-px
              ${activeTab === tab
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Problems tab ─────────────────────────────────── */}
      {activeTab === 'problems' && (
        <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
          {problems.length === 0 ? (
            <div className="text-center py-12 text-text-muted font-mono text-sm">
              No problems yet for this contest.
            </div>
          ) : (
            <div className="divide-y divide-border-secondary">
              {problems.map((cp, idx) => {
                const problem = cp.problem || cp;
                return (
                  <div key={cp.id || problem.id} className="flex items-center justify-between px-5 py-4 hover:bg-bg-hover transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-text-muted font-mono text-sm w-6">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div>
                        <Link
                          to={`/contests/${slug}/problems/${problem.slug}`}
                          className="text-text-primary hover:text-brand-blue font-medium transition-colors"
                        >
                          {problem.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <DifficultyBadge difficulty={problem.difficulty} />
                          <span className="text-text-muted text-xs font-mono">{cp.points} pts</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/contests/${slug}/problems/${problem.slug}`}
                      className="text-xs text-brand-blue hover:underline font-mono"
                    >
                      Solve →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Leaderboard tab ──────────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <LeaderboardTable entries={leaderboard} currentUserId={user?.id} />
      )}
    </div>
  );
}

function LeaderboardTable({ entries, currentUserId }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted font-mono text-sm bg-bg-card border border-border-primary rounded-xl">
        No participants yet.
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
      <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border-primary text-text-muted text-xs font-mono uppercase tracking-wider">
        <div className="col-span-1">Rank</div>
        <div className="col-span-5">User</div>
        <div className="col-span-2 text-center">Solved</div>
        <div className="col-span-2 text-center">Score</div>
        <div className="col-span-2 text-right">Penalty</div>
      </div>
      <div className="divide-y divide-border-secondary">
        {entries.map((entry) => {
          const isMe = entry.user?.id === currentUserId;
          return (
            <div
              key={entry.id}
              className={`grid grid-cols-12 gap-3 px-5 py-3.5 transition-colors
                ${isMe ? 'bg-brand-blue/5 border-l-2 border-brand-blue' : 'hover:bg-bg-hover'}`}
            >
              <div className="col-span-1 self-center">
                <RankBadge rank={entry.rank} />
              </div>
              <div className="col-span-5 self-center flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-blue to-accent-purple flex items-center justify-center text-white text-xs font-bold">
                  {entry.user?.username?.[0]?.toUpperCase()}
                </div>
                <Link to={`/profile/${entry.user?.username}`} className="text-text-primary hover:text-brand-blue text-sm font-medium transition-colors">
                  {entry.user?.username}
                </Link>
                {isMe && <span className="text-[10px] text-brand-blue font-mono">(you)</span>}
              </div>
              <div className="col-span-2 self-center text-center text-text-secondary text-sm font-mono">{entry.problems_solved}</div>
              <div className="col-span-2 self-center text-center text-text-primary font-bold text-sm font-mono">{formatNumber(entry.score)}</div>
              <div className="col-span-2 self-center text-right text-text-muted text-sm font-mono">{entry.penalty}m</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-yellow-400 font-mono font-bold text-sm">🥇</span>;
  if (rank === 2) return <span className="text-gray-300 font-mono font-bold text-sm">🥈</span>;
  if (rank === 3) return <span className="text-orange-400 font-mono font-bold text-sm">🥉</span>;
  return <span className="text-text-muted font-mono text-sm">#{rank}</span>;
}
