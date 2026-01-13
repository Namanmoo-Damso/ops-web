'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface TimelineHour {
  hour: number;
  label: string; // "06:00", "07:00", etc.
  scheduled: number;
  actual: number;
  incoming: number;
}

export interface TimelineResponse {
  date: string;
  timeline: TimelineHour[];
  fetchedAt: string;
}

// ============================================================================
// Hook
// ============================================================================

export function useDashboardApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get hourly call distribution for operations timeline
   */
  const getTimeline = useCallback(
    async (date?: string): Promise<TimelineResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const query = date ? `?date=${date}` : '';
        return await apiClient.get<TimelineResponse>(
          `/v1/admin/dashboard/timeline${query}`,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch timeline',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get dashboard stats
   */
  const getStats = useCallback(async (): Promise<any | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiClient.get('/v1/admin/dashboard/stats');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get realtime stats
   */
  const getRealtime = useCallback(async (): Promise<any | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiClient.get('/v1/admin/dashboard/realtime');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch realtime stats',
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getTimeline,
    getStats,
    getRealtime,
  };
}

export default useDashboardApi;
