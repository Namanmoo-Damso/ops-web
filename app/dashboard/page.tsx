"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";

// 차트 컴포넌트들을 동적으로 import (SSR 비활성화)
const WeeklyTrendChart = dynamic(
  () => import("../../components/DashboardCharts").then((mod) => mod.WeeklyTrendChart),
  { ssr: false, loading: () => <ChartLoading /> }
);
const MoodPieChart = dynamic(
  () => import("../../components/DashboardCharts").then((mod) => mod.MoodPieChart),
  { ssr: false, loading: () => <ChartLoading /> }
);
const KeywordsBarChart = dynamic(
  () => import("../../components/DashboardCharts").then((mod) => mod.KeywordsBarChart),
  { ssr: false, loading: () => <ChartLoading /> }
);

function ChartLoading() {
  return (
    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
      차트 로딩 중...
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type DashboardStats = {
  overview: {
    totalWards: number;
    activeWards: number;
    totalGuardians: number;
    totalOrganizations: number;
    totalCalls: number;
    totalCallMinutes: number;
  };
  todayStats: {
    calls: number;
    avgDuration: number;
    emergencies: number;
    newRegistrations: number;
  };
  weeklyTrend: {
    calls: number[];
    emergencies: number[];
    labels: string[];
  };
  moodDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  healthAlerts: {
    warning: number;
    info: number;
    unread: number;
  };
  topKeywords: Array<{
    keyword: string;
    count: number;
  }>;
  organizationStats: Array<{
    id: string;
    name: string;
    wardCount: number;
    callCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
  fetchedAt: string;
};

type RealtimeStats = {
  activeCalls: number;
  onlineWards: number;
  pendingEmergencies: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    details: Record<string, unknown>;
  }>;
  fetchedAt: string;
};

const MOOD_COLORS = {
  positive: "#22c55e",
  neutral: "#f59e0b",
  negative: "#ef4444",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realtime, setRealtime] = useState<RealtimeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      console.log("[Dashboard] Fetching stats from:", `${API_BASE}/v1/admin/dashboard/stats`);
      const response = await fetch(`${API_BASE}/v1/admin/dashboard/stats`, {
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
        const errorText = await response.text();
        console.error("[Dashboard] Stats fetch failed:", response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      console.log("[Dashboard] Stats received:", data);
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("[Dashboard] Stats error:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRealtime = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const response = await fetch(`${API_BASE}/v1/admin/dashboard/realtime`, {
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
      setRealtime(data);
    } catch {
      // Silently fail for realtime
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRealtime();

    let statsInterval: NodeJS.Timeout | null = null;
    let realtimeInterval: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      statsInterval = setInterval(fetchStats, 60000); // 1분마다 전체 통계
      realtimeInterval = setInterval(fetchRealtime, 10000); // 10초마다 실시간
    }

    return () => {
      if (statsInterval) clearInterval(statsInterval);
      if (realtimeInterval) clearInterval(realtimeInterval);
    };
  }, [fetchStats, fetchRealtime, autoRefresh]);

  if (isLoading) {
    return (
      <SidebarLayout title="대시보드">
        <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
          대시보드 로딩 중...
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout title="대시보드">
        <div style={{ padding: "48px", textAlign: "center", color: "#dc2626" }}>
          오류: {error}
          <button
            onClick={fetchStats}
            style={{
              marginLeft: "12px",
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            재시도
          </button>
        </div>
      </SidebarLayout>
    );
  }

  if (!stats) return null;

  // API 응답을 차트 데이터로 변환
  const moodTotal = stats.moodDistribution.positive + stats.moodDistribution.neutral + stats.moodDistribution.negative;
  const moodData = [
    { name: "긍정", value: stats.moodDistribution.positive, color: MOOD_COLORS.positive },
    { name: "중립", value: stats.moodDistribution.neutral, color: MOOD_COLORS.neutral },
    { name: "부정", value: stats.moodDistribution.negative, color: MOOD_COLORS.negative },
  ];

  // weeklyTrend를 차트 데이터로 변환
  const weeklyTrendData = stats.weeklyTrend.labels.map((label, index) => ({
    dayLabel: label,
    calls: stats.weeklyTrend.calls[index] || 0,
    emergencies: stats.weeklyTrend.emergencies[index] || 0,
  }));

  return (
    <SidebarLayout>
      {/* Custom Header with Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#1e293b" }}>
            관제 대시보드
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
            마지막 업데이트: {new Date(stats.fetchedAt).toLocaleString("ko-KR")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
            onClick={() => {
              fetchStats();
              fetchRealtime();
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
          >
            새로고침
          </button>
        </div>
      </div>

      {/* Realtime Stats Banner */}
      {realtime && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <RealtimeCard
            label="진행 중인 통화"
            value={realtime.activeCalls}
            color="#3b82f6"
            icon="📞"
          />
          <RealtimeCard
            label="온라인 피보호자"
            value={realtime.onlineWards}
            color="#22c55e"
            icon="🟢"
          />
          <RealtimeCard
            label="대기 중인 비상상황"
            value={realtime.pendingEmergencies}
            color={realtime.pendingEmergencies > 0 ? "#dc2626" : "#64748b"}
            icon="🚨"
            highlight={realtime.pendingEmergencies > 0}
          />
        </div>
      )}

      {/* Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <StatCard label="전체 피보호자" value={stats.overview.totalWards} />
        <StatCard
          label="활성 피보호자"
          value={stats.overview.activeWards}
          subtext={`${Math.round((stats.overview.activeWards / Math.max(stats.overview.totalWards, 1)) * 100)}%`}
        />
        <StatCard label="전체 보호자" value={stats.overview.totalGuardians} />
        <StatCard label="등록 기관" value={stats.overview.totalOrganizations} />
        <StatCard
          label="총 통화 수"
          value={stats.overview.totalCalls.toLocaleString()}
        />
        <StatCard
          label="총 통화 시간"
          value={`${Math.round(stats.overview.totalCallMinutes / 60)}시간`}
          subtext={`${stats.overview.totalCallMinutes.toLocaleString()}분`}
        />
      </div>

      {/* Today Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <TodayCard
          label="오늘 통화"
          value={stats.todayStats.calls}
          icon="📞"
        />
        <TodayCard
          label="평균 통화시간"
          value={`${stats.todayStats.avgDuration.toFixed(1)}분`}
          icon="⏱️"
        />
        <TodayCard
          label="오늘 비상상황"
          value={stats.todayStats.emergencies}
          icon="🚨"
          highlight={stats.todayStats.emergencies > 0}
        />
        <TodayCard
          label="신규 등록"
          value={stats.todayStats.newRegistrations}
          icon="👤"
        />
      </div>

      {/* Charts Row 1 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Weekly Trend Chart */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
            주간 추이
          </h3>
          <WeeklyTrendChart data={weeklyTrendData} />
        </div>

        {/* Mood Distribution */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
            감정 분포 (총 {moodTotal}건)
          </h3>
          <MoodPieChart data={moodData} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}
      >
        {/* Health Alerts */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
            건강 알림
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <AlertRow
              label="경고 알림"
              value={stats.healthAlerts.warning}
              color="#f59e0b"
            />
            <AlertRow
              label="정보 알림"
              value={stats.healthAlerts.info}
              color="#3b82f6"
            />
            <AlertRow
              label="미확인 알림"
              value={stats.healthAlerts.unread}
              color="#dc2626"
              highlight
            />
          </div>
        </div>

        {/* Top Keywords */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
            주요 건강 키워드
          </h3>
          {stats.topKeywords.length > 0 ? (
            <KeywordsBarChart data={stats.topKeywords.slice(0, 5)} />
          ) : (
            <div
              style={{
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              키워드 데이터 없음
            </div>
          )}
        </div>

        {/* Organization Stats */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
            기관별 현황
          </h3>
          {stats.organizationStats.length > 0 ? (
            <div style={{ maxHeight: "200px", overflow: "auto" }}>
              <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "10px 4px", color: "#475569", fontWeight: 600 }}>기관</th>
                    <th style={{ textAlign: "right", padding: "10px 4px", color: "#475569", fontWeight: 600 }}>피보호자</th>
                    <th style={{ textAlign: "right", padding: "10px 4px", color: "#475569", fontWeight: 600 }}>통화</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.organizationStats.map((org) => (
                    <tr key={org.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 4px", color: "#1e293b" }}>{org.name}</td>
                      <td style={{ textAlign: "right", padding: "10px 4px", color: "#475569" }}>{org.wardCount}</td>
                      <td style={{ textAlign: "right", padding: "10px 4px", color: "#475569" }}>{org.callCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
              }}
            >
              등록된 기관 없음
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>
          최근 활동
        </h3>
        {stats.recentActivity.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stats.recentActivity.slice(0, 10).map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))}
          </div>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
            최근 활동 없음
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

function RealtimeCard({
  label,
  value,
  color,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: highlight ? "#fef2f2" : "white",
        borderRadius: "12px",
        padding: "18px 22px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        border: highlight ? "2px solid #fca5a5" : "1px solid #e2e8f0",
        animation: highlight ? "pulse 2s infinite" : "none",
      }}
    >
      <span style={{ fontSize: "28px" }}>{icon}</span>
      <div>
        <div style={{ fontSize: "26px", fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        textAlign: "center",
        border: "1px solid #e2e8f0",
      }}
    >
      <div style={{ fontSize: "26px", fontWeight: 700, color: "#1e293b" }}>
        {value}
      </div>
      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "6px", fontWeight: 500 }}>
        {label}
      </div>
      {subtext && (
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

function TodayCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: highlight ? "#fef2f2" : "white",
        borderRadius: "12px",
        padding: "18px 22px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        border: highlight ? "1px solid #fca5a5" : "1px solid #e2e8f0",
      }}
    >
      <span style={{ fontSize: "26px" }}>{icon}</span>
      <div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: highlight ? "#dc2626" : "#1e293b",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function AlertRow({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 18px",
        backgroundColor: highlight ? "#fef2f2" : "#f8fafc",
        borderRadius: "10px",
        border: highlight ? "1px solid #fca5a5" : "1px solid #e2e8f0",
      }}
    >
      <span style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}>{label}</span>
      <span
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ActivityItem({
  activity,
}: {
  activity: {
    type: string;
    description: string;
    timestamp: string;
    details: Record<string, unknown>;
  };
}) {
  const typeIcons: Record<string, string> = {
    call_started: "📞",
    call_ended: "📴",
    emergency: "🚨",
  };

  const typeColors: Record<string, string> = {
    call_started: "#3b82f6",
    call_ended: "#64748b",
    emergency: "#dc2626",
  };

  const timeAgo = getTimeAgo(new Date(activity.timestamp));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px 16px",
        backgroundColor: activity.type === "emergency" ? "#fef2f2" : "#f8fafc",
        borderRadius: "10px",
        border: activity.type === "emergency" ? "1px solid #fca5a5" : "1px solid #e2e8f0",
      }}
    >
      <span style={{ fontSize: "22px" }}>{typeIcons[activity.type] || "📌"}</span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: typeColors[activity.type] || "#475569",
          }}
        >
          {activity.description}
        </div>
      </div>
      <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>{timeAgo}</div>
    </div>
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
