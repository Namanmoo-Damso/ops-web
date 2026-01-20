'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

// ============================================================================
// Types
// ============================================================================

export type NotificationType = 'settings_changed' | 'emergency_detected' | 'ward_linked';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// ============================================================================
// Hook
// ============================================================================

export function useNotificationsApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * List notifications with pagination
   */
  const listNotifications = useCallback(
    async (page = 1, pageSize = 10): Promise<NotificationListResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        return await apiClient.get<NotificationListResponse>(
          `/v1/admin/notifications?${query}`,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch notifications',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get unread notification count
   */
  const getUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const response = await apiClient.get<UnreadCountResponse>(
        '/v1/admin/notifications/unread-count',
      );
      return response?.unreadCount ?? 0;
    } catch {
      return 0;
    }
  }, []);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/v1/admin/notifications/${id}/read`, {});
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark notification as read',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/v1/admin/notifications/read-all', {});
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark all notifications as read',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotificationsApi;
