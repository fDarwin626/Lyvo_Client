"use client";

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
  markAllNotificationsRead,
  type Notification,
  isAuthenticated
} from '@/lib/api';

/* Tiny equalizer glyph — the page's one signature element.
   Bars are "listening" (animated) when a notification is unread,
   and flatline to silence once it's read. */
function Waveform({ active }: { active: boolean }) {
  const bars = [0.4, 1, 0.6, 0.85, 0.35];
  return (
    <span className="flex items-end gap-[2px] h-3.5 w-4 flex-shrink-0">
      {bars.map((h, i) => (
        <span
          key={i}
          className={`w-[2px] rounded-full ${active ? 'bg-accent animate-waveform-bar' : 'bg-[rgb(var(--text-muted))]'}`}
          style={{
            height: active ? '100%' : `${h * 100}%`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </span>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isAuthenticated()) {
      fetchNotifications();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNotifications(1, 50);
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
    if (notification.link) {
      router.push("/dashboard/history");
    }
  };

  const handleDelete = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      alert('Please read the notification before deleting');
      return;
    }
    if (!confirm('Delete this notification?')) return;

    try {
      setDeletingId(notificationId);
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      alert(err.message || 'Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    const common = "text-primary";
    if (type.includes('tts')) return <Icon icon="mdi:text-to-speech-off" width="20" height="20" className={common} />;
    if (type.includes('stt')) return <Icon icon="carbon:ibm-watson-text-to-speech" width="20" height="20" className={common} />;
    if (type.includes('audiobook')) return <Icon icon="arcticons:audiobookshelf" width="20" height="20" className={common} />;
    if (type.includes('voice_clone')) return <Icon icon="material-symbols-light:theater-comedy-outline" width="20" height="20" className={common} />;
    if (type.includes('payment')) return <Icon icon="fluent:wallet-credit-card-32-regular" width="20" height="20" className={common} />;
    return <Icon icon="line-md:bell-alert-loop" width="20" height="20" className={common} />;
  };

  // Status is now conveyed as a small mono tag rather than a colored card —
  // failure is the only state that borrows off-palette color, and sparingly.
  const getStatusTag = (type: string) => {
    if (type.includes('failed')) return { label: 'Failed', className: 'text-danger' };
    if (type.includes('success')) return { label: 'Done', className: 'text-secondary' };
    return null;
  };

  const visible = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Activity log</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1 className="font-[ArchivoBlack] text-3xl sm:text-4xl text-primary tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-secondary hover:text-primary underline underline-offset-4 decoration-[rgb(var(--border))] hover:decoration-[rgb(var(--text-primary))] transition-colors self-start sm:self-auto"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-default mb-2">
          <button
            onClick={() => setFilter('all')}
            className={`relative pb-3 text-sm font-medium tracking-wide uppercase transition-colors ${
              filter === 'all' ? 'text-primary' : 'text-muted hover:text-secondary'
            }`}
          >
            All <span className="text-muted normal-case">({notifications.length})</span>
            {filter === 'all' && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[rgb(var(--text-primary))]" />
            )}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`relative pb-3 text-sm font-medium tracking-wide uppercase transition-colors ${
              filter === 'unread' ? 'text-primary' : 'text-muted hover:text-secondary'
            }`}
          >
            Unread <span className="text-muted normal-case">({unreadCount})</span>
            {filter === 'unread' && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-accent" />
            )}
          </button>
        </div>

        {/* List */}
        <div className="mt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Waveform active />
              <p className="text-xs tracking-[0.2em] uppercase text-muted">Loading activity</p>
            </div>
          ) : error ? (
            <div className="border border-default py-12 px-6 text-center">
              <p className="font-[ArchivoBlack] text-lg text-primary mb-2">Something broke</p>
              <p className="text-sm text-secondary mb-5">{error}</p>
              <button
                onClick={fetchNotifications}
                className="text-sm text-primary underline underline-offset-4 hover:text-accent transition-colors"
              >
                Try again
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="border border-default py-16 px-6 text-center">
              <svg width="64" height="20" viewBox="0 0 64 20" className="mx-auto mb-5 opacity-40">
                <line x1="0" y1="10" x2="64" y2="10" stroke="rgb(var(--text-muted))" strokeWidth="2" />
              </svg>
              <h3 className="font-[ArchivoBlack] text-xl text-primary mb-2">
                {filter === 'unread' ? 'Nothing unread' : 'All quiet'}
              </h3>
              <p className="text-secondary text-sm max-w-xs mx-auto">
                {filter === 'unread'
                  ? "You're caught up. Switch back to All to see your full history."
                  : "You'll see activity here from your TTS, audiobook, and voice cloning runs."}
              </p>
            </div>
          ) : (
            <ul>
              {visible.map((notification) => {
                const status = getStatusTag(notification.type);
                return (
                  <li
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="group relative border-b border-default py-4 pl-4 pr-1 cursor-pointer transition-colors hover:bg-surface"
                  >
                    {!notification.is_read && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" />
                    )}
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-0.5 flex-shrink-0 w-8 h-8 flex items-center justify-center border border-default">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-medium text-primary text-sm sm:text-[15px] truncate">
                            {notification.title}
                          </h3>
                          <Waveform active={!notification.is_read} />
                        </div>

                        <p className="text-secondary text-sm mt-1 mb-2 line-clamp-2 sm:line-clamp-none">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] tracking-wide uppercase text-muted font-mono">
                          <span>{notification.time_ago}</span>
                          {status && <span className={status.className}>{status.label}</span>}
                          {notification.link && (
                            <span className="text-accent normal-case font-sans flex items-center gap-1">
                              View details
                              <Icon icon="mdi:arrow-right" width="12" height="12" />
                            </span>
                          )}
                        </div>
                      </div>

                      {notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id, notification.is_read);
                          }}
                          disabled={deletingId === notification.id}
                          className="p-2 text-muted hover:text-danger transition-colors disabled:opacity-50 flex-shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100"
                          title="Delete notification"
                        >
                          {deletingId === notification.id ? (
                            <Icon icon="mdi:loading" width="16" height="16" className="animate-spin" />
                          ) : (
                            <Icon icon="mdi:delete-outline" width="16" height="16" />
                          )}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}