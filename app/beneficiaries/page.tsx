'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

import { useApi } from '../../hooks/useApi';
import { apiClient, AuthError } from '../../lib/api-client';
import type { DataListResponse } from '../../types/api';
import DetailModal, {
  type BeneficiaryDetail,
  type BeneficiaryUpdatePayload,
  type BeneficiarySummary,
} from './DetailModal';

// Components
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
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

type SortOption = 'name' | 'lastCall-recent' | 'lastCall-old';

export default function BeneficiariesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
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
  }, [debouncedSearch, sortBy, managerFilter]);

  useEffect(() => {
    setDeleteError(null);
    setDetailOverride(null);
  }, [selectedId]);

  const { data, loading, error } = useApi<DataListResponse<BeneficiarySummary>>({
    deps: [debouncedSearch, page, pageSize, refreshKey],
    fetcher: (client, signal) => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
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

  // 담당자 목록 추출
  const managerList = useMemo(() => {
    const managers = new Set<string>();
    items.forEach(item => {
      if (item.manager) managers.add(item.manager);
    });
    return Array.from(managers).sort();
  }, [items]);

  // 담당자 필터 적용
  const managerFiltered = useMemo(() => {
    if (managerFilter === 'all') return searchMatches;
    return searchMatches.filter(item => item.manager === managerFilter);
  }, [searchMatches, managerFilter]);

  // 정렬 적용
  const filteredList = useMemo(() => {
    const sorted = [...managerFiltered];

    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    } else if (sortBy === 'lastCall-recent') {
      sorted.sort((a, b) => {
        if (!a.lastCall) return 1;
        if (!b.lastCall) return -1;
        return b.lastCall.localeCompare(a.lastCall);
      });
    } else if (sortBy === 'lastCall-old') {
      sorted.sort((a, b) => {
        if (!a.lastCall) return 1;
        if (!b.lastCall) return -1;
        return a.lastCall.localeCompare(b.lastCall);
      });
    }

    return sorted;
  }, [managerFiltered, sortBy]);

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
    <DashboardLayout>
      {/* Page Header with Search/Filter on same line */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        gap: '24px'
      }}>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 700,
              color: "var(--color-primary-dark)",
            }}
          >
            전체 대상자 관리
          </h1>
          <p
            style={{ margin: '6px 0 0', color: "var(--color-text-muted)", fontSize: '14px' }}
          >
            등록된 모든 대상자의 정보를 조회하고 관리합니다.
          </p>
        </div>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          managerFilter={managerFilter}
          onManagerFilterChange={setManagerFilter}
          managerList={managerList}
        />
      </div>

      <div className="beneficiaries-container">

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
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <TableHeader className="beneficiary-table-header">
              <TableRow>
                <TableHead className="beneficiary-table-head">이름 / 기본정보</TableHead>
                <TableHead className="beneficiary-table-head">거주지</TableHead>
                <TableHead className="beneficiary-table-head">담당자</TableHead>
                <TableHead className="beneficiary-table-head">보호자 연락처</TableHead>
                <TableHead className="beneficiary-table-head text-center">최근 안부</TableHead>
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
                  <TableCell className="beneficiary-table-cell">{item.address ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell">{item.manager ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell">{item.guardianPhone ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell text-center">{item.lastCall ?? '-'}</TableCell>
                </TableRow>
              ))}
              {filteredList.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
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
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  managerFilter: string;
  onManagerFilterChange: (value: string) => void;
  managerList: string[];
};

function FilterBar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  managerFilter,
  onManagerFilterChange,
  managerList,
}: FilterBarProps) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Input
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
        placeholder="이름, 주소, 담당자 검색..."
        aria-label="이름, 주소 또는 담당자 검색"
        style={{ minWidth: '200px' }}
      />

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          fontSize: '14px',
          color: 'var(--color-text-primary)',
          backgroundColor: 'var(--color-panel)',
          cursor: 'pointer',
        }}
        aria-label="정렬 기준"
      >
        <option value="name">이름순</option>
        <option value="lastCall-recent">최근 안부 - 최신순</option>
        <option value="lastCall-old">최근 안부 - 오래된순</option>
      </select>

      <select
        value={managerFilter}
        onChange={(e) => onManagerFilterChange(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          fontSize: '14px',
          color: 'var(--color-text-primary)',
          backgroundColor: 'var(--color-panel)',
          cursor: 'pointer',
        }}
        aria-label="담당자 필터"
      >
        <option value="all">전체 담당자</option>
        {managerList.map(manager => (
          <option key={manager} value={manager}>
            {manager}
          </option>
        ))}
      </select>
    </div>
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

