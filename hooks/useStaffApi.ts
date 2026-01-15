'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface Staff {
  id: string;
  email: string | null;
  name: string;
  phoneNumber: string | null;
  team: string | null;
  jobTitle: string | null;
  isActive: boolean;
  currentAssigned: number;
  createdAt: string;
}

export interface StaffDetail extends Staff {
  organizationId: string;
  updatedAt: string;
}

export interface StaffAssignment {
  id: string;
  organizationWardId: string;
  wardName: string;
  wardEmail: string;
  wardPhoneNumber: string;
  assignedAt: string;
  isActive: boolean;
  notes: string | null;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  totalAssigned: number;
  avgAssigned: number;
  unassignedWards: number;
}

export interface StaffListResponse {
  data: Staff[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateStaffData {
  name: string;
  email?: string;
  phoneNumber?: string;
  team?: string;
  jobTitle?: string;
}

export interface UpdateStaffData {
  name?: string;
  phoneNumber?: string;
  team?: string;
  jobTitle?: string;
  isActive?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useStaffApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * List staff with optional filtering and pagination
   */
  const listStaff = useCallback(
    async (params?: {
      search?: string;
      team?: string;
      page?: number;
      pageSize?: number;
    }): Promise<StaffListResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        if (params?.team) query.set('team', params.team);
        if (params?.page) query.set('page', String(params.page));
        if (params?.pageSize) query.set('pageSize', String(params.pageSize));

        const queryStr = query.toString();
        const path = `/v1/admin/staff${queryStr ? `?${queryStr}` : ''}`;
        return await apiClient.get<StaffListResponse>(path);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch staff');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get staff detail by ID
   */
  const getStaff = useCallback(
    async (id: string): Promise<StaffDetail | null> => {
      setLoading(true);
      setError(null);
      try {
        return await apiClient.get<StaffDetail>(`/v1/admin/staff/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch staff');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get staff statistics
   */
  const getStats = useCallback(async (): Promise<StaffStats | null> => {
    setLoading(true);
    setError(null);
    try {
      return await apiClient.get<StaffStats>('/v1/admin/staff/stats');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get list of unique teams
   */
  const getTeams = useCallback(async (): Promise<string[]> => {
    try {
      const res = await apiClient.get<{ teams: string[] }>(
        '/v1/admin/staff/teams',
      );
      return res.teams;
    } catch {
      return [];
    }
  }, []);

  /**
   * Get list of unassigned wards (without staff)
   */
  const getUnassignedWards = useCallback(async (): Promise<
    { id: string; name: string; phoneNumber: string }[]
  > => {
    try {
      const res = await apiClient.get<{
        data: { id: string; name: string; phoneNumber: string }[];
      }>('/v1/admin/staff/unassigned-wards');
      return res.data;
    } catch {
      return [];
    }
  }, []);

  /**
   * Create a new staff member
   */
  const createStaff = useCallback(
    async (data: CreateStaffData): Promise<{ id: string } | null> => {
      setLoading(true);
      setError(null);
      try {
        return await apiClient.post<{ id: string; message: string }>(
          '/v1/admin/staff',
          data,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create staff');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Update a staff member
   */
  const updateStaff = useCallback(
    async (id: string, data: UpdateStaffData): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.put(`/v1/admin/staff/${id}`, data);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update staff');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Delete a staff member (soft delete)
   */
  const deleteStaff = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/v1/admin/staff/${id}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get ward assignments for a staff member
   */
  const getAssignments = useCallback(
    async (staffId: string, activeOnly = true): Promise<StaffAssignment[]> => {
      try {
        const query = activeOnly ? '?activeOnly=true' : '';
        const res = await apiClient.get<{ data: StaffAssignment[] }>(
          `/v1/admin/staff/${staffId}/assignments${query}`,
        );
        return res.data;
      } catch {
        return [];
      }
    },
    [],
  );

  /**
   * Assign a ward to a staff member
   */
  const assignWard = useCallback(
    async (
      staffId: string,
      organizationWardId: string,
      notes?: string,
    ): Promise<{ id: string } | null> => {
      setLoading(true);
      setError(null);
      try {
        return await apiClient.post<{ id: string; message: string }>(
          `/v1/admin/staff/${staffId}/assign`,
          { organizationWardId, notes },
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign ward');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Unassign a ward from a staff member
   */
  const unassignWard = useCallback(
    async (staffId: string, assignmentId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.delete(
          `/v1/admin/staff/${staffId}/assignments/${assignmentId}`,
        );
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to unassign ward',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    listStaff,
    getStaff,
    getStats,
    getTeams,
    getUnassignedWards,
    createStaff,
    updateStaff,
    deleteStaff,
    getAssignments,
    assignWard,
    unassignWard,
  };
}

export default useStaffApi;
