'use client';

import { type CSSProperties } from 'react';
import { AlertTriangle, X, Volume2, VolumeX } from 'lucide-react';
import { useCareAlert, type CareAlert } from '../contexts/CareAlertContext';

const ALERT_TYPE_LABELS: Record<string, string> = {
  device_fall: '기기 낙상 감지',
  person_fall: '낙상 감지',
  loud_voice: '이상 발화 감지',
  unknown: '위급 상황 감지',
};

function AlertItem({
  alert,
  onDismiss,
}: {
  alert: CareAlert;
  onDismiss: () => void;
}) {
  const alertLabel =
    ALERT_TYPE_LABELS[alert.alertType || 'unknown'] || '위급 상황 감지';

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    animation: 'slideInRight 0.3s ease-out, pulse 2s ease-in-out infinite',
    border: '2px solid var(--color-danger-main, #dc2626)',
  };

  const iconContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-danger-light, #fee2e2)',
    flexShrink: 0,
  };

  const contentStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--color-danger-main, #dc2626)',
    marginBottom: '4px',
  };

  const descStyle: CSSProperties = {
    margin: 0,
    fontSize: '13px',
    color: 'var(--color-text-secondary, #64748b)',
  };

  const closeButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: 'var(--color-text-muted, #94a3b8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 150ms ease',
  };

  const timeAgo = Math.floor((Date.now() - alert.timestamp) / 1000);
  const timeLabel =
    timeAgo < 60 ? '방금 전' : `${Math.floor(timeAgo / 60)}분 전`;

  return (
    <div style={itemStyle}>
      <div style={iconContainerStyle}>
        <AlertTriangle size={20} color="var(--color-danger-main, #dc2626)" />
      </div>
      <div style={contentStyle}>
        <p style={titleStyle}>{alertLabel}</p>
        <p style={descStyle}>
          {alert.wardName || alert.roomName} · {timeLabel}
        </p>
      </div>
      <button
        style={closeButtonStyle}
        onClick={onDismiss}
        aria-label="알림 닫기"
        onMouseEnter={e =>
          (e.currentTarget.style.backgroundColor =
            'var(--color-bg-hover, #f1f5f9)')
        }
        onMouseLeave={e =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default function CareAlertNotification() {
  const {
    activeAlerts,
    dismissAlert,
    dismissAllAlerts,
    soundEnabled,
    setSoundEnabled,
  } = useCareAlert();

  if (activeAlerts.length === 0) {
    return null;
  }

  const containerStyle: CSSProperties = {
    position: 'fixed',
    top: '80px',
    right: '24px',
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '380px',
    width: '100%',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: 'var(--color-danger-main, #dc2626)',
    borderRadius: '8px',
    color: 'white',
  };

  const headerTitleStyle: CSSProperties = {
    margin: 0,
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const headerActionsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const iconButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  };

  const clearButtonStyle: CSSProperties = {
    ...iconButtonStyle,
    fontSize: '12px',
    padding: '4px 8px',
  };

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
          }
          50% {
            box-shadow: 0 4px 20px rgba(220, 38, 38, 0.35);
          }
        }
      `}</style>
      <div style={containerStyle} role="alert" aria-live="assertive">
        <div style={headerStyle}>
          <p style={headerTitleStyle}>
            <AlertTriangle size={16} />
            위급 상황 알림 ({activeAlerts.length}건)
          </p>
          <div style={headerActionsStyle}>
            <button
              style={iconButtonStyle}
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? '알림음 끄기' : '알림음 켜기'}
              title={soundEnabled ? '알림음 끄기' : '알림음 켜기'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              style={clearButtonStyle}
              onClick={dismissAllAlerts}
              aria-label="모두 닫기"
            >
              모두 닫기
            </button>
          </div>
        </div>
        {activeAlerts.slice(0, 5).map(alert => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissAlert(alert.id)}
          />
        ))}
        {activeAlerts.length > 5 && (
          <p
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            외 {activeAlerts.length - 5}건의 알림이 더 있습니다
          </p>
        )}
      </div>
    </>
  );
}
