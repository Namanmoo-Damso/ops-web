import { ReactNode } from 'react';
import { cn } from '../../components/ui/utils';

type StatCardProps = {
  label: string;
  value: number;
  color?: string;
  icon: ReactNode;
  extra?: ReactNode;
  highlight?: boolean;
  footer?: string;
};

export function StatCard({ label, value, color, icon, extra, highlight, footer }: StatCardProps) {
  return (
    <div className={cn('stat-card', highlight && 'highlight')}>
      <div className="stat-card-icon" style={color ? { color } : undefined}>
        {icon}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">
        <span className={cn('stat-card-number', highlight && 'highlight')} style={highlight && color ? { color } : undefined}>
          {value}
        </span>
        <span className="stat-card-unit">명</span>
      </div>
      {extra}
      {footer && <div className="stat-card-footer">{footer}</div>}
    </div>
  );
}
