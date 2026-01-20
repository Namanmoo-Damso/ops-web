'use client';

import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { colors, shadows, spacing, typography } from '../../styles/tokens';
import { useNotificationsApi, type NotificationItem, type NotificationType } from '../../hooks/useNotificationsApi';

// ============================================================================
// Icons
// ============================================================================

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ============================================================================
// Helper Functions
// ============================================================================

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'settings_changed':
      return <IconSettings />;
    case 'emergency_detected':
      return <IconAlert />;
    case 'ward_linked':
      return <IconLink />;
    default:
      return <IconBell />;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'settings_changed':
      return colors.primary.main;
    case 'emergency_detected':
      return colors.status.danger.main;
    case 'ward_linked':
      return colors.status.success.main;
    default:
      return colors.text.muted;
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Component
// ============================================================================

export interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { listNotifications, getUnreadCount, markAsRead, markAllAsRead } = useNotificationsApi();

  const PAGE_SIZE = 5;

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [getUnreadCount]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async (page: number) => {
    const result = await listNotifications(page, PAGE_SIZE);
    if (result) {
      setNotifications(result.data);
      setTotalPages(result.pagination.totalPages);
      setUnreadCount(result.unreadCount);
    }
  }, [listNotifications]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(currentPage);
    }
  }, [isOpen, currentPage, fetchNotifications]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const iconButtonStyle: CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    display: 'grid',
    placeItems: 'center',
    color: colors.text.muted,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    position: 'relative',
  };

  const badgeStyle: CSSProperties = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 5px',
    borderRadius: '9px',
    backgroundColor: colors.status.danger.main,
    color: '#fff',
    fontSize: '11px',
    fontWeight: typography.fontWeight.bold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const dropdownStyle: CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '360px',
    maxHeight: '480px',
    backgroundColor: colors.panel.main,
    border: `1px solid ${colors.border.main}`,
    borderRadius: spacing.md,
    boxShadow: shadows.lg,
    zIndex: 10001,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.border.main}`,
  };

  const notificationItemStyle = (isRead: boolean): CSSProperties => ({
    display: 'flex',
    gap: spacing.md,
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: isRead ? 'transparent' : colors.primary.soft,
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
    borderBottom: `1px solid ${colors.border.light}`,
  });

  const paginationStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderTop: `1px solid ${colors.border.main}`,
    backgroundColor: colors.background.elevated1,
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }} className={className}>
      {/* Bell Button */}
      <button
        style={iconButtonStyle}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="알림"
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = colors.background.elevated1;
          e.currentTarget.style.color = colors.text.primary;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.muted;
        }}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span style={badgeStyle}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={dropdownStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <span style={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}>
              알림
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: colors.primary.main,
                  fontSize: typography.fontSize.small,
                  fontWeight: typography.fontWeight.medium,
                  cursor: 'pointer',
                }}
              >
                모두 읽음 처리
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: `${spacing['3xl']} ${spacing.lg}`,
                textAlign: 'center',
                color: colors.text.muted,
                fontSize: typography.fontSize.caption,
              }}>
                알림이 없습니다
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  style={notificationItemStyle(notification.isRead)}
                  onClick={() => handleNotificationClick(notification)}
                  onMouseEnter={e => {
                    if (notification.isRead) {
                      e.currentTarget.style.backgroundColor = colors.background.elevated1;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = notification.isRead
                      ? 'transparent'
                      : colors.primary.soft;
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: `${getNotificationColor(notification.type)}15`,
                    color: getNotificationColor(notification.type),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: typography.fontSize.body,
                      fontWeight: notification.isRead
                        ? typography.fontWeight.normal
                        : typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: '4px',
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.caption,
                      color: colors.text.muted,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {notification.message}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.small,
                      color: colors.text.soft,
                      marginTop: '6px',
                    }}>
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary.main,
                      flexShrink: 0,
                      alignSelf: 'center',
                    }} />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyle}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: currentPage <= 1 ? colors.text.disabled : colors.text.muted,
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <IconChevronLeft />
              </button>
              <span style={{
                fontSize: typography.fontSize.small,
                color: colors.text.muted,
              }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: currentPage >= totalPages ? colors.text.disabled : colors.text.muted,
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <IconChevronRight />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
