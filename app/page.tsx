"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  TrackRefContext,
  VideoTrack,
  useLocalParticipant,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { RoomEvent, Track, VideoQuality } from "livekit-client";
import SidebarLayout from "../components/SidebarLayout";
import { IconMic, IconCam } from "../components/Icons";
import {
  JoinBanner,
  ControlBar,
  ParticipantSidebar,
  EmptyTile,
  TileActionButton,
  TileSignal,
  getInitials,
} from "../components/video";
import type { MockParticipant } from "../components/video";
import { useLiveKitSession } from "../hooks";
import styles from "./page.module.css";

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
  | { type: "live"; key: string; tile: LiveTileData }
  | { type: "empty"; key: string };

const LiveTile = ({
  trackRef,
  displayName,
  focused,
  onFocus,
  onToggleAudio,
  onToggleVideo,
  audioOff,
  videoOff,
  canControl,
}: {
  trackRef: any;
  displayName: string;
  focused: boolean;
  onFocus: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  audioOff: boolean;
  videoOff: boolean;
  canControl: boolean;
}) => {
  const participant = trackRef.participant;
  const name = displayName;
  const speaking = participant.isSpeaking;
  const micMuted = audioOff;
  const cameraOff = videoOff;

  return (
    <div
      className={`${styles.tile} ${focused ? styles.focused : ""} ${
        speaking ? styles.speaking : ""
      }`}
      onClick={onFocus}
    >
      <div className={styles.tileMedia}>
        {cameraOff ? (
          <div className={styles.avatarFallback}>{getInitials(name)}</div>
        ) : (
          <TrackRefContext.Provider value={trackRef}>
            <VideoTrack className={styles.video} />
          </TrackRefContext.Provider>
        )}
        <div className={styles.tileOverlay} />
        <div className={styles.tileActions}>
          <TileActionButton
            onClick={onToggleAudio}
            disabled={!canControl}
            off={micMuted}
            title={micMuted ? "Unmute" : "Mute"}
          >
            <IconMic muted={micMuted} />
          </TileActionButton>
          <TileActionButton
            onClick={onToggleVideo}
            disabled={!canControl}
            off={cameraOff}
            title={cameraOff ? "Start video" : "Stop video"}
          >
            <IconCam off={cameraOff} />
          </TileActionButton>
        </div>
        <div className={styles.tileFooter}>
          {speaking ? <span className={styles.tileBadge}>Speaking</span> : null}
          <span className={styles.tileName}>{name}</span>
          <span className={styles.tileMeta}>
            <TileSignal />
            Live
          </span>
        </div>
      </div>
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
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant();
  const room = useRoomContext();
  const canControl = connected && !!localParticipant;
  const [audioOverrides, setAudioOverrides] = useState<Record<string, boolean>>({});
  const [videoOverrides, setVideoOverrides] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [ending, setEnding] = useState(false);
  const [knownParticipants, setKnownParticipants] = useState<Record<string, MockParticipant>>({});
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
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
      setToastMessage("연결이 종료되었습니다");
      setToastKey((prev) => prev + 1);
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
    const base = apiBase || "";
    let cancelled = false;
    const fetchRoster = async () => {
      try {
        const res = await fetch(`${base}/v1/rooms/${encodeURIComponent(roomName)}/members`);
        if (!res.ok) throw new Error(`Roster fetch failed (${res.status})`);
        const data = await res.json();
        const members: RosterMember[] = Array.isArray(data?.members) ? data.members : [];
        if (cancelled) return;

        const now = new Date().toISOString();
        console.log("[fetchRoster] Members from API:", members.map(m => m.identity));
        setKnownParticipants((prev) => {
          const next = { ...prev };
          members.forEach((member) => {
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
              status: online ? existing?.status ?? "" : "Offline",
              speaking: online ? existing?.speaking ?? false : false,
              muted: existing?.muted ?? true,
              cameraOff: existing?.cameraOff ?? true,
              you: id === selfIdentity ? true : existing?.you,
              online,
              lastSeen: existing?.lastSeen ?? member.joinedAt ?? now,
            };
          });
          console.log("[fetchRoster] Updated knownParticipants:", Object.keys(next));
          return next;
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoster();
    return () => { cancelled = true; };
  }, [apiBase, roomName, selfIdentity]);

  const updateOverride = (
    setter: Dispatch<SetStateAction<Record<string, boolean>>>,
    identity: string,
    disabled: boolean,
  ) => {
    setter((prev) => {
      const next = { ...prev };
      if (disabled) next[identity] = true;
      else delete next[identity];
      return next;
    });
  };

  const getParticipantId = (participant: any) =>
    participant.identity || participant.sid || "unknown";

  const getBaseName = (participant: any) =>
    (participant.name || participant.identity || "User").trim();

  const resolveRosterName = (member: RosterMember) =>
    (member.displayName || member.identity || "User").trim();

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

  const setRemoteSubscription = (publications: Map<string, any>, enabled: boolean) => {
    publications.forEach((publication) => {
      if (publication?.setSubscribed) publication.setSubscribed(enabled);
    });
  };

  const setRemoteVideoQuality = (participant: any, quality: VideoQuality) => {
    const publications = participant?.videoTrackPublications;
    if (!publications) return;
    publications.forEach((publication: any) => {
      if (typeof publication?.setVideoQuality === "function") publication.setVideoQuality(quality);
      else if (typeof publication?.setPreferredLayer === "function") publication.setPreferredLayer(quality);
    });
  };

  const setRemoteTrackPriority = (participant: any, priority: "low" | "standard" | "high") => {
    const publications = participant?.videoTrackPublications;
    if (!publications) return;
    const priorityEnum = (Track as any).Priority;
    if (!priorityEnum) return;
    const key = priority.toUpperCase();
    const value = priorityEnum[key] ?? priorityEnum.STANDARD;
    if (!value) return;
    publications.forEach((publication: any) => {
      if (typeof publication?.setPriority === "function") publication.setPriority(value);
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
    return tracks.every((track) => {
      const participant = track.participant;
      if (!participant || participant.isLocal) return true;
      const identity = getParticipantId(participant);
      return audioOverrides[identity] === true;
    });
  }, [tracks, audioOverrides]);

  const allVideoOff = useMemo(() => {
    return tracks.every((track) => {
      const participant = track.participant;
      if (!participant || participant.isLocal) return true;
      const identity = getParticipantId(participant);
      return videoOverrides[identity] === true;
    });
  }, [tracks, videoOverrides]);

  const toggleAllAudio = () => {
    const newState = !allAudioOff;
    tracks.forEach((track) => {
      const participant = track.participant;
      if (!participant || participant.isLocal) return;
      const identity = getParticipantId(participant);
      updateOverride(setAudioOverrides, identity, newState);
      setRemoteSubscription(participant.audioTrackPublications, !newState);
    });
  };

  const toggleAllVideo = () => {
    const newState = !allVideoOff;
    tracks.forEach((track) => {
      const participant = track.participant;
      if (!participant || participant.isLocal) return;
      const identity = getParticipantId(participant);
      updateOverride(setVideoOverrides, identity, newState);
      setRemoteSubscription(participant.videoTrackPublications, !newState);
    });
  };

  const liveTiles: LiveTileData[] = useMemo(() => {
    const tiles: LiveTileData[] = [];
    tracks.forEach((trackRef) => {
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
    tracks.forEach((trackRef) => {
      const participant = trackRef.participant;
      if (!participant) return;
      const identity = getParticipantId(participant);
      const displayName = getBaseName(participant);

      // 사용자가 다시 로그인한 경우 (active track이 있음), deletedIdentities에서 제거
      if (deletedIdentitiesRef.current.has(identity)) {
        console.log(`[tracks] User logged back in, removing from deleted set: ${identity}`);
        deletedIdentitiesRef.current.delete(identity);
      }

      setKnownParticipants((prev) => {
        const existing = prev[identity];
        if (existing && existing.online) return prev;
        return {
          ...prev,
          [identity]: {
            id: identity,
            name: displayName,
            status: "",
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
    const onlineIds = new Set(liveTiles.map((t) => t.key));
    setKnownParticipants((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        const wasOnline = next[id].online;
        const nowOnline = onlineIds.has(id);
        if (wasOnline !== nowOnline) {
          changed = true;
          next[id] = {
            ...next[id],
            online: nowOnline,
            status: nowOnline ? "" : "Offline",
          };
        }
      });
      return changed ? next : prev;
    });
  }, [liveTiles]);

  useEffect(() => {
    tracks.forEach((trackRef) => {
      const participant = trackRef.participant;
      if (!participant || participant.isLocal) return;
      const identity = getParticipantId(participant);
      const isFocused = identity === focusedId;
      if (isFocused) {
        setRemoteVideoQuality(participant, VideoQuality.HIGH);
        setRemoteTrackPriority(participant, "high");
      } else {
        setRemoteVideoQuality(participant, VideoQuality.LOW);
        setRemoteTrackPriority(participant, "low");
      }
    });
  }, [focusedId, tracks]);

  const showOnlyFocused = !!focusedId && liveTiles.length > 1;
  const visibleTiles = showOnlyFocused
    ? liveTiles.filter((t) => t.key === focusedId)
    : liveTiles;

  const gridSlots = useMemo<GridSlot[]>(() => {
    if (showOnlyFocused) {
      return visibleTiles.map((tile) => ({ type: "live" as const, key: tile.key, tile }));
    }
    const slots = gridSize * gridSize;
    const result: GridSlot[] = [];
    for (let i = 0; i < slots; i++) {
      const tile = visibleTiles[i];
      if (tile) result.push({ type: "live" as const, key: tile.key, tile });
      else result.push({ type: "empty" as const, key: `empty-${i}` });
    }
    return result;
  }, [visibleTiles, gridSize, showOnlyFocused]);

  const sidebarList = useMemo(() => {
    console.log("[sidebarList] Computing, knownParticipants keys:", Object.keys(knownParticipants));
    const list = Object.values(knownParticipants).filter((participant) => {
      if (participant.you && participant.online === false) return false;
      return true;
    });
    list.sort((a, b) => {
      const onlineDiff = Number(!!b.online) - Number(!!a.online);
      if (onlineDiff !== 0) return onlineDiff;
      return a.name.localeCompare(b.name);
    });
    console.log("[sidebarList] Result count:", list.length, "names:", list.map(p => p.name));
    return list;
  }, [knownParticipants]);

  useEffect(() => {
    if (!selectedParticipantId) return;
    const selected = knownParticipants[selectedParticipantId];
    if (!selected || selected.you) setSelectedParticipantId(null);
  }, [knownParticipants, selectedParticipantId]);

  // SSE 이벤트 구독 (로그아웃/회원탈퇴 시 목록에서 삭제)
  useEffect(() => {
    const base = apiBase || "";
    if (!base) {
      console.log("[SSE] apiBase is empty, skipping SSE connection");
      return;
    }

    const sseUrl = `${base}/v1/events/stream`;
    console.log(`[SSE] Connecting to: ${sseUrl}`);

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log(`[SSE] Connection opened, readyState: ${eventSource.readyState}`);
    };

    eventSource.onmessage = (event) => {
      console.log(`[SSE] Message received:`, event.data);
      try {
        const data = JSON.parse(event.data);
        console.log(`[SSE] Parsed event:`, data);
        if (data.type === "user-logout" || data.type === "user-deleted") {
          const { identity } = data;
          if (identity) {
            console.log(`[SSE] Removing participant: ${identity}`);
            // 삭제된 identity 기록 (재추가 방지)
            deletedIdentitiesRef.current.add(identity);
            setKnownParticipants((prev) => {
              const next = { ...prev };
              delete next[identity];
              console.log(`[SSE] Updated participants:`, Object.keys(next));
              return next;
            });
          }
        }
      } catch (err) {
        console.error("[SSE] Parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error(`[SSE] Connection error, readyState: ${eventSource.readyState}`, err);
    };

    return () => {
      console.log("[SSE] Closing connection");
      eventSource.close();
    };
  }, [apiBase]);

  return (
    <div className={`${styles.content} ${!showParticipantList ? styles.contentFullWidth : ""}`}>
      <div className={`${styles.stage} ${ending ? styles.stageEnding : ""}`}>
        {showJoin ? <JoinBanner onJoin={onJoin} busy={joinBusy} error={error} /> : null}
        {toastMessage ? (
          <div key={toastKey} className={styles.toast}>{toastMessage}</div>
        ) : null}
        <RoomAudioRenderer />
        <div
          className={`${styles.grid} ${showOnlyFocused ? styles.gridFocused : ""}`}
          style={{
            gridTemplateColumns: showOnlyFocused ? "1fr" : `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: showOnlyFocused ? "1fr" : `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {gridSlots.map((slot) =>
            slot.type === "live" ? (
              <LiveTile
                key={slot.key}
                trackRef={slot.tile.ref}
                displayName={slot.tile.displayName}
                focused={focusedId === slot.tile.key}
                onFocus={() => onFocus(focusedId === slot.tile.key ? null : slot.tile.key)}
                onToggleAudio={() => toggleParticipantAudio(slot.tile.ref.participant)}
                onToggleVideo={() => toggleParticipantVideo(slot.tile.ref.participant)}
                audioOff={isAudioOff(slot.tile.ref.participant)}
                videoOff={isVideoOff(slot.tile.ref.participant)}
                canControl={canControl}
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
    </div>
  );
};

export default function Home() {
  const apiBaseEnv = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const livekitEnv = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";
  const defaultRoom = process.env.NEXT_PUBLIC_ROOM_NAME ?? "demo-room";

  const [apiBase, setApiBase] = useState(apiBaseEnv);

  useEffect(() => {
    if (apiBaseEnv) {
      setApiBase(apiBaseEnv);
      return;
    }
    if (typeof window !== "undefined") {
      setApiBase(window.location.origin);
    }
  }, [apiBaseEnv]);

  const session = useLiveKitSession({
    apiBase,
    livekitUrl: livekitEnv,
    defaultRoomName: defaultRoom,
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
              apiBase={apiBase || ""}
              selfIdentity={session.identity}
              gridSize={session.gridSize}
              onGridSizeChange={session.setGridSize}
              showParticipantList={session.showParticipantList}
              onToggleParticipantList={() => session.setShowParticipantList(!session.showParticipantList)}
            />
          </LiveKitRoom>
        </div>
      </div>
    </SidebarLayout>
  );
}
