'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface Settings {
  // Scheduled Calls
  preferredStartTime: string;
  preferredEndTime: string;

  // Retry Policy
  maxRetries: number;
  retryInterval: number;

  // Risk Detection
  riskSensitivity: number;

  // Conversation Topics
  healthCheck: boolean;
  mealCheck: boolean;
  medicationCheck: boolean;
  sleepCheck: boolean;
  moodCheck: boolean;

  updatedAt: string;
}

export interface UpdateSettingsData {
  preferredStartTime?: string;
  preferredEndTime?: string;
  maxRetries?: number;
  retryInterval?: number;
  riskSensitivity?: number;
  healthCheck?: boolean;
  mealCheck?: boolean;
  medicationCheck?: boolean;
  sleepCheck?: boolean;
  moodCheck?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useSettingsApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get organization settings
   */
  const getSettings = useCallback(async (): Promise<Settings | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiClient.get<Settings>('/v1/admin/settings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update organization settings
   */
  const updateSettings = useCallback(
    async (data: UpdateSettingsData): Promise<Settings | null> => {
      setLoading(true);
      setError(null);
      try {
        return await apiClient.put<Settings>('/v1/admin/settings', data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update settings',
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
    getSettings,
    updateSettings,
  };
}

export default useSettingsApi;
