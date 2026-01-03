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
import { EmptyTile, getInitials, ControlBar, ParticipantSidebar, ParticipantDetailSidebar, FullScreenVideo, type MockParticipant } from '../components/video';
import { useRoomSSE, useMultiRoomSession } from '../hooks';
import styles from './page.module.css';

const LiveTile = ({
  trackRef,
  displayName,
  roomName,
  videoOff,
  onClick,
  participantId,
}: {
  trackRef: any;
  displayName: string;
  roomName: string;
  videoOff: boolean;
  onClick?: (participantId: string) => void;
  participantId: string;
}) => {
  const cameraOff = videoOff;

  const handleClick = () => {
    if (onClick) {
      onClick(participantId);
    }
  };

  return (
    <div
      className={styles.tile}
      style={{ position: 'relative', cursor: onClick ? 'pointer' : 'default' }}
      onClick={handleClick}
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
  onTileClick,
  selectedParticipantForAudio,
}: {
  roomName: string;
  onParticipantsUpdate?: (participants: MockParticipant[]) => void;
  onTileClick?: (participantId: string, videoTrackRef: any) => void;
  selectedParticipantForAudio?: string | null;
}) => {
  const allTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  const audioTracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: false }],
    { onlySubscribed: false },
  );

  // Filter out admin and agent participants (they are invisible in grid)
  const tracks = allTracks.filter(
    (track) =>
      !track.participant.identity.startsWith('admin_') &&
      !track.participant.identity.startsWith('agent-'),
  );

  // Filter audio tracks to only include selected participant and exclude AI agents
  const filteredAudioTracks = audioTracks.filter((track) => {
    if (!selectedParticipantForAudio) return false;
    const participantId = track.participant.identity || track.participant.sid;
    // Exclude AI agents from audio
    if (participantId.startsWith('agent-')) return false;
    return participantId === selectedParticipantForAudio;
  });

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
      {filteredAudioTracks.map((audioTrackRef) => (
        <TrackRefContext.Provider key={audioTrackRef.participant.identity || audioTrackRef.participant.sid} value={audioTrackRef}>
          <RoomAudioRenderer />
        </TrackRefContext.Provider>
      ))}
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
            onClick={(participantId) => onTileClick?.(participantId, trackRef)}
            participantId={identity}
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
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [detailParticipant, setDetailParticipant] = useState<MockParticipant | null>(null);
  const [selectedParticipantForAudio, setSelectedParticipantForAudio] = useState<string | null>(null);
  const [selectedVideoTrackRef, setSelectedVideoTrackRef] = useState<any>(null);
  const [showFullScreenVideo, setShowFullScreenVideo] = useState(false);

  // Collect participants from all rooms or selected room
  const participantList = useMemo(() => {
    const participants: MockParticipant[] = [];
    if (selectedRoomName && allParticipants[selectedRoomName]) {
      // Show only participants from the selected room
      participants.push(...allParticipants[selectedRoomName]);
    } else {
      // Show all participants from all rooms
      Object.values(allParticipants).forEach((roomParticipants) => {
        participants.push(...roomParticipants);
      });
    }
    return participants;
  }, [allParticipants, selectedRoomName]);

  // Close detail sidebar if the selected participant leaves
  useEffect(() => {
    if (detailParticipant && selectedParticipantForAudio) {
      // Check if the participant still exists in the participant list
      const participantExists = participantList.some(p => p.id === selectedParticipantForAudio);
      if (!participantExists) {
        // Participant left, close the sidebar and turn off audio
        setShowDetailSidebar(false);
        setDetailParticipant(null);
        setSelectedRoomName(null);
        setSelectedParticipantForAudio(null);
        setSelectedVideoTrackRef(null);
      }
    }
  }, [participantList, detailParticipant, selectedParticipantForAudio]);

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
      onTileClick?: (participantId: string, videoTrackRef: any) => void;
      selectedParticipantForAudio?: string | null;
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

        const onTileClick = (participantId: string, videoTrackRef: any) => {
          // If clicking the same participant that's already in fullscreen, close it
          if (showFullScreenVideo && selectedParticipantForAudio === participantId) {
            setShowFullScreenVideo(false);
            setShowDetailSidebar(false);
            setDetailParticipant(null);
            setSelectedRoomName(null);
            setSelectedParticipantForAudio(null);
            setSelectedVideoTrackRef(null);
          } else {
            // Open both fullscreen video and detail sidebar, enable audio for this participant
            setSelectedParticipantForAudio(participantId);
            setSelectedRoomName(roomName);
            setSelectedVideoTrackRef(videoTrackRef);
            // Get the participant details from this room
            const roomParticipants = allParticipants[roomName];
            if (roomParticipants && roomParticipants.length > 0) {
              // Find the specific participant that was clicked
              const clickedParticipant = roomParticipants.find(p => p.id === participantId) || roomParticipants[0];
              setDetailParticipant(clickedParticipant);
              setShowFullScreenVideo(true);
              setShowDetailSidebar(true); // Show sidebar together with video
            }
          }
        };

        result.push({
          type: 'connection',
          key: connection.roomName,
          connection,
          onParticipantsUpdate,
          onTileClick,
          selectedParticipantForAudio,
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
  }, [connections, gridSize, selectedParticipantForAudio, showFullScreenVideo]);

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
              className={styles.room}              options={{
                audioCaptureDefaults: {
                  autoGainControl: true,
                  echoCancellation: true,
                  noiseSuppression: true,
                },
              }}            >
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
                <div className={styles.stage} style={{ position: 'relative' }}>
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
                          options={{
                            audioCaptureDefaults: {
                              autoGainControl: true,
                              echoCancellation: true,
                              noiseSuppression: true,
                            },
                          }}
                        >
                          <RoomTracks
                            roomName={slot.connection.roomName}
                            onParticipantsUpdate={slot.onParticipantsUpdate}
                            onTileClick={slot.onTileClick}
                            selectedParticipantForAudio={slot.selectedParticipantForAudio}
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

                {/* Full Screen Video */}
                {showFullScreenVideo && detailParticipant && selectedVideoTrackRef && (
                  <FullScreenVideo
                    participant={detailParticipant}
                    videoTrackRef={selectedVideoTrackRef}
                  />
                )}

                {/* Participant Detail Sidebar */}
                {showFullScreenVideo && showDetailSidebar && detailParticipant && (
                  <ParticipantDetailSidebar
                    participant={detailParticipant}
                    onClose={() => {
                      setShowFullScreenVideo(false);
                      setShowDetailSidebar(false);
                      setDetailParticipant(null);
                      setSelectedRoomName(null);
                      setSelectedParticipantForAudio(null);
                      setSelectedVideoTrackRef(null);
                    }}
                  />
                )}

                {/* Participant Sidebar */}
                {showParticipantList && !showFullScreenVideo && (
                  <ParticipantSidebar
                    participants={participantList}
                    selectedParticipantId={selectedParticipantId}
                    onSelectParticipant={setSelectedParticipantId}
                    onClose={() => {
                      setShowParticipantList(false);
                      setSelectedRoomName(null);
                    }}
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
              <div className={styles.stage} style={{ position: 'relative' }}>
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

              {/* Full Screen Video */}
              {showFullScreenVideo && detailParticipant && selectedVideoTrackRef && (
                <FullScreenVideo
                  participant={detailParticipant}
                  videoTrackRef={selectedVideoTrackRef}
                />
              )}

              {/* Participant Detail Sidebar */}
              {showFullScreenVideo && showDetailSidebar && detailParticipant && (
                <ParticipantDetailSidebar
                  participant={detailParticipant}
                  onClose={() => {
                    setShowFullScreenVideo(false);
                    setShowDetailSidebar(false);
                    setDetailParticipant(null);
                    setSelectedRoomName(null);
                    setSelectedParticipantForAudio(null);
                    setSelectedVideoTrackRef(null);
                  }}
                />
              )}

              {/* Participant Sidebar */}
              {showParticipantList && !showFullScreenVideo && (
                <ParticipantSidebar
                  participants={participantList}
                  selectedParticipantId={selectedParticipantId}
                  onSelectParticipant={setSelectedParticipantId}
                  onClose={() => {
                    setShowParticipantList(false);
                    setSelectedRoomName(null);
                  }}
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
