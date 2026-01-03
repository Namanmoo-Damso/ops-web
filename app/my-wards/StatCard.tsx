import { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: number;
  color: string;
  icon: ReactNode;
  extra?: ReactNode;
  highlight?: boolean;
  footer?: string;
};

export function StatCard({ label, value, color, icon, extra, highlight, footer }: StatCardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: highlight ? `1px solid ${color}33` : '1px solid #E9F0DF',
        borderRadius: '14px',
        padding: '16px',
        boxShadow: highlight
          ? '0 10px 30px rgba(220,38,38,0.1)'
          : '0 6px 18px rgba(15,23,42,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: '10px',
          top: '10px',
          opacity: 0.12,
          color,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: highlight ? color : '#4A5D23',
          }}
        >
          {value}
        </span>
        <span style={{ color: '#94a3b8', fontSize: '13px' }}>명</span>
      </div>
      {extra}
      {footer && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
          {footer}
        </div>
      )}
    </div>
  );
}
