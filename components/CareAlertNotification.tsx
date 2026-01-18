'use client';

import { type CSSProperties } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle, X, Volume2, VolumeX, MonitorPlay } from 'lucide-react';
import { useCareAlert, type CareAlert } from '../contexts/CareAlertContext';

const ALERT_TYPE_LABELS: Record<string, string> = {
  device_fall: '기기 낙상 감지',
  person_fall: '낙상 감지',
  loud_voice: '이상 발화 감지',
  unknown: '위급 상황 감지',
};

// Constants
const PENDING_ALERT_ROOM_KEY = 'pendingAlertRoom';
const PENDING_ALERT_DANGER_KEY = 'pendingAlertDanger';
const DANGER_STATE_TRUE = 'true';
const HOME_PATH = '/monitoring';

// Safe sessionStorage access
const safeSetSessionStorage = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  } catch {
    console.warn(
      `[CareAlertNotification] Failed to set sessionStorage[${key}]`,
    );
  }
};

function AlertItem({
  alert,
  onDismiss,
  onNavigateToMonitor,
}: {
  alert: CareAlert;
  onDismiss: () => void;
  onNavigateToMonitor: () => void;
}) {
  const alertLabel =
    ALERT_TYPE_LABELS[alert.alertType || 'unknown'] || '위급 상황 감지';
  // wardName만 표시, roomName은 숨김
  const displayName = alert.wardName || '알 수 없음';

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

  const monitorButtonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    marginTop: '8px',
    border: '1px solid var(--color-danger-main, #dc2626)',
    borderRadius: '8px',
    background: 'transparent',
    color: 'var(--color-danger-main, #dc2626)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  };

  return (
    <div style={itemStyle}>
      <div style={iconContainerStyle}>
        <AlertTriangle size={20} color="var(--color-danger-main, #dc2626)" />
      </div>
      <div style={contentStyle}>
        <p style={titleStyle}>{alertLabel}</p>
        <p style={descStyle}>
          {displayName} · {timeLabel}
        </p>
        <button
          style={monitorButtonStyle}
          onClick={onNavigateToMonitor}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor =
              'var(--color-danger-main, #dc2626)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-danger-main, #dc2626)';
          }}
        >
          <MonitorPlay size={14} />
          모니터링 보기
        </button>
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

export default function CareAlertNotification({
  onSelectRoom,
}: {
  onSelectRoom?: (roomName: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    activeAlerts,
    dismissAlert,
    dismissAllAlerts,
    soundEnabled,
    setSoundEnabled,
    suspended,
  } = useCareAlert();

  const handleNavigateToMonitor = (alert: CareAlert) => {
    // Store the room name and danger state to select
    safeSetSessionStorage(PENDING_ALERT_ROOM_KEY, alert.roomName);
    safeSetSessionStorage(PENDING_ALERT_DANGER_KEY, DANGER_STATE_TRUE);

    // If not on monitoring page, navigate to it
    if (pathname !== HOME_PATH) {
      router.push(HOME_PATH);
    } else {
      // Already on monitoring page, trigger via callback or dispatch event
      onSelectRoom?.(alert.roomName);
      // Also dispatch custom event for the monitoring page to listen
      try {
        window.dispatchEvent(
          new CustomEvent('selectAlertRoom', {
            detail: { roomName: alert.roomName, isDanger: true },
          }),
        );
      } catch (err) {
        console.warn(
          '[CareAlertNotification] Failed to dispatch selectAlertRoom event:',
          err,
        );
      }
    }
  };

  // Hide notifications when suspended (detail sidebar is open) or no alerts
  if (suspended || activeAlerts.length === 0) {
    return null;
  }

  // Use CSS variable for header height - it's defined globally on :root
  const containerStyle: CSSProperties = {
    position: 'fixed',
    top: 'calc(var(--header-height, 64px) + 16px)',
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
            onNavigateToMonitor={() => handleNavigateToMonitor(alert)}
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
