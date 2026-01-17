import { useEffect, useState, useCallback, useRef } from 'react';
import type { Room, RoomsSummary, AppEvent } from '../types/room';

type UseRoomSSEOptions = {
  apiBase: string | undefined;
  enabled?: boolean;
};

// Constants
const PENDING_ALERT_ROOM_KEY = 'pendingAlertRoom';
const PENDING_ALERT_DANGER_KEY = 'pendingAlertDanger';
const DANGER_STATE_TRUE = 'true';

// Safe sessionStorage access
const safeGetSessionStorage = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const safeClearSessionStorage = (key: string): void => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Silently ignore storage errors
  }
};

export function useRoomSSE({ apiBase, enabled = true }: UseRoomSSEOptions) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Initialize dangerRooms with pending alert danger state from sessionStorage
  const [dangerRooms, setDangerRooms] = useState<Record<string, boolean>>(
    () => {
      const pendingRoom = safeGetSessionStorage(PENDING_ALERT_ROOM_KEY);
      const pendingDanger = safeGetSessionStorage(PENDING_ALERT_DANGER_KEY);
      if (pendingRoom && pendingDanger === DANGER_STATE_TRUE) {
        return { [pendingRoom]: true };
      }
      return {};
    },
  );
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial rooms list
  const fetchRooms = useCallback(async () => {
    if (!apiBase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/v1/livekit/rooms`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rooms: ${response.status}`);
      }
      const data: RoomsSummary = await response.json();
      setRooms(data.rooms);
      setError(null);
    } catch (err) {
      console.error('[useRoomSSE] Failed to fetch rooms:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    if (!enabled || !apiBase) {
      console.log('[useRoomSSE] SSE disabled or no apiBase');
      return;
    }

    const sseUrl = `${apiBase}/v1/events/stream`;
    console.log(`[useRoomSSE] Connecting to SSE: ${sseUrl}`);

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[useRoomSSE] SSE connection opened');
    };

    eventSource.onmessage = event => {
      console.log('[useRoomSSE] SSE message received:', event.data);
      try {
        const data: AppEvent = JSON.parse(event.data);
        console.log('[useRoomSSE] Parsed event:', data);

        // Handle room-created event
        if (data.type === 'room-created') {
          console.log('[useRoomSSE] Room created:', data.roomName);
          // Refetch all rooms to get the complete room data
          fetchRooms();
        }

        // Handle participant events (you can expand this later)
        if (
          data.type === 'participant-joined' ||
          data.type === 'participant-left'
        ) {
          console.log(
            '[useRoomSSE] Participant event:',
            data.type,
            data.roomName,
          );
          // Refetch to get updated participant counts
          fetchRooms();
        }

        // Handle room-danger event
        if (data.type === 'room-danger') {
          console.log(
            '[useRoomSSE] Room danger event:',
            data.roomName,
            data.isDanger,
          );
          setDangerRooms(prev => ({
            ...prev,
            [data.roomName]: data.isDanger,
          }));
        }
      } catch (err) {
        console.error('[useRoomSSE] Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = err => {
      console.error('[useRoomSSE] SSE error:', err);
      // Don't set error state here to avoid UI disruption
      // The connection will auto-retry
    };

    return () => {
      console.log('[useRoomSSE] Closing SSE connection');
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [enabled, apiBase, fetchRooms]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchRooms();
    }
  }, [enabled, fetchRooms]);

  return {
    rooms,
    loading,
    error,
    dangerRooms,
    refetch: fetchRooms,
  };
}
