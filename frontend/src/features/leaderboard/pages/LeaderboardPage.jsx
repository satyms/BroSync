import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardService } from '../services/leaderboardService';
import { PageLoader } from '@shared/components/ui/Spinner';
import { formatNumber } from '@shared/utils/formatters';
import EmptyState from '@shared/components/ui/EmptyState';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';

export default function LeaderboardPage() {
  const { user } = useSelector((s) => s.auth);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

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
              <div key={entry.id || entry.user?.id} className="flex flex-col items-center gap-2">
                <div className="text-2xl">{emojis[i]}</div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-accent-purple flex items-center justify-center text-white font-bold text-sm">
                  {entry.user?.username?.[0]?.toUpperCase()}
                </div>
                <Link to={`/profile/${entry.user?.username}`} className="text-text-primary text-xs font-semibold hover:text-brand-blue transition-colors text-center">
                  {entry.user?.username}
                </Link>
                <p className="text-text-muted text-xs font-mono">{formatNumber(entry.rating || entry.score)} pts</p>
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
          <div className="col-span-4">User</div>
          <div className="col-span-2 text-center">Problems</div>
          <div className="col-span-2 text-center">Contests</div>
          <div className="col-span-3 text-right">Rating</div>
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
                  <div className="col-span-4 self-center flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-accent-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <Link to={`/profile/${u.username}`} className="text-text-primary hover:text-brand-blue text-sm font-medium transition-colors">
                        {u.username}
                      </Link>
                      {isMe && <span className="text-[10px] text-brand-blue font-mono ml-1">(you)</span>}
                    </div>
                  </div>
                  <div className="col-span-2 self-center text-center text-text-secondary text-sm font-mono">
                    {formatNumber(u.problems_solved || entry.problems_solved || 0)}
                  </div>
                  <div className="col-span-2 self-center text-center text-text-secondary text-sm font-mono">
                    {formatNumber(u.contests_participated || 0)}
                  </div>
                  <div className="col-span-3 self-center text-right">
                    <span className="text-brand-blue font-bold font-mono text-sm">
                      {formatNumber(u.rating || entry.score || 0)}
                    </span>
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
