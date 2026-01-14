/**
 * Common shared types
 */

export type Status = 'active' | 'inactive' | 'pending' | 'deleted';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SortOrder = 'asc' | 'desc';
export type Role = 'admin' | 'manager' | 'viewer';

export interface DateRange {
    startDate: string;
    endDate: string;
}

export interface Coordinates {
    lat: number;
    lng: number;
}
