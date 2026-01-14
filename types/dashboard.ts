import type { ReactNode } from 'react';

/**
 * API Response for My Wards stats
 */
export type MyWardsStatsResponse = {
    stats?: {
        total: number;
        registered: number;
    };
};

/**
 * Hero Section Copy Configuration
 */
export type HeroCopy = {
    title: string;
    desc: ReactNode;
    action: ReactNode;
};
