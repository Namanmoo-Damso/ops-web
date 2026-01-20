'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
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
  riskLevel?: 'normal' | 'caution' | 'critical';
}

export interface RoomTracksProps {
  roomName: string;
  onParticipantsUpdate?: (roomName: string, participants: MockParticipant[]) => void;
  onTileClick?: (roomName: string, participantId: string, videoTrackRef: any) => void;
  onDangerStateChange?: (state: RoomDangerState) => void;
  selectedParticipantForAudio?: string | null;
  focusedParticipantId?: string | null;
  isFullscreenActive?: boolean;
  isDanger?: boolean;
  riskLevel?: 'normal' | 'caution' | 'critical';
}

const getParticipantId = (participant: any) =>
  participant.identity || participant.sid || 'unknown';

const getBaseName = (participant: any) =>
  (participant.name || participant.identity || 'User').trim();

// Check if participant has a real name (not just a placeholder)
const hasRealName = (participant: any): boolean => {
  const name = (participant.name || '').trim().toLowerCase();
  const identity = (participant.identity || '').trim().toLowerCase();
  // Consider it a placeholder if name is empty, "user", or identity looks like a generic ID
  if (!name || name === 'user') {
    // Check if identity is also generic (e.g., just "user" or UUID-like)
    if (!identity || identity === 'user' || identity.match(/^[a-f0-9-]{36}$/i)) {
      return false;
    }
  }
  return true;
};

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
  riskLevel,
}: RoomTracksProps) => {
  // Get room metadata for danger state
  const roomInfo = useRoomInfo();

  // Parse danger state from room metadata and notify parent
  useEffect(() => {
    if (!onDangerStateChange) return;

    let dangerState: RoomDangerState = { isDanger: false, dangerCode: '0000', riskLevel: 'normal' };

    if (roomInfo.metadata) {
      try {
        const metadata = JSON.parse(roomInfo.metadata);
        dangerState = {
          isDanger: metadata.isDanger ?? false,
          dangerCode: metadata.dangerCode ?? '0000',
          riskLevel: metadata.riskLevel ?? (metadata.isDanger ? 'critical' : 'normal'),
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

  // Filter out admin, agent participants, and placeholder participants (they are invisible in grid)
  const tracks = allTracks.filter(
    track =>
      !track.participant.identity.startsWith('admin_') &&
      !track.participant.identity.startsWith('agent-') &&
      hasRealName(track.participant),
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

  // Memoize participant list to prevent unnecessary updates
  const participants = useMemo<MockParticipant[]>(() => {
    return tracks.map(trackRef => {
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
  }, [tracks]);

  // Track previous participants to avoid redundant updates
  const prevParticipantsRef = useRef<string>('');

  // Update parent with participant list only when data actually changes
  useEffect(() => {
    if (!onParticipantsUpdate) return;
    
    // Create a stable key for comparison (exclude lastSeen which always changes)
    const participantsKey = JSON.stringify(
      participants.map(p => ({
        id: p.id,
        name: p.name,
        speaking: p.speaking,
        muted: p.muted,
        cameraOff: p.cameraOff,
      }))
    );
    
    if (participantsKey !== prevParticipantsRef.current) {
      prevParticipantsRef.current = participantsKey;
      onParticipantsUpdate(roomName, participants);
    }
  }, [participants, roomName, onParticipantsUpdate]);

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
            onClick={onTileClick}
            participantId={identity}
            isDanger={isDanger}
            riskLevel={riskLevel}
          />
        );
      })}
    </>
  );
};
