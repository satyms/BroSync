/**
 * BattleResultModal
 * ==================
 * Full-screen overlay shown when a battle ends.
 */

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function BattleResultModal({ endEvent, onRematch }) {
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);

  if (!endEvent) return null;

  const { winner, is_draw, scores } = endEvent;
  const iWon  = winner === currentUser?.username;
  const isDraw = is_draw || !winner;

  const sorted = (scores ?? []).slice().sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-bg-card border border-border-primary rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 space-y-6 text-center">
        {/* Emoji headline */}
        <div className="text-6xl">{isDraw ? '🤝' : iWon ? '🏆' : '😔'}</div>

        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            {isDraw ? "It's a Draw!" : iWon ? 'You Won!' : 'You Lost'}
          </h2>
          {!isDraw && (
            <p className="text-text-muted text-sm mt-1">
              {iWon ? '+20 rating points awarded' : `${winner} takes the win`}
            </p>
          )}
        </div>

        {/* Final scoreboard */}
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div
              key={p.username}
              className={`flex items-center justify-between px-4 py-2 rounded-lg
                ${i === 0 && !isDraw ? 'bg-yellow-900/20 border border-yellow-600/30' : 'bg-bg-tertiary border border-border-secondary'}`}
            >
              <div className="flex items-center gap-2">
                <span>{i === 0 && !isDraw ? '👑' : '⚔️'}</span>
                <span className={`font-semibold text-sm ${p.username === currentUser?.username ? 'text-brand-blue' : 'text-text-primary'}`}>
                  {p.username} {p.username === currentUser?.username && <span className="text-[10px] font-normal text-text-muted">(you)</span>}
                </span>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-sm text-brand-blue">{p.score ?? 0} pts</p>
                <p className="text-text-muted text-[10px] font-mono">{p.problems_solved ?? 0} solved</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border-primary text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium"
          >
            Go Home
          </button>
          {onRematch && (
            <button
              onClick={onRematch}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-blue hover:bg-brand-blue/80 text-white transition-colors text-sm font-semibold"
            >
              Rematch
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
