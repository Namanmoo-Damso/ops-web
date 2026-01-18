import { useEffect, useState, useCallback, useRef } from 'react';
import type { Room, RoomsSummary, AppEvent, RoomParticipant } from '../types/room';

type UseRoomSSEOptions = {
  apiBase: string | undefined;
  enabled?: boolean;
};

// Constants
const PENDING_ALERT_ROOM_KEY = 'pendingAlertRoom';
const PENDING_ALERT_DANGER_KEY = 'pendingAlertDanger';
const DANGER_STATE_TRUE = 'true';

// Reconnection constants
const INITIAL_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;
const RETRY_MULTIPLIER = 2;

// Safe sessionStorage access
const safeGetSessionStorage = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

export function useRoomSSE({ apiBase, enabled = true }: UseRoomSSEOptions) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
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
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY_MS);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

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

  // Incremental update handlers - avoid full refetch
  const handleRoomCreated = useCallback((roomName: string) => {
    setRooms(prev => {
      // If room already exists, skip
      if (prev.some(r => r.name === roomName)) return prev;
      // Add minimal room entry (will be updated on participant join)
      const newRoom: Room = {
        name: roomName,
        metadata: null,
        createdAt: new Date().toISOString(),
        numParticipants: 0,
        numPublishers: null,
        participants: [],
      };
      return [...prev, newRoom];
    });
  }, []);

  const handleParticipantJoined = useCallback((roomName: string, identity?: string, name?: string) => {
    setRooms(prev => {
      const roomIndex = prev.findIndex(r => r.name === roomName);
      if (roomIndex === -1) {
        // Room doesn't exist yet, create it with this participant
        if (identity) {
          const newRoom: Room = {
            name: roomName,
            metadata: null,
            createdAt: new Date().toISOString(),
            numParticipants: 1,
            numPublishers: null,
            participants: [{
              identity,
              name: name || identity,
              metadata: null,
              joinedAt: new Date().toISOString(),
            }],
          };
          return [...prev, newRoom];
        }
        return prev;
      }

      const room = prev[roomIndex];
      // Check if participant already exists
      if (identity && room.participants.some(p => p.identity === identity)) {
        return prev;
      }

      const newParticipant: RoomParticipant | null = identity ? {
        identity,
        name: name || identity,
        metadata: null,
        joinedAt: new Date().toISOString(),
      } : null;

      const updatedRoom: Room = {
        ...room,
        participants: newParticipant
          ? [...room.participants, newParticipant]
          : room.participants,
        numParticipants: room.numParticipants + 1,
      };

      const newRooms = [...prev];
      newRooms[roomIndex] = updatedRoom;
      return newRooms;
    });
  }, []);

  const handleParticipantLeft = useCallback((roomName: string, participantIdentity?: string) => {
    setRooms(prev => {
      const roomIndex = prev.findIndex(r => r.name === roomName);
      if (roomIndex === -1) return prev;

      const room = prev[roomIndex];
      const updatedRoom: Room = {
        ...room,
        participants: participantIdentity
          ? room.participants.filter(p => p.identity !== participantIdentity)
          : room.participants,
        numParticipants: Math.max(0, room.numParticipants - 1),
      };

      const newRooms = [...prev];
      newRooms[roomIndex] = updatedRoom;
      return newRooms;
    });
  }, []);

  // Connect to SSE with reconnection logic
  const connectSSE = useCallback(() => {
    if (!enabled || !apiBase || !mountedRef.current) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const sseUrl = `${apiBase}/v1/events/stream`;
    console.log(`[useRoomSSE] Connecting to SSE: ${sseUrl}`);

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[useRoomSSE] SSE connection opened');
      setConnected(true);
      setError(null);
      // Reset retry delay on successful connection
      retryDelayRef.current = INITIAL_RETRY_DELAY_MS;
    };

    eventSource.onmessage = event => {
      try {
        const data: AppEvent = JSON.parse(event.data);

        switch (data.type) {
          case 'room-created':
            console.log('[useRoomSSE] Room created:', data.roomName);
            handleRoomCreated(data.roomName);
            break;

          case 'participant-joined':
            // RoomEvent has identity and name directly on the event
            console.log('[useRoomSSE] Participant joined:', data.roomName, data.identity);
            handleParticipantJoined(data.roomName, data.identity, data.name);
            break;

          case 'participant-left':
            console.log('[useRoomSSE] Participant left:', data.roomName, data.identity);
            handleParticipantLeft(data.roomName, data.identity);
            break;

          case 'room-danger':
            console.log('[useRoomSSE] Room danger:', data.roomName, data.isDanger);
            setDangerRooms(prev => ({
              ...prev,
              [data.roomName]: data.isDanger,
            }));
            break;

          default:
            // Includes room-updated, user-logout, user-deleted
            console.log('[useRoomSSE] Unhandled event type:', data.type);
        }
      } catch (err) {
        console.error('[useRoomSSE] Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('[useRoomSSE] SSE connection error, will reconnect...');
      setConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      // Schedule reconnection with exponential backoff
      if (mountedRef.current) {
        const delay = retryDelayRef.current;
        console.log(`[useRoomSSE] Reconnecting in ${delay}ms...`);

        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectSSE();
          }
        }, delay);

        // Increase delay for next retry (with cap)
        retryDelayRef.current = Math.min(
          retryDelayRef.current * RETRY_MULTIPLIER,
          MAX_RETRY_DELAY_MS
        );
      }
    };
  }, [enabled, apiBase, handleRoomCreated, handleParticipantJoined, handleParticipantLeft]);

  // Subscribe to SSE for real-time updates
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || !apiBase) {
      console.log('[useRoomSSE] SSE disabled or no apiBase');
      return;
    }

    connectSSE();

    return () => {
      console.log('[useRoomSSE] Cleaning up SSE connection');
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
  }, [enabled, apiBase, connectSSE]);

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
    connected,
    dangerRooms,
    refetch: fetchRooms,
  };
}
