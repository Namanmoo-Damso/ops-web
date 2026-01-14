'use client';

import { useEffect, useState, useMemo } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import SidebarLayout from '../components/SidebarLayout';
import {
  EmptyTile,
  ControlBar,
  ParticipantSidebar,
  ParticipantDetailSidebar,
  FullScreenVideo,
  RoomTracks,
  TakeoverAudioController,
  type MockParticipant,
} from '../components/video';
import { useRoomSSE, useMultiRoomSession } from '../hooks';
import { requestHighQuality, setRoomDanger } from '../utils/roomApi';
import { API_BASE } from '../lib/api-client';
import type { RoomConnection } from '../types/room';
import styles from './page.module.css';

export default function Home() {
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
  const [isMonitoringFullscreen, setIsMonitoringFullscreen] = useState(false);
  // Toggle fullscreen mode (hides sidebar and navbar)
  const toggleMonitoringFullscreen = () => {
    setIsMonitoringFullscreen(prev => !prev);
  };

  // Collect participants from all rooms or selected room (from LiveKit tiles only)
  const participantList = useMemo(() => {
    const participants: MockParticipant[] = [];

    Object.entries(allParticipants).forEach(([roomName, roomParticipants]) => {
      // If a specific room is selected, only include that room's participants
      if (selectedRoomName && roomName !== selectedRoomName) return;

      roomParticipants.forEach(p => {
        // Avoid duplicates
        if (!participants.some(existing => existing.id === p.id)) {
          participants.push(p);
        }
      });
    });

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

  const { rooms, error, dangerRooms } = useRoomSSE({
    apiBase: API_BASE,
    enabled: !!API_BASE,
  });

  const { connections } = useMultiRoomSession({
    apiBase: API_BASE,
    rooms,
    enabled: !!API_BASE && rooms.length > 0,
  });

  // Stable dependency key for connection room names
  const activeRoomNamesKey = useMemo(
    () =>
      connections
        .map(c => c.roomName)
        .sort()
        .join(','),
    [connections],
  );

  // Remove participants when their room is removed from connections
  useEffect(() => {
    const activeRoomNames = new Set(connections.map(c => c.roomName));

    setAllParticipants(prev => {
      const roomsToRemove = Object.keys(prev).filter(
        roomName => !activeRoomNames.has(roomName),
      );

      if (roomsToRemove.length === 0) return prev;

      const updated = { ...prev };
      roomsToRemove.forEach(roomName => {
        delete updated[roomName];
      });

      return updated;
    });
  }, [activeRoomNamesKey]);

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
            const existingParticipants = prev[roomName] || [];

            // Check if anything actually changed
            if (
              existingParticipants.length === participants.length &&
              existingParticipants.every((p, idx) => {
                const updated = participants[idx];
                return (
                  p.id === updated?.id &&
                  p.muted === updated?.muted &&
                  p.cameraOff === updated?.cameraOff &&
                  p.speaking === updated?.speaking
                );
              })
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
            {/* Render detail sidebar inside the selected room's LiveKitRoom context */}
            {selectedRoomName === slot.connection.roomName &&
              showFullScreenVideo &&
              showDetailSidebar &&
              detailParticipant && (
                <>
                  <FullScreenVideo
                    participant={detailParticipant}
                    videoTrackRef={selectedVideoTrackRef}
                    isDanger={dangerRooms[slot.connection.roomName] ?? false}
                  />
                  <ParticipantDetailSidebar
                    participant={detailParticipant}
                    roomName={selectedRoomName}
                    apiBase={API_BASE}
                    isTakeoverActive={isTakeoverActive}
                    onToggleTakeover={handleToggleTakeover}
                    onClose={handleCloseSidebar}
                    isDanger={dangerRooms[slot.connection.roomName] ?? false}
                    onClearDanger={handleClearDanger}
                  />
                </>
              )}
          </LiveKitRoom>
        ) : (
          <EmptyTile key={slot.key} />
        ),
      )}
    </div>
  );

  const renderParticipantSidebar = () =>
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
      />
    );

  const hasConnections = connections.length > 0;

  // Fullscreen container (no sidebar/navbar)
  const fullscreenContent = (
    <div
      className={styles.page}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#F7F9F2',
      }}
    >
      <div className={styles.roomWrap} style={{ height: '100%' }}>
        <div className={styles.content} style={{ gridTemplateColumns: '1fr' }}>
          <div className={styles.stage} style={{ position: 'relative' }}>
            {renderGrid()}
            <ControlBar
              showParticipantList={showParticipantList}
              onToggleParticipantList={() =>
                setShowParticipantList(!showParticipantList)
              }
              gridSize={gridSize}
              onGridSizeChange={setGridSize}
              connected={hasConnections}
              isFullscreen={isMonitoringFullscreen}
              onToggleFullscreen={toggleMonitoringFullscreen}
            />
          </div>
          {renderParticipantSidebar()}
        </div>
      </div>
    </div>
  );

  // If fullscreen mode, render without SidebarLayout
  if (isMonitoringFullscreen) {
    return fullscreenContent;
  }

  return (
    <SidebarLayout noPadding>
      <div className={styles.page}>
        <div className={styles.roomWrap}>
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
              <ControlBar
                showParticipantList={showParticipantList}
                onToggleParticipantList={() =>
                  setShowParticipantList(!showParticipantList)
                }
                gridSize={gridSize}
                onGridSizeChange={setGridSize}
                connected={hasConnections}
                isFullscreen={isMonitoringFullscreen}
                onToggleFullscreen={toggleMonitoringFullscreen}
              />
            </div>

            {renderParticipantSidebar()}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
