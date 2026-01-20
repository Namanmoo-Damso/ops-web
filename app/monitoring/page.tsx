'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import SidebarLayout from '../../components/SidebarLayout';
import {
  EmptyTile,
  ControlBar,
  ParticipantSidebar,
  ParticipantDetailSidebar,
  FullScreenVideo,
  RoomTracks,
  TakeoverAudioController,
  type MockParticipant,
  type RoomDangerState,
} from '../../components/video';
import { useRoomSSE, useMultiRoomSession } from '../../hooks';
import { requestHighQuality, setRoomDanger } from '../../utils/roomApi';
import { API_BASE } from '../../lib/api-client';
import type { RoomConnection } from '../../types/room';
import styles from './page.module.css';

// Constants
const PENDING_ALERT_ROOM_KEY = 'pendingAlertRoom';
const PENDING_ALERT_DANGER_KEY = 'pendingAlertDanger';
const PENDING_ALERT_DELAY_MS = 500;

// Safe sessionStorage operations
const safeGetSessionStorage = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
  } catch (error) {
    console.warn('[sessionStorage] Failed to get item:', key, error);
    return null;
  }
};

const safeClearSessionStorage = (...keys: string[]): void => {
  try {
    if (typeof window !== 'undefined') {
      keys.forEach(key => sessionStorage.removeItem(key));
    }
  } catch (error) {
    console.warn('[sessionStorage] Failed to clear items:', keys, error);
  }
};

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
  const [selectedVideoTrackRef, setSelectedVideoTrackRef] =
    useState<TrackReferenceOrPlaceholder | null>(null);
  const [showFullScreenVideo, setShowFullScreenVideo] = useState(false);
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);
  const [isMonitoringFullscreen, setIsMonitoringFullscreen] = useState(false);
  // Use ref for pending room tracking - refs are synchronous, avoiding race conditions
  const pendingAlertRoomRef = useRef<string | null>(null);
  // Danger state from room metadata (persisted in LiveKit)
  const [dangerStates, setDangerStates] = useState<
    Record<string, RoomDangerState>
  >({});

  // Toggle fullscreen mode (hides sidebar and navbar)
  const toggleMonitoringFullscreen = () => {
    setIsMonitoringFullscreen(prev => !prev);
  };

  // Update CSS variable when fullscreen mode changes so fixed-position components can adjust
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--header-height',
      isMonitoringFullscreen ? '0px' : '64px',
    );
  }, [isMonitoringFullscreen]);

  // Notify CareAlertContext when detail sidebar visibility changes
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('detailSidebarStateChange', {
        detail: { isOpen: showDetailSidebar },
      }),
    );
  }, [showDetailSidebar]);

  // Callback to update danger state from room metadata
  const handleDangerStateChange = useCallback(
    (roomName: string, state: RoomDangerState) => {
      setDangerStates(prev => {
        // Only update if changed to avoid re-renders
        if (
          prev[roomName]?.isDanger === state.isDanger &&
          prev[roomName]?.dangerCode === state.dangerCode
        ) {
          return prev;
        }
        return { ...prev, [roomName]: state };
      });
    },
    [],
  );

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

  // Close detail sidebar if the selected participant leaves (but not during pending alert room selection)
  useEffect(() => {
    // Skip this check if we're waiting for a pending room to fully load
    if (pendingAlertRoomRef.current) return;
    if (!detailParticipant || !selectedParticipantForAudio) return;

    const participantExists = participantList.some(
      p => p.id === selectedParticipantForAudio,
    );

    // If participant doesn't exist but room is selected, try to update with new participant
    if (!participantExists && selectedRoomName) {
      const roomParticipants = allParticipants[selectedRoomName];
      if (roomParticipants && roomParticipants.length > 0) {
        // Participant ID changed but room still has participants - update to first participant
        const newParticipant = roomParticipants[0];
        setSelectedParticipantForAudio(newParticipant.id);
        setDetailParticipant(newParticipant);
        console.log(
          '[Home] Updated participant after refresh:',
          newParticipant.name,
        );
        return;
      }
    }

    if (!participantExists) {
      setShowDetailSidebar(false);
      setDetailParticipant(null);
      setSelectedRoomName(null);
      setSelectedParticipantForAudio(null);
      setSelectedVideoTrackRef(null);
      setShowFullScreenVideo(false);
    }
  }, [
    participantList,
    detailParticipant,
    selectedParticipantForAudio,
    selectedRoomName,
    allParticipants,
  ]);

  // Ensure takeover is reset when sidebar closes unexpectedly
  useEffect(() => {
    if (!showDetailSidebar && isTakeoverActive) {
      console.log(
        '[Home] Resetting takeover state: Sidebar closed unexpectedly',
      );
      setIsTakeoverActive(false);
    }
  }, [showDetailSidebar, isTakeoverActive]);

  const { rooms, error } = useRoomSSE({
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

  // Handle pending alert room from CareAlertNotification navigation
  const selectRoomByName = useCallback(
    (roomName: string) => {
      // Find the connection for this room
      const connectionExists = connections.some(c => c.roomName === roomName);
      if (!connectionExists) {
        console.warn('[Home] Room not found:', roomName);
        return;
      }

      const roomParticipants = allParticipants[roomName];

      if (roomParticipants && roomParticipants.length > 0) {
        const firstParticipant = roomParticipants[0];
        setSelectedParticipantForAudio(firstParticipant.id);
        setSelectedRoomName(roomName);
        setDetailParticipant(firstParticipant);
        setShowFullScreenVideo(true);
        setShowDetailSidebar(true);
        console.log(
          '[Home] Selected room from alert:',
          roomName,
          firstParticipant.name,
        );
      }
    },
    [connections, allParticipants],
  );

  // Check for pending alert room on mount and when connections/participants change
  useEffect(() => {
    const pendingRoom = safeGetSessionStorage(PENDING_ALERT_ROOM_KEY);
    if (!pendingRoom || connections.length === 0) {
      // Clear tracking if no pending room
      if (!pendingRoom && pendingAlertRoomRef.current) {
        pendingAlertRoomRef.current = null;
      }
      return;
    }

    // Start tracking pending room (set immediately - no waiting for re-render)
    pendingAlertRoomRef.current = pendingRoom;

    // Check if room exists in connections
    const connectionExists = connections.some(c => c.roomName === pendingRoom);
    if (!connectionExists) {
      console.warn(
        '[Home] Pending alert room not found in connections:',
        pendingRoom,
      );
      safeClearSessionStorage(PENDING_ALERT_ROOM_KEY, PENDING_ALERT_DANGER_KEY);
      pendingAlertRoomRef.current = null;
      return;
    }

    // Check if participants are available for this room
    const roomParticipants = allParticipants[pendingRoom];
    // Wait until we have a participant with a real name (not just "user")
    const hasRealParticipant =
      roomParticipants &&
      roomParticipants.length > 0 &&
      roomParticipants.some(p => p.name && p.name !== 'user');

    if (hasRealParticipant) {
      // Participants are ready with real data, select the room
      const realParticipant =
        roomParticipants.find(p => p.name && p.name !== 'user') ||
        roomParticipants[0];
      setSelectedParticipantForAudio(realParticipant.id);
      setSelectedRoomName(pendingRoom);
      setDetailParticipant(realParticipant);
      setShowFullScreenVideo(true);
      setShowDetailSidebar(true);
      safeClearSessionStorage(PENDING_ALERT_ROOM_KEY, PENDING_ALERT_DANGER_KEY);
      pendingAlertRoomRef.current = null;
      console.log(
        '[Home] Successfully selected pending alert room:',
        pendingRoom,
        realParticipant.name,
      );
    }
    // If participants not yet loaded with real data, this effect will re-run when allParticipants changes
  }, [connections, allParticipants]);

  // Fallback: Retry selecting pending room with polling (handles race conditions)
  useEffect(() => {
    const pendingRoom = safeGetSessionStorage(PENDING_ALERT_ROOM_KEY);
    if (!pendingRoom) return;

    let retryCount = 0;
    const maxRetries = 30; // 3 seconds max (100ms * 30)

    const retryInterval = setInterval(() => {
      // Check if already selected (sessionStorage cleared)
      const stillPending = safeGetSessionStorage(PENDING_ALERT_ROOM_KEY);
      if (!stillPending) {
        clearInterval(retryInterval);
        return;
      }

      retryCount++;
      if (retryCount >= maxRetries) {
        console.warn(
          '[Home] Pending alert room selection timed out:',
          pendingRoom,
        );
        safeClearSessionStorage(
          PENDING_ALERT_ROOM_KEY,
          PENDING_ALERT_DANGER_KEY,
        );
        pendingAlertRoomRef.current = null;
        clearInterval(retryInterval);
        return;
      }

      // Try to find and select the room (only accept real participants, not 'user' placeholder)
      const connectionExists = connections.some(
        c => c.roomName === pendingRoom,
      );
      const roomParticipants = allParticipants[pendingRoom];
      const hasRealParticipant =
        roomParticipants &&
        roomParticipants.length > 0 &&
        roomParticipants.some(p => p.name && p.name !== 'user');

      if (connectionExists && hasRealParticipant) {
        const realParticipant =
          roomParticipants.find(p => p.name && p.name !== 'user') ||
          roomParticipants[0];
        setSelectedParticipantForAudio(realParticipant.id);
        setSelectedRoomName(pendingRoom);
        setDetailParticipant(realParticipant);
        setShowFullScreenVideo(true);
        setShowDetailSidebar(true);
        safeClearSessionStorage(
          PENDING_ALERT_ROOM_KEY,
          PENDING_ALERT_DANGER_KEY,
        );
        pendingAlertRoomRef.current = null;
        console.log(
          '[Home] Fallback: Selected pending alert room:',
          pendingRoom,
          realParticipant.name,
        );
        clearInterval(retryInterval);
      }
    }, 100);

    return () => clearInterval(retryInterval);
  }, []); // Run once on mount

  // Listen for selectAlertRoom custom event from CareAlertNotification
  useEffect(() => {
    const handleSelectAlertRoom = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const detail = event.detail as { roomName?: string; isDanger?: boolean };
      const roomName = detail?.roomName;

      if (!roomName) {
        console.warn('[Home] Invalid selectAlertRoom event data');
        return;
      }

      selectRoomByName(roomName);
      safeClearSessionStorage(PENDING_ALERT_ROOM_KEY, PENDING_ALERT_DANGER_KEY);
    };

    window.addEventListener('selectAlertRoom', handleSelectAlertRoom);
    return () => {
      window.removeEventListener('selectAlertRoom', handleSelectAlertRoom);
    };
  }, [selectRoomByName]);

  // Stable callback for updating participants - doesn't need to change per room
  const handleParticipantsUpdate = useCallback(
    (roomName: string, participants: MockParticipant[]) => {
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
    },
    [],
  );

  // Ref to hold latest state values for tile click handler
  const tileClickStateRef = useRef({
    showFullScreenVideo,
    selectedParticipantForAudio,
    allParticipants,
  });

  // Keep ref updated with latest values
  useEffect(() => {
    tileClickStateRef.current = {
      showFullScreenVideo,
      selectedParticipantForAudio,
      allParticipants,
    };
  }, [showFullScreenVideo, selectedParticipantForAudio, allParticipants]);

  // Stable callback for tile clicks - uses ref to access current state
  const handleTileClick = useCallback(
    (
      roomName: string,
      participantId: string,
      videoTrackRef: TrackReferenceOrPlaceholder,
    ) => {
      const {
        showFullScreenVideo: isFullscreen,
        selectedParticipantForAudio: selectedId,
        allParticipants: participants,
      } = tileClickStateRef.current;

      console.debug('[video] tile click', {
        participantId,
        roomName,
        fullscreenActive: isFullscreen,
      });
      // If clicking the same participant that's already in fullscreen, close it
      if (isFullscreen && selectedId === participantId) {
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
        const roomParticipants = participants[roomName];
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
    },
    [],
  );

  // Memoize connection slots separately - these don't change with grid size
  // Categorize into user rooms and bot rooms based on room name
  const { userRoomSlots, botRoomSlots } = useMemo(() => {
    type SlotType = {
      type: 'connection';
      key: string;
      connection: RoomConnection;
      isDanger: boolean;
    };
    const userRooms: SlotType[] = [];
    const botRooms: SlotType[] = [];

    connections.forEach(connection => {
      // Bot rooms have names starting with 'bot-'
      const isBotRoom = connection.roomName.startsWith('bot-');
      
      const slot = {
        type: 'connection' as const,
        key: connection.roomName,
        connection,
        isDanger: dangerStates[connection.roomName]?.isDanger ?? false,
      };

      if (isBotRoom) {
        botRooms.push(slot);
      } else {
        userRooms.push(slot);
      }
    });

    return { userRoomSlots: userRooms, botRoomSlots: botRooms };
  }, [connections, dangerStates]);

  // Combine connection slots with empty slots based on grid size
  // First tile is reserved for user rooms - if no user, show empty tile then bot rooms
  const gridSlots = useMemo(() => {
    const slots = gridSize * gridSize;
    const result: Array<{
      type: 'connection' | 'empty';
      key: string;
      connection?: RoomConnection;
      isDanger?: boolean;
    }> = [];

    // If we have user rooms, put them first
    if (userRoomSlots.length > 0) {
      result.push(...userRoomSlots.slice(0, slots));
      // Add bot rooms after user rooms
      const remainingSlots = slots - result.length;
      if (remainingSlots > 0) {
        result.push(...botRoomSlots.slice(0, remainingSlots));
      }
    } else {
      // No user rooms - reserve first tile as empty, then add bot rooms
      result.push({
        type: 'empty',
        key: 'reserved-for-user',
      });
      // Add bot rooms starting from position 2
      const remainingSlots = slots - 1;
      if (remainingSlots > 0) {
        result.push(...botRoomSlots.slice(0, remainingSlots));
      }
    }

    // Fill remaining slots with empty tiles
    for (let i = result.length; i < slots; i++) {
      result.push({
        type: 'empty',
        key: `empty-${i}`,
      });
    }

    return result;
  }, [userRoomSlots, botRoomSlots, gridSize]);

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
              onParticipantsUpdate={handleParticipantsUpdate}
              onTileClick={handleTileClick}
              onDangerStateChange={state =>
                handleDangerStateChange(slot.connection!.roomName, state)
              }
              selectedParticipantForAudio={selectedParticipantForAudio}
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
                    isDanger={
                      dangerStates[slot.connection.roomName]?.isDanger ?? false
                    }
                    isHeaderHidden={isMonitoringFullscreen}
                  />
                  <ParticipantDetailSidebar
                    participant={detailParticipant}
                    roomName={selectedRoomName}
                    apiBase={API_BASE}
                    isTakeoverActive={isTakeoverActive}
                    onToggleTakeover={handleToggleTakeover}
                    onClose={handleCloseSidebar}
                    isDanger={
                      dangerStates[slot.connection.roomName]?.isDanger ?? false
                    }
                    dangerCode={
                      dangerStates[slot.connection.roomName]?.dangerCode
                    }
                    onClearDanger={handleClearDanger}
                    isHeaderHidden={isMonitoringFullscreen}
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

  // Common grid and control content - rendered only once to preserve LiveKitRoom connections
  const gridContent = (
    <>
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
    </>
  );

  // Always render the same structure within SidebarLayout to preserve React tree
  // Use fixed positioning to create fullscreen overlay effect without changing tree structure
  return (
    <SidebarLayout noPadding>
      <div
        className={styles.page}
        style={
          isMonitoringFullscreen
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 10001,
                background: '#F7F9F2',
              }
            : undefined
        }
      >
        <div
          className={styles.roomWrap}
          style={isMonitoringFullscreen ? { height: '100%' } : undefined}
        >
          <div
            className={`${styles.content} ${
              !showParticipantList || isMonitoringFullscreen
                ? styles.contentFullWidth
                : ''
            }`}
            style={
              isMonitoringFullscreen
                ? { gridTemplateColumns: '1fr' }
                : undefined
            }
          >
            {!isMonitoringFullscreen && renderErrorBanner()}

            {/* Main Stage */}
            <div className={styles.stage} style={{ position: 'relative' }}>
              {gridContent}
            </div>

            {renderParticipantSidebar()}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
