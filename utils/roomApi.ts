import { Track, VideoQuality, TrackPublication } from 'livekit-client';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { API_BASE } from '../lib/api-client';

/** Extended publication interface for version compatibility */
interface ExtendedPublication extends TrackPublication {
  setSubscribed?: (subscribed: boolean) => void;
  setPreferredLayer?: (quality: VideoQuality) => void;
  setPriority?: (priority: number) => void;
  setVideoQuality?: (quality: VideoQuality) => void;
  setVideoDimensions?: (dimensions: { width: number; height: number }) => void;
}

/** Track module with optional Priority enum (version-dependent) */
interface TrackWithPriority {
  Priority?: { HIGH?: number };
}

/**
 * Request high quality video for a track
 */
export const requestHighQuality = (
  trackRef: TrackReferenceOrPlaceholder | undefined,
  context?: { participantId?: string; roomName?: string; source?: string },
) => {
  const pub = trackRef?.publication as ExtendedPublication | undefined;
  if (!pub) return;

  console.debug('[video] request high quality', {
    participantId: context?.participantId,
    roomName: context?.roomName,
    source: context?.source,
    trackSid: pub.trackSid,
  });

  try {
    pub.setSubscribed?.(true);
  } catch {
    // ignore
  }

  if (typeof pub.setVideoQuality === 'function') {
    pub.setVideoQuality?.(VideoQuality.HIGH);
  } else if (typeof pub.setPreferredLayer === 'function') {
    pub.setPreferredLayer?.(VideoQuality.HIGH);
  }

  try {
    const trackModule = Track as unknown as TrackWithPriority;
    const highPriority = trackModule.Priority?.HIGH;
    if (highPriority !== undefined && typeof pub.setPriority === 'function') {
      pub.setPriority(highPriority);
    }
  } catch {
    // ignore
  }

  pub.setVideoDimensions?.({ width: 1920, height: 1080 });
};

/**
 * Get API base URL
 */
export const getApiBase = () => API_BASE;

/**
 * Get admin token from localStorage
 */
export const getAdminToken = (): string | null => {
  return typeof window !== 'undefined'
    ? window.localStorage.getItem('admin_access_token')
    : null;
};

/**
 * Set danger state for a room via API
 */
export const setRoomDanger = async (
  roomName: string,
  isDanger: boolean,
): Promise<void> => {
  const apiBase = getApiBase();
  const adminToken = getAdminToken();

  if (!adminToken) {
    console.warn('[setRoomDanger] No admin token available');
    return;
  }

  try {
    const response = await fetch(
      `${apiBase}/v1/livekit/rooms/${encodeURIComponent(roomName)}/danger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isDanger }),
      },
    );

    if (!response.ok) {
      console.error('[setRoomDanger] API error:', response.status);
    } else {
      console.log(
        `[setRoomDanger] Room ${roomName} danger state set to ${isDanger}`,
      );
    }
  } catch (err) {
    console.error('[setRoomDanger] Failed:', err);
  }
};

/**
 * Mute/unmute AI agent via API
 */
export const muteAgentInRoom = async (
  roomName: string,
  mute: boolean,
): Promise<void> => {
  const apiBase = getApiBase();
  const adminToken = getAdminToken();

  if (!adminToken) {
    console.warn('[muteAgentInRoom] No admin token available');
    return;
  }

  try {
    const response = await fetch(
      `${apiBase}/v1/livekit/rooms/${encodeURIComponent(roomName)}/mute-agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ mute }),
      },
    );

    if (!response.ok) {
      console.error('[muteAgentInRoom] API error:', response.status);
    } else {
      console.log(
        `[muteAgentInRoom] Agent ${mute ? 'muted' : 'unmuted'} in ${roomName}`,
      );
    }
  } catch (err) {
    console.error('[muteAgentInRoom] Failed:', err);
  }
};
