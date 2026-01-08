'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { palette, shadows } from '../theme';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../hooks/useAuth';
import DetailModal, {
  type BeneficiaryDetail,
  type BeneficiaryUpdatePayload,
} from './DetailModal';

const SEARCH_DEBOUNCE_MS = 250;
const DEFAULT_PAGE_SIZE = 20;
const borderStyle = `1px solid ${palette.border}`;

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

type BeneficiaryDetailPayload = BeneficiaryDetail & {
  id: string;
};

type BeneficiaryDetailResponse = {
  data: BeneficiaryDetailPayload;
};

const EMPTY_DETAIL: BeneficiaryDetail = {
  name: null,
  email: null,
  phoneNumber: null,
  birthDate: null,
  address: null,
  gender: null,
  type: null,
  guardian: null,
  diseases: [],
  medication: null,
  notes: null,
  recentLogs: [],
};

export default function BeneficiariesPage() {
  const { logout } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'risk'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailOverride, setDetailOverride] =
    useState<BeneficiaryDetailPayload | null>(null);

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

  useEffect(() => {
    setDeleteError(null);
    setDetailOverride(null);
  }, [selectedId]);

  const { data, loading, error, refetch } = useApi<BeneficiariesApiResponse>({
    deps: [debouncedSearch, filter, page, pageSize, refreshKey],
    fetcher: (client, signal) => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (filter === 'risk') params.set('riskOnly', 'true');
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      return client.get<BeneficiariesApiResponse>(
        `/v1/admin/beneficiaries?${params.toString()}`,
        { signal }
      );
    },
  });

  const {
    data: detailResponse,
    loading: detailLoading,
    error: detailError,
  } = useApi<BeneficiaryDetailResponse>({
    deps: [selectedId],
    skip: !selectedId,
    fetcher: (client, signal) => {
      if (!selectedId) throw new Error('No selected ID');
      return client.get<BeneficiaryDetailResponse>(
        `/v1/admin/beneficiaries/${selectedId}`,
        { signal }
      );
    },
  });

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/v1/admin/beneficiaries/${id}`);

      setSelectedId(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Delete beneficiary failed.', err);
      // apiClient handles AuthError (redirects), so we verify other errors here
      setDeleteError('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdate = async (
    id: string,
    payload: BeneficiaryUpdatePayload,
  ): Promise<BeneficiaryDetailPayload | null> => {
    try {
      const result = await apiClient.put<BeneficiaryDetailResponse>(
        `/v1/admin/beneficiaries/${id}`,
        payload
      );

      setDetailOverride(result.data);
      setRefreshKey(prev => prev + 1);
      return result.data;
    } catch (err) {
      console.error('Update beneficiary failed.', err);
      throw new Error('정보 수정에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

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
    const detail =
      detailOverride?.id === selectedId
        ? detailOverride
        : detailResponse?.data?.id === selectedId
          ? detailResponse.data
          : EMPTY_DETAIL;
    return { base, detail, detailLoading, detailError };
  }, [
    detailError,
    detailLoading,
    detailOverride,
    detailResponse,
    items,
    selectedId,
  ]);

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
          search={search}
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
            onDelete={() => handleDelete(selectedData.base.id)}
            deleting={deleteLoading}
            deleteError={deleteError}
            onUpdate={payload => handleUpdate(selectedData.base.id, payload)}
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
            style={{ fontSize: '22px', fontWeight: 800, color: palette.primaryDark }}
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
            border: borderStyle,
            backgroundColor: palette.background,
            fontSize: '14px',
            color: palette.primaryDark,
            outline: 'none',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          backgroundColor: palette.soft,
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
            backgroundColor: filter === 'all' ? palette.panel : 'transparent',
            color: filter === 'all' ? palette.primaryDark : palette.textSoft,
            fontWeight: 700,
            fontSize: '13px',
            boxShadow:
              filter === 'all' ? shadows.raised : 'none',
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
            backgroundColor: filter === 'risk' ? palette.panel : 'transparent',
            color: filter === 'risk' ? palette.danger : palette.textSoft,
            fontWeight: 700,
            fontSize: '13px',
            boxShadow:
              filter === 'risk' ? shadows.raised : 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          위험군
          <span
            style={{
              backgroundColor: palette.dangerSoft,
              color: palette.danger,
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
  search: string;
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
  search,
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
        background: palette.panel,
        border: borderStyle,
        borderRadius: '16px',
        boxShadow: shadows.lifted,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: borderStyle,
          backgroundColor: palette.background,
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
            color: palette.primaryDark,
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          전체 {totalCount}명 중{' '}
          <span style={{ color: palette.primaryDark }}>{items.length}</span>명 표시
        </div>
        <div style={{ color: palette.textSoft, fontSize: '12px' }}>
          행 또는 관리 버튼 클릭 시 상세 모달을 확인할 수 있습니다.
        </div>
      </div>

      {loading && (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: palette.textMuted,
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
            color: palette.danger,
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
                backgroundColor: palette.background,
                color: palette.primaryDark,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: borderStyle,
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
                    borderBottom: '1px solid #F0F5E8',
                    backgroundColor: isSelected ? palette.background : palette.panel,
                    transition: 'background-color 120ms ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = palette.background;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = palette.panel;
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
                            color: palette.primaryDark,
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            color: palette.textSoft,
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
                      color: palette.primaryDark,
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
                      color: palette.primaryDark,
                      fontWeight: 700,
                    }}
                  >
                    {item.manager ?? '-'}
                  </td>
                  <td
                    style={{
                      padding: '14px 12px',
                      color: palette.textMuted,
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
                        border: borderStyle,
                        backgroundColor: palette.panel,
                        color: palette.textSoft,
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = palette.soft;
                        e.currentTarget.style.color = palette.primaryDark;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = palette.panel;
                        e.currentTarget.style.color = palette.textSoft;
                      }}
                    >
                      관리
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: palette.textMuted,
                    fontSize: '14px',
                  }}
                >
                  {search
                    ? '검색 결과가 없습니다.'
                    : '표시할 대상자가 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          borderTop: borderStyle,
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: palette.background,
        }}
      >
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: borderStyle,
            backgroundColor: page === 1 ? palette.soft : palette.panel,
            color: page === 1 ? palette.textMuted : palette.primaryDark,
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          이전
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontSize: '14px',
            fontWeight: 700,
            color: palette.primaryDark,
          }}
        >
          {page} / {pageTotal}
        </div>
        <button
          onClick={() => onPageChange(Math.min(pageTotal, page + 1))}
          disabled={page === pageTotal}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: borderStyle,
            backgroundColor: page === pageTotal ? palette.soft : palette.panel,
            color: page === pageTotal ? palette.textMuted : palette.primaryDark,
            cursor: page === pageTotal ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          다음
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'WARNING') {
    return (
      <span
        style={{
          display: 'inline-flex',
          padding: '4px 8px',
          borderRadius: '999px',
          backgroundColor: palette.dangerSoft,
          color: palette.danger,
          fontSize: '11px',
          fontWeight: 800,
        }}
      >
        위험
      </span>
    );
  }
  if (status === 'CAUTION') {
    return (
      <span
        style={{
          display: 'inline-flex',
          padding: '4px 8px',
          borderRadius: '999px',
          backgroundColor: '#fffbeb',
          color: '#d97706',
          fontSize: '11px',
          fontWeight: 800,
          border: '1px solid #fcd34d',
        }}
      >
        주의
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '4px 8px',
        borderRadius: '999px',
        backgroundColor: '#e9f0df',
        color: palette.primaryDark,
        fontSize: '11px',
        fontWeight: 700,
      }}
    >
      정상
    </span>
  );
}

function ProfileCircle({ status, name }: { status: string; name: string }) {
  const initial = name.slice(0, 1);
  const bgColor =
    status === 'WARNING'
      ? palette.danger
      : status === 'CAUTION'
        ? '#f59e0b'
        : palette.primary;

  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: bgColor,
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: '14px',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
