'use client';

import { useMemo } from 'react';
import { AuthError } from './useAuthedFetch';
import { API_BASE } from '../lib/api-client';

/**
 * @deprecated This hook is deprecated. Use `useAuth` from '@/hooks/useAuth' instead.
 *
 * - For token access: `const { token } = useAuth();`
 * - For logout: `const { logout } = useAuth();`
 * - For API calls: Use `apiClient` from '@/lib/api-client'
 */
export const useAdminApi = () => {
  return useMemo(() => {
    const getApiBase = () => API_BASE;

    const requireAdminToken = () => {
      const token = localStorage.getItem('admin_access_token');
      if (!token) throw new AuthError('로그인이 필요합니다.');
      return token;
    };

    const clearAdminSession = () => {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_info');
    };

    return { getApiBase, requireAdminToken, clearAdminSession };
  }, []);
};
