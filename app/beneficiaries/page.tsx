'use client';

import { useEffect, useMemo, useState } from 'react';
import SidebarLayout from '../../components/SidebarLayout';

type Beneficiary = {
  id: number;
  name: string;
  age: number;
  gender: string;
  type: string;
  address: string;
  manager: string;
  status: 'WARNING' | 'NORMAL' | 'CAUTION';
  lastCall: string;
};

// 임시 목업 데이터 (API 연동 전)
const BENEFICIARIES: Beneficiary[] = [
  {
    id: 1,
    name: '이말순',
    age: 82,
    gender: '여',
    type: '독거',
    address: '서울시 종로구 평창동 12-3',
    manager: '김복지',
    status: 'WARNING',
    lastCall: '오늘 14:30',
  },
  {
    id: 2,
    name: '박철수',
    age: 79,
    gender: '남',
    type: '부부',
    address: '서울시 종로구 구기동 88',
    manager: '이성실',
    status: 'NORMAL',
    lastCall: '어제 10:00',
  },
  {
    id: 3,
    name: '최정자',
    age: 88,
    gender: '여',
    type: '독거',
    address: '서울시 성북구 정릉동 33',
    manager: '최열정',
    status: 'CAUTION',
    lastCall: '5/05 11:00',
  },
  {
    id: 4,
    name: '김영희',
    age: 75,
    gender: '여',
    type: '독거',
    address: '서대문구 홍제동',
    manager: '김복지',
    status: 'NORMAL',
    lastCall: '오늘 09:30',
  },
  {
    id: 5,
    name: '정민수',
    age: 72,
    gender: '남',
    type: '독거',
    address: '은평구 불광동',
    manager: '박관리',
    status: 'NORMAL',
    lastCall: '오늘 10:00',
  },
  {
    id: 6,
    name: '강동원',
    age: 81,
    gender: '남',
    type: '부부',
    address: '종로구 신영동',
    manager: '김복지',
    status: 'NORMAL',
    lastCall: '오늘 11:00',
  },
  {
    id: 7,
    name: '윤여정',
    age: 74,
    gender: '여',
    type: '독거',
    address: '종로구 혜화동',
    manager: '최열정',
    status: 'NORMAL',
    lastCall: '어제 15:00',
  },
];

export default function BeneficiariesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'risk'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 디바운스된 검색어로 필터링 부담을 줄임
  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  const filteredList = useMemo(() => {
    const query = debouncedSearch.trim();
    return BENEFICIARIES.filter(item => {
      const matchesFilter =
        filter === 'all'
          ? true
          : item.status === 'WARNING' || item.status === 'CAUTION';
      if (!matchesFilter) return false;
      if (!query) return true;
      return (
        item.name.includes(query) ||
        item.address.includes(query) ||
        item.manager.includes(query)
      );
    });
  }, [debouncedSearch, filter]);

  const renderStatusBadge = (status: Beneficiary['status']) => {
    const baseStyle: React.CSSProperties = {
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
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
              >
                전체 대상자 관리
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                placeholder="이름, 주소, 담당자 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
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
            >
              <button
                onClick={() => setFilter('all')}
                aria-pressed={filter === 'all'}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor:
                    filter === 'all' ? '#ffffff' : 'transparent',
                  color: filter === 'all' ? '#0f172a' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow:
                    filter === 'all'
                      ? '0 6px 16px rgba(15,23,42,0.08)'
                      : 'none',
                  cursor: 'pointer',
                }}
              >
                전체
              </button>
              <button
                onClick={() => setFilter('risk')}
                aria-pressed={filter === 'risk'}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor:
                    filter === 'risk' ? '#ffffff' : 'transparent',
                  color: filter === 'risk' ? '#dc2626' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '13px',
                  boxShadow:
                    filter === 'risk'
                      ? '0 6px 16px rgba(15,23,42,0.08)'
                      : 'none',
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
                >
                  {BENEFICIARIES.filter(
                    b => b.status === 'WARNING' || b.status === 'CAUTION',
                  ).length}
                </span>
              </button>
            </div>
          </div>
        </div>

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
              전체 {BENEFICIARIES.length}명 중{' '}
              <span style={{ color: '#4A5D23' }}>{filteredList.length}</span>명
              표시
            </div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>
              행 클릭 시 상세 패널은 추후 추가 예정입니다.
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '900px',
              }}
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
                  <th style={{ textAlign: 'right', padding: '14px 12px' }}>
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(item => {
                  const isSelected = selectedId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
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
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '999px',
                              backgroundColor:
                                item.status === 'WARNING'
                                  ? '#dc2626'
                                  : '#94a3b8',
                              color: '#ffffff',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 800,
                              fontSize: '14px',
                            }}
                          >
                            {item.name.at(0)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                              {item.age}세 / {item.gender} / {item.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        {renderStatusBadge(item.status)}
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
                        title={item.address}
                      >
                        {item.address}
                      </td>
                      <td
                        style={{
                          padding: '14px 12px',
                          color: '#475569',
                          fontWeight: 700,
                        }}
                      >
                        {item.manager}
                      </td>
                      <td
                        style={{
                          padding: '14px 12px',
                          color: '#64748b',
                          fontWeight: 600,
                        }}
                      >
                        {item.lastCall}
                      </td>
                      <td
                        style={{
                          padding: '14px 12px',
                          textAlign: 'right',
                        }}
                      >
                        <button
                          type="button"
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

          {filteredList.length === 0 && (
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
        </div>
      </div>
    </SidebarLayout>
  );
}
