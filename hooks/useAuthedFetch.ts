'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export class AuthError extends Error {
  constructor(message = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
  }
}

type UseAuthedFetchParams<T> = {
  deps: unknown[];
  fetcher: (args: { token: string; signal: AbortSignal }) => Promise<T>;
};

type UseAuthedFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useAuthedFetch<T>({
  deps,
  fetcher,
}: UseAuthedFetchParams<T>): UseAuthedFetchResult<T> {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestSeqRef.current;
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      try {
        const result = await fetcher({ token, signal: controller.signal });
        if (requestId !== requestSeqRef.current) return;
        setData(result);
      } catch (err) {
        if (controller.signal.aborted || requestId !== requestSeqRef.current)
          return;
        if (err instanceof AuthError) {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
          localStorage.removeItem('admin_info');
          router.replace('/login');
          return;
        }
        setError((err as Error).message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        if (!controller.signal.aborted && requestId === requestSeqRef.current) {
          setLoading(false);
        }
      }
    };

    run();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
