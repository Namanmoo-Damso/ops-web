'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackRefContext,
  VideoTrack,
  useTracks,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react';
import {
  Track,
  RemoteTrackPublication,
  ConnectionState,
  createLocalAudioTrack,
  VideoQuality,
} from 'livekit-client';
import SidebarLayout from '../components/SidebarLayout';
import {
  EmptyTile,
  getInitials,
  ControlBar,
  ParticipantSidebar,
  ParticipantDetailSidebar,
  FullScreenVideo,
  type MockParticipant,
} from '../components/video';
import { useRoomSSE, useMultiRoomSession } from '../hooks';
import type { RoomConnection } from '../types/room';
import styles from './page.module.css';

const requestHighQuality = (
  trackRef: any,
  context?: { participantId?: string; roomName?: string; source?: string },
) => {
  const pub = trackRef?.publication;
  if (!pub) return;

  console.debug('[video] request high quality', {
    participantId: context?.participantId,
    roomName: context?.roomName,
    source: context?.source,
    trackSid: pub.trackSid,
  });

  try {
    (pub as any)?.setSubscribed?.(true);
  } catch {
    // ignore
  }

  if (typeof pub.setVideoQuality === 'function') {
    pub.setVideoQuality(VideoQuality.HIGH);
  } else if (typeof (pub as any).setPreferredLayer === 'function') {
    (pub as any).setPreferredLayer(VideoQuality.HIGH);
  }

  try {
    const priorityEnum = (Track as any).Priority;
    const highPriority = priorityEnum?.HIGH ?? undefined;
    if (
      highPriority !== undefined &&
      typeof (pub as any).setPriority === 'function'
    ) {
      (pub as any).setPriority(highPriority);
    }
  } catch {
    // ignore
  }

  pub.setVideoDimensions?.({ width: 1920, height: 1080 });
};

