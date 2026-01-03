'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { AuthError, useAuthedFetch } from '../../hooks/useAuthedFetch';
import DetailModal, {
  type BeneficiaryDetail,
  type BeneficiaryLog,
} from './DetailModal';

const SEARCH_DEBOUNCE_MS = 250;
const DEFAULT_PAGE_SIZE = 20;

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
  name: string;
  address: string | null;
  manager: string | null;
  status: 'WARNING' | 'NORMAL' | 'CAUTION';
  lastCall: string | null;
  age?: number | null;
  gender?: string | null;
  type?: string | null;
};

type BeneficiariesApiResponse = {
  data: ApiBeneficiary[];
  total?: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_DETAIL: BeneficiaryDetail = {
  phoneNumber: '-',
  guardian: '-',
  diseases: [],
  medication: '-',
  notes: '특이사항 없음',
  recentLogs: [],
};

const BENEFICIARY_DETAIL_MOCKS: Record<string, BeneficiaryDetail> = {
  '1': {
    phoneNumber: '010-1234-1111',
    guardian: '아들 박성훈 (010-1234-5678)',
    diseases: ['고혈압', '협심증'],
    medication: '혈압약 (아침/저녁)',
    notes:
      '거동이 불편하여 방문 시 초인종을 길게 눌러주세요. 강아지를 키우고 계십니다.',
    recentLogs: [
      {
        id: 1,
        date: '오늘 14:30',
        type: 'AI 안부',
        content: '가슴 통증 호소 (위험 감지)',
        sentiment: 'negative',
      },
      {
        id: 2,
        date: '5/07 10:00',
        type: '정기 방문',
        content: '반찬 배달 및 청소 지원',
        sentiment: 'neutral',
      },
      {
        id: 3,
        date: '5/06 14:00',
        type: 'AI 안부',
        content: '식사 잘 하심, 기분 좋음',
        sentiment: 'positive',
      },
    ],
  },
  '2': {
    phoneNumber: '010-9876-2222',
    guardian: '딸 박지민 (010-9876-5432)',
    diseases: ['관절염'],
    medication: '진통제 (필요시)',
    notes: '난청이 있으셔서 크게 말씀해드려야 합니다.',
    recentLogs: [
      {
        id: 1,
        date: '어제 10:00',
        type: 'AI 안부',
        content: '복지관 다녀오심',
        sentiment: 'positive',
      },
    ],
  },
  '3': {
    phoneNumber: '010-3333-3333',
    guardian: '손자 이민호 (010-3333-4444)',
    diseases: ['우울증', '불면증'],
    medication: '수면제',
    notes: '외로움 호소, 주 2회 통화 권장.',
    recentLogs: [
      {
        id: 1,
        date: '5/05 11:00',
        type: 'AI 안부',
        content: '외로움 호소',
        sentiment: 'negative',
      },
    ],
  },
};

export default function BeneficiariesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'risk'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // 디바운스된 검색어로 필터링 부담을 줄임
  useEffect(() => {
    const handle = window.setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(handle);
  }, [search]);

  // 쿼리 변경 시 페이지를 첫 페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  const { data, loading, error } = useAuthedFetch<BeneficiariesApiResponse>({
    deps: [debouncedSearch, filter, page, pageSize],
    fetcher: async ({ token, signal }) => {
      if (!API_BASE) {
        throw new Error(
          'API URL이 설정되지 않았습니다. NEXT_PUBLIC_API_URL을 확인하세요.',
        );
      }

      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (filter === 'risk') params.set('riskOnly', 'true');
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const response = await fetch(
        `${API_BASE}/v1/admin/beneficiaries?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        },
      );

      if (response.status === 401 || response.status === 403) {
        throw new AuthError('인증이 만료되었습니다.');
      }

      if (!response.ok) {
        throw new Error(
          `목록 불러오기에 실패했습니다. (HTTP ${response.status})`,
        );
      }

      return (await response.json()) as BeneficiariesApiResponse;
    },
  });

  const items = useMemo<Beneficiary[]>(() => {
    const apiItems = Array.isArray(data?.data) ? data?.data : [];
    return apiItems.map((item: ApiBeneficiary, index: number) => {
      const normalizedStatus =
        item.status === 'WARNING' || item.status === 'CAUTION'
          ? item.status
          : 'NORMAL';
      return {
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
    });
  }, [data?.data]);

  const totalCount = useMemo(() => {
    return typeof data?.total === 'number'
      ? data.total
      : Array.isArray(data?.data)
      ? data.data.length
      : 0;
  }, [data?.data, data?.total]);

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

  const pageTotal = useMemo(() => {
    const base = totalCount || items.length || 0;
    return Math.max(1, Math.ceil(base / pageSize));
  }, [items.length, pageSize, totalCount]);

  const selectedData = useMemo(() => {
    if (!selectedId) return null;
    const base = items.find(item => item.id === selectedId);
    if (!base) return null;
    const detail = BENEFICIARY_DETAIL_MOCKS[selectedId] ?? DEFAULT_DETAIL;
    return { base, detail };
  }, [items, selectedId]);

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
          onPageChange={setPage}
          pageTotal={pageTotal}
        />
        {selectedData && (
          <DetailModal
            beneficiary={selectedData.base}
            detail={selectedData.detail}
            onClose={() => setSelectedId(null)}
          />
        )}
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
  onPageChange: (page: number) => void;
  pageTotal: number;
};

function BeneficiaryTable({
  items,
  totalCount,
  selectedId,
  onSelect,
  loading,
  error,
  page,
  onPageChange,
  pageTotal,
}: BeneficiaryTableProps) {
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
          행 또는 관리 버튼 클릭 시 상세 모달을 확인할 수 있습니다.
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
                        onSelect(item.id);
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

      <Pagination
        page={page}
        pageTotal={pageTotal}
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}

type StatusBadgeProps = { status: Beneficiary['status'] };

type PaginationProps = {
  page: number;
  pageTotal: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

function Pagination({
  page,
  pageTotal,
  loading,
  onPageChange,
}: PaginationProps) {
  return (
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
  );
}

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
