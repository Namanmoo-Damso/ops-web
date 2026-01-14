'use client';

import { useMemo } from 'react';
import { AuthError } from './useAuthedFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const useAdminApi = () => {
  return useMemo(() => {
    const getApiBase = () => {
      if (!API_BASE) {
        throw new Error(
          'API URL이 설정되지 않았습니다. NEXT_PUBLIC_API_URL을 확인하세요.',
        );
      }
      return API_BASE;
    };

    const requireAdminToken = () => {
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        throw new AuthError('로그인이 필요합니다.');
      }
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
