/**
 * API Client
 *
 * Centralized fetch wrapper with automatic authentication
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) {
  throw new Error('NEXT_PUBLIC_API_BASE 환경 변수가 설정되지 않았습니다.');
}

/** API Error with status code */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Auth Error (401/403) */
export class AuthError extends ApiError {
  constructor(message = '인증이 필요합니다.') {
    super(message, 401);
    this.name = 'AuthError';
  }
}

/** Request options */
interface RequestOptions {
  /** Skip authentication header */
  skipAuth?: boolean;
  /** Request headers */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Get access token from localStorage
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_access_token');
}

/**
 * Handle auth error - clear session
 */
function handleAuthError(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_access_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_info');
  window.location.replace('/login');
}

/**
 * Make authenticated API request
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, headers = {}, signal } = options;

  const url = `${API_BASE}${path}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!skipAuth) {
    const token = getToken();
    if (!token) {
      throw new AuthError('로그인이 필요합니다.');
    }
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  // Handle auth errors
  if (response.status === 401 || response.status === 403) {
    handleAuthError();
    throw new AuthError('인증이 만료되었습니다.');
  }

  // Handle other errors
  if (!response.ok) {
    let errorMessage = `요청 실패 (${response.status})`;
    let errorData: unknown;

    try {
      errorData = await response.json();
      if (
        typeof errorData === 'object' &&
        errorData !== null &&
        'message' in errorData
      ) {
        errorMessage = String((errorData as { message: unknown }).message);
      }
    } catch {
      // Failed to parse error response
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Handle empty response
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * API Client object
 *
 * @example
 * ```ts
 * import { apiClient } from '@/lib/api-client';
 *
 * // GET request
 * const data = await apiClient.get<MyType>('/v1/admin/wards');
 *
 * // POST request
 * await apiClient.post('/v1/admin/wards', { name: 'test' });
 *
 * // With abort signal
 * const controller = new AbortController();
 * const data = await apiClient.get('/v1/data', { signal: controller.signal });
 * ```
 */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

export default apiClient;
