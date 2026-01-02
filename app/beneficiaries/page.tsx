'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '../../components/SidebarLayout';

type Beneficiary = {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  type: string | null;
  address: string | null;
  manager: string | null;
  status: 'WARNING' | 'NORMAL' | 'CAUTION';
  lastCall: string | null;
};

type ApiBeneficiary = {
  id: number | string;
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  type?: string | null;
  address?: string | null;
  manager?: string | null;
  status?: string | null;
  lastCall?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function BeneficiariesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'risk'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 디바운스된 검색어로 필터링 부담을 줄임
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  // 쿼리 변경 시 페이지를 첫 페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  // 서버에서 목록 가져오기
  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (!API_BASE) {
        setError(
          'API URL이 설정되지 않았습니다. NEXT_PUBLIC_API_URL을 확인하세요.',
        );
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (filter === 'risk') params.set('riskOnly', 'true');
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      try {
        const response = await fetch(
          `${API_BASE}/v1/admin/beneficiaries?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
          localStorage.removeItem('admin_info');
          setLoading(false);
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(
            `목록 불러오기에 실패했습니다. (HTTP ${response.status})`,
          );
        }

        const data = await response.json();
        const apiItems: Beneficiary[] = Array.isArray(data?.data)
          ? data.data.map((item: ApiBeneficiary, index: number) => {
              const normalizedStatus =
                item.status === 'WARNING' || item.status === 'CAUTION'
                  ? item.status
                  : 'NORMAL';
              return {
                // API가 문자열 ID를 반환할 수 있어도 키 충돌이 없도록 문자열로 보관
                id: String(item.id ?? `row-${index}`),
                name: item.name || '이름 없음',
                age: item.age ?? null,
                gender: item.gender ?? null,
                type: item.type ?? null,
                address: item.address ?? null,
                manager: item.manager ?? null,
                status: normalizedStatus,
                lastCall: item.lastCall ?? null,
              };
            })
          : [];

        setItems(apiItems);
        setTotalCount(
          typeof data?.total === 'number' ? data.total : apiItems.length,
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        setError((err as Error).message || '알 수 없는 오류가 발생했습니다.');
        setItems([]);
        setTotalCount(0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [debouncedSearch, filter, page, pageSize, router]);

  // 검색어 기준 1차 필터링 (서버가 검색을 지원하지 않는 경우 대비)
  const searchMatches = useMemo(() => {
    const query = debouncedSearch.trim();
    return items.filter(item => {
      if (!query) return true;
      return (
        item.name.includes(query) ||
        item.address?.includes(query) ||
        item.manager?.includes(query)
      );
    });
  }, [debouncedSearch, items]);

  // 검색 결과 내 위험군 수 (UI 표기용)
  const riskCount = useMemo(
    () =>
      searchMatches.filter(
        item => item.status === 'WARNING' || item.status === 'CAUTION',
      ).length,
    [searchMatches],
  );

  // 검색 결과에 필터(전체/위험군) 적용
  const filteredList = useMemo(() => {
    if (filter === 'all') return searchMatches;
    return searchMatches.filter(
      item => item.status === 'WARNING' || item.status === 'CAUTION',
    );
  }, [searchMatches, filter]);

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader />
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          riskCount={riskCount}
        />
        <BeneficiaryTable
          items={filteredList}
          totalCount={totalCount}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
          error={error}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </SidebarLayout>
  );
}

// --- Components ---

function PageHeader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <div
            style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}
            role="heading"
            aria-level={1}
          >
            전체 대상자 관리
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filter: 'all' | 'risk';
  onFilterChange: (value: 'all' | 'risk') => void;
  riskCount: number;
};

function FilterBar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  riskCount,
}: FilterBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        marginBottom: '12px',
      }}
    >
      <div style={{ position: 'relative', minWidth: '240px' }}>
        <label
          htmlFor="beneficiary-search"
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          대상자 검색
        </label>
        <input
          id="beneficiary-search"
          placeholder="이름, 주소, 담당자 검색"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          aria-label="이름, 주소 또는 담당자 검색"
          style={{
            width: '100%',
            padding: '10px 12px 10px 14px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            fontSize: '14px',
            color: '#0f172a',
            outline: 'none',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          padding: '6px',
          borderRadius: '12px',
          gap: '6px',
        }}
        role="group"
        aria-label="대상자 필터"
      >
        <button
          onClick={() => onFilterChange('all')}
          aria-pressed={filter === 'all'}
          aria-label="전체 대상자 보기"
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: filter === 'all' ? '#ffffff' : 'transparent',
            color: filter === 'all' ? '#0f172a' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13px',
            boxShadow:
              filter === 'all' ? '0 6px 16px rgba(15,23,42,0.08)' : 'none',
            cursor: 'pointer',
          }}
        >
          전체
        </button>
        <button
          onClick={() => onFilterChange('risk')}
          aria-pressed={filter === 'risk'}
          aria-label="위험군만 보기"
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: filter === 'risk' ? '#ffffff' : 'transparent',
            color: filter === 'risk' ? '#dc2626' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13px',
            boxShadow:
              filter === 'risk' ? '0 6px 16px rgba(15,23,42,0.08)' : 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          위험군
          <span
            style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              borderRadius: '999px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 800,
            }}
            aria-label={`검색 결과 중 위험군 ${riskCount}명`}
          >
            {riskCount}
          </span>
        </button>
      </div>
    </div>
  );
}

type BeneficiaryTableProps = {
  items: Beneficiary[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function BeneficiaryTable({
  items,
  totalCount,
  selectedId,
  onSelect,
  loading,
  error,
  page,
  pageSize,
  onPageChange,
}: BeneficiaryTableProps) {
  const pageTotal = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div
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
          padding: '14px 16px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#475569',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          전체 {totalCount}명 중{' '}
          <span style={{ color: '#4A5D23' }}>{items.length}</span>명 표시
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          행 클릭 시 상세 패널은 추후 추가 예정입니다.
        </div>
      </div>

      {loading && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: '#64748b',
            fontWeight: 700,
          }}
        >
          데이터를 불러오는 중입니다...
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: '#dc2626',
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '900px',
          }}
          aria-label="전체 대상자 목록"
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
              <th style={{ textAlign: 'left', padding: '14px 16px' }}>
                이름 / 기본정보
              </th>
              <th style={{ textAlign: 'left', padding: '14px 12px' }}>
                현재 상태
              </th>
              <th style={{ textAlign: 'left', padding: '14px 12px' }}>
                거주지
              </th>
              <th style={{ textAlign: 'left', padding: '14px 12px' }}>
                담당자
              </th>
              <th style={{ textAlign: 'left', padding: '14px 12px' }}>
                최근 안부
              </th>
              <th style={{ textAlign: 'right', padding: '14px 12px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isSelected = selectedId === item.id;
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: isSelected ? '#f7f9fb' : '#ffffff',
                    transition: 'background-color 120ms ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <ProfileCircle status={item.status} name={item.name} />
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '15px',
                            color: '#0f172a',
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            color: '#94a3b8',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {item.age ?? '-'}세 / {item.gender ?? '-'} /{' '}
                          {item.type ?? '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <StatusBadge status={item.status} />
                  </td>
                  <td
                    style={{
                      padding: '14px 12px',
                      color: '#475569',
                      fontWeight: 600,
                      maxWidth: '240px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={item.address ?? undefined}
                  >
                    {item.address ?? '-'}
                  </td>
                  <td
                    style={{
                      padding: '14px 12px',
                      color: '#475569',
                      fontWeight: 700,
                    }}
                  >
                    {item.manager ?? '-'}
                  </td>
                  <td
                    style={{
                      padding: '14px 12px',
                      color: '#64748b',
                      fontWeight: 600,
                    }}
                  >
                    {item.lastCall ?? '-'}
                  </td>
                  <td
                    style={{
                      padding: '14px 12px',
                      textAlign: 'right',
                    }}
                  >
                    <button
                      type="button"
                      aria-label={`${item.name} 관리`}
                      onClick={e => {
                        e.stopPropagation();
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        color: '#94a3b8',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      관리
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && !loading && !error && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#475569',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '14px',
              backgroundColor: '#f1f5f9',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 12px',
              color: '#94a3b8',
            }}
            aria-hidden="true"
          >
            🔍
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '16px',
              color: '#0f172a',
            }}
          >
            조건에 맞는 대상자가 없습니다
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              marginTop: '6px',
            }}
          >
            검색어나 필터를 조정해 다시 확인해주세요.
          </div>
        </div>
      )}

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
          페이지 {page} / {pageTotal}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: page <= 1 || loading ? '#cbd5e1' : '#0f172a',
              fontWeight: 700,
              cursor: page <= 1 || loading ? 'not-allowed' : 'pointer',
            }}
            aria-label="이전 페이지"
          >
            이전
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(pageTotal, page + 1))}
            disabled={page >= pageTotal || loading}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: page >= pageTotal || loading ? '#cbd5e1' : '#0f172a',
              fontWeight: 700,
              cursor: page >= pageTotal || loading ? 'not-allowed' : 'pointer',
            }}
            aria-label="다음 페이지"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}

type StatusBadgeProps = { status: Beneficiary['status'] };

function StatusBadge({ status }: StatusBadgeProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '12px',
    border: '1px solid transparent',
  };

  if (status === 'WARNING') {
    return (
      <span
        style={{
          ...baseStyle,
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderColor: '#fecdd3',
        }}
      >
        ● 위험 감지
      </span>
    );
  }
  if (status === 'CAUTION') {
    return (
      <span
        style={{
          ...baseStyle,
          backgroundColor: '#fff7ed',
          color: '#c2410c',
          borderColor: '#fed7aa',
        }}
      >
        ● 주의 필요
      </span>
    );
  }
  return (
    <span
      style={{
        ...baseStyle,
        backgroundColor: '#e0ecff',
        color: '#2563eb',
        borderColor: '#cbdafe',
      }}
    >
      ● 양호
    </span>
  );
}

type ProfileCircleProps = {
  status: Beneficiary['status'];
  name: string;
};

function ProfileCircle({ status, name }: ProfileCircleProps) {
  const isWarning = status === 'WARNING';
  return (
    <div
      aria-hidden="true"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '999px',
        backgroundColor: isWarning ? '#dc2626' : '#94a3b8',
        color: '#ffffff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: '14px',
      }}
    >
      {name ? name.charAt(0) : '?'}
    </div>
  );
}
