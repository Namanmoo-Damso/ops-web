import { useState, useEffect, useCallback } from 'react';
import type { Room } from '../types/room';

type RoomConnection = {
  roomName: string;
  token: string;
  serverUrl: string;
  connected: boolean;
};

type UseMultiRoomSessionOptions = {
  apiBase: string;
  livekitUrl: string;
  rooms: Room[];
  enabled?: boolean;
};

export function useMultiRoomSession({
  apiBase,
  livekitUrl,
  rooms,
  enabled = true,
}: UseMultiRoomSessionOptions) {
  const [connections, setConnections] = useState<Record<string, RoomConnection>>({});
  const [adminIdentity, setAdminIdentity] = useState<string>('');

  // Fetch admin info on mount
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const adminAccessToken =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('admin_access_token')
            : null;

        if (!adminAccessToken) return;

        const apiBaseResolved = apiBase || (typeof window !== 'undefined' ? window.location.origin : '');
        const res = await fetch(`${apiBaseResolved}/admin/me`, {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const adminId = data.admin?.id || '';
          setAdminIdentity(`admin_${adminId}`);
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
        const apiBaseResolved = apiBase || (typeof window !== 'undefined' ? window.location.origin : '');

        const adminAccessToken =
          typeof window !== 'undefined' ? window.localStorage.getItem('admin_access_token') : null;

        if (!adminAccessToken) {
          console.error(`[useMultiRoomSession] No admin token for room: ${roomName}`);
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
          console.error(`[useMultiRoomSession] Failed to join room ${roomName}: ${rtcRes.status}`);
          return;
        }

        const rtcData = await rtcRes.json();
        if (!rtcData?.token) {
          console.error(`[useMultiRoomSession] No token received for room: ${roomName}`);
          return;
        }

        setConnections((prev) => ({
          ...prev,
          [roomName]: {
            roomName,
            token: rtcData.token,
            serverUrl: rtcData.livekitUrl || livekitUrl,
            connected: true,
          },
        }));

        console.log(`[useMultiRoomSession] Successfully joined room: ${roomName}`);
      } catch (err) {
        console.error(`[useMultiRoomSession] Error joining room ${roomName}:`, err);
      }
    },
    [apiBase, livekitUrl],
  );

  // Leave a specific room
  const leaveRoom = useCallback((roomName: string) => {
    setConnections((prev) => {
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
      rooms: rooms.map((r) => ({
        name: r.name,
        participants: r.participants.map((p) => p.identity),
      })),
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
    const roomsWithNonAdminParticipants = rooms.filter((room) =>
      room.participants.some((p) => !p.identity.startsWith('admin_'))
    );
    const newRoomNames = new Set(roomsWithNonAdminParticipants.map((r) => r.name));

    console.log('[useMultiRoomSession] Filtered rooms with non-admin participants:', {
      total: rooms.length,
      withNonAdmin: roomsWithNonAdminParticipants.length,
      newRoomNames: Array.from(newRoomNames),
      currentRoomNames: Array.from(currentRoomNames),
    });

    // Join new rooms that have non-admin participants
    newRoomNames.forEach((roomName) => {
      if (!currentRoomNames.has(roomName)) {
        console.log(`[useMultiRoomSession] Joining room with participants: ${roomName}`);
        joinRoom(roomName);
      }
    });

    // Leave rooms that no longer exist or have no non-admin participants
    currentRoomNames.forEach((roomName) => {
      if (!newRoomNames.has(roomName)) {
        console.log(`[useMultiRoomSession] Leaving room (no participants or room closed): ${roomName}`);
        leaveRoom(roomName);
      }
    });
  }, [enabled, apiBase, adminIdentity, rooms, connections, joinRoom, leaveRoom]);

  return {
    connections: Object.values(connections),
    adminIdentity,
  };
}
