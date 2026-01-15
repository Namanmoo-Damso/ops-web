'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { API_BASE } from '../lib/api-client';

export interface CareAlert {
  id: string;
  roomName: string;
  wardName?: string;
  alertType?: string;
  timestamp: number;
}

interface CareAlertContextType {
  activeAlerts: CareAlert[];
  dismissAlert: (id: string) => void;
  dismissAllAlerts: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const CareAlertContext = createContext<CareAlertContextType | undefined>(
  undefined,
);

export function useCareAlert() {
  const context = useContext(CareAlertContext);
  if (!context) {
    throw new Error('useCareAlert must be used within a CareAlertProvider');
  }
  return context;
}

// Generate alert sound using Web Audio API
function playAlertSound() {
  try {
    const audioContext = new (
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();

    // Create an oscillator for the alert beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Alert sound: two-tone beep
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Second beep after short pause
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();

      osc2.connect(gain2);
      gain2.connect(audioContext.destination);

      osc2.frequency.value = 1100; // C#6 note - higher pitch
      osc2.type = 'sine';

      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3,
      );

      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.3);
    }, 150);
  } catch (e) {
    console.warn('[CareAlertContext] Failed to play alert sound:', e);
  }
}

interface CareAlertProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function CareAlertProvider({
  children,
  enabled = true,
}: CareAlertProviderProps) {
  const [activeAlerts, setActiveAlerts] = useState<CareAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  const dismissAlert = useCallback((id: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const dismissAllAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  const addAlert = useCallback(
    (alert: CareAlert) => {
      setActiveAlerts(prev => {
        // Prevent duplicate alerts for the same room
        const exists = prev.some(a => a.roomName === alert.roomName);
        if (exists) return prev;

        // Play sound for new alert
        if (soundEnabled) {
          playAlertSound();
        }

        return [alert, ...prev];
      });
    },
    [soundEnabled],
  );

  const removeAlertByRoom = useCallback((roomName: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.roomName !== roomName));
  }, []);

  // Subscribe to SSE for room-danger events
  useEffect(() => {
    if (!enabled || !API_BASE) {
      return;
    }

    const sseUrl = `${API_BASE}/v1/events/stream`;
    console.log(`[CareAlertProvider] Connecting to SSE: ${sseUrl}`);

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[CareAlertProvider] SSE connection opened');
    };

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        // Handle room-danger event
        if (data.type === 'room-danger') {
          console.log(
            '[CareAlertProvider] Room danger event:',
            data.roomName,
            data.isDanger,
          );

          if (data.isDanger) {
            // Extract alert info from event name (e.g., "device_fall:wardId")
            const alertType = data.name?.split(':')[0] || 'unknown';
            addAlert({
              id: `${data.roomName}-${Date.now()}`,
              roomName: data.roomName,
              alertType,
              timestamp: Date.now(),
            });
          } else {
            // Remove alert when danger is cleared
            removeAlertByRoom(data.roomName);
          }
        }
      } catch (err) {
        console.error('[CareAlertProvider] Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = err => {
      console.error('[CareAlertProvider] SSE error:', err);
    };

    return () => {
      console.log('[CareAlertProvider] Closing SSE connection');
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [enabled, addAlert, removeAlertByRoom]);

  return (
    <CareAlertContext.Provider
      value={{
        activeAlerts,
        dismissAlert,
        dismissAllAlerts,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </CareAlertContext.Provider>
  );
}
