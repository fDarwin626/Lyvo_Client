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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch notifications on mount
useEffect(() => {
  // ✅ Only fetch if authenticated
  if (isAuthenticated()) {
    fetchNotifications();
  }
}, []); // Or add [isAuthenticated] if using context
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

  // Handle notification click (mark as read + navigate)
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }

    // Navigate to link if exists
    if (notification.link) {
      router.push("/dashboard/history");
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      alert('Please read the notification before deleting');
      return;
    }

    if (!confirm('Delete this notification?')) {
      return;
    }

    try {
      setDeletingId(notificationId);
      await deleteNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllNotificationsRead();
      
      // Update all notifications to read
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      alert(err.message || 'Failed to mark all as read');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    if (type.includes('tts')) return <Icon icon="mdi:text-to-speech-off" width="24" height="24"  className="color: #352d2d" />;
    if (type.includes('stt')) return <Icon icon="carbon:ibm-watson-text-to-speech" width="32" height="32"  className="color: #352d2d" />;
    if (type.includes('audiobook')) return <Icon icon="arcticons:audiobookshelf" width="48" height="48"  className="color: #352d2d" />;
    if (type.includes('voice_clone')) return <Icon icon="material-symbols-light:theater-comedy-outline" width="24" height="24"  className="color: #352d2d" />;
    if (type.includes('payment')) return <Icon icon="fluent:wallet-credit-card-32-regular" width="32" height="32"  className="color: #352d2d" />;
    return <Icon icon="line-md:bell-alert-loop" width="24" height="24"  className="color: #352d2d" />;
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    if (type.includes('failed')) return 'text-red-500';
    if (type.includes('success')) return 'text-natural-500';
    return 'text-blue-500';
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Notifications</h1>
            <p className="text-secondary mt-1 text-sm sm:text-base">
              Stay updated with your activity
            </p>
          </div>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              <Icon icon="mdi:check-all" width="18" height="18" className="sm:w-5 sm:h-5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Unread count indicator */}
        {unreadCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 flex items-center gap-2">
            <Icon icon="mdi:information" width="18" height="18" className="text-blue-500 flex-shrink-0 sm:w-5 sm:h-5" />
            <p className="text-xs sm:text-sm text-blue-700">
              You have <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          // Loading state
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-brand"></div>
              <p className="text-secondary text-sm sm:text-base">Loading notifications...</p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
            <Icon icon="mdi:alert-circle" width="40" height="40" className="text-red-500 mx-auto mb-3 sm:w-12 sm:h-12" />
            <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-3 sm:mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          // Empty state
          <div className="bg-surface border border-default rounded-lg p-8 sm:p-12 text-center">
            <Icon icon="mdi:bell-off-outline" width="48" height="48" className="text-gray-300 mx-auto mb-3 sm:mb-4 sm:w-16 sm:h-16" />
            <h3 className="text-lg sm:text-xl font-semibold text-primary mb-2">No notifications yet</h3>
            <p className="text-secondary text-sm sm:text-base">
              You'll see notifications here when you use TTS, audiobooks, voice cloning, and more
            </p>
          </div>
        ) : (
          // Notifications list
          <div className="space-y-2 sm:space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-surface border rounded-lg p-3 sm:p-4 transition-all cursor-pointer ${
                  notification.is_read
                    ? 'border-default'
                    : 'border-blue-300 bg-blue-50'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 sm:gap-4">
                  {/* Icon */}
                  <div className={`text-2xl sm:text-3xl flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-primary text-sm sm:text-base">
                        {notification.title}
                      </h3>
                      
                      {/* NEW badge for unread */}
                      {!notification.is_read && (
                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex-shrink-0">
                          <Icon icon="mdi:new-box" width="12" height="12" className="sm:w-3.5 sm:h-3.5" />
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-secondary text-xs sm:text-sm mb-2 line-clamp-2 sm:line-clamp-none">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:clock-outline" width="12" height="12" className="sm:w-3.5 sm:h-3.5" />
                        {notification.time_ago}
                      </span>
                      {notification.link && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <Icon icon="mdi:arrow-right" width="12" height="12" className="sm:w-3.5 sm:h-3.5" />
                          View details
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button (only for read notifications) */}
                  {notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id, notification.is_read);
                      }}
                      disabled={deletingId === notification.id}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Delete notification"
                    >
                      {deletingId === notification.id ? (
                        <Icon icon="mdi:loading" width="18" height="18" className="animate-spin sm:w-5 sm:h-5" />
                      ) : (
                        <Icon icon="mdi:delete-outline" width="18" height="18" className="sm:w-5 sm:h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}