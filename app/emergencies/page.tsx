"use client";

import { useCallback, useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { LocationMap, type WardLocation } from "../../components/LocationMap";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Emergency = {
  id: string;
  wardId: string | null;
  wardName: string;
  type: "manual" | "ai_detected" | "geofence" | "admin";
  status: "active" | "resolved" | "false_alarm";
  latitude: number | null;
  longitude: number | null;
  message: string | null;
  guardianNotified: boolean;
  createdAt: string;
  resolvedAt: string | null;
  respondedAgencies: string[];
};

const TYPE_LABELS: Record<string, string> = {
  manual: "수동 발동",
  ai_detected: "AI 감지",
  geofence: "영역 이탈",
  admin: "관제센터",
};

const STATUS_LABELS: Record<string, string> = {
  active: "진행 중",
  resolved: "해결됨",
  false_alarm: "오경보",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#ef4444",
  resolved: "#22c55e",
  false_alarm: "#64748b",
};

export default function EmergenciesPage() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isResolving, setIsResolving] = useState(false);

  const fetchEmergencies = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const url = filterStatus
        ? `${API_BASE}/v1/admin/emergencies?status=${filterStatus}`
        : `${API_BASE}/v1/admin/emergencies`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_info");
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setEmergencies(data.emergencies || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchEmergencies();

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchEmergencies, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchEmergencies, autoRefresh]);

  const handleResolve = async (emergencyId: string, status: "resolved" | "false_alarm") => {
    if (isResolving) return;
    setIsResolving(true);

    try {
      const token = localStorage.getItem("admin_access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const response = await fetch(
        `${API_BASE}/v1/admin/emergencies/${emergencyId}/resolve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_info");
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      await fetchEmergencies();
      setSelectedEmergencyId(null);
    } catch (err) {
      alert(`해결 처리 실패: ${(err as Error).message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const selectedEmergency = selectedEmergencyId
    ? emergencies.find((e) => e.id === selectedEmergencyId)
    : null;

  const activeCount = emergencies.filter((e) => e.status === "active").length;

  // 지도에 표시할 위치 데이터
  const mapLocations: WardLocation[] = emergencies
    .filter((e) => e.latitude !== null && e.longitude !== null)
    .map((e) => ({
      wardId: e.wardId || e.id,
      wardName: e.wardName,
      latitude: e.latitude!,
      longitude: e.longitude!,
      accuracy: null,
      lastUpdated: e.createdAt,
      status: e.status === "active" ? "emergency" : "normal",
      organizationId: null,
    }));

  return (
    <SidebarLayout>
      <div style={{ display: "flex", gap: "24px", height: "calc(100vh - 80px)" }}>
        {/* Emergency List Panel */}
        <aside
          style={{
            width: "420px",
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: activeCount > 0 ? "#fef2f2" : "white",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
              비상 상황 관리
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "14px",
                color: activeCount > 0 ? "#dc2626" : "#64748b",
                fontWeight: activeCount > 0 ? 600 : 400,
              }}
            >
              {activeCount > 0
                ? `진행 중인 비상 상황: ${activeCount}건`
                : "진행 중인 비상 상황 없음"}
            </p>
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "14px 20px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {["active", "resolved", "false_alarm", ""].map((status) => (
              <button
                key={status || "all"}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: filterStatus === status ? "#3b82f6" : "#f1f5f9",
                  color: filterStatus === status ? "white" : "#475569",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {status ? STATUS_LABELS[status] : "전체"}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#3b82f6" }}
              />
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}>자동 새로고침 (10초)</span>
            </label>
            <button
              onClick={fetchEmergencies}
              style={{
                padding: "8px 14px",
                fontSize: "13px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              새로고침
            </button>
          </div>

          {/* Emergency List */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {isLoading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                로딩 중...
              </div>
            ) : error ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>
                오류: {error}
              </div>
            ) : emergencies.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                비상 상황이 없습니다.
              </div>
            ) : (
              emergencies.map((emergency) => (
                <EmergencyCard
                  key={emergency.id}
                  emergency={emergency}
                  isSelected={emergency.id === selectedEmergencyId}
                  onClick={() => setSelectedEmergencyId(emergency.id)}
                />
              ))
            )}
          </div>

          {/* Selected Emergency Detail */}
          {selectedEmergency && (
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                {selectedEmergency.wardName}
              </h3>
              <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.9" }}>
                <div>
                  <strong style={{ color: "#1e293b" }}>유형:</strong> {TYPE_LABELS[selectedEmergency.type]}
                </div>
                <div>
                  <strong style={{ color: "#1e293b" }}>발생시각:</strong>{" "}
                  {new Date(selectedEmergency.createdAt).toLocaleString("ko-KR")}
                </div>
                {selectedEmergency.message && (
                  <div>
                    <strong style={{ color: "#1e293b" }}>메시지:</strong> {selectedEmergency.message}
                  </div>
                )}
                {selectedEmergency.respondedAgencies.length > 0 && (
                  <div>
                    <strong style={{ color: "#1e293b" }}>연락기관:</strong> {selectedEmergency.respondedAgencies.join(", ")}
                  </div>
                )}
                <div>
                  <strong style={{ color: "#1e293b" }}>보호자 알림:</strong>{" "}
                  {selectedEmergency.guardianNotified ? "완료" : "미발송"}
                </div>
              </div>

              {selectedEmergency.status === "active" && (
                <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                  <button
                    onClick={() => handleResolve(selectedEmergency.id, "resolved")}
                    disabled={isResolving}
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      backgroundColor: "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: isResolving ? "not-allowed" : "pointer",
                      opacity: isResolving ? 0.7 : 1,
                    }}
                  >
                    해결 완료
                  </button>
                  <button
                    onClick={() => handleResolve(selectedEmergency.id, "false_alarm")}
                    disabled={isResolving}
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      backgroundColor: "#64748b",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: isResolving ? "not-allowed" : "pointer",
                      opacity: isResolving ? 0.7 : 1,
                    }}
                  >
                    오경보 처리
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Map */}
        <main style={{ flex: 1, borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <LocationMap
            locations={mapLocations}
            onWardClick={(wardId) => {
              const emergency = emergencies.find(
                (e) => e.wardId === wardId || e.id === wardId
              );
              if (emergency) {
                setSelectedEmergencyId(emergency.id);
              }
            }}
            selectedWardId={selectedEmergency?.wardId || selectedEmergency?.id}
          />
        </main>
      </div>
    </SidebarLayout>
  );
}

function EmergencyCard({
  emergency,
  isSelected,
  onClick,
}: {
  emergency: Emergency;
  isSelected: boolean;
  onClick: () => void;
}) {
  const timeAgo = getTimeAgo(new Date(emergency.createdAt));
  const isActive = emergency.status === "active";

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "16px 20px",
        border: "none",
        borderBottom: "1px solid #f1f5f9",
        backgroundColor: isSelected
          ? "#eff6ff"
          : isActive
          ? "#fef2f2"
          : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 150ms ease",
      }}
    >
      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: STATUS_COLORS[emergency.status],
          marginTop: "4px",
          flexShrink: 0,
          animation: isActive ? "pulse 2s infinite" : "none",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontWeight: isActive ? 600 : 500,
              fontSize: "14px",
              color: isActive ? "#dc2626" : "#1e293b",
            }}
          >
            {emergency.wardName}
          </span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>{timeAgo}</span>
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          {TYPE_LABELS[emergency.type]} | {STATUS_LABELS[emergency.status]}
        </div>
        {emergency.respondedAgencies.length > 0 && (
          <div
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              marginTop: "6px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {emergency.respondedAgencies.join(", ")}
          </div>
        )}
      </div>
    </button>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR");
}
