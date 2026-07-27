import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
  Bell,
  Wrench,
  CheckCircle,
  MessageSquare,
  CheckCheck,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function NotificationDropdown({
  onClose,
  onSelectComplaint,
  onViewAll,
  onNotificationsUpdated,
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res.status === 'success' && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
        if (onNotificationsUpdated) {
          onNotificationsUpdated(res.data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load notification dropdown:', err);
    } finally {
      setLoading(false);
    }
  }, [onNotificationsUpdated]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleMarkRead = async (notif) => {
    try {
      if (!notif.isRead) {
        const res = await api.markNotificationRead(notif._id);
        if (res.status === 'success') {
          setNotifications((prev) =>
            prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
          );
          const newCount = res.data.unreadCount;
          setUnreadCount(newCount);
          if (onNotificationsUpdated) {
            onNotificationsUpdated(newCount);
          }
        }
      }

      onClose();

      if (notif.complaint && onSelectComplaint) {
        const compId = notif.complaint.ticketId || notif.complaint._id;
        onSelectComplaint(compId);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

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
      console.error('Failed to mark all read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'complaint_assigned':
        return (
          <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
            <Wrench className="w-3.5 h-3.5" />
          </div>
        );
      case 'complaint_status':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-status-success flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
        );
      case 'comment_added':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-soft text-purple flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed top-16 right-6 w-80 sm:w-96 max-h-[460px] bg-white rounded-2xl shadow-2xl border border-surface-border flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
      {/* Header */}
      <div className="p-3.5 bg-sidebar text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold font-display tracking-wide">Notifications</h4>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-status-danger text-white text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-[11px] text-sidebar-text hover:text-white transition flex items-center gap-1 px-2 py-0.5 rounded hover:bg-sidebar-soft"
              title="Mark all as read"
            >
              {markingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3 h-3" />
              )}
              Read all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-sidebar-text hover:text-white hover:bg-sidebar-soft transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body List */}
      <div className="flex-1 p-2 overflow-y-auto space-y-1 bg-surface-bg/40 max-h-80">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-ink-muted">
            <Loader2 className="w-5 h-5 animate-spin text-brand" />
            <span className="text-xs font-mono">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center space-y-1.5 text-ink-muted">
            <Bell className="w-6 h-6 opacity-40 text-brand mx-auto" />
            <p className="text-xs font-semibold text-ink">No notifications</p>
            <p className="text-[11px]">You are all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleMarkRead(n)}
              className={`p-3 rounded-xl flex items-start gap-3 transition cursor-pointer ${
                !n.isRead ? 'bg-white shadow-subtle border border-surface-border' : 'hover:bg-white/60'
              }`}
            >
              {renderIcon(n.type)}
              <div className="flex-1 min-w-0 space-y-0.5 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <b className={`text-xs ${!n.isRead ? 'text-brand font-bold' : 'text-ink font-semibold'}`}>
                    {n.title}
                  </b>
                  <time className="text-[9.5px] font-mono text-ink-muted flex-shrink-0">
                    {formatDate(n.createdAt)}
                  </time>
                </div>
                <p className="text-ink-muted text-[11.5px] leading-snug line-clamp-2">{n.message}</p>
                {n.complaint && (
                  <span className="inline-block text-[10px] font-mono text-brand font-semibold">
                    {n.complaint.ticketId}
                  </span>
                )}
              </div>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-white border-t border-surface-border text-center flex-shrink-0">
        <button
          onClick={() => {
            onClose();
            onViewAll();
          }}
          className="text-xs text-brand font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
        >
          View all notifications <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
