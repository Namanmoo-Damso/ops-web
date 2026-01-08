'use client';

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

import { LocationMap, type WardLocation } from '../../components/LocationMap';
import { useApi } from '../../hooks/useApi';



type LocationsResponse = {
  locations: WardLocation[];
};

export default function LocationsPage() {
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data, loading, error, refetch } = useApi<LocationsResponse>({
    deps: [],
    fetcher: (client, signal) => client.get('/v1/admin/locations', { signal }),
  });

  const locations = data?.locations || [];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetch();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refetch]);

  const handleWardClick = useCallback((wardId: string) => {
    setSelectedWardId(wardId);
  }, []);

  const selectedLocation = selectedWardId
    ? locations.find(loc => loc.wardId === selectedWardId)
    : null;

  const statusCounts = locations.reduce(
    (acc, loc) => {
      acc[loc.status] = (acc[loc.status] || 0) + 1;
      return acc;
    },
    { normal: 0, warning: 0, emergency: 0 } as Record<string, number>,
  );

  const isLoading = loading && !data;

  // Manual refresh handler
  const handleRefresh = () => {
    refetch();
  };

  return (
    <DashboardLayout>
      <div
        style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 80px)' }}
      >
        {/* Ward List Panel */}
        <aside
          style={{
            width: '340px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: "1px solid var(--color-border)",
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px',
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 700,
                color: "var(--color-primary-dark)",
              }}
            >
              실시간 위치 현황
            </h2>
            <p
              style={{ margin: '6px 0 0', fontSize: '14px', color: "var(--color-text-muted)" }}
            >
              등록된 피보호자: {locations.length}명
            </p>
          </div>

          {/* Status Summary */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '14px 20px',
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <StatusBadge
              label="정상"
              count={statusCounts.normal}
              color="#22c55e"
            />
            <StatusBadge
              label="주의"
              count={statusCounts.warning}
              color="#f59e0b"
            />
            <StatusBadge
              label="비상"
              count={statusCounts.emergency}
              color="#ef4444"
            />
          </div>

          {/* Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: "var(--color-primary)",
                }}
              />
              <span
                style={{ fontSize: '14px', color: "var(--color-primary-dark)", fontWeight: 500 }}
              >
                자동 새로고침
              </span>
            </label>
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                backgroundColor: loading ? "var(--color-accent-soft)" : "var(--color-primary)",
                color: loading ? "var(--color-text-muted)" : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {loading ? '로딩 중...' : '새로고침'}
            </button>
          </div>

          {/* Ward List */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {isLoading ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: "var(--color-text-muted)",
                }}
              >
                로딩 중...
              </div>
            ) : error ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#dc2626',
                }}
              >
                오류: {error}
              </div>
            ) : locations.length === 0 ? (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: "var(--color-text-muted)",
                }}
              >
                등록된 위치 정보가 없습니다.
              </div>
            ) : (
              locations.map(loc => (
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
                padding: '20px',
                borderTop: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg)",
              }}
            >
              <h3
                style={{
                  margin: '0 0 14px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: "var(--color-primary-dark)",
                }}
              >
                {selectedLocation.wardName}
              </h3>
              <div
                style={{
                  fontSize: '13px',
                  color: "var(--color-primary-dark)",
                  lineHeight: '1.9',
                }}
              >
                <div>
                  <strong style={{ color: "var(--color-primary-dark)" }}>위치:</strong>{' '}
                  {selectedLocation.latitude.toFixed(6)},{' '}
                  {selectedLocation.longitude.toFixed(6)}
                </div>
                {selectedLocation.accuracy && (
                  <div>
                    <strong style={{ color: "var(--color-primary-dark)" }}>정확도:</strong>{' '}
                    {selectedLocation.accuracy.toFixed(1)}m
                  </div>
                )}
                <div>
                  <strong style={{ color: "var(--color-primary-dark)" }}>마지막 업데이트:</strong>{' '}
                  {new Date(selectedLocation.lastUpdated).toLocaleString(
                    'ko-KR',
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map */}
        <main
          style={{
            flex: 1,
            borderRadius: '12px',
            overflow: 'hidden',
            border: "1px solid var(--color-border)",
          }}
        >
          <LocationMap
            locations={locations}
            onWardClick={handleWardClick}
            selectedWardId={selectedWardId || undefined}
          />
        </main>
      </div>
    </DashboardLayout>
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
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: color + '15',
        borderRadius: '20px',
        border: `1px solid ${color}30`,
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      <span style={{ fontSize: '13px', color: "var(--color-primary-dark)", fontWeight: 500 }}>
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
    normal: '#22c55e',
    warning: '#f59e0b',
    emergency: '#ef4444',
  };

  const timeAgo = getTimeAgo(new Date(location.lastUpdated));

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 20px',
        border: 'none',
        borderBottom: '1px solid #F0F5E8',
        backgroundColor: isSelected ? "var(--color-accent-soft)" : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={e =>
        !isSelected && (e.currentTarget.style.backgroundColor = "var(--color-bg)")
      }
      onMouseLeave={e =>
        !isSelected && (e.currentTarget.style.backgroundColor = 'transparent')
      }
    >
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: statusColors[location.status],
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '14px',
          flexShrink: 0,
        }}
      >
        {location.wardName.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: isSelected ? 600 : 500,
            fontSize: '14px',
            color: "var(--color-primary-dark)",
            marginBottom: '4px',
          }}
        >
          {location.wardName}
        </div>
        <div style={{ fontSize: '12px', color: "var(--color-text-muted)" }}>{timeAgo}</div>
      </div>
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
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

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}
