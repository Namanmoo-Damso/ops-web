"use client";

import { useCallback, useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { LocationMap, type WardLocation } from "../../components/LocationMap";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LocationsPage() {
  const [locations, setLocations] = useState<WardLocation[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLocations = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const response = await fetch(`${API_BASE}/v1/admin/locations`, {
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
      setLocations(data.locations || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();

    // Auto refresh every 30 seconds
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchLocations, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchLocations, autoRefresh]);

  const handleWardClick = useCallback((wardId: string) => {
    setSelectedWardId(wardId);
  }, []);

  const selectedLocation = selectedWardId
    ? locations.find((loc) => loc.wardId === selectedWardId)
    : null;

  const statusCounts = locations.reduce(
    (acc, loc) => {
      acc[loc.status] = (acc[loc.status] || 0) + 1;
      return acc;
    },
    { normal: 0, warning: 0, emergency: 0 } as Record<string, number>
  );

  return (
    <SidebarLayout>
      <div style={{ display: "flex", gap: "24px", height: "calc(100vh - 80px)" }}>
        {/* Ward List Panel */}
        <aside
          style={{
            width: "340px",
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
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
              실시간 위치 현황
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#64748b" }}>
              등록된 피보호자: {locations.length}명
            </p>
          </div>

          {/* Status Summary */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "14px 20px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <StatusBadge label="정상" count={statusCounts.normal} color="#22c55e" />
            <StatusBadge label="주의" count={statusCounts.warning} color="#f59e0b" />
            <StatusBadge label="비상" count={statusCounts.emergency} color="#ef4444" />
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
              <span style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}>자동 새로고침</span>
            </label>
            <button
              onClick={fetchLocations}
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

          {/* Ward List */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {isLoading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                로딩 중...
              </div>
            ) : error ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#dc2626" }}>
                오류: {error}
              </div>
            ) : locations.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                등록된 위치 정보가 없습니다.
              </div>
            ) : (
              locations.map((loc) => (
                <WardListItem
                  key={loc.wardId}
                  location={loc}
                  isSelected={loc.wardId === selectedWardId}
                  onClick={() => handleWardClick(loc.wardId)}
                />
              ))
            )}
          </div>

          {/* Selected Ward Detail */}
          {selectedLocation && (
            <div
              style={{
                padding: "20px",
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
                {selectedLocation.wardName}
              </h3>
              <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.9" }}>
                <div>
                  <strong style={{ color: "#1e293b" }}>위치:</strong> {selectedLocation.latitude.toFixed(6)},{" "}
                  {selectedLocation.longitude.toFixed(6)}
                </div>
                {selectedLocation.accuracy && (
                  <div>
                    <strong style={{ color: "#1e293b" }}>정확도:</strong> {selectedLocation.accuracy.toFixed(1)}m
                  </div>
                )}
                <div>
                  <strong style={{ color: "#1e293b" }}>마지막 업데이트:</strong>{" "}
                  {new Date(selectedLocation.lastUpdated).toLocaleString("ko-KR")}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map */}
        <main style={{ flex: 1, borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <LocationMap
            locations={locations}
            onWardClick={handleWardClick}
            selectedWardId={selectedWardId || undefined}
          />
        </main>
      </div>
    </SidebarLayout>
  );
}

function StatusBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        backgroundColor: color + "15",
        borderRadius: "20px",
        border: `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: 500 }}>
        {label}: {count}
      </span>
    </div>
  );
}

function WardListItem({
  location,
  isSelected,
  onClick,
}: {
  location: WardLocation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusColors: Record<string, string> = {
    normal: "#22c55e",
    warning: "#f59e0b",
    emergency: "#ef4444",
  };

  const timeAgo = getTimeAgo(new Date(location.lastUpdated));

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 20px",
        border: "none",
        borderBottom: "1px solid #f1f5f9",
        backgroundColor: isSelected ? "#eff6ff" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 150ms ease",
      }}
      onMouseEnter={(e) => !isSelected && (e.currentTarget.style.backgroundColor = "#f8fafc")}
      onMouseLeave={(e) => !isSelected && (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          backgroundColor: statusColors[location.status],
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "14px",
          flexShrink: 0,
        }}
      >
        {location.wardName.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: isSelected ? 600 : 500,
            fontSize: "14px",
            color: "#1e293b",
            marginBottom: "4px",
          }}
        >
          {location.wardName}
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>{timeAgo}</div>
      </div>
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: statusColors[location.status],
          flexShrink: 0,
        }}
      />
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
