import { useEffect, useState, useCallback, useRef } from 'react';
import { API_BASE } from '../lib/api-client';

type RiskLevel = 'normal' | 'caution' | 'critical';

export interface LocationDangerState {
  isDanger: boolean;
  riskLevel: RiskLevel;
  alertType?: string;
  timestamp: number;
}

// Map riskLevel to location status
// caution → warning, critical → emergency
export function riskLevelToStatus(riskLevel: RiskLevel): 'normal' | 'warning' | 'emergency' {
  switch (riskLevel) {
    case 'critical':
      return 'emergency';
    case 'caution':
      return 'warning';
    default:
      return 'normal';
  }
}

// Reconnection constants
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const RETRY_MULTIPLIER = 2;

interface UseLocationDangerSSEOptions {
  enabled?: boolean;
}

/**
 * SSE hook for real-time location danger state updates.
 * Listens to room-danger events and maps them to wardId for location markers.
 */
export function useLocationDangerSSE({ enabled = true }: UseLocationDangerSSEOptions = {}) {
  // wardId -> LocationDangerState
  const [dangerStates, setDangerStates] = useState<Record<string, LocationDangerState>>({});
  const [connected, setConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const connectSSE = useCallback(() => {
    if (!enabled || !API_BASE || !mountedRef.current) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const sseUrl = `${API_BASE}/v1/events/stream`;
    console.log(`[useLocationDangerSSE] Connecting to SSE: ${sseUrl}`);

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[useLocationDangerSSE] SSE connection opened');
      setConnected(true);
      retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
    };

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        // Only handle room-danger events
        if (data.type === 'room-danger' && data.wardId) {
          console.log('[useLocationDangerSSE] Room danger event:', data.wardId, data.isDanger, data.riskLevel);

          setDangerStates(prev => {
            if (data.isDanger) {
              return {
                ...prev,
                [data.wardId]: {
                  isDanger: true,
                  riskLevel: data.riskLevel || 'critical',
                  alertType: data.alertType,
                  timestamp: Date.now(),
                },
              };
            } else {
              // Remove danger state when cleared
              const { [data.wardId]: _, ...rest } = prev;
              return rest;
            }
          });
        }
      } catch (err) {
        console.error('[useLocationDangerSSE] Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('[useLocationDangerSSE] SSE connection error, will reconnect...');
      setConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      // Schedule reconnection with exponential backoff
      if (mountedRef.current) {
        const delay = retryDelayRef.current;
        console.log(`[useLocationDangerSSE] Reconnecting in ${delay}ms...`);

        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectSSE();
          }
        }, delay);

        retryDelayRef.current = Math.min(
          retryDelayRef.current * RETRY_MULTIPLIER,
          MAX_RETRY_DELAY_MS
        );
      }
    };
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !API_BASE) {
      console.log('[useLocationDangerSSE] SSE disabled or no API_BASE');
      return;
    }

    connectSSE();

    return () => {
      console.log('[useLocationDangerSSE] Cleaning up SSE connection');
      mountedRef.current = false;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled, connectSSE]);

  /**
   * Get the effective status for a ward, considering SSE danger state.
   * SSE state takes priority over API-fetched state.
   */
  const getEffectiveStatus = useCallback(
    (wardId: string, apiStatus: 'normal' | 'warning' | 'emergency'): 'normal' | 'warning' | 'emergency' => {
      const dangerState = dangerStates[wardId];
      if (dangerState?.isDanger) {
        return riskLevelToStatus(dangerState.riskLevel);
      }
      return apiStatus;
    },
    [dangerStates]
  );

  return {
    dangerStates,
    connected,
    getEffectiveStatus,
  };
}
