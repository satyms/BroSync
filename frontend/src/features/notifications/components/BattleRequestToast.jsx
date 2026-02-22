/**
 * BattleRequestToast.jsx
 * =======================
 * Mounts globally (inside App.jsx).
 * Watches Redux pendingBattleRequests and fires interactive toasts
 * with Accept / Reject buttons.
 */
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { removePendingBattleRequest, clearBattleStarted } from '../notificationsSlice';
import { battlesService } from '@features/battles/services/battlesService';

export default function BattleRequestToast() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pendingBattleRequests, battleStarted } = useSelector((s) => s.notifications);
  const { user } = useSelector((s) => s.auth);
  const shownIds = useRef(new Set());

  // ── Auto-navigate when a battle_started event arrives ─────────────────────
  // Both challenger AND opponent receive this WS push.
  // Opponent already navigated from the Accept button click, but re-navigating
  // to the same URL is harmless. Challenger NEEDS this to open the room.
  useEffect(() => {
    if (!battleStarted) return;
    const battleId = battleStarted.battle_id;
    dispatch(clearBattleStarted());

    const isChallenger = user?.username === battleStarted.challenger;
    if (isChallenger) {
      toast.success(
        `⚔️ ${battleStarted.opponent} accepted your challenge! Opening battle room…`,
        { duration: 5000, id: `bs_${battleId}` },
      );
    }
    // Navigate both users to the battle room
    navigate(`/battles/${battleId}`);
  }, [battleStarted, dispatch, navigate, user?.username]);

  useEffect(() => {
    pendingBattleRequests.forEach((req) => {
      const requestId = req.request_id;
      if (shownIds.current.has(requestId)) return;
      shownIds.current.add(requestId);

      const challenger = req.challenger ?? 'Someone';

      toast(
        (t) => (
          <div className="flex flex-col gap-2 min-w-[220px]">
            <p className="text-sm font-semibold text-text-primary">
              ⚔️ <strong>{challenger}</strong> challenged you!
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-1 text-xs font-semibold bg-brand-blue hover:bg-brand-blue/80 text-white rounded-lg transition-colors"
                onClick={async () => {
                  toast.dismiss(t.id);
                  dispatch(removePendingBattleRequest(requestId));
                  try {
                    const res = await battlesService.respond(requestId, true);
                    // backend returns BattleDetailSerializer → field is `id`
                    const battleId = res?.id;
                    toast.success('Challenge accepted! Prepare for battle…');
                    if (battleId) navigate(`/battles/${battleId}`);
                  } catch {
                    toast.error('Failed to accept.');
                  }
                }}
              >
                Accept
              </button>
              <button
                className="flex-1 px-3 py-1 text-xs border border-border-primary text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
                onClick={async () => {
                  toast.dismiss(t.id);
                  dispatch(removePendingBattleRequest(requestId));
                  try { await battlesService.respond(requestId, false); } catch {}
                  toast('Rejected.', { icon: '🚫' });
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ),
        { duration: 30000, id: `br_${requestId}` }
      );
    });
  }, [pendingBattleRequests, dispatch, navigate]);

  return null; // renders nothing itself
}
