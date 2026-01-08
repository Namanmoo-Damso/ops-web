'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

import { useApi } from '../../hooks/useApi';
import { apiClient, AuthError } from '../../lib/api-client';
import { useAuth } from '../../hooks/useAuth';
import type { DataListResponse } from '../../types/api';
import DetailModal, {
  type BeneficiaryDetail,
  type BeneficiaryUpdatePayload,
  type BeneficiarySummary,
} from './DetailModal';

// Components
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const SEARCH_DEBOUNCE_MS = 250;
const DEFAULT_PAGE_SIZE = 20;

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

  const { data, loading, error, refetch } = useApi<DataListResponse<BeneficiarySummary>>({
    deps: [debouncedSearch, filter, page, pageSize, refreshKey],
    fetcher: (client, signal) => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (filter === 'risk') params.set('riskOnly', 'true');
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      return client.get<DataListResponse<BeneficiarySummary>>(
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
      if (err instanceof AuthError) throw err;
      console.error('Delete beneficiary failed.', err);
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
      if (err instanceof AuthError) throw err;
      console.error('Update beneficiary failed.', err);
      throw new Error('정보 수정에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const items = useMemo<BeneficiarySummary[]>(() => {
    const apiItems = Array.isArray(data?.data) ? data?.data : [];
    return apiItems.map((item: BeneficiarySummary, index: number) => {
      const normalizedStatus =
        item.status === 'WARNING' || item.status === 'CAUTION'
          ? item.status
          : 'NORMAL';
      return {
        ...item,
        id: String(item.id ?? `row-${index}`),
        status: normalizedStatus as 'WARNING' | 'NORMAL' | 'CAUTION',
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
    <DashboardLayout title="전체 대상자 관리">
      <div className="beneficiaries-container">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          riskCount={riskCount}
        />

        <div className="beneficiary-table-container">
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              전체 {totalCount}명 중 <span>{items.length}</span>명 표시
            </div>
          </div>

          {loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              데이터를 불러오는 중입니다...
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-danger-main)' }}>
              {error}
            </div>
          )}

          <Table>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <TableHeader className="beneficiary-table-header">
              <TableRow>
                <TableHead className="beneficiary-table-head">이름 / 기본정보</TableHead>
                <TableHead className="beneficiary-table-head">현재 상태</TableHead>
                <TableHead className="beneficiary-table-head">거주지</TableHead>
                <TableHead className="beneficiary-table-head">담당자</TableHead>
                <TableHead className="beneficiary-table-head text-center">최근 안부</TableHead>
                <TableHead className="beneficiary-table-head text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map(item => (
                <TableRow
                  key={item.id}
                  onClick={() => setSelectedId(String(item.id))}
                  selected={selectedId === String(item.id)}
                  className="beneficiary-table-row"
                >
                  <TableCell className="beneficiary-table-cell">
                    <div className="beneficiary-user-cell">
                      <ProfileCircle status={item.status} name={item.name} />
                      <div>
                        <div className="beneficiary-user-name">{item.name}</div>
                        <div className="beneficiary-user-meta">
                          {item.age ?? '-'}세 / {item.gender ?? '-'} / {item.type ?? '-'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="beneficiary-table-cell">
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="beneficiary-table-cell">{item.address ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell">{item.manager ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell text-center">{item.lastCall ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedId(String(item.id));
                      }}
                    >
                      관리
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredList.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    {search ? '검색 결과가 없습니다.' : '표시할 대상자가 없습니다.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="table-footer">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              이전
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 700 }}>
              {page} / {pageTotal}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage(Math.min(pageTotal, page + 1))}
              disabled={page === pageTotal}
            >
              다음
            </Button>
          </div>
        </div>

        {selectedData && (
          <DetailModal
            beneficiary={selectedData.base}
            detail={selectedData.detail}
            onClose={() => setSelectedId(null)}
            onDelete={() => handleDelete(String(selectedData.base.id))}
            deleting={deleteLoading}
            deleteError={deleteError}
            onUpdate={payload => handleUpdate(String(selectedData.base.id), payload)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// --- Components ---

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
    <div className="filter-bar">
      <div className="filter-search-container">
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          placeholder="이름 또는 상태로 검색..."
          aria-label="이름, 주소 또는 담당자 검색"
        />
      </div>
      <div className="filter-group" role="group" aria-label="대상자 필터">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
          aria-pressed={filter === 'all'}
        >
          전체
        </button>
        <button
          className={`filter-button ${filter === 'risk' ? 'active risk' : ''}`}
          onClick={() => onFilterChange('risk')}
          aria-pressed={filter === 'risk'}
        >
          위험군
          <span className="risk-badge">
            {riskCount}
          </span>
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'WARNING' | 'NORMAL' | 'CAUTION' }) {
  const variantMap = {
    WARNING: 'danger',
    CAUTION: 'warning',
    NORMAL: 'success',
  } as const;

  const labelMap = {
    WARNING: '위험',
    CAUTION: '주의',
    NORMAL: '정상',
  };

  return (
    <Badge variant={variantMap[status]} size="sm" dot>
      {labelMap[status]}
    </Badge>
  );
}

function ProfileCircle({
  status,
  name,
}: {
  status: 'WARNING' | 'NORMAL' | 'CAUTION';
  name: string;
}) {
  const initial = name ? name.slice(0, 1) : '?';
  let className = 'profile-circle';
  if (status === 'WARNING') className += ' warning';
  else if (status === 'CAUTION') className += ' caution';
  else className += ' normal';

  return (
    <div className={className}>
      {initial}
    </div>
  );
}

