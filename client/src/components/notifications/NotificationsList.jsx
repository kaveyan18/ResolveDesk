import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Bell,
  Wrench,
  CheckCircle,
  MessageSquare,
  CheckCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function NotificationsList({ onSelectComplaint, onNotificationsUpdated }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getNotifications();
      if (res.status === 'success' && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
        if (onNotificationsUpdated) {
          onNotificationsUpdated(res.data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [onNotificationsUpdated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark Single Notification as Read
  const handleMarkRead = async (notif) => {
    try {
      if (!notif.isRead) {
        const res = await api.markNotificationRead(notif._id);
        if (res.status === 'success') {
          setNotifications((prev) =>
            prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
          );
          setUnreadCount(res.data.unreadCount);
          if (onNotificationsUpdated) {
            onNotificationsUpdated(res.data.unreadCount);
          }
        }
      }

      if (notif.complaint && onSelectComplaint) {
        const compId = notif.complaint.ticketId || notif.complaint._id;
        onSelectComplaint(compId);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark All as Read
  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      const res = await api.markAllNotificationsRead();
      if (res.status === 'success') {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        if (onNotificationsUpdated) {
          onNotificationsUpdated(0);
        }
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Type Icon Renderer
  const renderIcon = (type) => {
    switch (type) {
      case 'complaint_assigned':
        return (
          <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
        );
      case 'complaint_status':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-status-success flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        );
      case 'comment_added':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-soft text-purple flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs font-mono text-ink-muted">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-ink">Notifications</h1>
          <p className="text-sm text-ink-muted mt-1">
            Stay updated on your complaint activities and progress
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="px-4 py-2 bg-white text-ink border border-surface-border text-xs font-semibold rounded-lg hover:border-brand hover:text-brand transition flex items-center gap-1.5 shadow-subtle self-start sm:self-auto"
          >
            {markingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchNotifications}
            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Notifications Panel */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-card space-y-3">
        {notifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Bell className="w-8 h-8 text-gray-custom mx-auto opacity-40" />
            <p className="text-sm font-semibold text-ink">No notifications yet</p>
            <p className="text-xs text-ink-muted">
              You will receive real-time updates when technicians are assigned or status changes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleMarkRead(n)}
                className={`p-4 flex items-start gap-4 transition rounded-xl cursor-pointer ${
                  !n.isRead ? 'bg-surface-bg/70 hover:bg-surface-bg' : 'hover:bg-surface-bg/40'
                }`}
              >
                {renderIcon(n.type)}

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <b className={`text-xs ${!n.isRead ? 'text-brand font-bold' : 'text-ink font-semibold'}`}>
                      {n.title}
                    </b>
                    <time className="text-[10.5px] font-mono text-ink-muted flex-shrink-0">
                      {formatDate(n.createdAt)}
                    </time>
                  </div>

                  <p className="text-xs text-ink-muted leading-relaxed">{n.message}</p>

                  {n.complaint && (
                    <span className="inline-block text-[11px] font-mono text-brand font-semibold pt-1">
                      {n.complaint.ticketId}
                    </span>
                  )}
                </div>

                {!n.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
