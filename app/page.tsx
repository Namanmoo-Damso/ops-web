'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackRefContext,
  VideoTrack,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { RoomEvent, Track, VideoQuality } from 'livekit-client';
import SidebarLayout from '../components/SidebarLayout';
import {
  JoinBanner,
  ControlBar,
  ParticipantSidebar,
  EmptyTile,
  getInitials,
} from '../components/video';
import type { MockParticipant } from '../components/video';
import { useLiveKitSession } from '../hooks';
import styles from './page.module.css';

type RosterMember = {
  identity: string;
  displayName?: string | null;
  joinedAt?: string | null;
};

type LiveTileData = {
  key: string;
  ref: any;
  displayName: string;
};

type GridSlot =
  | { type: 'live'; key: string; tile: LiveTileData }
  | { type: 'empty'; key: string };

const LiveTile = ({
  trackRef,
  displayName,
  focused,
  onFocus,
  videoOff,
  onOpenDetail,
}: {
  trackRef: any;
  displayName: string;
  focused: boolean;
  onFocus: () => void;
  videoOff: boolean;
  onOpenDetail?: () => void;
}) => {
  const name = displayName;
  const cameraOff = videoOff;

  const handleClick = () => {
    if (onOpenDetail) {
      onOpenDetail();
    } else {
      onFocus();
    }
  };

  return (
    <div
      className={`${styles.tile} ${focused ? styles.focused : ''}`}
      onClick={handleClick}
      style={{ position: 'relative', cursor: 'pointer' }}
    >
      <div className={styles.tileMedia}>
        {cameraOff ? (
          <div className={styles.avatarFallback}>{getInitials(name)}</div>
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
              {name}
            </span>
          </div>
        </div>
      </div>
      <div
        className="hover-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.2)',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          backdropFilter: 'blur(1px)',
        }}
      >
        <div
          style={{
            background: 'white',
            color: '#1e293b',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '6px 12px',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            transform: 'scale(0.95)',
            transition: 'transform 0.2s ease',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          상세보기
        </div>
      </div>
      <style jsx>{`
        .hover-overlay {
          pointer-events: none;
        }
        div:hover > .hover-overlay {
          opacity: 1 !important;
        }
        div:hover > .hover-overlay > div {
          transform: scale(1) !important;
        }
      `}</style>
    </div>
  );
};

const RoomShell = ({
  focusedId,
  onFocus,
  showJoin,
  onJoin,
  joinBusy,
  error,
  connected,
  onLeave,
  onInvite,
  inviteBusy,
  inviteStatus,
  roomName,
  apiBase,
  selfIdentity,
  gridSize,
  onGridSizeChange,
  showParticipantList,
  onToggleParticipantList,
}: {
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  showJoin: boolean;
  onJoin: () => void;
  joinBusy: boolean;
  error?: string | null;
  connected: boolean;
  onLeave: () => void;
  onInvite: (identity: string) => void;
  inviteBusy: boolean;
  inviteStatus?: string | null;
  roomName: string;
  apiBase: string;
  selfIdentity: string;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showParticipantList: boolean;
  onToggleParticipantList: () => void;
}) => {
  const allTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  // Filter out admin participants from grid (admins are audio-only and invisible)
  const tracks = allTracks.filter(
    track => !track.participant.identity.startsWith('admin_'),
  );

  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const room = useRoomContext();
  const canControl = connected && !!localParticipant;
  const [audioOverrides, setAudioOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [videoOverrides, setVideoOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [ending, setEnding] = useState(false);
  const [knownParticipants, setKnownParticipants] = useState<
    Record<string, MockParticipant>
  >({});
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [detailParticipantId, setDetailParticipantId] = useState<string | null>(
    null,
  );
  const deletedIdentitiesRef = useRef<Set<string>>(new Set());
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!connected) {
      setAudioOverrides({});
      setVideoOverrides({});
    }
  }, [connected]);

  useEffect(() => {
    if (!room) return;
    const handleDisconnected = () => {
      setToastMessage('연결이 종료되었습니다');
      setToastKey(prev => prev + 1);
      setEnding(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastMessage(null), 2000);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
      endTimerRef.current = setTimeout(() => {
        setEnding(false);
        onLeave();
      }, 1400);
    };
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, handleDisconnected);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, [room, onLeave]);

  useEffect(() => {
    if (!roomName) return;
    const base = apiBase || '';
    let cancelled = false;
    const fetchRoster = async () => {
      try {
        const res = await fetch(
          `${base}/v1/rooms/${encodeURIComponent(roomName)}/members`,
        );
        if (!res.ok) throw new Error(`Roster fetch failed (${res.status})`);
        const data = await res.json();
        const members: RosterMember[] = Array.isArray(data?.members)
          ? data.members
          : [];
        if (cancelled) return;

        const now = new Date().toISOString();
        console.log(
          '[fetchRoster] Members from API:',
          members.map(m => m.identity),
        );
        setKnownParticipants(prev => {
          const next = { ...prev };
          members.forEach(member => {
            const id = member.identity;
            if (!id) return;
            // SSE로 삭제된 사용자는 다시 추가하지 않음
            if (deletedIdentitiesRef.current.has(id)) {
              console.log(`[fetchRoster] Skipping deleted identity: ${id}`);
              return;
            }
            const existing = next[id];
            const name = existing?.name || resolveRosterName(member);
            const online = existing?.online ?? false;
            next[id] = {
              id,
              name,
              status: online ? existing?.status ?? '' : 'Offline',
              speaking: online ? existing?.speaking ?? false : false,
              muted: existing?.muted ?? true,
              cameraOff: existing?.cameraOff ?? true,
              you: id === selfIdentity ? true : existing?.you,
              online,
              lastSeen: existing?.lastSeen ?? member.joinedAt ?? now,
            };
          });
          console.log(
            '[fetchRoster] Updated knownParticipants:',
            Object.keys(next),
          );
          return next;
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoster();
    return () => {
      cancelled = true;
    };
  }, [apiBase, roomName, selfIdentity]);

  const updateOverride = (
    setter: Dispatch<SetStateAction<Record<string, boolean>>>,
    identity: string,
    disabled: boolean,
  ) => {
    setter(prev => {
      const next = { ...prev };
      if (disabled) next[identity] = true;
      else delete next[identity];
      return next;
    });
  };

  const getParticipantId = (participant: any) =>
    participant.identity || participant.sid || 'unknown';

  const getBaseName = (participant: any) =>
    (participant.name || participant.identity || 'User').trim();

  const resolveRosterName = (member: RosterMember) =>
    (member.displayName || member.identity || 'User').trim();

  const isAudioOff = (participant: any) => {
    if (participant.isLocal) return !isMicrophoneEnabled;
    const identity = getParticipantId(participant);
    if (!focusedId || identity !== focusedId) return true;
    const publishing = participant.isMicrophoneEnabled !== false;
    return (audioOverrides[identity] ?? false) || !publishing;
  };

  const isVideoOff = (participant: any) => {
    if (participant.isLocal) return !isCameraEnabled;
    const identity = getParticipantId(participant);
    const publishing = participant.isCameraEnabled !== false;
    return (videoOverrides[identity] ?? false) || !publishing;
  };

  const setRemoteSubscription = (
    publications: Map<string, any>,
    enabled: boolean,
  ) => {
    publications.forEach(publication => {
      if (publication?.setSubscribed) publication.setSubscribed(enabled);
    });
  };

  const setRemoteVideoQuality = (participant: any, quality: VideoQuality) => {
    const publications = participant?.videoTrackPublications;
    if (!publications) return;
    publications.forEach((publication: any) => {
      if (typeof publication?.setVideoQuality === 'function')
        publication.setVideoQuality(quality);
      else if (typeof publication?.setPreferredLayer === 'function')
        publication.setPreferredLayer(quality);
    });
  };

  const setRemoteTrackPriority = (
    participant: any,
    priority: 'low' | 'standard' | 'high',
  ) => {
    const publications = participant?.videoTrackPublications;
    if (!publications) return;
    const priorityEnum = (Track as any).Priority;
    if (!priorityEnum) return;
    const key = priority.toUpperCase();
    const value = priorityEnum[key] ?? priorityEnum.STANDARD;
    if (!value) return;
    publications.forEach((publication: any) => {
      if (typeof publication?.setPriority === 'function')
        publication.setPriority(value);
    });
  };

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

  const leaveRoom = () => {
    room?.disconnect?.();
    onLeave();
  };

  const toggleParticipantAudio = (participant: any) => {
    if (!participant || participant.isLocal) return;
    const identity = getParticipantId(participant);
    const isCurrentlyMuted = audioOverrides[identity] ?? false;
    updateOverride(setAudioOverrides, identity, !isCurrentlyMuted);
    setRemoteSubscription(participant.audioTrackPublications, isCurrentlyMuted);
  };

  const toggleParticipantVideo = (participant: any) => {
    if (!participant || participant.isLocal) return;
    const identity = getParticipantId(participant);
    const isCurrentlyOff = videoOverrides[identity] ?? false;
    updateOverride(setVideoOverrides, identity, !isCurrentlyOff);
    setRemoteSubscription(participant.videoTrackPublications, isCurrentlyOff);
  };

  const allAudioOff = useMemo(() => {
    return allTracks.every(track => {
      const participant = track.participant;
      if (!participant || participant.isLocal) return true;
      const identity = getParticipantId(participant);
      return audioOverrides[identity] === true;
    });
  }, [allTracks, audioOverrides]);

  const allVideoOff = useMemo(() => {
    return allTracks.every(track => {
      const participant = track.participant;
      if (!participant || participant.isLocal) return true;
      const identity = getParticipantId(participant);
      return videoOverrides[identity] === true;
    });
  }, [allTracks, videoOverrides]);

  const toggleAllAudio = () => {
    const newState = !allAudioOff;
    allTracks.forEach(track => {
      const participant = track.participant;
      if (!participant || participant.isLocal) return;
      const identity = getParticipantId(participant);
      updateOverride(setAudioOverrides, identity, newState);
      setRemoteSubscription(participant.audioTrackPublications, !newState);
    });
  };

  const toggleAllVideo = () => {
    const newState = !allVideoOff;
    allTracks.forEach(track => {
      const participant = track.participant;
      if (!participant || participant.isLocal) return;
      const identity = getParticipantId(participant);
      updateOverride(setVideoOverrides, identity, newState);
      setRemoteSubscription(participant.videoTrackPublications, !newState);
    });
  };

  const liveTiles: LiveTileData[] = useMemo(() => {
    const tiles: LiveTileData[] = [];
    tracks.forEach(trackRef => {
      const participant = trackRef.participant;
      if (!participant) return;
      const identity = getParticipantId(participant);
      const displayName = getBaseName(participant);
      tiles.push({ key: identity, ref: trackRef, displayName });
    });
    return tiles;
  }, [tracks]);

  // tracks에서 knownParticipants 업데이트 (useMemo에서 분리)
  useEffect(() => {
    tracks.forEach(trackRef => {
      const participant = trackRef.participant;
      if (!participant) return;
      const identity = getParticipantId(participant);
      const displayName = getBaseName(participant);

      // 사용자가 다시 로그인한 경우 (active track이 있음), deletedIdentities에서 제거
      if (deletedIdentitiesRef.current.has(identity)) {
        console.log(
          `[tracks] User logged back in, removing from deleted set: ${identity}`,
        );
        deletedIdentitiesRef.current.delete(identity);
      }

      setKnownParticipants(prev => {
        const existing = prev[identity];
        if (existing && existing.online) return prev;
        return {
          ...prev,
          [identity]: {
            id: identity,
            name: displayName,
            status: '',
            speaking: participant.isSpeaking || false,
            muted: !participant.isMicrophoneEnabled,
            cameraOff: !participant.isCameraEnabled,
            you: participant.isLocal,
            online: true,
            lastSeen: new Date().toISOString(),
          },
        };
      });
    });
  }, [tracks]);

  useEffect(() => {
    const onlineIds = new Set(liveTiles.map(t => t.key));
    setKnownParticipants(prev => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        const wasOnline = next[id].online;
        const nowOnline = onlineIds.has(id);
        if (wasOnline !== nowOnline) {
          changed = true;
          next[id] = {
            ...next[id],
            online: nowOnline,
            status: nowOnline ? '' : 'Offline',
          };
        }
      });
      return changed ? next : prev;
    });
  }, [liveTiles]);

  useEffect(() => {
    tracks.forEach(trackRef => {
      const participant = trackRef.participant;
      if (!participant || participant.isLocal) return;
      const identity = getParticipantId(participant);
      const isFocused = identity === focusedId;
      if (isFocused) {
        setRemoteVideoQuality(participant, VideoQuality.HIGH);
        setRemoteTrackPriority(participant, 'high');
      } else {
        setRemoteVideoQuality(participant, VideoQuality.LOW);
        setRemoteTrackPriority(participant, 'low');
      }
    });
  }, [focusedId, tracks]);

  const showOnlyFocused = !!focusedId && liveTiles.length > 1;
  const visibleTiles = showOnlyFocused
    ? liveTiles.filter(t => t.key === focusedId)
    : liveTiles;

  const gridSlots = useMemo<GridSlot[]>(() => {
    if (showOnlyFocused) {
      return visibleTiles.map(tile => ({
        type: 'live' as const,
        key: tile.key,
        tile,
      }));
    }
    const slots = gridSize * gridSize;
    const result: GridSlot[] = [];
    for (let i = 0; i < slots; i++) {
      const tile = visibleTiles[i];
      if (tile) result.push({ type: 'live' as const, key: tile.key, tile });
      else result.push({ type: 'empty' as const, key: `empty-${i}` });
    }
    return result;
  }, [visibleTiles, gridSize, showOnlyFocused]);

  const sidebarList = useMemo(() => {
    console.log(
      '[sidebarList] Computing, knownParticipants keys:',
      Object.keys(knownParticipants),
    );
    const list = Object.values(knownParticipants).filter(participant => {
      if (participant.you && participant.online === false) return false;
      return true;
    });
    list.sort((a, b) => {
      const onlineDiff = Number(!!b.online) - Number(!!a.online);
      if (onlineDiff !== 0) return onlineDiff;
      return a.name.localeCompare(b.name);
    });
    console.log(
      '[sidebarList] Result count:',
      list.length,
      'names:',
      list.map(p => p.name),
    );
    return list;
  }, [knownParticipants]);

  useEffect(() => {
    if (!selectedParticipantId) return;
    const selected = knownParticipants[selectedParticipantId];
    if (!selected || selected.you) setSelectedParticipantId(null);
  }, [knownParticipants, selectedParticipantId]);

  // SSE 이벤트 구독 (로그아웃/회원탈퇴 시 목록에서 삭제)
  useEffect(() => {
    const base = apiBase || '';
    if (!base) {
      console.log('[SSE] apiBase is empty, skipping SSE connection');
      return;
    }

    const sseUrl = `${base}/v1/events/stream`;
    console.log(`[SSE] Connecting to: ${sseUrl}`);

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log(
        `[SSE] Connection opened, readyState: ${eventSource.readyState}`,
      );
    };

    eventSource.onmessage = event => {
      console.log(`[SSE] Message received:`, event.data);
      try {
        const data = JSON.parse(event.data);
        console.log(`[SSE] Parsed event:`, data);
        if (data.type === 'user-logout' || data.type === 'user-deleted') {
          const { identity } = data;
          if (identity) {
            console.log(`[SSE] Removing participant: ${identity}`);
            // 삭제된 identity 기록 (재추가 방지)
            deletedIdentitiesRef.current.add(identity);
            setKnownParticipants(prev => {
              const next = { ...prev };
              delete next[identity];
              console.log(`[SSE] Updated participants:`, Object.keys(next));
              return next;
            });
          }
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    eventSource.onerror = err => {
      console.error(
        `[SSE] Connection error, readyState: ${eventSource.readyState}`,
        err,
      );
    };

    return () => {
      console.log('[SSE] Closing connection');
      eventSource.close();
    };
  }, [apiBase]);

  return (
    <div
      className={`${styles.content} ${
        !showParticipantList ? styles.contentFullWidth : ''
      }`}
    >
      <div className={`${styles.stage} ${ending ? styles.stageEnding : ''}`}>
        {showJoin ? (
          <JoinBanner onJoin={onJoin} busy={joinBusy} error={error} />
        ) : null}
        {toastMessage ? (
          <div key={toastKey} className={styles.toast}>
            {toastMessage}
          </div>
        ) : null}
        <RoomAudioRenderer />
        <div
          className={`${styles.grid} ${
            showOnlyFocused ? styles.gridFocused : ''
          }`}
          style={{
            gridTemplateColumns: showOnlyFocused
              ? '1fr'
              : `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: showOnlyFocused
              ? '1fr'
              : `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {gridSlots.map(slot =>
            slot.type === 'live' ? (
              <LiveTile
                key={slot.key}
                trackRef={slot.tile.ref}
                displayName={slot.tile.displayName}
                focused={focusedId === slot.tile.key}
                onFocus={() =>
                  onFocus(focusedId === slot.tile.key ? null : slot.tile.key)
                }
                videoOff={isVideoOff(slot.tile.ref.participant)}
                onOpenDetail={() => setDetailParticipantId(slot.tile.key)}
              />
            ) : (
              <EmptyTile key={slot.key} />
            ),
          )}
        </div>
        <ControlBar
          isMicrophoneEnabled={isMicrophoneEnabled}
          isCameraEnabled={isCameraEnabled}
          onToggleMicrophone={toggleMicrophone}
          onToggleCamera={toggleCamera}
          allAudioOff={allAudioOff}
          allVideoOff={allVideoOff}
          onToggleAllAudio={toggleAllAudio}
          onToggleAllVideo={toggleAllVideo}
          showParticipantList={showParticipantList}
          onToggleParticipantList={onToggleParticipantList}
          gridSize={gridSize}
          onGridSizeChange={onGridSizeChange}
          onLeaveRoom={leaveRoom}
          connected={connected}
          canControl={canControl}
        />
      </div>

      {showParticipantList && (
        <ParticipantSidebar
          participants={sidebarList}
          selectedParticipantId={selectedParticipantId}
          onSelectParticipant={setSelectedParticipantId}
          onClose={onToggleParticipantList}
          onMuteAll={toggleAllAudio}
          onInvite={onInvite}
          inviteBusy={inviteBusy}
          inviteStatus={inviteStatus ?? null}
          connected={connected}
          canControl={canControl}
        />
      )}

      {/* Detail Sidebar */}
      {detailParticipantId &&
        (() => {
          const tile = liveTiles.find(t => t.key === detailParticipantId);
          if (!tile) return null;

          return (
            <div
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '420px',
                height: '100vh',
                background: 'white',
                borderLeft: '1px solid #e2e8f0',
                boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: 'rgba(248, 250, 252, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  세부 모니터링
                </h3>
                <button
                  onClick={() => setDetailParticipantId(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  overflowY: 'auto',
                }}
              >
                {/* Participant Name */}
                <div
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      background: '#f1f5f9',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#94a3b8',
                    }}
                  >
                    {getInitials(tile.displayName)}
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        marginBottom: '4px',
                      }}
                    >
                      {tile.displayName}
                    </h4>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: '#10b981',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      온라인
                    </span>
                  </div>
                </div>

                {/* Video Preview */}
                <div
                  style={{
                    marginBottom: '20px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#0f172a',
                    aspectRatio: '16/9',
                    position: 'relative',
                  }}
                >
                  <TrackRefContext.Provider value={tile.ref}>
                    <VideoTrack
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </TrackRefContext.Provider>
                </div>

                {/* Info Section */}
                <div style={{ marginTop: '20px' }}>
                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginBottom: '12px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    참가자 정보
                  </p>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '600',
                        }}
                      >
                        참가자 ID:
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          color: '#1e293b',
                          marginLeft: '8px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {tile.key}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default function Home() {
  const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE ?? '';
  const livekitEnv = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '';
  const defaultRoom = process.env.NEXT_PUBLIC_ROOM_NAME ?? 'demo-room';

  const [apiBase, setApiBase] = useState(apiBaseEnv);

  useEffect(() => {
    if (apiBaseEnv) {
      setApiBase(apiBaseEnv);
      return;
    }
    if (typeof window !== 'undefined') {
      setApiBase(window.location.origin);
    }
  }, [apiBaseEnv]);

  const session = useLiveKitSession({
    apiBase,
    livekitUrl: livekitEnv,
    defaultRoomName: defaultRoom,
    autoJoin: true,
  });

  return (
    <SidebarLayout noPadding>
      <div className={styles.page}>
        <div className={styles.roomWrap}>
          <LiveKitRoom
            className={styles.room}
            serverUrl={session.serverUrl}
            token={session.token}
            connect={session.connected}
            audio
            video
          >
            <RoomShell
              focusedId={session.focusedId}
              onFocus={session.setFocusedId}
              showJoin={!session.connected}
              onJoin={session.joinRoom}
              joinBusy={session.connecting}
              error={session.error}
              connected={session.connected}
              onLeave={session.leaveRoom}
              onInvite={session.inviteParticipant}
              inviteBusy={session.inviteBusy}
              inviteStatus={session.inviteStatus}
              roomName={session.roomName}
              apiBase={apiBase || ''}
              selfIdentity={session.identity}
              gridSize={session.gridSize}
              onGridSizeChange={session.setGridSize}
              showParticipantList={session.showParticipantList}
              onToggleParticipantList={() =>
                session.setShowParticipantList(!session.showParticipantList)
              }
            />
          </LiveKitRoom>
        </div>
      </div>
    </SidebarLayout>
  );
}
