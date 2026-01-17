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
  wardId?: string;
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
  suspended: boolean; // True when ParticipantDetailSidebar is open
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

// Play a single alert beep (two-tone)
function playAlertBeep(audioContext: AudioContext) {
  // First beep
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 880; // A5 note
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.2,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);

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
      audioContext.currentTime + 0.2,
    );

    osc2.start(audioContext.currentTime);
    osc2.stop(audioContext.currentTime + 0.2);
  }, 120);
}

// Alarm controller for continuous sound
class AlarmController {
  private audioContext: AudioContext | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying) return;

    try {
      this.audioContext = new (
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();

      this.isPlaying = true;

      // Play immediately
      playAlertBeep(this.audioContext);

      // Repeat every 2 seconds
      this.intervalId = setInterval(() => {
        if (this.audioContext && this.isPlaying) {
          playAlertBeep(this.audioContext);
        }
      }, 2000);
    } catch (e) {
      console.warn('[AlarmController] Failed to start alarm:', e);
    }
  }

  stop() {
    this.isPlaying = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  get playing() {
    return this.isPlaying;
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
  const [suspended, setSuspended] = useState(false); // True when detail sidebar is open
  const eventSourceRef = useRef<EventSource | null>(null);
  const alarmRef = useRef<AlarmController | null>(null);

  // Initialize alarm controller
  useEffect(() => {
    alarmRef.current = new AlarmController();
    return () => {
      alarmRef.current?.stop();
    };
  }, []);

  // Manage alarm based on active alerts, sound setting, and suspended state
  useEffect(() => {
    if (!alarmRef.current) return;

    // Only play alarm if there are alerts, sound is enabled, AND not suspended
    if (activeAlerts.length > 0 && soundEnabled && !suspended) {
      alarmRef.current.start();
    } else {
      alarmRef.current.stop();
    }
  }, [activeAlerts.length, soundEnabled, suspended]);

  // Listen for sidebar state changes from page.tsx
  useEffect(() => {
    const handleSidebarStateChange = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const { isOpen } = event.detail as { isOpen: boolean };
      setSuspended(isOpen);
    };

    window.addEventListener('detailSidebarStateChange', handleSidebarStateChange);
    return () => {
      window.removeEventListener('detailSidebarStateChange', handleSidebarStateChange);
    };
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const dismissAllAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  const addAlert = useCallback((alert: CareAlert) => {
    setActiveAlerts(prev => {
      // Prevent duplicate alerts for the same room
      const exists = prev.some(a => a.roomName === alert.roomName);
      if (exists) return prev;
      return [alert, ...prev];
    });
  }, []);

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
            data.wardName,
          );

          if (data.isDanger) {
            // Use wardName and alertType from event data if available
            const alertType =
              data.alertType || data.name?.split(':')[0] || 'unknown';
            addAlert({
              id: `${data.roomName}-${Date.now()}`,
              roomName: data.roomName,
              wardId: data.wardId,
              wardName: data.wardName,
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
        suspended,
      }}
    >
      {children}
    </CareAlertContext.Provider>
  );
}
