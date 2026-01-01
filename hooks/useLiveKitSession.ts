"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Role = "host" | "viewer" | "observer";

export type UseLiveKitSessionOptions = {
  apiBase: string;
  livekitUrl: string;
  defaultRoomName: string;
  autoJoin?: boolean;
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
  autoJoin = false,
}: UseLiveKitSessionOptions): UseLiveKitSessionReturn {
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

  // Admin identity and name (fetched from admin/me endpoint or derived from token)
  const [adminIdentity, setAdminIdentity] = useState<string>("");
  const [adminName, setAdminName] = useState<string>("");

  // Track if auto-join has been attempted to prevent duplicates
  const autoJoinAttempted = useRef(false);

  // Fetch admin info on mount
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const adminAccessToken = typeof window !== "undefined"
          ? window.localStorage.getItem("admin_access_token")
          : null;

        if (!adminAccessToken) return;

        const apiBaseResolved = apiBase || (typeof window !== "undefined" ? window.location.origin : "");
        const res = await fetch(`${apiBaseResolved}/admin/me`, {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const adminId = data.admin?.id || "";
          const adminNameValue = data.admin?.name || data.admin?.email || "Admin";
          setAdminIdentity(`admin_${adminId}`);
          setAdminName(adminNameValue);
        }
      } catch (err) {
        console.error("Failed to fetch admin info:", err);
      }
    };

    fetchAdminInfo();
  }, [apiBase]);

  const joinRoom = useCallback(async () => {
    if (connecting || connected) return;
    setConnecting(true);
    setError(null);
    try {
      const apiBaseResolved = apiBase || window.location.origin;

      // Use admin access token from localStorage instead of anonymous auth
      const adminAccessToken = typeof window !== "undefined"
        ? window.localStorage.getItem("admin_access_token")
        : null;

      if (!adminAccessToken) {
        throw new Error("Admin not authenticated. Please log in.");
      }

      // Request RTC token using admin credentials
      const rtcRes = await fetch(`${apiBaseResolved}/v1/rtc/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          roomName,
          // identity and name will be set by server based on admin token
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
  }, [connecting, connected, apiBase, roomName, livekitUrl]);

  // Auto-join when enabled (only once)
  useEffect(() => {
    if (autoJoin && apiBase && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      joinRoom();
    }
  }, [autoJoin, apiBase, joinRoom]);

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
    if (target === adminIdentity) {
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
          callerIdentity: adminIdentity,
          callerName: adminName,
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
  }, [inviteBusy, adminIdentity, adminName, apiBase, roomName]);

  return {
    identity: adminIdentity,
    name: adminName,
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
