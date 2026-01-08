'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ApiError, AuthError } from '../lib/api-client';

/**
 * Options for useApi hook
 */
export interface UseApiOptions<T> {
    /**
     * Fetcher function that uses the apiClient
     * @param client - The apiClient instance
     * @param signal - AbortSignal for request cancellation
     */
    fetcher: (client: typeof apiClient, signal: AbortSignal) => Promise<T>;
    /**
     * Dependencies array - refetch when these change
     */
    deps: unknown[];
    /**
     * Skip initial fetch (useful for conditional fetching)
     */
    skip?: boolean;
}

/**
 * Result from useApi hook
 */
export interface UseApiResult<T> {
    /** Fetched data */
    data: T | null;
    /** Loading state */
    loading: boolean;
    /** Error message if any */
    error: string | null;
    /** Manually trigger refetch */
    refetch: () => void;
}

/**
 * Hook for making authenticated API requests using api-client
 * 
 * Replaces useAuthedFetch with better integration with AuthContext
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useApi<MyType>({
 *   fetcher: (client, signal) => client.get('/v1/admin/wards', { signal }),
 *   deps: [organizationId],
 * });
 * ```
 */
export function useApi<T>({
    fetcher,
    deps,
    skip = false,
}: UseApiOptions<T>): UseApiResult<T> {
    const router = useRouter();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<string | null>(null);
    const requestSeqRef = useRef(0);

    const execute = useCallback(async (signal: AbortSignal) => {
        if (skip) {
            setLoading(false);
            return;
        }

        const requestId = ++requestSeqRef.current;
        setLoading(true);
        setError(null);

        try {
            const result = await fetcher(apiClient, signal);

            // Prevent stale updates
            if (requestId !== requestSeqRef.current) return;

            setData(result);
        } catch (err) {
            // Ignore aborted requests and stale updates
            if (signal.aborted || requestId !== requestSeqRef.current) return;

            if (err instanceof AuthError) {
                // Auth errors are already handled by api-client (redirect to login)
                return;
            }

            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError((err as Error).message || '알 수 없는 오류가 발생했습니다.');
            }
        } finally {
            if (!signal.aborted && requestId === requestSeqRef.current) {
                setLoading(false);
            }
        }
    }, [fetcher, skip, router]);

    useEffect(() => {
        const controller = new AbortController();
        execute(controller.signal);
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    const refetch = useCallback(() => {
        const controller = new AbortController();
        execute(controller.signal);
    }, [execute]);

    return { data, loading, error, refetch };
}

export default useApi;
