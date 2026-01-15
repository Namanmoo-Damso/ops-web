'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface BeneficiaryUsageStats {
  beneficiaryId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalCalls: number;
    totalDurationMinutes: number;
    averageDurationMinutes: number;
  };
  callDates: string[];
}

// ============================================================================
// Hook
// ============================================================================

export function useBeneficiaryStatsApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get usage stats for a beneficiary
   * @param beneficiaryId - The beneficiary ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   */
  const getUsageStats = useCallback(
    async (
      beneficiaryId: string,
      startDate: string,
      endDate: string,
    ): Promise<BeneficiaryUsageStats | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          startDate,
          endDate,
        });
        const result = await apiClient.get<BeneficiaryUsageStats>(
          `/v1/admin/beneficiaries/${beneficiaryId}/stats?${params.toString()}`,
        );

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
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
    getUsageStats,
  };
}