const LiveTile = ({
  trackRef,
  displayName,
  roomName,
  videoOff,
  suppressVideo,
  onClick,
  participantId,
}: {
  trackRef: any;
  displayName: string;
  roomName: string;
  videoOff: boolean;
  suppressVideo?: boolean;
  onClick?: (participantId: string) => void;
  participantId: string;
}) => {
  const cameraOff = videoOff;
  const showVideo = !cameraOff && !suppressVideo;

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
        {showVideo ? (
          <TrackRefContext.Provider value={trackRef}>
            <VideoTrack className={styles.video} />
          </TrackRefContext.Provider>
        ) : (
          <div className={styles.avatarFallback}>
            {getInitials(displayName)}
          </div>
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
    </div>
  );
};

// Component that renders tracks from a single room
const RoomTracks = ({
  roomName,
  onParticipantsUpdate,
  onTileClick,
  selectedParticipantForAudio,
  focusedParticipantId,
  isFullscreenActive,
}: {
  roomName: string;
  onParticipantsUpdate?: (participants: MockParticipant[]) => void;
  onTileClick?: (participantId: string, videoTrackRef: any) => void;
  selectedParticipantForAudio?: string | null;
  focusedParticipantId?: string | null;
  isFullscreenActive?: boolean;
}) => {
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

  const getParticipantId = (participant: any) =>
    participant.identity || participant.sid || 'unknown';

  const getBaseName = (participant: any) =>
    (participant.name || participant.identity || 'User').trim();

  const isVideoOff = (participant: any) => {
    const publishing = participant.isCameraEnabled !== false;
    return !publishing;
  };

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
          <LiveTile
            key={identity}
            trackRef={trackRef}
            displayName={displayName}
            roomName={roomName}
            videoOff={isVideoOff(participant)}
            suppressVideo={suppressVideo}
            onClick={participantId => onTileClick?.(participantId, trackRef)}
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
// Mic is controlled exclusively via the takeover button in the
// ParticipantDetailSidebar, so the mic toggle in the main control bar
// is effectively disabled and only reflects current takeover state.
const ControlBarWrapper = ({
  gridSize,
  onGridSizeChange,
  showParticipantList,
  onToggleParticipantList,
  isTakeoverActive,
}: {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showParticipantList: boolean;
  onToggleParticipantList: () => void;
  isTakeoverActive: boolean;
}) => {
  const { isCameraEnabled, localParticipant } = useLocalParticipant();

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
      // Mic state comes from takeover, and the toggle is disabled
      isMicrophoneEnabled={isTakeoverActive}
      isCameraEnabled={isCameraEnabled}
      onToggleMicrophone={() => { }}
      onToggleCamera={toggleCamera}
      allAudioOff={false}
      allVideoOff={false}
      onToggleAllAudio={() => { }}
      onToggleAllVideo={() => { }}
      showParticipantList={showParticipantList}
      onToggleParticipantList={onToggleParticipantList}
      gridSize={gridSize}
      onGridSizeChange={onGridSizeChange}
      onLeaveRoom={() => { }}
      connected={true}
      canControl={true}
    />
  );
};

// Helper function to mute/unmute AI agent via API
const muteAgentInRoom = async (
  roomName: string,
  mute: boolean,
): Promise<void> => {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const adminToken =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('admin_access_token')
      : null;

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

// Controls the actual LiveKit microphone state based on whether
// takeover mode is active. When not in takeover, the mic is forced off.
// Any browser permission errors (e.g. user denied mic access) are caught
// and ignored so they don't surface as unhandled errors.
const TakeoverAudioController = ({ active }: { active: boolean }) => {
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

export default function Home() {
  const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE ?? '';
  const livekitEnv = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '';
  const [apiBase, setApiBase] = useState(apiBaseEnv);
  const [gridSize, setGridSize] = useState(3);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [allParticipants, setAllParticipants] = useState<
    Record<string, MockParticipant[]>
  >({});
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const [showDetailSidebar, setShowDetailSidebar] = useState(false);
  const [detailParticipant, setDetailParticipant] =
    useState<MockParticipant | null>(null);
  const [selectedParticipantForAudio, setSelectedParticipantForAudio] =
    useState<string | null>(null);
  const [selectedVideoTrackRef, setSelectedVideoTrackRef] = useState<any>(null);
  const [showFullScreenVideo, setShowFullScreenVideo] = useState(false);
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);

  // Collect participants from all rooms or selected   room
  const participantList = useMemo(() => {
    const participants: MockParticipant[] = [];
    if (selectedRoomName && allParticipants[selectedRoomName]) {
      // Show only participants from the selected room
      participants.push(...allParticipants[selectedRoomName]);
    } else {
      // Show all participants from all rooms
      Object.values(allParticipants).forEach(roomParticipants => {
        participants.push(...roomParticipants);
      });
    }
    return participants;
  }, [allParticipants, selectedRoomName]);

  // Close detail sidebar if the selected participant leaves
  useEffect(() => {
    if (!detailParticipant || !selectedParticipantForAudio) return;

    const participantExists = participantList.some(
      p => p.id === selectedParticipantForAudio,
    );

    if (!participantExists) {
      setShowDetailSidebar(false);
      setDetailParticipant(null);
      setSelectedRoomName(null);
      setSelectedParticipantForAudio(null);
      setSelectedVideoTrackRef(null);
      setShowFullScreenVideo(false);
    }
  }, [participantList, detailParticipant, selectedParticipantForAudio]);

  // Ensure takeover is reset when sidebar closes unexpectedly
  useEffect(() => {
    if (!showDetailSidebar && isTakeoverActive) {
      console.log(
        '[Home] Resetting takeover state: Sidebar closed unexpectedly',
      );
      setIsTakeoverActive(false);
    }
  }, [showDetailSidebar, isTakeoverActive]);

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
      connection?: RoomConnection;
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
          setAllParticipants(prev => {
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
          console.debug('[video] tile click', {
            participantId,
            roomName,
            fullscreenActive: showFullScreenVideo,
          });
          // If clicking the same participant that's already in fullscreen, close it
          if (
            showFullScreenVideo &&
            selectedParticipantForAudio === participantId
          ) {
            setShowFullScreenVideo(false);
            setShowDetailSidebar(false);
            setDetailParticipant(null);
            setSelectedRoomName(null);
            setSelectedParticipantForAudio(null);
            setSelectedVideoTrackRef(null);
          } else {
            requestHighQuality(videoTrackRef, {
              participantId,
              roomName,
              source: 'tile-click',
            });
            // Open both fullscreen video and detail sidebar, enable audio for this participant
            setSelectedParticipantForAudio(participantId);
            setSelectedRoomName(roomName);
            setSelectedVideoTrackRef(videoTrackRef);
            // Get the participant details from this room
            const roomParticipants = allParticipants[roomName];
            if (roomParticipants && roomParticipants.length > 0) {
              // Find the specific participant that was clicked
              const clickedParticipant =
                roomParticipants.find(p => p.id === participantId) ||
                roomParticipants[0];
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
              audio={false}
              video={false}
              className={styles.room}
              options={{
                adaptiveStream: false,
                audioCaptureDefaults: {
                  autoGainControl: true,
                  echoCancellation: true,
                  noiseSuppression: true,
                },
                videoCaptureDefaults: {
                  resolution: { width: 1920, height: 1080 },
                  frameRate: 30,
                },
                dynacast: true,
                publishDefaults: {
                  videoEncoding: {
                    maxBitrate: 3_000_000,
                    maxFramerate: 30,
                  },
                },
              }}
            >
              <div
                className={`${styles.content} ${!showParticipantList ? styles.contentFullWidth : ''
                  }`}
              >
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
                    {gridSlots.map(slot =>
                      slot.type === 'connection' && slot.connection ? (
                        <LiveKitRoom
                          key={slot.key}
                          serverUrl={slot.connection.serverUrl}
                          token={slot.connection.token}
                          connect={slot.connection.connected}
                          audio={false}
                          video={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'contents',
                          }}
                          options={{
                            adaptiveStream: false,
                            audioCaptureDefaults: {
                              autoGainControl: true,
                              echoCancellation: true,
                              noiseSuppression: true,
                            },
                            videoCaptureDefaults: {
                              resolution: { width: 1920, height: 1080 },
                              frameRate: 30,
                            },
                            dynacast: true,
                            publishDefaults: {
                              videoEncoding: {
                                maxBitrate: 3_000_000,
                                maxFramerate: 30,
                              },
                            },
                          }}
                        >
                          {/* Enable admin mic only in the selected room */}
                          {selectedRoomName === slot.connection.roomName && (
                            <TakeoverAudioController
                              active={isTakeoverActive}
                            />
                          )}
                          <RoomTracks
                            roomName={slot.connection.roomName}
                            onParticipantsUpdate={slot.onParticipantsUpdate}
                            onTileClick={slot.onTileClick}
                            selectedParticipantForAudio={
                              slot.selectedParticipantForAudio
                            }
                            focusedParticipantId={
                              showFullScreenVideo
                                ? selectedParticipantForAudio
                                : null
                            }
                            isFullscreenActive={showFullScreenVideo}
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
                    onToggleParticipantList={() =>
                      setShowParticipantList(!showParticipantList)
                    }
                    isTakeoverActive={isTakeoverActive}
                  />
                </div>

                {/* Full Screen Video */}
                {showFullScreenVideo &&
                  detailParticipant &&
                  selectedVideoTrackRef && (
                    <FullScreenVideo
                      participant={detailParticipant}
                      videoTrackRef={selectedVideoTrackRef}
                    />
                  )}

                {/* Participant Detail Sidebar */}
                {showFullScreenVideo &&
                  showDetailSidebar &&
                  detailParticipant && (
                    <ParticipantDetailSidebar
                      participant={detailParticipant}
                      roomName={selectedRoomName || undefined}
                      apiBase={
                        process.env.NEXT_PUBLIC_API_BASE_URL ||
                        process.env.NEXT_PUBLIC_API_URL
                      }
                      isTakeoverActive={isTakeoverActive}
                      onToggleTakeover={() => {
                        console.log('[Home] Toggling takeover', {
                          currentState: isTakeoverActive,
                          newState: !isTakeoverActive,
                          selectedRoomName,
                        });
                        setIsTakeoverActive(prev => !prev);
                      }}
                      onClose={() => {
                        setIsTakeoverActive(false);
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
                    onMuteAll={() => { }}
                    onInvite={() => { }}
                    inviteBusy={false}
                    inviteStatus={null}
                    connected={true}
                    canControl={true}
                  />
                )}
              </div>
            </LiveKitRoom>
          ) : (
            <div
              className={`${styles.content} ${!showParticipantList ? styles.contentFullWidth : ''
                }`}
            >
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
                  {gridSlots.map(slot => (
                    <EmptyTile key={slot.key} />
                  ))}
                </div>

                {/* Control Bar - Static version without LiveKit */}
                <ControlBar
                  isMicrophoneEnabled={false}
                  isCameraEnabled={false}
                  onToggleMicrophone={() => { }}
                  onToggleCamera={() => { }}
                  allAudioOff={false}
                  allVideoOff={false}
                  onToggleAllAudio={() => { }}
                  onToggleAllVideo={() => { }}
                  showParticipantList={showParticipantList}
                  onToggleParticipantList={() =>
                    setShowParticipantList(!showParticipantList)
                  }
                  gridSize={gridSize}
                  onGridSizeChange={setGridSize}
                  onLeaveRoom={() => { }}
                  connected={false}
                  canControl={false}
                />
              </div>

              {/* Full Screen Video */}
              {showFullScreenVideo &&
                detailParticipant &&
                selectedVideoTrackRef && (
                  <FullScreenVideo
                    participant={detailParticipant}
                    videoTrackRef={selectedVideoTrackRef}
                  />
                )}

              {/* Participant Detail Sidebar */}
              {showFullScreenVideo &&
                showDetailSidebar &&
                detailParticipant && (
                  <ParticipantDetailSidebar
                    participant={detailParticipant}
                    roomName={selectedRoomName || undefined}
                    apiBase={
                      process.env.NEXT_PUBLIC_API_BASE_URL ||
                      process.env.NEXT_PUBLIC_API_URL
                    }
                    isTakeoverActive={isTakeoverActive}
                    onToggleTakeover={() => setIsTakeoverActive(prev => !prev)}
                    onClose={() => {
                      setIsTakeoverActive(false);
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
                  onMuteAll={() => { }}
                  onInvite={() => { }}
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
