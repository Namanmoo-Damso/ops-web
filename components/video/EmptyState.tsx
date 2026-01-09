'use client';

export interface EmptyStateProps {
  message: string;
}

export const EmptyState = ({ message }: EmptyStateProps) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '16px',
    }}
  >
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748b"
      strokeWidth="1.5"
    >
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <p
      style={{
        fontSize: '16px',
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
      }}
    >
      {message}
    </p>
  </div>
);
