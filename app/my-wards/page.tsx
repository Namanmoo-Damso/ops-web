'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { StatCard } from './StatCard';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  LinkOffIcon,
  RefreshIcon,
  SearchIcon,
  UsersIcon,
} from './icons';
import { AuthError, useAuthedFetch } from '../../hooks/useAuthedFetch';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SEARCH_DEBOUNCE_MS = 400;
const RESEND_ALL_DELAY_MS = 400;
const RESEND_ONE_DELAY_MS = 300;

type ApiWard = {
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

type MyWardsApiResponse = {
  wards: ApiWard[];
  stats?: {
    total: number;
    registered: number;
  };
};

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

export default function MyWardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending'>('all');
  const [resendingAll, setResendingAll] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totals, setTotals] = useState({
    total: 0,
    linked: 0,
    pending: 0,
    rate: 0,
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  const computeTotals = useCallback((items: Ward[]) => {
    const total = items.length;
    const linked = items.filter(w => w.isRegistered).length;
    const pending = total - linked;
    const rate = total > 0 ? Math.round((linked / total) * 100) : 0;
    return { total, linked, pending, rate };
  }, []);

  const { data, loading, error } = useAuthedFetch<MyWardsApiResponse>({
    deps: [refreshKey],
    fetcher: async ({ token, signal }) => {
      const response = await fetch(`${API_BASE}/v1/admin/my-wards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal,
      });

      if (response.status === 401 || response.status === 403) {
        throw new AuthError('인증이 만료되었습니다.');
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return (await response.json()) as MyWardsApiResponse;
    },
  });

  useEffect(() => {
    if (!data) return;
    const rawWards = Array.isArray(data?.wards) ? data.wards : [];
    const wardsData: Ward[] = rawWards.map((item: ApiWard, index: number) => {
      const idSource =
        item?.id ??
        item?.wardId ??
        item?.email ??
        item?.phoneNumber ??
        `ward-${index}`;
      return {
        id: String(idSource),
        organizationId: String(item?.organizationId ?? ''),
        organizationName: String(item?.organizationName ?? '소속 없음'),
        email: String(item?.email ?? ''),
        phoneNumber: String(item?.phoneNumber ?? ''),
        name: String(item?.name ?? '이름 없음'),
        birthDate: item?.birthDate ?? null,
        address: item?.address ?? null,
        notes: item?.notes ?? null,
        isRegistered: Boolean(item?.isRegistered),
        wardId: item?.wardId ?? null,
        createdAt: String(item?.createdAt ?? ''),
        lastCallAt: item?.lastCallAt ?? null,
        totalCalls: Number.isFinite(Number(item?.totalCalls))
          ? Number(item.totalCalls)
          : 0,
        lastMood: item?.lastMood ?? null,
      };
    });
    setWards(wardsData);
    const serverStats = data.stats;
    if (
      serverStats &&
      typeof serverStats.total === 'number' &&
      typeof serverStats.registered === 'number'
    ) {
      const pending = serverStats.total - serverStats.registered;
      const rate =
        serverStats.total > 0
          ? Math.round((serverStats.registered / serverStats.total) * 100)
          : 0;
      setTotals({
        total: serverStats.total,
        linked: serverStats.registered,
        pending,
        rate,
      });
    } else {
      setTotals(computeTotals(wardsData));
    }
    setHasLoaded(true);
  }, [computeTotals, data]);

  const filteredWards = useMemo(() => {
    // 전체 목록은 연동/미연동 모두, 'pending'일 때만 미연동만 노출
    const byStatus =
      filterStatus === 'pending'
        ? wards.filter(ward => !ward.isRegistered)
        : wards;

    if (!debouncedQuery) return byStatus;
    const query = debouncedQuery.toLowerCase();
    return byStatus.filter(
      ward =>
        ward.name.toLowerCase().includes(query) ||
        ward.email.toLowerCase().includes(query) ||
        ward.phoneNumber.includes(query),
    );
  }, [wards, filterStatus, debouncedQuery]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '발송 전';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const handleResendAllPending = () => {
    if (totals.pending === 0 || resendingAll) return;
    setResendingAll(true);
    // TODO: 연동 API 연결
    setTimeout(() => {
      alert(
        `${totals.pending}명의 미연동 대상자에게 앱 설치 링크를 재발송했습니다.`,
      );
      setResendingAll(false);
    }, RESEND_ALL_DELAY_MS);
  };

  const handleResendOne = (ward: Ward) => {
    if (resendingId || resendingAll) return;
    setResendingId(ward.id);
    // TODO: 연동 API 연결
    setTimeout(() => {
      alert(`${ward.name}님에게 앱 설치 링크를 재발송했습니다.`);
      setResendingId(null);
    }, RESEND_ONE_DELAY_MS);
  };

  const isInitialLoading = loading && !hasLoaded;
  const isRefreshing = loading && hasLoaded;

  return (
    <SidebarLayout>
      {isInitialLoading && (
        <div
          style={{
            minHeight: '60vh',
            display: 'grid',
            placeItems: 'center',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          데이터를 불러오는 중입니다...
        </div>
      )}
      {!isInitialLoading && error && (
        <div
          style={{
            minHeight: '60vh',
            display: 'grid',
            placeItems: 'center',
            gap: '12px',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          <div>{error}</div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      )}
      {(hasLoaded || (!isInitialLoading && !error)) && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
          {isRefreshing && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              최신 데이터를 불러오는 중입니다...
            </div>
          )}
          <div style={{ marginBottom: '20px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 700,
                color: '#1e293b',
              }}
            >
              대상자 연동 현황
            </h1>
            <p
              style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}
            >
              등록된 대상자의 앱 설치 및 기기 연동 상태를 관리합니다.
            </p>
          </div>

          {totals.pending > 0 && (
            <div
              style={{
                background: '#fff4f4',
                border: '1px solid #fecdd3',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: '#fef2f2',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#2563eb',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangleIcon size={18} strokeWidth={2} color="#dc2626" />
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#991b1b',
                    }}
                  >
                    아직 연동되지 않은 대상자가 {totals.pending}명 있습니다.
                  </div>
                </div>
              </div>
              <button
                onClick={handleResendAllPending}
                disabled={totals.pending === 0 || resendingAll}
                aria-label="미연동 인원 전체 재초대"
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor:
                    totals.pending === 0 || resendingAll
                      ? '#fca5a5'
                      : '#dc2626',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor:
                    totals.pending === 0 || resendingAll
                      ? 'not-allowed'
                      : 'pointer',
                  display: 'inline-flex',
                  gap: '8px',
                  alignItems: 'center',
                  boxShadow:
                    totals.pending === 0 || resendingAll
                      ? 'none'
                      : '0 10px 30px rgba(220,38,38,0.18)',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (totals.pending === 0 || resendingAll) return;
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={e => {
                  if (totals.pending === 0 || resendingAll) return;
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                <RefreshIcon size={16} />
                {resendingAll ? '재초대 중...' : '미연동 인원 전체 재초대'}
              </button>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <StatCard
              label="총 등록 인원 (청구 기준)"
              value={totals.total}
              color="#3b82f6"
              icon={<UsersIcon size={32} />}
            />
            <StatCard
              label="정상 연동됨"
              value={totals.linked}
              color="#4A5D23"
              icon={<CheckCircleIcon size={32} />}
              extra={
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '999px',
                    backgroundColor: '#e2e8f0',
                    overflow: 'hidden',
                    marginTop: '10px',
                  }}
                >
                  <div
                    style={{
                      width: `${totals.rate}%`,
                      height: '100%',
                      backgroundColor: '#93c5fd',
                      transition: 'width 150ms ease',
                    }}
                  />
                </div>
              }
              footer={`연동률 ${totals.rate}%`}
            />
            <StatCard
              label="연동 대기 (조치 필요)"
              value={totals.pending}
              color="#dc2626"
              icon={<LinkOffIcon size={32} />}
              highlight={totals.pending > 0}
              footer={
                totals.pending > 0
                  ? '서비스 이용이 지연되고 있습니다'
                  : undefined
              }
            />
          </div>

          <section
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  background: '#f1f5f9',
                  padding: '6px',
                  borderRadius: '12px',
                }}
              >
                <button
                  onClick={() => setFilterStatus('all')}
                  aria-pressed={filterStatus === 'all'}
                  aria-label="전체 목록 보기"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor:
                      filterStatus === 'all' ? '#ffffff' : 'transparent',
                    color: filterStatus === 'all' ? '#1e293b' : '#64748b',
                    fontWeight: 700,
                    fontSize: '14px',
                    boxShadow:
                      filterStatus === 'all'
                        ? '0 6px 16px rgba(15,23,42,0.08)'
                        : 'none',
                    cursor: 'pointer',
                  }}
                >
                  전체 목록
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  aria-pressed={filterStatus === 'pending'}
                  aria-label="미연동 대상자만 보기"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor:
                      filterStatus === 'pending' ? '#ffffff' : 'transparent',
                    color: filterStatus === 'pending' ? '#dc2626' : '#64748b',
                    fontWeight: 700,
                    fontSize: '14px',
                    boxShadow:
                      filterStatus === 'pending'
                        ? '0 6px 16px rgba(15,23,42,0.08)'
                        : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  미연동 대상자
                  <span
                    style={{
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {totals.pending}
                  </span>
                </button>
              </div>

              <div style={{ position: 'relative', minWidth: '260px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                >
              <SearchIcon size={18} />
            </div>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="이름 · 이메일 · 전화번호 검색"
              aria-label="이름, 이메일 또는 전화번호 검색"
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    fontSize: '14px',
                    color: '#1e293b',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse' }}
              aria-label="대상자 연동 테이블"
            >
                <thead>
                  <tr
                    style={{
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    <th style={{ padding: '14px 16px', textAlign: 'left' }}>
                      대상자 이름
                    </th>
                    <th style={{ padding: '14px 12px', textAlign: 'left' }}>
                      연락처
                    </th>
                    <th style={{ padding: '14px 12px', textAlign: 'center' }}>
                      연동 상태
                    </th>
                    <th style={{ padding: '14px 12px', textAlign: 'center' }}>
                      최근 안내 발송
                    </th>
                    <th style={{ padding: '14px 12px', textAlign: 'center' }}>
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWards.map(ward => (
                    <tr
                      key={ward.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: '#ffffff',
                        transition: 'background-color 150ms ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#f7f9fb';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <td
                        style={{
                          padding: '14px 16px',
                          fontWeight: 700,
                          color: '#0f172a',
                        }}
                      >
                        {ward.name}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ color: '#475569', fontSize: '14px' }}>
                          {ward.phoneNumber}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {ward.email}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        {ward.isRegistered ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              backgroundColor: '#e9f0df',
                              color: '#4A5D23',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircleIcon size={14} />
                            연동 완료
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              fontSize: '12px',
                              fontWeight: 700,
                              animation: 'pulse 1.6s ease-in-out infinite',
                            }}
                          >
                            <LinkOffIcon size={14} />
                            연동 대기
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '14px 12px',
                          textAlign: 'center',
                          fontSize: '12px',
                          color: '#475569',
                        }}
                      >
                        {formatDate(ward.lastCallAt)}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        {!ward.isRegistered ? (
                        <button
                          onClick={() => handleResendOne(ward)}
                          disabled={resendingId !== null || resendingAll}
                          aria-label={`${ward.name} 재발송`}
                          style={{
                            padding: '8px 12px',
                              borderRadius: '10px',
                              border: 'none',
                              backgroundColor:
                                resendingId !== null || resendingAll
                                  ? '#bfdbfe'
                                  : '#2563eb',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor:
                                resendingId !== null || resendingAll
                                  ? 'not-allowed'
                                  : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 150ms ease',
                            }}
                            onMouseEnter={e => {
                              if (resendingId !== null || resendingAll) return;
                              e.currentTarget.style.backgroundColor = '#1d4ed8';
                            }}
                            onMouseLeave={e => {
                              if (resendingId !== null || resendingAll) return;
                              e.currentTarget.style.backgroundColor = '#2563eb';
                            }}
                          >
                            <RefreshIcon size={14} />
                            {resendingId === ward.id
                              ? '재발송 중...'
                              : '재발송'}
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredWards.length === 0 && (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#475569',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: '#f1f5f9',
                    display: 'grid',
                    placeItems: 'center',
                    color: totals.total === 0 ? '#cbd5e1' : '#4A5D23',
                    margin: '0 auto 12px',
                  }}
                >
                  <CheckCircleIcon size={26} />
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '16px',
                    color: '#0f172a',
                  }}
                >
                  {totals.total === 0
                    ? '등록된 대상자가 없습니다'
                    : '모든 대상자가 연동되었습니다'}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    marginTop: '4px',
                  }}
                >
                  {totals.total === 0
                    ? '대상자를 등록하고 연동을 시작하세요.'
                    : '현재 조치가 필요한 대상자가 없습니다.'}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </SidebarLayout>
  );
}
