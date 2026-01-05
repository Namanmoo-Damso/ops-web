import type { ReactElement } from 'react';

export type StatTone = 'dark' | 'muted' | 'primary' | 'warning';

export type HeroCopy = {
  title: string;
  desc: ReactElement;
  action: ReactElement;
};

export type FeatureCardProps = {
  icon: ReactElement;
  cornerIcon: ReactElement;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
};

export type StatCardProps = {
  label: string;
  value: string;
  unit: string;
  icon: ReactElement;
  badge?: string;
  tone: StatTone;
};

export type MyWardsStatsResponse = {
  stats?: {
    total: number;
    registered: number;
  };
};
