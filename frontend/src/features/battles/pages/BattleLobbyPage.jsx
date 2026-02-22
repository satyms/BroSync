/**
 * BattleLobbyPage  (/battles)
 * ============================
 * - Shows incoming battle requests (accept / reject)
 * - Shows user's battle history
 * - Link to leaderboard to challenge someone
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { battlesService } from '../services/battlesService';
import { PageLoader } from '@shared/components/ui/Spinner';

/* ── tiny helper ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40',
    active: 'bg-green-900/30 text-green-400 border-green-700/40',
    completed: 'bg-blue-900/30 text-blue-400 border-blue-700/40',
    cancelled: 'bg-red-900/30 text-red-400 border-red-700/40',
    waiting: 'bg-gray-700/30 text-gray-400 border-gray-600/40',
  };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${map[status] ?? map.cancelled}`}>
      {status}
    </span>
  );
}

export default function BattleLobbyPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const [inbox, setInbox] = useState([]);
  const [battles, setBattles] = useState([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingBattles, setLoadingBattles] = useState(true);
  const [responding, setResponding] = useState(null); // requestId being processed

  const loadInbox = useCallback(() => {
    setLoadingInbox(true);
    battlesService
      .getInbox()
      .then((d) => setInbox(d?.results ?? d ?? []))
      .catch(() => setInbox([]))
      .finally(() => setLoadingInbox(false));
  }, []);

  const loadBattles = useCallback(() => {
    setLoadingBattles(true);
    battlesService
      .getMyBattles()
      .then((d) => setBattles(d?.results ?? d ?? []))
      .catch(() => setBattles([]))
      .finally(() => setLoadingBattles(false));
  }, []);

  useEffect(() => {
    loadInbox();
    loadBattles();
  }, [loadInbox, loadBattles]);

  const handleRespond = async (requestId, accept) => {
    setResponding(requestId);
    try {
      const res = await battlesService.respond(requestId, accept);
      if (accept) {
        const battleId = res?.id;
        toast.success('Challenge accepted! Entering battle room…');
        if (battleId) navigate(`/battles/${battleId}`);
      } else {
        toast('Challenge rejected.', { icon: '🚫' });
      }
      loadInbox();
      loadBattles();
    } catch {
      toast.error('Failed to respond to challenge.');
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-xl font-bold flex items-center gap-2">
            ⚔️ Code Battles
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">1v1 real-time coding duels</p>
        </div>
        <Link
          to="/leaderboard"
          className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/80 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Challenge a Player →
        </Link>
      </div>

      {/* Inbox */}
      <section>
        <h2 className="text-text-primary font-semibold text-base mb-3">Incoming Challenges</h2>
        <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
          {loadingInbox ? (
            <div className="flex justify-center py-10"><PageLoader /></div>
          ) : inbox.length === 0 ? (
            <div className="text-center py-10 text-text-muted text-sm">No pending challenges.</div>
          ) : (
            <div className="divide-y divide-border-secondary">
              {inbox.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-text-primary text-sm font-semibold">
                      {req.challenger_username ?? req.challenger?.username ?? '?'}
                      <span className="text-text-muted font-normal"> wants to battle you</span>
                    </p>
                    <p className="text-text-muted text-xs font-mono mt-0.5">
                      Difficulty: {req.difficulty ?? 'mixed'} · Expires in ~5 min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={responding === req.id}
                      onClick={() => handleRespond(req.id, false)}
                      className="px-3 py-1.5 text-xs font-medium border border-border-primary text-text-secondary hover:bg-red-900/20 hover:border-red-600/40 hover:text-red-400 rounded-lg transition-colors disabled:opacity-40"
                    >
                      Reject
                    </button>
                    <button
                      disabled={responding === req.id}
                      onClick={() => handleRespond(req.id, true)}
                      className="px-3 py-1.5 text-xs font-semibold bg-brand-blue hover:bg-brand-blue/80 text-white rounded-lg transition-colors disabled:opacity-40"
                    >
                      {responding === req.id ? 'Accepting…' : 'Accept'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* My Battles */}
      <section>
        <h2 className="text-text-primary font-semibold text-base mb-3">My Battles</h2>
        <div className="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border-primary text-text-muted text-xs font-mono uppercase tracking-wider">
            <div className="col-span-4">Opponent</div>
            <div className="col-span-3 text-center">Status</div>
            <div className="col-span-3 text-center">Result</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {loadingBattles ? (
            <div className="flex justify-center py-10"><PageLoader /></div>
          ) : battles.length === 0 ? (
            <div className="text-center py-10 text-text-muted text-sm">
              No battles yet.{' '}
              <Link to="/leaderboard" className="text-brand-blue hover:underline">
                Challenge someone
              </Link>
              !
            </div>
          ) : (
            <div className="divide-y divide-border-secondary">
              {battles.map((b) => {
                const me = b.participants?.find((p) => p.username === user?.username);
                const opp = b.participants?.find((p) => p.username !== user?.username);
                const isActive = b.status === 'active' || b.status === 'waiting';
                const iWon = b.winner === user?.username;
                const resultLabel = b.status !== 'completed' ? '—' : b.winner ? (iWon ? '🏆 Won' : '😔 Lost') : '🤝 Draw';
                return (
                  <div key={b.id} className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center">
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-blue to-accent-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {opp?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <Link to={`/profile/${opp?.username}`} className="text-text-primary hover:text-brand-blue text-sm transition-colors truncate">
                        {opp?.username ?? 'Unknown'}
                      </Link>
                    </div>
                    <div className="col-span-3 text-center"><StatusBadge status={b.status} /></div>
                    <div className="col-span-3 text-center text-sm">{resultLabel}</div>
                    <div className="col-span-2 text-right">
                      {isActive && (
                        <Link
                          to={`/battles/${b.id}`}
                          className="px-3 py-1 text-xs font-semibold bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          Rejoin →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
