import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '@features/auth/authSlice';
import { fetchNotifications } from '@features/notifications/notificationsSlice';
import { useNotificationsWS } from '@features/notifications/hooks/useNotificationsWS';

/**
 * AppInitializer - Bootstraps the app on load:
 * - Fetches the logged-in user's profile
 * - Fetches initial notifications
 * - Opens WebSocket connection for real-time notifications
 */
export default function AppInitializer() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);

  // Restore session
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfile());
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated]);

  // WebSocket for real-time notifications
  useNotificationsWS();

  return null;
}
