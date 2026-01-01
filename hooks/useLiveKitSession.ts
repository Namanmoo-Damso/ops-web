"use client";

import { useState, useEffect, useCallback } from "react";

const IDENTITY_STORAGE_KEY = "damso.identity";
const NAME_STORAGE_KEY = "damso.name";

const generateIdentity = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `host-${crypto.randomUUID()}`;
  }
  return `host-${Date.now()}`;
};

type Role = "host" | "viewer" | "observer";

export type UseLiveKitSessionOptions = {
  apiBase: string;
  livekitUrl: string;
  defaultRoomName: string;
};

export type UseLiveKitSessionReturn = {
  identity: string;
  name: string;
  roomName: string;
  token: string;
  serverUrl: string;
  connecting: boolean;
  connected: boolean;
  error: string | null;
  inviteStatus: string | null;
  inviteBusy: boolean;
  focusedId: string | null;
  gridSize: number;
  showParticipantList: boolean;
  setFocusedId: (id: string | null) => void;
  setGridSize: (size: number) => void;
  setShowParticipantList: (show: boolean) => void;
  joinRoom: () => Promise<void>;
  leaveRoom: () => void;
  inviteParticipant: (targetIdentity: string) => Promise<void>;
};

export function useLiveKitSession({
  apiBase,
  livekitUrl,
  defaultRoomName,
}: UseLiveKitSessionOptions): UseLiveKitSessionReturn {
  const [identity, setIdentity] = useState(generateIdentity);
  const [name, setName] = useState("Host");
  const [roomName] = useState(defaultRoomName);
  const [token, setToken] = useState<string>("");
  const [serverUrl, setServerUrl] = useState<string>(livekitUrl);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [gridSize, setGridSize] = useState(3);
  const [showParticipantList, setShowParticipantList] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedIdentity = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (storedIdentity) {
      setIdentity(storedIdentity);
    } else {
      const nextIdentity = generateIdentity();
      window.localStorage.setItem(IDENTITY_STORAGE_KEY, nextIdentity);
      setIdentity(nextIdentity);
    }

    const storedName = window.localStorage.getItem(NAME_STORAGE_KEY);
    if (storedName) {
      setName(storedName);
    }
  }, []);

  const joinRoom = useCallback(async () => {
    if (connecting || connected) return;
    setConnecting(true);
    setError(null);
    try {
      const apiBaseResolved = apiBase || window.location.origin;
      const authRes = await fetch(`${apiBaseResolved}/v1/auth/anonymous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, displayName: name }),
      });
      if (!authRes.ok) {
        throw new Error(`Auth failed (${authRes.status})`);
      }
      const authData = await authRes.json();

      const rtcRes = await fetch(`${apiBaseResolved}/v1/rtc/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.accessToken || ""}`,
        },
        body: JSON.stringify({
          roomName,
          identity,
          name,
          role: "host" as Role,
        }),
      });
      if (!rtcRes.ok) {
        throw new Error(`RTC token failed (${rtcRes.status})`);
      }
      const rtcData = await rtcRes.json();
      if (!rtcData?.token) {
        throw new Error("RTC token missing");
      }
      setToken(rtcData.token);
      setServerUrl(rtcData.livekitUrl || livekitUrl);
      setConnected(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Join failed");
    } finally {
      setConnecting(false);
    }
  }, [connecting, connected, apiBase, identity, name, roomName, livekitUrl]);

  const leaveRoom = useCallback(() => {
    setConnected(false);
    setToken("");
    setServerUrl(livekitUrl);
    setFocusedId(null);
  }, [livekitUrl]);

  const inviteParticipant = useCallback(async (targetIdentity: string) => {
    if (inviteBusy) return;
    const target = targetIdentity.trim();
    if (!target) {
      setInviteStatus("목록에서 참가자를 선택하세요");
      return;
    }
    if (target === identity) {
      setInviteStatus("자기 자신에게는 호출할 수 없습니다");
      return;
    }
    setInviteBusy(true);
    setInviteStatus(null);
    try {
      const apiBaseResolved = apiBase || window.location.origin;
      const res = await fetch(`${apiBaseResolved}/v1/calls/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerIdentity: identity,
          callerName: name,
          calleeIdentity: target,
          roomName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `Invite failed (${res.status})`);
      }
      const callId = data?.callId ? ` (${data.callId})` : "";
      setInviteStatus(`Invite sent${callId}`);
    } catch (err) {
      console.error(err);
      setInviteStatus(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setInviteBusy(false);
    }
  }, [inviteBusy, identity, name, apiBase, roomName]);

  return {
    identity,
    name,
    roomName,
    token,
    serverUrl,
    connecting,
    connected,
    error,
    inviteStatus,
    inviteBusy,
    focusedId,
    gridSize,
    showParticipantList,
    setFocusedId,
    setGridSize,
    setShowParticipantList,
    joinRoom,
    leaveRoom,
    inviteParticipant,
  };
}
