import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { addNotification, addPendingBattleRequest, setBattleStarted } from '../notificationsSlice';
import { WS_ROUTES } from '@shared/utils/constants';

/**
 * useNotificationsWS
 * Connects to the per-user notification WebSocket with auto-reconnect.
 * Battle events are dispatched to Redux; UI (accept/reject buttons) is handled
 * by BattleRequestToast.jsx which is mounted in App.jsx.
 */
export function useNotificationsWS() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const wsRef     = useRef(null);
  const retryRef  = useRef(null);
  const retryCount = useRef(0);
  const alive     = useRef(true); // set to false on cleanup so reconnect stops

  const connect = useCallback(() => {
    if (!alive.current) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const url = `${WS_ROUTES.NOTIFICATIONS()}?token=${token}`;
    console.log('[NotificationsWS] Connecting to:', url);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[NotificationsWS] Connected successfully for user:', user?.username);
      retryCount.current = 0; // reset backoff on successful connection
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[NotificationsWS] Message received:', data);

        if (data.type === 'battle_request') {
          dispatch(addPendingBattleRequest(data));
          return;
        }

        if (data.type === 'battle_started') {
          // Dispatch to Redux so BattleRequestToast can navigate in both windows
          dispatch(setBattleStarted(data));
          return;
        }

        if (data.type === 'battle_rejected') {
          toast('Your challenge was rejected.', { icon: '\u{1F614}', duration: 5000 });
          return;
        }

        dispatch(addNotification(data));
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = (e) => console.warn('[NotificationsWS] Error:', e);

    ws.onclose = (e) => {
      console.warn('[NotificationsWS] Closed. code:', e.code, 'reason:', e.reason);
      // Don't reconnect on auth failure (4001) or intentional close (1000)
      if (!alive.current || e.code === 4001 || e.code === 1000) return;
      // Exponential backoff: 1s, 2s, 4s, 8s … max 30s
      const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
      retryCount.current += 1;
      console.log(`[NotificationsWS] Reconnecting in ${delay}ms (attempt ${retryCount.current})...`);
      retryRef.current = setTimeout(connect, delay);
    };
  }, [user?.id, user?.username, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.id) return;
    alive.current = true;
    retryCount.current = 0;
    connect();

    return () => {
      alive.current = false;
      clearTimeout(retryRef.current);
      wsRef.current?.close(1000, 'unmount');
    };
  }, [user?.id, connect]);
}

