'use client';

import { useEffect, useState, useMemo } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import SidebarLayout from '../components/SidebarLayout';
import {
  EmptyTile,
  ControlBar,
  ControlBarWrapper,
  ParticipantSidebar,
  ParticipantDetailSidebar,
  FullScreenVideo,
  RoomTracks,
  TakeoverAudioController,
  type MockParticipant,
} from '../components/video';
import { useRoomSSE, useMultiRoomSession } from '../hooks';
import { requestHighQuality, setRoomDanger } from '../utils/roomApi';
import type { RoomConnection } from '../types/room';
import styles from './page.module.css';

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

  // Collect participants from all rooms or selected room
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

  const { rooms, error, dangerRooms } = useRoomSSE({
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
      isDanger?: boolean;
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
          isDanger: dangerRooms[roomName] ?? false,
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
  }, [
    connections,
    gridSize,
    selectedParticipantForAudio,
    showFullScreenVideo,
    dangerRooms,
  ]);

  // We need at least one connection to show the control bar
  const firstConnection = connections[0];

  const handleCloseSidebar = () => {
    setIsTakeoverActive(false);
    setShowFullScreenVideo(false);
    setShowDetailSidebar(false);
    setDetailParticipant(null);
    setSelectedRoomName(null);
    setSelectedParticipantForAudio(null);
    setSelectedVideoTrackRef(null);
  };

  const handleClearDanger = () => {
    if (selectedRoomName) {
      setRoomDanger(selectedRoomName, false);
    }
  };

  const handleToggleTakeover = () => {
    console.log('[Home] Toggling takeover', {
      currentState: isTakeoverActive,
      newState: !isTakeoverActive,
      selectedRoomName,
    });
    setIsTakeoverActive(prev => !prev);
  };

  const liveKitOptions = {
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
  };

  const renderErrorBanner = () =>
    error && (
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
    );

  const renderGrid = () => (
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
            options={liveKitOptions}
          >
            {/* Enable admin mic only in the selected room */}
            {selectedRoomName === slot.connection.roomName && (
              <TakeoverAudioController active={isTakeoverActive} />
            )}
            <RoomTracks
              roomName={slot.connection.roomName}
              onParticipantsUpdate={slot.onParticipantsUpdate}
              onTileClick={slot.onTileClick}
              selectedParticipantForAudio={slot.selectedParticipantForAudio}
              focusedParticipantId={
                showFullScreenVideo ? selectedParticipantForAudio : null
              }
              isFullscreenActive={showFullScreenVideo}
              isDanger={slot.isDanger}
            />
          </LiveKitRoom>
        ) : (
          <EmptyTile key={slot.key} />
        ),
      )}
    </div>
  );

  const renderFullScreenVideo = () =>
    showFullScreenVideo &&
    detailParticipant &&
    selectedVideoTrackRef && (
      <FullScreenVideo
        participant={detailParticipant}
        videoTrackRef={selectedVideoTrackRef}
        isDanger={
          selectedRoomName ? (dangerRooms[selectedRoomName] ?? false) : false
        }
      />
    );

  const renderDetailSidebar = () =>
    showFullScreenVideo &&
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
        onToggleTakeover={handleToggleTakeover}
        onClose={handleCloseSidebar}
        isDanger={
          selectedRoomName ? (dangerRooms[selectedRoomName] ?? false) : false
        }
        onClearDanger={handleClearDanger}
      />
    );

  const renderParticipantSidebar = (connected: boolean) =>
    showParticipantList &&
    !showFullScreenVideo && (
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
        connected={connected}
        canControl={connected}
      />
    );

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
              options={liveKitOptions}
            >
              <div
                className={`${styles.content} ${
                  !showParticipantList ? styles.contentFullWidth : ''
                }`}
              >
                {renderErrorBanner()}

                {/* Main Stage */}
                <div className={styles.stage} style={{ position: 'relative' }}>
                  {renderGrid()}

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

                {renderFullScreenVideo()}
                {renderDetailSidebar()}
                {renderParticipantSidebar(true)}
              </div>
            </LiveKitRoom>
          ) : (
            <div
              className={`${styles.content} ${
                !showParticipantList ? styles.contentFullWidth : ''
              }`}
            >
              {renderErrorBanner()}

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
                  onToggleMicrophone={() => {}}
                  onToggleCamera={() => {}}
                  allAudioOff={false}
                  allVideoOff={false}
                  onToggleAllAudio={() => {}}
                  onToggleAllVideo={() => {}}
                  showParticipantList={showParticipantList}
                  onToggleParticipantList={() =>
                    setShowParticipantList(!showParticipantList)
                  }
                  gridSize={gridSize}
                  onGridSizeChange={setGridSize}
                  onLeaveRoom={() => {}}
                  connected={false}
                  canControl={false}
                />
              </div>

              {renderFullScreenVideo()}
              {renderDetailSidebar()}
              {renderParticipantSidebar(false)}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
