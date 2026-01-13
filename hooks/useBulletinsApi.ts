'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

// ============================================================================
// Types
// ============================================================================

export interface BulletinItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  isPinned: boolean;
  date: string; // MM/DD format
  createdAt: string;
  updatedAt: string;
}

export interface BulletinListResponse {
  data: BulletinItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateBulletinData {
  title: string;
  content: string;
  isPinned?: boolean;
}

export interface UpdateBulletinData {
  title?: string;
  content?: string;
  isPinned?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useBulletinsApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * List bulletins with pagination
   */
  const listBulletins = useCallback(
    async (page = 1, pageSize = 10): Promise<BulletinListResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        return await apiClient.get<BulletinListResponse>(
          `/v1/admin/bulletins?${query}`,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch bulletins',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Get a single bulletin
   */
  const getBulletin = useCallback(
    async (id: string): Promise<BulletinItem | null> => {
      setLoading(true);
      setError(null);
      try {
        return await apiClient.get<BulletinItem>(`/v1/admin/bulletins/${id}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch bulletin',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Create a new bulletin
   */
  const createBulletin = useCallback(
    async (data: CreateBulletinData): Promise<{ id: string } | null> => {
      setLoading(true);
      setError(null);
      try {
        return await apiClient.post<{ id: string; message: string }>(
          '/v1/admin/bulletins',
          data,
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create bulletin',
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Update a bulletin
   */
  const updateBulletin = useCallback(
    async (id: string, data: UpdateBulletinData): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.put(`/v1/admin/bulletins/${id}`, data);
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update bulletin',
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * Delete a bulletin
   */
  const deleteBulletin = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/v1/admin/bulletins/${id}`);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete bulletin',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    listBulletins,
    getBulletin,
    createBulletin,
    updateBulletin,
    deleteBulletin,
  };
}

export default useBulletinsApi;
