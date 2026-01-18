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

export interface TodaySummary {
  totalCalls: number;
  incomingCalls: number;
  outgoingCalls: number;
  totalDurationMinutes: number;
  avgDurationMinutes: number;
  scheduledCheckIns: number;
  completedCheckIns: number;
  fetchedAt: string;
}

export interface StatsOverview {
  totalWards: number;
  activeWards: number;
  totalGuardians: number;
  totalOrganizations: number;
  totalCalls: number;
  totalCallMinutes: number;
}

export interface TodayStats {
  calls: number;
  avgDuration: number;
  emergencies: number;
  newRegistrations: number;
}

export interface WeeklyTrend {
  calls: number[];
  emergencies: number[];
  labels: string[];
}

export interface MoodDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface HealthAlerts {
  warning: number;
  info: number;
  unread: number;
}

export interface KeywordStat {
  keyword: string;
  count: number;
}

export interface StatsResponse {
  overview: StatsOverview;
  todayStats: TodayStats;
  weeklyTrend: WeeklyTrend;
  moodDistribution: MoodDistribution;
  healthAlerts: HealthAlerts;
  topKeywords: KeywordStat[];
  fetchedAt: string;
}

export interface CareAlertLog {
  id: string;
  wardId: string;
  wardName: string;
  type: string;
  alertType: string;
  severity: string;
  timestamp: string;
  status: 'resolved' | 'pending' | 'false_positive';
  acknowledgedAt: string | null;
  roomName: string | null;
}

export interface CareAlertsResponse {
  logs: CareAlertLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  fetchedAt: string;
}

export interface CareAlertStatsResponse {
  detected: number;
  responded: number;
  responseRate: number;
  period: string;
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
   * Get today's daily operations summary
   */
  const getTodaySummary =
    useCallback(async (): Promise<TodaySummary | null> => {
      setLoading(true);
      setError(null);
      try {
        return await apiClient.get<TodaySummary>(
          '/v1/admin/dashboard/today-summary',
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch today summary',
        );
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

  /**
   * Get dashboard stats
   */
  const getStats = useCallback(async (): Promise<StatsResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiClient.get<StatsResponse>('/v1/admin/dashboard/stats');
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

  /**
   * Get care alert logs for emergency dashboard
   */
  const getCareAlerts = useCallback(
    async (options?: {
      limit?: number;
      hoursBack?: number;
      page?: number;
      startDate?: string;
      endDate?: string;
    }): Promise<CareAlertsResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.hoursBack)
          params.set('hoursBack', String(options.hoursBack));
        if (options?.page) params.set('page', String(options.page));
        if (options?.startDate) params.set('startDate', options.startDate);
        if (options?.endDate) params.set('endDate', options.endDate);
        const query = params.toString() ? `?${params.toString()}` : '';
        return await apiClient.get<CareAlertsResponse>(
          `/v1/admin/dashboard/care-alerts${query}`,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch care alerts',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get care alert statistics
   */
  const getCareAlertStats = useCallback(
    async (
      period?: 'today' | 'week' | 'month' | 'all',
    ): Promise<CareAlertStatsResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const query = period ? `?period=${period}` : '';
        return await apiClient.get<CareAlertStatsResponse>(
          `/v1/admin/dashboard/care-alert-stats${query}`,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch care alert stats',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    getTimeline,
    getTodaySummary,
    getStats,
    getRealtime,
    getCareAlerts,
    getCareAlertStats,
  };
}

export default useDashboardApi;
