/**
 * API Response Envelopes
 */

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    code?: string;
    details?: unknown;
}

export interface DataListResponse<T> {
    data: T[];
    total?: number;
}

export interface SearchParams {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    [key: string]: string | number | undefined;
}
