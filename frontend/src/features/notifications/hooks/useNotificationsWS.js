import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../notificationsSlice';
import { WS_ROUTES } from '@shared/utils/constants';

/**
 * useNotificationsWS - Connects to the notifications WebSocket for real-time alerts.
 */
export function useNotificationsWS() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    const url = WS_ROUTES.NOTIFICATIONS(user.id);
    wsRef.current = new WebSocket(url);

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        dispatch(addNotification(data));
      } catch {}
    };

    wsRef.current.onerror = (e) => console.warn('Notification WS error:', e);

    return () => {
      wsRef.current?.close();
    };
  }, [user?.id, dispatch]);
}
