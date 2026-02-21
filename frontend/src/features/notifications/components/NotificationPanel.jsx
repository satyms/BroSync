import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  markAsRead,
  markAllRead,
} from '../notificationsSlice';
import { timeAgo } from '@shared/utils/formatters';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@shared/components/ui/Spinner';

const TYPE_ICONS = {
  submission_result: '⚡',
  contest_start: '🏆',
  contest_end: '🔔',
  system: '🛡',
};

export default function NotificationPanel({ onClose }) {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((s) => s.notifications);
  const panelRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="w-80 max-h-[480px] bg-bg-secondary border border-border-primary rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-down"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
        <h3 className="text-text-primary font-semibold text-sm">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(markAllRead())}
            className="text-xs text-brand-blue hover:text-blue-400 font-mono transition-colors flex items-center gap-1"
          >
            <CheckIcon className="w-3 h-3" /> All read
          </button>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm font-mono">
            No notifications
          </div>
        ) : (
          <ul>
            {items.map((notif) => (
              <li
                key={notif.id}
                onClick={() => !notif.is_read && dispatch(markAsRead(notif.id))}
                className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-bg-hover transition-colors border-b border-border-secondary last:border-0
                  ${!notif.is_read ? 'bg-brand-blue/5' : ''}`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {TYPE_ICONS[notif.notification_type] || '🔔'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!notif.is_read ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-brand-blue rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-text-muted text-xs mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-text-muted text-[10px] font-mono mt-1">{timeAgo(notif.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
