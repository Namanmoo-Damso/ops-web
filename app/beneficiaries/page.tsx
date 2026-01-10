'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

import { useApi } from '../../hooks/useApi';
import { apiClient, AuthError } from '../../lib/api-client';
import type { DataListResponse } from '../../types/api';
import DetailModal, {
  type BeneficiaryDetail,
  type BeneficiaryUpdatePayload,
  type BeneficiarySummary,
} from './DetailModal';
import { StatCard } from '../my-wards/StatCard';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshIcon,
  UsersIcon,
} from '../my-wards/icons';

// Components
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const SEARCH_DEBOUNCE_MS = 250;

// 한글 초성 추출 함수
function getKoreanConsonant(name: string): string {
  if (!name || name.length === 0) return '';

  const firstChar = name.charAt(0);
  const code = firstChar.charCodeAt(0);

  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const consonantIndex = Math.floor((code - 0xAC00) / 588);
    return consonants[consonantIndex];
  }

  return '';
}

// 한글 자음 목록
const KOREAN_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 날짜를 상대적 시간으로 포맷팅
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();

  // 오늘 날짜인지 확인
  const isToday = date.getDate() === now.getDate() &&
                  date.getMonth() === now.getMonth() &&
                  date.getFullYear() === now.getFullYear();

  if (isToday) {
    // 오늘이면 시간 표시 (오전/오후 형식)
    const hours = date.getHours();
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${period} ${displayHours}시`;
  }

  // 며칠 전인지 계산
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '1일 전';
  } else if (diffDays < 30) {
    return `${diffDays}일 전`;
  } else if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}개월 전`;
  } else {
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}년 전`;
  }
}

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
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [detailOverride, setDetailOverride] =
    useState<BeneficiaryDetailPayload | null>(null);
  const [activeConsonant, setActiveConsonant] = useState<string | null>(null);
  const [openInEditMode, setOpenInEditMode] = useState(false);

  // Refs for scrolling to specific rows
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // 디바운스된 검색어로 필터링 부담을 줄임
  useEffect(() => {
    const handle = window.setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(handle);
  }, [search]);


  useEffect(() => {
    setDeleteError(null);
    setDetailOverride(null);
    if (!selectedId) {
      setOpenInEditMode(false);
    }
  }, [selectedId]);

  // my-wards API를 사용하여 실제 연동 데이터를 가져옴
  type MyWardsApiResponse = {
    wards: Array<{
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
    }>;
    stats?: {
      total: number;
      registered: number;
    };
  };

  const { data: wardsData, loading, error } = useApi<MyWardsApiResponse>({
    deps: [refreshKey],
    fetcher: (client, signal) => {
      return client.get<MyWardsApiResponse>('/v1/admin/my-wards', { signal });
    },
  });

  const allData = wardsData;

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
    const apiItems = Array.isArray(wardsData?.wards) ? wardsData.wards : [];
    return apiItems.map((ward, index) => {
      // 나이 계산
      let age: number | null = null;
      if (ward.birthDate) {
        const birthYear = new Date(ward.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        age = currentYear - birthYear;
      }

      // ward 데이터를 BeneficiarySummary 형식으로 변환
      return {
        id: String(ward.id ?? `row-${index}`),
        name: ward.name,
        phoneNumber: ward.phoneNumber || null,
        address: ward.address || null,
        manager: null, // my-wards API에는 manager 필드가 없음
        guardianPhone: null, // my-wards API에는 guardianPhone 필드가 없음
        isRegistered: ward.isRegistered,
        status: 'NORMAL' as 'WARNING' | 'NORMAL' | 'CAUTION', // 기본값
        lastCall: ward.lastCallAt || null,
        age: age,
        gender: null, // my-wards API에는 gender 필드가 없음
        type: null, // my-wards API에는 type 필드가 없음
      };
    });
  }, [wardsData]);

  const totalCount = useMemo(() => {
    return items.length;
  }, [items]);

  // 연동 통계 계산 - 전체 데이터 기준
  const linkStats = useMemo(() => {
    const allItems = items;
    const total = allItems.length;
    const linked = allItems.filter(item => item.isRegistered === true).length;
    const pending = allItems.filter(item => item.isRegistered === false).length;
    const rate = total > 0 ? Math.round((linked / total) * 100) : 0;
    return { total, linked, pending, rate };
  }, [items]);

  // 검색어 기준 1차 필터링
  const searchMatches = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    return items.filter(item => {
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.phoneNumber?.toLowerCase().includes(query) ||
        item.address?.toLowerCase().includes(query)
      );
    });
  }, [debouncedSearch, items]);

  // 담당자 목록 추출 (현재는 사용하지 않음)
  const managerList = useMemo(() => {
    return [];
  }, []);

  // 담당자 필터 적용 (현재는 모든 항목 반환)
  const managerFiltered = useMemo(() => {
    return searchMatches;
  }, [searchMatches]);

  // filterStatus 필터 적용 (전체목록 vs 미연동 대상자)
  const statusFiltered = useMemo(() => {
    if (filterStatus === 'all') return managerFiltered;
    return managerFiltered.filter(item => item.isRegistered === false);
  }, [managerFiltered, filterStatus]);

  // 정렬 적용 - 미연동 대상자는 항상 아래에 위치
  const filteredList = useMemo(() => {
    const registered = statusFiltered.filter(item => item.isRegistered === true);
    const unregistered = statusFiltered.filter(item => item.isRegistered === false);

    // 각 그룹 내에서 정렬
    const sortGroup = (group: BeneficiarySummary[]) => {
      if (sortBy === 'lastCall-recent') {
        return group.sort((a, b) => {
          if (!a.lastCall) return 1;
          if (!b.lastCall) return -1;
          return b.lastCall.localeCompare(a.lastCall);
        });
      } else if (sortBy === 'lastCall-old') {
        return group.sort((a, b) => {
          if (!a.lastCall) return 1;
          if (!b.lastCall) return -1;
          return a.lastCall.localeCompare(b.lastCall);
        });
      }
      // 기본값은 이름순 정렬
      return group.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    };

    // 각 그룹을 선택된 정렬 기준으로 정렬
    const sortedRegistered = sortGroup([...registered]);
    const sortedUnregistered = sortGroup([...unregistered]);

    // 연동된 사용자 먼저, 그 다음 미연동 사용자
    return [...sortedRegistered, ...sortedUnregistered];
  }, [statusFiltered, sortBy]);

  // 무한 스크롤 - 전체 리스트 표시
  const displayList = filteredList;

  // 자음별 첫 번째 항목 인덱스 맵
  const consonantMap = useMemo(() => {
    const map = new Map<string, number>();
    displayList.forEach((item, index) => {
      const consonant = getKoreanConsonant(item.name);
      if (consonant && !map.has(consonant)) {
        map.set(consonant, index);
      }
    });
    return map;
  }, [displayList]);

  // 자음 클릭 핸들러
  const handleConsonantClick = (consonant: string) => {
    const index = consonantMap.get(consonant);
    if (index !== undefined && displayList[index]) {
      const itemId = displayList[index].id;
      const rowElement = rowRefs.current.get(String(itemId));
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setActiveConsonant(consonant);
      }
    }
  };

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
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
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

      {/* 통계 카드 제거 - 경고 배너도 제거 */}
      {/* 연동 대기 경고 배너 제거 */}
      {false && linkStats.pending > 0 && (
        <div
          style={{
            background: "var(--color-danger-soft)",
            border: `1px solid var(--color-danger-border)`,
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
                backgroundColor: "var(--color-danger-soft)",
                display: 'grid',
                placeItems: 'center',
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
                아직 연동되지 않은 대상자가 {linkStats.pending}명 있습니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div style={{ marginBottom: '20px' }}>
        <StatCard
          value={null}
          color="#8FA963"
          extra={
            <div style={{ marginTop: '16px' }}>
              {/* 3개 섹션: 연동된 대상자 | 전체 등록 인원 | 연동 대기중 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--color-border)',
              }}>
                {/* 연동된 대상자 */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    연동된 대상자
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {linkStats.linked}명
                  </div>
                </div>

                <div style={{ width: '1px', height: '50px', backgroundColor: 'var(--color-border)' }} />

                {/* 전체 등록 인원 */}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    전체 등록 인원
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    {linkStats.total}명
                  </div>
                </div>

                <div style={{ width: '1px', height: '50px', backgroundColor: 'var(--color-border)' }} />

                {/* 연동 대기중 */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                      연동 대기중
                    </div>
                    <div style={{ fontSize: '30px', fontWeight: 800, color: linkStats.pending > 0 ? '#dc2626' : 'var(--color-text-primary)' }}>
                      {linkStats.pending}명
                    </div>
                  </div>
                  {linkStats.pending > 0 && (
                    <button
                      style={{
                        position: 'absolute',
                        right: '20%',
                        top: '70%',
                        transform: 'translateY(-50%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#dc2626',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fecaca';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                      }}
                      onClick={() => {
                        // TODO: Implement reinvite logic
                        console.log('Reinvite all pending users');
                      }}
                    >
                      <RefreshIcon size={14} color="#dc2626" />
                      재초대
                    </button>
                  )}
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div style={{ marginTop: '16px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    borderRadius: '999px',
                    backgroundColor: "var(--color-border)",
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${linkStats.rate}%`,
                      height: '100%',
                      backgroundColor: "var(--color-primary)",
                      transition: 'width 150ms ease',
                    }}
                  />
                </div>
              </div>
            </div>
          }
          footer={`연동률 ${linkStats.rate}%`}
        />
      </div>

      <div className="beneficiaries-container">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Korean Alphabet Scrollbar - Outside table */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              backgroundColor: 'var(--color-panel)',
              padding: '8px 6px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-raised)',
              position: 'sticky',
              top: '20px',
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {KOREAN_CONSONANTS.map(consonant => {
              const hasItems = consonantMap.has(consonant);
              const isActive = activeConsonant === consonant;
              return (
                <button
                  key={consonant}
                  onClick={() => hasItems && handleConsonantClick(consonant)}
                  disabled={!hasItems}
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: isActive
                      ? 'var(--color-primary)'
                      : hasItems
                      ? 'transparent'
                      : 'transparent',
                    color: isActive
                      ? 'white'
                      : hasItems
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-muted)',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: hasItems ? 'pointer' : 'not-allowed',
                    opacity: hasItems ? 1 : 0.3,
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (hasItems && !isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-accent-soft)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasItems && !isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {consonant}
                </button>
              );
            })}
          </div>

        <div className="beneficiary-table-container" style={{ flex: 1 }}>
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            borderBottom: '1px solid var(--color-border)',
            overflowX: 'auto',
          }}>
            {/* Filter Status Buttons (전체목록/미연동 대상자) */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--color-accent-soft)',
                padding: '6px',
                borderRadius: '12px',
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setFilterStatus('all')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: filterStatus === 'all' ? 'white' : 'transparent',
                  color: filterStatus === 'all' ? 'var(--color-primary-dark)' : 'var(--color-text-muted)',
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: filterStatus === 'all' ? 'var(--shadow-raised)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                전체 목록
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: filterStatus === 'pending' ? 'white' : 'transparent',
                  color: filterStatus === 'pending' ? 'var(--color-danger-main)' : 'var(--color-text-muted)',
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: filterStatus === 'pending' ? 'var(--shadow-raised)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                미연동 대상자
                <span
                  style={{
                    backgroundColor: 'var(--color-danger-soft)',
                    color: 'var(--color-danger-main)',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  {linkStats.pending}
                </span>
              </button>
            </div>

            {/* Search and Sort Filters */}
            <Input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="이름, 주소, 담당자 검색..."
              aria-label="이름, 주소 또는 담당자 검색"
              style={{ width: '240px', flexShrink: 0 }}
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-panel)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label="정렬 기준"
            >
              <option value="lastCall-recent">최근 안부 - 최신순</option>
              <option value="lastCall-old">최근 안부 - 오래된순</option>
            </select>
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
              <col style={{ width: '24%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <TableHeader className="beneficiary-table-header">
              <TableRow>
                <TableHead className="beneficiary-table-head">이름 및 기본정보</TableHead>
                <TableHead className="beneficiary-table-head">연락처</TableHead>
                <TableHead className="beneficiary-table-head">담당자</TableHead>
                <TableHead className="beneficiary-table-head">보호자 연락처</TableHead>
                <TableHead className="beneficiary-table-head">최근 안부</TableHead>
                <TableHead className="beneficiary-table-head">정보 수정</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayList.map(item => (
                <TableRow
                  key={item.id}
                  ref={(el) => {
                    if (el) {
                      rowRefs.current.set(String(item.id), el);
                    } else {
                      rowRefs.current.delete(String(item.id));
                    }
                  }}
                  onClick={() => setSelectedId(String(item.id))}
                  selected={selectedId === String(item.id)}
                  className="beneficiary-table-row"
                >
                  <TableCell className="beneficiary-table-cell" style={{ textAlign: 'left' }}>
                    <div className="beneficiary-user-cell">
                      <ProfileCircle status={item.status} name={item.name} isRegistered={item.isRegistered} />
                      <div>
                        <div className="beneficiary-user-name">
                          {item.name}
                          {item.age && (
                            <span style={{ fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                              ({item.age}세{item.gender ? ', ' : ''}{item.gender === 'male' || item.gender === 'm' ? '남' : item.gender === 'female' || item.gender === 'f' ? '여' : ''})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="beneficiary-table-cell">{item.phoneNumber ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell">{item.manager ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell">{item.guardianPhone ?? '-'}</TableCell>
                  <TableCell className="beneficiary-table-cell ">{formatRelativeTime(item.lastCall)}</TableCell>
                  <TableCell className="beneficiary-table-cell text-center" style={{ padding: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(String(item.id));
                        setOpenInEditMode(true);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        backgroundColor: 'var(--color-primary-soft)',
                        border: '1px solid var(--color-primary-border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-soft)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {displayList.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    {search ? '검색 결과가 없습니다.' : '표시할 대상자가 없습니다.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
            initialEditMode={openInEditMode}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// --- Components ---

function ProfileCircle({
  status,
  name,
  isRegistered,
}: {
  status: 'WARNING' | 'NORMAL' | 'CAUTION';
  name: string;
  isRegistered?: boolean;
}) {
  const initial = name ? name.slice(0, 1) : '?';
  let className = 'profile-circle';
  if (status === 'WARNING') className += ' warning';
  else if (status === 'CAUTION') className += ' caution';
  else className += ' normal';

  // 연동 상태 bullet point 색상
  const bulletColor = isRegistered === true
    ? '#22c55e'  // 초록색 (soften green)
    : isRegistered === false
    ? 'var(--color-danger-border)'  // 빨간색
    : '#94a3b8';  // 기본 (회색)

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* Bullet point indicator */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '-16px',
          transform: 'translateY(-50%)',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: bulletColor,
        }}
      />
      <div className={className}>
        {initial}
      </div>
    </div>
  );
}

