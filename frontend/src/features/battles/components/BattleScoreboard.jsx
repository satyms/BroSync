/**
 * BattleScoreboard
 * =================
 * Live side-panel showing both players' scores and problems solved.
 */

import { useSelector } from 'react-redux';

export default function BattleScoreboard({ scores, challenger, opponent }) {
  const currentUser = useSelector((s) => s.auth.user);

  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-4 space-y-3">
      <h3 className="text-text-muted text-xs font-mono uppercase tracking-wider">Live Scores</h3>

      {scores.length === 0 ? (
        <p className="text-text-muted text-xs text-center py-4">Waiting for scores…</p>
      ) : (
        <div className="space-y-2">
          {scores
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((p, i) => {
              const isMe = p.username === currentUser?.username;
              const isLeading = i === 0;
              return (
                <div
                  key={p.username}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors
                    ${isLeading ? 'bg-yellow-900/10 border-yellow-600/30' : 'bg-bg-tertiary border-border-secondary'}
                    ${isMe ? 'ring-1 ring-brand-blue/40' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{isLeading ? '👑' : '⚔️'}</span>
                    <div>
                      <p className={`text-sm font-semibold ${isMe ? 'text-brand-blue' : 'text-text-primary'}`}>
                        {p.username} {isMe && <span className="text-[10px] font-normal text-text-muted">(you)</span>}
                      </p>
                      <p className="text-text-muted text-[10px] font-mono">
                        {p.problems_solved ?? 0} solved
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-brand-blue text-sm">
                    {p.score ?? 0} pts
                  </span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
