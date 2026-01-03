'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackRefContext,
  VideoTrack,
  useTracks,
  useLocalParticipant,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import SidebarLayout from '../components/SidebarLayout';
import { EmptyTile, getInitials, ControlBar, ParticipantSidebar, type MockParticipant } from '../components/video';
import { useRoomSSE, useMultiRoomSession } from '../hooks';
import styles from './page.module.css';

const LiveTile = ({
  trackRef,
  displayName,
  roomName,
  videoOff,
}: {
  trackRef: any;
  displayName: string;
  roomName: string;
  videoOff: boolean;
}) => {
  const cameraOff = videoOff;

  return (
    <div
      className={styles.tile}
      style={{ position: 'relative' }}
    >
      <div className={styles.tileMedia}>
        {cameraOff ? (
          <div className={styles.avatarFallback}>{getInitials(displayName)}</div>
        ) : (
          <TrackRefContext.Provider value={trackRef}>
            <VideoTrack className={styles.video} />
          </TrackRefContext.Provider>
        )}
        <div className={styles.tileFooter}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            <span
              className={styles.tileName}
              style={{ color: '#000000', textShadow: 'none' }}
            >
              {displayName}
            </span>
          </div>
        </div>
      </div>
      {/* Room name badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          fontSize: '11px',
          fontWeight: '600',
          color: '#e2e8f0',
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {roomName}
      </div>
    </div>
  );
};

// Component that renders tracks from a single room
const RoomTracks = ({
  roomName,
  onParticipantsUpdate,
}: {
  roomName: string;
  onParticipantsUpdate?: (participants: MockParticipant[]) => void;
}) => {
  const allTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  // Filter out admin and agent participants (they are invisible in grid)
  const tracks = allTracks.filter(
    (track) =>
      !track.participant.identity.startsWith('admin_') &&
      !track.participant.identity.startsWith('agent-'),
  );

  const getParticipantId = (participant: any) =>
    participant.identity || participant.sid || 'unknown';

  const getBaseName = (participant: any) =>
    (participant.name || participant.identity || 'User').trim();

  const isVideoOff = (participant: any) => {
    const publishing = participant.isCameraEnabled !== false;
    return !publishing;
  };

  // Update parent with participant list
  useEffect(() => {
    if (onParticipantsUpdate) {
      const participants: MockParticipant[] = tracks.map((trackRef) => {
        const participant = trackRef.participant;
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
      <RoomAudioRenderer />
      {tracks.map((trackRef) => {
        const participant = trackRef.participant;
        if (!participant) return null;
        const identity = getParticipantId(participant);
        const displayName = getBaseName(participant);
        return (
          <LiveTile
            key={identity}
            trackRef={trackRef}
            displayName={displayName}
            roomName={roomName}
            videoOff={isVideoOff(participant)}
          />
        );
      })}
    </>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '16px',
    }}
  >
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748b"
      strokeWidth="1.5"
    >
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <p
      style={{
        fontSize: '16px',
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
      }}
    >
      {message}
    </p>
  </div>
);

// Wrapper component to access LiveKit hooks within a room context
const ControlBarWrapper = ({
  gridSize,
  onGridSizeChange,
  showParticipantList,
  onToggleParticipantList,
}: {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showParticipantList: boolean;
  onToggleParticipantList: () => void;
}) => {
  const { isMicrophoneEnabled, isCameraEnabled, localParticipant } = useLocalParticipant();

  const toggleMicrophone = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCamera = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ControlBar
      isMicrophoneEnabled={isMicrophoneEnabled}
      isCameraEnabled={isCameraEnabled}
      onToggleMicrophone={toggleMicrophone}
      onToggleCamera={toggleCamera}
      allAudioOff={false}
      allVideoOff={false}
      onToggleAllAudio={() => {}}
      onToggleAllVideo={() => {}}
      showParticipantList={showParticipantList}
      onToggleParticipantList={onToggleParticipantList}
      gridSize={gridSize}
      onGridSizeChange={onGridSizeChange}
      onLeaveRoom={() => {}}
      connected={true}
      canControl={true}
    />
  );
};

export default function Home() {
  const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE ?? '';
  const livekitEnv = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '';
  const [apiBase, setApiBase] = useState(apiBaseEnv);
  const [gridSize, setGridSize] = useState(3);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [allParticipants, setAllParticipants] = useState<Record<string, MockParticipant[]>>({});

  // Collect participants from all rooms
  const participantList = useMemo(() => {
    const participants: MockParticipant[] = [];
    Object.values(allParticipants).forEach((roomParticipants) => {
      participants.push(...roomParticipants);
    });
    return participants;
  }, [allParticipants]);

  useEffect(() => {
    if (apiBaseEnv) {
      setApiBase(apiBaseEnv);
      return;
    }
    if (typeof window !== 'undefined') {
      setApiBase(window.location.origin);
    }
  }, [apiBaseEnv]);

  const { rooms, loading, error } = useRoomSSE({
    apiBase,
    enabled: !!apiBase,
  });

  const { connections } = useMultiRoomSession({
    apiBase,
    livekitUrl: livekitEnv,
    rooms,
    enabled: !!apiBase && rooms.length > 0,
  });

  const gridSlots = useMemo(() => {
    const slots = gridSize * gridSize;
    const result: Array<{
      type: 'connection' | 'empty';
      key: string;
      connection?: any;
      onParticipantsUpdate?: (participants: MockParticipant[]) => void;
    }> = [];

    for (let i = 0; i < slots; i++) {
      const connection = connections[i];
      if (connection) {
        // Create a stable callback for each room
        const roomName = connection.roomName;
        const onParticipantsUpdate = (participants: MockParticipant[]) => {
          setAllParticipants((prev) => {
            // Check if participants have actually changed
            const existingParticipants = prev[roomName];
            if (
              existingParticipants &&
              existingParticipants.length === participants.length &&
              existingParticipants.every(
                (p, idx) =>
                  p.id === participants[idx]?.id &&
                  p.muted === participants[idx]?.muted &&
                  p.cameraOff === participants[idx]?.cameraOff &&
                  p.speaking === participants[idx]?.speaking,
              )
            ) {
              return prev;
            }
            return {
              ...prev,
              [roomName]: participants,
            };
          });
        };

        result.push({
          type: 'connection',
          key: connection.roomName,
          connection,
          onParticipantsUpdate,
        });
      } else {
        result.push({
          type: 'empty',
          key: `empty-${i}`,
        });
      }
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections, gridSize]);

  // We need at least one connection to show the control bar
  const firstConnection = connections[0];

  return (
    <SidebarLayout noPadding>
      <div className={styles.page}>
        <div className={styles.roomWrap}>
          {firstConnection ? (
            <LiveKitRoom
              serverUrl={firstConnection.serverUrl}
              token={firstConnection.token}
              connect={firstConnection.connected}
              audio
              video={false}
              className={styles.room}
            >
              <div className={`${styles.content} ${!showParticipantList ? styles.contentFullWidth : ''}`}>
                {/* Error State */}
                {error && (
                  <div
                    style={{
                      padding: '16px 24px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 10,
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#991b1b',
                        margin: 0,
                      }}
                    >
                      Error: {error}
                    </p>
                  </div>
                )}

                {/* Main Stage */}
                <div className={styles.stage}>
                  {/* Grid with Live Video Feeds */}
                  <div
                    className={styles.grid}
                    style={{
                      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                    }}
                  >
                    {gridSlots.map((slot) =>
                      slot.type === 'connection' ? (
                        <LiveKitRoom
                          key={slot.key}
                          serverUrl={slot.connection.serverUrl}
                          token={slot.connection.token}
                          connect={slot.connection.connected}
                          audio
                          video={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'contents',
                          }}
                        >
                          <RoomTracks
                            roomName={slot.connection.roomName}
                            onParticipantsUpdate={slot.onParticipantsUpdate}
                          />
                        </LiveKitRoom>
                      ) : (
                        <EmptyTile key={slot.key} />
                      ),
                    )}
                  </div>

                  {/* Control Bar */}
                  <ControlBarWrapper
                    gridSize={gridSize}
                    onGridSizeChange={setGridSize}
                    showParticipantList={showParticipantList}
                    onToggleParticipantList={() => setShowParticipantList(!showParticipantList)}
                  />
                </div>

                {/* Participant Sidebar */}
                {showParticipantList && (
                  <ParticipantSidebar
                    participants={participantList}
                    selectedParticipantId={selectedParticipantId}
                    onSelectParticipant={setSelectedParticipantId}
                    onClose={() => setShowParticipantList(false)}
                    onMuteAll={() => {}}
                    onInvite={() => {}}
                    inviteBusy={false}
                    inviteStatus={null}
                    connected={true}
                    canControl={true}
                  />
                )}
              </div>
            </LiveKitRoom>
          ) : (
            <div className={`${styles.content} ${!showParticipantList ? styles.contentFullWidth : ''}`}>
              {/* Error State */}
              {error && (
                <div
                  style={{
                    padding: '16px 24px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#991b1b',
                      margin: 0,
                    }}
                  >
                    Error: {error}
                  </p>
                </div>
              )}

              {/* Main Stage */}
              <div className={styles.stage}>
                {/* Grid with Empty Tiles */}
                <div
                  className={styles.grid}
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                  }}
                >
                  {gridSlots.map((slot) => (
                    <EmptyTile key={slot.key} />
                  ))}
                </div>

                {/* Control Bar - Static version without LiveKit */}
                <ControlBar
                  isMicrophoneEnabled={false}
                  isCameraEnabled={false}
                  onToggleMicrophone={() => {}}
                  onToggleCamera={() => {}}
                  allAudioOff={false}
                  allVideoOff={false}
                  onToggleAllAudio={() => {}}
                  onToggleAllVideo={() => {}}
                  showParticipantList={showParticipantList}
                  onToggleParticipantList={() => setShowParticipantList(!showParticipantList)}
                  gridSize={gridSize}
                  onGridSizeChange={setGridSize}
                  onLeaveRoom={() => {}}
                  connected={false}
                  canControl={false}
                />
              </div>

              {/* Participant Sidebar */}
              {showParticipantList && (
                <ParticipantSidebar
                  participants={participantList}
                  selectedParticipantId={selectedParticipantId}
                  onSelectParticipant={setSelectedParticipantId}
                  onClose={() => setShowParticipantList(false)}
                  onMuteAll={() => {}}
                  onInvite={() => {}}
                  inviteBusy={false}
                  inviteStatus={null}
                  connected={false}
                  canControl={false}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
