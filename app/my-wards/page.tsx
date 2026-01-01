"use client";

import { useCallback, useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Ward = {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  phoneNumber: string;
  name: string;
  birthDate: string | null;
  address: string | null;
  notes: string | null;
  isRegistered: boolean;
  wardId: string | null;
  createdAt: string;
  lastCallAt: string | null;
  totalCalls: number;
  lastMood: string | null;
};

type Stats = {
  total: number;
  registered: number;
  pending: number;
  positiveMood: number;
  negativeMood: number;
};

const MOOD_LABELS: Record<string, string> = {
  positive: "긍정",
  neutral: "보통",
  negative: "부정",
};

const MOOD_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#64748b",
  negative: "#ef4444",
};

export default function MyWardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    registered: 0,
    pending: 0,
    positiveMood: 0,
    negativeMood: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "registered" | "pending">("all");
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  const fetchMyWards = useCallback(async () => {
    try {
      const token = localStorage.getItem("admin_access_token");
      if (!token) {
        setError("로그인이 필요합니다");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/v1/admin/my-wards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰 만료 - 자동 로그아웃
          localStorage.removeItem("admin_access_token");
          localStorage.removeItem("admin_refresh_token");
          localStorage.removeItem("admin_info");
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setWards(data.wards || []);
      setStats(data.stats || { total: 0, registered: 0, pending: 0, positiveMood: 0, negativeMood: 0 });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyWards();
  }, [fetchMyWards]);

  const filteredWards = wards.filter((ward) => {
    // Filter by status
    if (filterStatus === "registered" && !ward.isRegistered) return false;
    if (filterStatus === "pending" && ward.isRegistered) return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ward.name.toLowerCase().includes(query) ||
        ward.email.toLowerCase().includes(query) ||
        ward.phoneNumber.includes(query)
      );
    }
    return true;
  });

  const getTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>
            내 담당 고객
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#64748b" }}>
            CSV로 등록한 피보호자 목록을 관리하세요
          </p>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <StatCard
            label="전체 고객"
            value={stats.total}
            color="#3b82f6"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            }
          />
          <StatCard
            label="앱 가입 완료"
            value={stats.registered}
            color="#22c55e"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="가입 대기"
            value={stats.pending}
            color="#f59e0b"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="긍정 감정"
            value={stats.positiveMood}
            color="#22c55e"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="9" cy="10" r="1" fill="currentColor" />
                <circle cx="15" cy="10" r="1" fill="currentColor" />
              </svg>
            }
          />
          <StatCard
            label="부정 감정"
            value={stats.negativeMood}
            color="#ef4444"
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="9" cy="10" r="1" fill="currentColor" />
                <circle cx="15" cy="10" r="1" fill="currentColor" />
              </svg>
            }
          />
        </div>

        {/* Filters & Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            {(["all", "registered", "pending"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: "8px 16px",
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
                {status === "all" ? "전체" : status === "registered" ? "가입 완료" : "대기 중"}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: "200px",
              maxWidth: "400px",
              padding: "10px 14px",
              fontSize: "14px",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              backgroundColor: "white",
              color: "#1e293b",
            }}
          />
          <button
            onClick={fetchMyWards}
            style={{
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            새로고침
          </button>
        </div>

        {/* Content */}
        <div style={{ display: "flex", gap: "24px" }}>
          {/* Ward List */}
          <div
            style={{
              flex: 1,
              backgroundColor: "white",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {isLoading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
                로딩 중...
              </div>
            ) : error ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#dc2626" }}>
                {error}
              </div>
            ) : filteredWards.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
                {wards.length === 0
                  ? "등록된 담당 고객이 없습니다. CSV로 피보호자를 등록해주세요."
                  : "검색 결과가 없습니다."}
              </div>
            ) : (
              <div>
                {/* Table Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 80px",
                    gap: "12px",
                    padding: "14px 20px",
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span>이름</span>
                  <span>연락처</span>
                  <span>기관</span>
                  <span>상태</span>
                  <span>마지막 통화</span>
                  <span>감정</span>
                </div>

                {/* Table Body */}
                {filteredWards.map((ward) => (
                  <WardRow
                    key={ward.id}
                    ward={ward}
                    isSelected={selectedWard?.id === ward.id}
                    onClick={() => setSelectedWard(ward)}
                    getTimeAgo={getTimeAgo}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedWard && (
            <div
              style={{
                width: "360px",
                backgroundColor: "white",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                flexShrink: 0,
                position: "sticky",
                top: "24px",
                height: "fit-content",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                  상세 정보
                </h3>
                <button
                  onClick={() => setSelectedWard(null)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#f1f5f9",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    color: "#64748b",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Profile */}
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: selectedWard.isRegistered ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "28px",
                    fontWeight: 700,
                    margin: "0 auto 12px",
                  }}
                >
                  {selectedWard.name.charAt(0)}
                </div>
                <h4 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
                  {selectedWard.name}
                </h4>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "20px",
                    backgroundColor: selectedWard.isRegistered ? "#dcfce7" : "#fef3c7",
                    color: selectedWard.isRegistered ? "#16a34a" : "#d97706",
                  }}
                >
                  {selectedWard.isRegistered ? "앱 가입 완료" : "가입 대기"}
                </span>
              </div>

              {/* Info List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <DetailItem label="이메일" value={selectedWard.email} />
                <DetailItem label="전화번호" value={selectedWard.phoneNumber} />
                <DetailItem label="생년월일" value={formatDate(selectedWard.birthDate)} />
                <DetailItem label="주소" value={selectedWard.address || "-"} />
                <DetailItem label="소속 기관" value={selectedWard.organizationName} />
                <DetailItem label="등록일" value={formatDate(selectedWard.createdAt)} />

                <div style={{ height: "1px", backgroundColor: "#e2e8f0", margin: "8px 0" }} />

                <DetailItem
                  label="총 통화"
                  value={`${selectedWard.totalCalls}회`}
                />
                <DetailItem
                  label="마지막 통화"
                  value={getTimeAgo(selectedWard.lastCallAt)}
                />
                {selectedWard.lastMood && (
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>마지막 감정</div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        backgroundColor: `${MOOD_COLORS[selectedWard.lastMood]}15`,
                        color: MOOD_COLORS[selectedWard.lastMood],
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: MOOD_COLORS[selectedWard.lastMood],
                        }}
                      />
                      {MOOD_LABELS[selectedWard.lastMood]}
                    </span>
                  </div>
                )}

                {selectedWard.notes && (
                  <>
                    <div style={{ height: "1px", backgroundColor: "#e2e8f0", margin: "8px 0" }} />
                    <div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>메모</div>
                      <div style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6 }}>
                        {selectedWard.notes}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: `${color}15`,
            color: color,
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "2px" }}>{label}</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b" }}>{value}</div>
        </div>
      </div>
    </div>
  );
}

function WardRow({
  ward,
  isSelected,
  onClick,
  getTimeAgo,
}: {
  ward: Ward;
  isSelected: boolean;
  onClick: () => void;
  getTimeAgo: (date: string | null) => string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 80px",
        gap: "12px",
        padding: "16px 20px",
        border: "none",
        borderBottom: "1px solid #f1f5f9",
        backgroundColor: isSelected ? "#eff6ff" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 150ms ease",
      }}
    >
      {/* Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background: ward.isRegistered ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "white",
            display: "grid",
            placeItems: "center",
            fontSize: "14px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {ward.name.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{ward.name}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>{ward.email}</div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ display: "flex", alignItems: "center", fontSize: "14px", color: "#475569" }}>
        {ward.phoneNumber}
      </div>

      {/* Organization */}
      <div style={{ display: "flex", alignItems: "center", fontSize: "13px", color: "#64748b" }}>
        {ward.organizationName}
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: 600,
            borderRadius: "20px",
            backgroundColor: ward.isRegistered ? "#dcfce7" : "#fef3c7",
            color: ward.isRegistered ? "#16a34a" : "#d97706",
          }}
        >
          {ward.isRegistered ? "가입" : "대기"}
        </span>
      </div>

      {/* Last Call */}
      <div style={{ display: "flex", alignItems: "center", fontSize: "13px", color: "#64748b" }}>
        {getTimeAgo(ward.lastCallAt)}
      </div>

      {/* Mood */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {ward.lastMood ? (
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: MOOD_COLORS[ward.lastMood],
            }}
            title={MOOD_LABELS[ward.lastMood]}
          />
        ) : (
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>-</span>
        )}
      </div>
    </button>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "#1e293b", fontWeight: 500 }}>{value}</div>
    </div>
  );
}
