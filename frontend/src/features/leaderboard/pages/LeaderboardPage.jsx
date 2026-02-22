import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardService } from '../services/leaderboardService';
import { battlesService } from '@features/battles/services/battlesService';
import { PageLoader } from '@shared/components/ui/Spinner';
import { formatNumber } from '@shared/utils/formatters';
import EmptyState from '@shared/components/ui/EmptyState';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

/* ── Challenge Modal ─────────────────────────────────────── */
function ChallengeModal({ target, onClose }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      console.log('[ChallengeModal] Sending request to:', target.username);
      await battlesService.sendRequest(target.username, difficulty);
      toast.success(`Challenge sent to ${target.username}!`);
      onClose();
    } catch (err) {
      console.error('[ChallengeModal] sendRequest error:', err?.response?.data);
      const errData = err?.response?.data?.error;
      // errData.message may be a string or an object (serializer errors dict)
      let msg = 'Failed to send challenge.';
      if (errData?.message) {
        msg = typeof errData.message === 'string'
          ? errData.message
          : Object.values(errData.message).flat().join(' ');
      }
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-bg-card border border-border-primary rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
        <div>
          <h3 className="text-text-primary font-bold text-base">⚔️ Challenge {target.username}</h3>
          <p className="text-text-muted text-sm mt-1">Choose difficulty for the 5 problems.</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors capitalize
                ${difficulty === d
                  ? { easy: 'bg-green-900/30 border-green-600 text-green-400', medium: 'bg-yellow-900/30 border-yellow-600 text-yellow-400', hard: 'bg-red-900/30 border-red-600 text-red-400' }[d]
                  : 'border-border-primary text-text-secondary hover:bg-bg-hover'}`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border-primary text-text-secondary hover:bg-bg-tertiary text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending} className="flex-1 px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/80 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {sending ? 'Sending…' : 'Send Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useSelector((s) => s.auth);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [challengeTarget, setChallengeTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    leaderboardService.getGlobalLeaderboard({ page, page_size: 50 })
      .then((data) => {
        setEntries(data.results || data || []);
        setCount(data.count || 0);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Challenge Modal */}
      {challengeTarget && (
        <ChallengeModal target={challengeTarget} onClose={() => setChallengeTarget(null)} />
      )}
      {/* Header */}
      <div>
        <h1 className="text-text-primary text-xl font-bold">Global Leaderboard</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          {formatNumber(count)} coders ranked worldwide
        </p>
      </div>

      {/* Top 3 podium */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-2">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            if (!entry) return null;
            const rank = [2, 1, 3][i];
            const heights = ['h-20', 'h-28', 'h-16'];
            const colors = ['bg-gray-400', 'bg-yellow-400', 'bg-orange-400'];
            const emojis = ['🥈', '🥇', '🥉'];
            return (
              <div key={entry.id} className="flex flex-col items-center gap-2">
                <div className="text-2xl">{emojis[i]}</div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-accent-purple flex items-center justify-center text-white font-bold text-sm">
                  {entry.username?.[0]?.toUpperCase()}
                </div>
                <Link to={`/profile/${entry.username}`} className="text-text-primary text-xs font-semibold hover:text-brand-blue transition-colors text-center">
                  {entry.username}
                </Link>
                <p className="text-text-muted text-xs font-mono">{formatNumber(entry.rating || 0)} pts</p>
                <div className={`w-full ${heights[i]} ${colors[i]}/20 rounded-t-lg border border-t border-x ${colors[i]}/30`} />
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border-primary text-text-muted text-xs font-mono uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">User</div>
          <div className="col-span-2 text-center">Problems</div>
          <div className="col-span-2 text-center">Contests</div>
          <div className="col-span-2 text-right">Rating</div>
          <div className="col-span-2 text-right">Battle</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><PageLoader /></div>
        ) : entries.length === 0 ? (
          <EmptyState icon={ChartBarIcon} title="No rankings yet" description="Start solving problems to appear on the leaderboard!" />
        ) : (
          <div className="divide-y divide-border-secondary">
            {entries.map((entry, idx) => {
              const rank = (page - 1) * 50 + idx + 1;
              const isMe = entry.user?.id === user?.id || entry.id === user?.id;
              const u = entry.user || entry;
              return (
                <div
                  key={entry.id || u.id}
                  className={`grid grid-cols-12 gap-3 px-5 py-3.5 transition-colors
                    ${isMe ? 'bg-brand-blue/5 border-l-2 border-l-brand-blue' : 'hover:bg-bg-hover'}`}
                >
                  <div className="col-span-1 self-center">
                    {rank <= 3 ? (
                      <span className="text-base">{['🥇', '🥈', '🥉'][rank - 1]}</span>
                    ) : (
                      <span className="text-text-muted font-mono text-sm">#{rank}</span>
                    )}
                  </div>
                  <div className="col-span-3 self-center flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-accent-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link to={`/profile/${u.username}`} className="text-text-primary hover:text-brand-blue text-sm font-medium transition-colors truncate block">
                        {u.username}
                      </Link>
                      {isMe && <span className="text-[10px] text-brand-blue font-mono">(you)</span>}
                    </div>
                  </div>
                  <div className="col-span-2 self-center text-center text-text-secondary text-sm font-mono">
                    {formatNumber(u.problems_solved || entry.problems_solved || 0)}
                  </div>
                  <div className="col-span-2 self-center text-center text-text-secondary text-sm font-mono">
                    {formatNumber(u.contests_participated || 0)}
                  </div>
                  <div className="col-span-2 self-center text-right">
                    <span className="text-brand-blue font-bold font-mono text-sm">
                      {formatNumber(u.rating || entry.score || 0)}
                    </span>
                  </div>
                  <div className="col-span-2 self-center text-right">
                    {!isMe && (
                      <button
                        onClick={() => setChallengeTarget({ username: u.username })}
                        className="px-2.5 py-1 text-[11px] font-semibold border border-brand-blue/50 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors"
                      >
                        ⚔️ Battle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(count / 50) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm font-mono text-text-secondary border border-border-primary hover:border-brand-blue rounded-lg transition-colors disabled:opacity-40">← Prev</button>
          <span className="text-text-muted text-sm font-mono">{page} / {Math.ceil(count / 50)}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(count / 50)}
            className="px-3 py-1.5 text-sm font-mono text-text-secondary border border-border-primary hover:border-brand-blue rounded-lg transition-colors disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
