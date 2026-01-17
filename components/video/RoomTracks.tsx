'use client';

import { useEffect } from 'react';
import {
  RoomAudioRenderer,
  TrackRefContext,
  useTracks,
  useRoomInfo,
} from '@livekit/components-react';
import { Track, RemoteTrackPublication } from 'livekit-client';
import { LiveTileOps } from './LiveTileOps';
import { EmptyTile } from './VideoTiles';
import type { MockParticipant } from './ParticipantSidebar';

export interface RoomDangerState {
  isDanger: boolean;
  dangerCode: string;
}

export interface RoomTracksProps {
  roomName: string;
  onParticipantsUpdate?: (participants: MockParticipant[]) => void;
  onTileClick?: (participantId: string, videoTrackRef: any) => void;
  onDangerStateChange?: (state: RoomDangerState) => void;
  selectedParticipantForAudio?: string | null;
  focusedParticipantId?: string | null;
  isFullscreenActive?: boolean;
  isDanger?: boolean;
}

const getParticipantId = (participant: any) =>
  participant.identity || participant.sid || 'unknown';

const getBaseName = (participant: any) =>
  (participant.name || participant.identity || 'User').trim();

const isVideoOff = (participant: any) => {
  const publishing = participant.isCameraEnabled !== false;
  return !publishing;
};

export const RoomTracks = ({
  roomName,
  onParticipantsUpdate,
  onTileClick,
  onDangerStateChange,
  selectedParticipantForAudio,
  focusedParticipantId,
  isFullscreenActive,
  isDanger,
}: RoomTracksProps) => {
  // Get room metadata for danger state
  const roomInfo = useRoomInfo();

  // Parse danger state from room metadata and notify parent
  useEffect(() => {
    if (!onDangerStateChange) return;

    let dangerState: RoomDangerState = { isDanger: false, dangerCode: '0000' };

    if (roomInfo.metadata) {
      try {
        const metadata = JSON.parse(roomInfo.metadata);
        dangerState = {
          isDanger: metadata.isDanger ?? false,
          dangerCode: metadata.dangerCode ?? '0000',
        };
      } catch {
        // Invalid metadata JSON, use defaults
      }
    }

    onDangerStateChange(dangerState);
  }, [roomInfo.metadata, onDangerStateChange]);

  const allTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: false },
  );

  // Manually control audio subscriptions - ONLY subscribe to selected participant
  useEffect(() => {
    audioTracks.forEach(trackRef => {
      const participantId =
        trackRef.participant.identity || trackRef.participant.sid;
      const isAgent =
        participantId.startsWith('agent-') ||
        participantId.startsWith('admin_');
      const isSelected = participantId === selectedParticipantForAudio;

      // Always unsubscribe from agents/admins
      if (isAgent) {
        if (trackRef.publication instanceof RemoteTrackPublication) {
          trackRef.publication.setSubscribed(false);
        }
      }
      // For regular participants, only subscribe if selected
      else if (selectedParticipantForAudio) {
        if (trackRef.publication instanceof RemoteTrackPublication) {
          trackRef.publication.setSubscribed(isSelected);
        }
      }
    });
  }, [audioTracks, selectedParticipantForAudio]);

  // Filter out admin and agent participants (they are invisible in grid)
  const tracks = allTracks.filter(
    track =>
      !track.participant.identity.startsWith('admin_') &&
      !track.participant.identity.startsWith('agent-'),
  );

  // Filter audio tracks to only include selected participant and exclude AI agents and admins
  const filteredAudioTracks = audioTracks.filter(track => {
    if (!selectedParticipantForAudio) return false;
    const participantId = track.participant.identity || track.participant.sid;

    // Exclude AI agents and admin from audio - they should NEVER be heard
    if (
      participantId.startsWith('agent-') ||
      participantId.startsWith('admin_')
    ) {
      return false;
    }

    // Only play audio for the selected participant
    const shouldPlay = participantId === selectedParticipantForAudio;

    return shouldPlay;
  });

  const hasFocusedParticipant =
    !!isFullscreenActive &&
    !!focusedParticipantId &&
    tracks.some(
      trackRef =>
        getParticipantId(trackRef.participant) === focusedParticipantId,
    );

  useEffect(() => {
    if (!hasFocusedParticipant) return;
    console.debug('[video] fullscreen focus in room', {
      roomName,
      focusedParticipantId,
    });
  }, [hasFocusedParticipant, roomName, focusedParticipantId]);

  // Update parent with participant list
  useEffect(() => {
    if (onParticipantsUpdate) {
      const participants: MockParticipant[] = tracks.map(trackRef => {
        const participant = trackRef.participant;

        // Try to extract beneficiaryId from metadata
        let beneficiaryId: string | undefined;
        try {
          if (participant.metadata) {
            const metadata = JSON.parse(participant.metadata);
            beneficiaryId =
              metadata.beneficiaryId || metadata.wardId || metadata.userId;
          }
        } catch (e) {
          // If metadata parsing fails, try to extract from identity
          // Format: beneficiary-{id} or ward-{id}
          const identity = getParticipantId(participant);
          const match = identity.match(/^(?:beneficiary-|ward-)(.+)$/);
          if (match) {
            beneficiaryId = match[1];
          }
        }

        return {
          id: getParticipantId(participant),
          name: getBaseName(participant),
          status: '',
          speaking: participant.isSpeaking || false,
          muted: !participant.isMicrophoneEnabled,
          cameraOff: !participant.isCameraEnabled,
          you: participant.isLocal,
          online: true,
          lastSeen: new Date().toISOString(),
          beneficiaryId,
        };
      });
      onParticipantsUpdate(participants);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  // If no visible participants, render an EmptyTile to maintain grid structure
  if (tracks.length === 0) {
    return <EmptyTile />;
  }

  return (
    <>
      {filteredAudioTracks.map(audioTrackRef => {
        return (
          <TrackRefContext.Provider
            key={
              audioTrackRef.participant.identity ||
              audioTrackRef.participant.sid
            }
            value={audioTrackRef}
          >
            <RoomAudioRenderer />
          </TrackRefContext.Provider>
        );
      })}
      {tracks.map(trackRef => {
        const participant = trackRef.participant;
        if (!participant) return null;
        const identity = getParticipantId(participant);
        const displayName = getBaseName(participant);
        const suppressVideo =
          !!isFullscreenActive && focusedParticipantId === identity;
        return (
          <LiveTileOps
            key={identity}
            trackRef={trackRef}
            displayName={displayName}
            roomName={roomName}
            videoOff={isVideoOff(participant)}
            suppressVideo={suppressVideo}
            onClick={participantId => onTileClick?.(participantId, trackRef)}
            participantId={identity}
            isDanger={isDanger}
          />
        );
      })}
    </>
  );
};
