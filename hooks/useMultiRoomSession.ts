import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Room, RoomConnection } from '../types/room';
import type { Admin } from '../types/models';

type UseMultiRoomSessionOptions = {
  apiBase: string | undefined;
  rooms: Room[];
  enabled?: boolean;
};

// Cache admin identity to avoid refetching
let cachedAdminIdentity: string | null = null;

export function useMultiRoomSession({
  apiBase,
  rooms,
  enabled = true,
}: UseMultiRoomSessionOptions) {
  const [connections, setConnections] = useState<
    Record<string, RoomConnection>
  >({});
  const [adminIdentity, setAdminIdentity] = useState<string>(cachedAdminIdentity || '');
  const pendingJoinsRef = useRef<Set<string>>(new Set());

  // Fetch admin info on mount (with caching)
  useEffect(() => {
    // Use cached value if available
    if (cachedAdminIdentity) {
      setAdminIdentity(cachedAdminIdentity);
      return;
    }

    const fetchAdminInfo = async () => {
      try {
        const adminAccessToken =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('admin_access_token')
            : null;

        if (!adminAccessToken) return;

        const apiBaseResolved =
          apiBase ||
          (typeof window !== 'undefined' ? window.location.origin : '');
        const res = await fetch(`${apiBaseResolved}/admin/me`, {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        });

        if (res.ok) {
          const data = (await res.json()) as { admin: Admin };
          const adminId = data.admin?.id || '';
          const identity = `admin_${adminId}`;
          cachedAdminIdentity = identity;
          setAdminIdentity(identity);
        }
      } catch (err) {
        console.error('Failed to fetch admin info:', err);
      }
    };

    fetchAdminInfo();
  }, [apiBase]);

  // Join a specific room
  const joinRoom = useCallback(
    async (roomName: string) => {
      try {
        const apiBaseResolved =
          apiBase ||
          (typeof window !== 'undefined' ? window.location.origin : '');

        const adminAccessToken =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('admin_access_token')
            : null;

        if (!adminAccessToken) {
          console.error(
            `[useMultiRoomSession] No admin token for room: ${roomName}`,
          );
          return;
        }

        console.log(`[useMultiRoomSession] Joining room: ${roomName}`);

        const rtcRes = await fetch(`${apiBaseResolved}/v1/rtc/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({
            roomName,
            role: 'host',
          }),
        });

        if (!rtcRes.ok) {
          console.error(
            `[useMultiRoomSession] Failed to join room ${roomName}: ${rtcRes.status}`,
          );
          return;
        }

        const rtcData = await rtcRes.json();
        if (!rtcData?.token) {
          console.error(
            `[useMultiRoomSession] No token received for room: ${roomName}`,
          );
          return;
        }

        setConnections(prev => ({
          ...prev,
          [roomName]: {
            roomName,
            token: rtcData.token,
            serverUrl: rtcData.livekitUrl,
            connected: true,
          },
        }));

        console.log(
          `[useMultiRoomSession] Successfully joined room: ${roomName}`,
        );
      } catch (err) {
        console.error(
          `[useMultiRoomSession] Error joining room ${roomName}:`,
          err,
        );
      }
    },
    [apiBase],
  );

  // Leave a specific room
  const leaveRoom = useCallback((roomName: string) => {
    setConnections(prev => {
      const next = { ...prev };
      delete next[roomName];
      return next;
    });
    console.log(`[useMultiRoomSession] Left room: ${roomName}`);
  }, []);

  // Auto-join all rooms when they appear (but only rooms with non-admin participants)
  useEffect(() => {
    console.log('[useMultiRoomSession] Auto-join effect triggered', {
      enabled,
      apiBase: !!apiBase,
      adminIdentity,
      roomsCount: rooms.length,
    });

    if (!enabled) {
      console.log('[useMultiRoomSession] Auto-join disabled: enabled=false');
      return;
    }
    if (!apiBase) {
      console.log('[useMultiRoomSession] Auto-join disabled: no apiBase');
      return;
    }
    if (!adminIdentity) {
      console.log('[useMultiRoomSession] Auto-join disabled: no adminIdentity');
      return;
    }

    const currentRoomNames = new Set(Object.keys(connections));

    // Filter rooms to only join those with at least one non-admin participant
    const roomsWithNonAdminParticipants = rooms.filter(room =>
      room.participants.some(p => !p.identity.startsWith('admin_')),
    );
    const newRoomNames = new Set(
      roomsWithNonAdminParticipants.map(r => r.name),
    );

    // Find rooms to join (not already connected and not pending)
    const roomsToJoin = Array.from(newRoomNames).filter(
      roomName => !currentRoomNames.has(roomName) && !pendingJoinsRef.current.has(roomName)
    );

    // Find rooms to leave
    const roomsToLeave = Array.from(currentRoomNames).filter(
      roomName => !newRoomNames.has(roomName)
    );

    console.log('[useMultiRoomSession] Room changes:', {
      toJoin: roomsToJoin,
      toLeave: roomsToLeave,
    });

    // Leave rooms that no longer exist or have no non-admin participants
    roomsToLeave.forEach(roomName => {
      console.log(
        `[useMultiRoomSession] Leaving room (no participants or room closed): ${roomName}`,
      );
      leaveRoom(roomName);
    });

    // Join new rooms in PARALLEL for lower latency
    if (roomsToJoin.length > 0) {
      // Mark rooms as pending to prevent duplicate joins
      roomsToJoin.forEach(roomName => pendingJoinsRef.current.add(roomName));

      console.log(`[useMultiRoomSession] Joining ${roomsToJoin.length} rooms in parallel`);

      // Join all rooms concurrently
      Promise.allSettled(
        roomsToJoin.map(async roomName => {
          try {
            await joinRoom(roomName);
          } catch (err) {
            console.error(`[useMultiRoomSession] Failed to join room ${roomName}:`, err);
          } finally {
            // Remove from pending set after join completes (success or failure)
            pendingJoinsRef.current.delete(roomName);
          }
        })
      );
    }
  }, [
    enabled,
    apiBase,
    adminIdentity,
    rooms,
    connections,
    joinRoom,
    leaveRoom,
  ]);

  // Memoize the connections array and sort by room creation time
  // This provides stable ordering across page refreshes
  const connectionsArray = useMemo(() => {
    const connectionValues = Object.values(connections);
    if (connectionValues.length === 0) return [];

    // Create a map of room name to its createdAt timestamp
    const roomCreatedAtMap = new Map(
      rooms.map(room => [room.name, room.createdAt || ''])
    );

    // Sort connections by createdAt timestamp (oldest first)
    return connectionValues.sort((a, b) => {
      const createdA = roomCreatedAtMap.get(a.roomName) || '';
      const createdB = roomCreatedAtMap.get(b.roomName) || '';
      return createdA.localeCompare(createdB);
    });
  }, [connections, rooms]);

  return {
    connections: connectionsArray,
    adminIdentity,
  };
}
