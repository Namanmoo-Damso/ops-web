'use client';

import { useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { ConnectionState, createLocalAudioTrack } from 'livekit-client';
import { muteAgentInRoom } from '../../utils/roomApi';

export interface TakeoverAudioControllerProps {
  active: boolean;
}

/**
 * Controls the actual LiveKit microphone state based on whether
 * takeover mode is active. When not in takeover, the mic is forced off.
 * Any browser permission errors (e.g. user denied mic access) are caught
 * and ignored so they don't surface as unhandled errors.
 */
export const TakeoverAudioController = ({ active }: TakeoverAudioControllerProps) => {
  const room = useRoomContext();
  const audioTrackRef = useRef<any>(null);
  const isPublishingRef = useRef(false);

  useEffect(() => {
    const localParticipant = room?.localParticipant;
    let cancelled = false;

    if (!room || !localParticipant) {
      return;
    }

    const ensureMicState = async () => {
      // Prevent concurrent operations
      if (isPublishingRef.current) {
        return;
      }

      try {
        const roomState = room.state;

        if (roomState !== ConnectionState.Connected) {
          return;
        }

        if (active && !audioTrackRef.current) {
          isPublishingRef.current = true;

          // Mute the AI agent first
          await muteAgentInRoom(room.name, true);

          const track = await createLocalAudioTrack({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          });

          // Check if we were cancelled while creating the track
          if (cancelled) {
            track.stop();
            // Unmute the agent since we're cancelling
            await muteAgentInRoom(room.name, false);
            isPublishingRef.current = false;
            return;
          }

          await localParticipant.publishTrack(track);
          audioTrackRef.current = track;
          isPublishingRef.current = false;
          console.log(
            '[TakeoverAudioController] Takeover active - admin mic on, agent muted',
          );
        } else if (!active && audioTrackRef.current) {
          isPublishingRef.current = true;

          const track = audioTrackRef.current;
          audioTrackRef.current = null;

          try {
            await localParticipant.unpublishTrack(track);
          } catch (e) {
            // Ignore unpublish errors
          }
          track.stop();

          // Unmute the AI agent
          await muteAgentInRoom(room.name, false);

          isPublishingRef.current = false;
          console.log(
            '[TakeoverAudioController] Takeover ended - admin mic off, agent unmuted',
          );
        }
      } catch (err: any) {
        isPublishingRef.current = false;
        if (err?.name === 'NotAllowedError') {
          console.warn(
            '[TakeoverAudioController] Microphone permission denied',
          );
          // Unmute agent since we couldn't take over
          await muteAgentInRoom(room.name, false);
          return;
        }
        console.error('[TakeoverAudioController] Error:', err);
      }
    };

    void ensureMicState();

    // Cleanup on unmount or when dependencies change
    return () => {
      cancelled = true;
      if (audioTrackRef.current) {
        const track = audioTrackRef.current;
        audioTrackRef.current = null;
        track.stop();
        // Unmute agent on cleanup
        muteAgentInRoom(room.name, false);
      }
    };
  }, [active, room]);

  return null;
};
