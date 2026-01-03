'use client';

import { type CSSProperties } from 'react';

export type BeneficiaryLog = {
  id: string | number;
  date: string;
  type: string;
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
};

export type BeneficiaryDetail = {
  phoneNumber: string | null;
  guardian: string | null;
  diseases: string[];
  medication: string | null;
  notes: string | null;
  recentLogs: BeneficiaryLog[];
};

export type BeneficiarySummary = {
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

type DetailModalProps = {
  beneficiary: BeneficiarySummary | undefined;
  detail: BeneficiaryDetail;
  onClose: () => void;
};

export default function DetailModal({
  beneficiary,
  detail,
  onClose,
}: DetailModalProps) {
  if (!beneficiary) return null;

  const status = beneficiary.status;
  const isWarning = status === 'WARNING';
  const isCaution = status === 'CAUTION';
  const badgeColor = isWarning ? '#dc2626' : isCaution ? '#c2410c' : '#16a34a';
  const badgeBg = isWarning ? '#fef2f2' : isCaution ? '#fff7ed' : '#ecfdf3';

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,23,42,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        // 사이드바가 열려 있을 때 좌측 공간을 확보해 모달이 가리지 않도록 추가 패딩
        paddingLeft: 'calc(var(--sidebar-width, 0px) + 12px)',
        zIndex: 2000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          // 사이드바 폭을 제외한 영역에서 여백을 둔 최대 너비 설정 (sidebar 있을 때 더 좁게 맞춤)
          width:
            'min(1300px, calc(100vw - var(--sidebar-width, 0px) - 48px))',
          maxWidth:
            'min(1300px, calc(100vw - var(--sidebar-width, 0px) - 48px))',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.32)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid #e2e8f0',
            background:
              status === 'WARNING'
                ? 'linear-gradient(90deg, #fff5f5 0%, #fff 70%)'
                : '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              aria-hidden="true"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: isWarning ? '#dc2626' : '#64748b',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 900,
                fontSize: '18px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              }}
            >
              {beneficiary.name ? beneficiary.name.charAt(0) : '?'}
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    color: '#0f172a',
                  }}
                >
                  {beneficiary.name}
                </div>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>
                  ({beneficiary.age ?? '-'}세 / {beneficiary.gender ?? '-'})
                </span>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    padding: '6px 10px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '12px',
                    border: `1px solid ${badgeColor}1f`,
                  }}
                >
                  ●{' '}
                  {status === 'WARNING'
                    ? '케어 필요 (Warning)'
                    : status === 'CAUTION'
                    ? '주의 필요'
                    : '안정적'}
                </span>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <span style={{ color: '#475569', fontWeight: 700 }}>
                  {beneficiary.type ?? '유형 정보 없음'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: 800,
                boxShadow: '0 6px 16px rgba(15,23,42,0.08)',
                cursor: 'pointer',
              }}
            >
              담소일지 (상담 기록)
            </button>
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <SectionTitle>기본 정보</SectionTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px',
                  boxShadow: '0 10px 26px rgba(15,23,42,0.06)',
                }}
              >
                <InfoItem label="대상자 전화번호" value={detail.phoneNumber} />
                <InfoItem label="주소" value={beneficiary.address ?? '-'} />
                <InfoItem label="보호자" value={detail.guardian ?? '-'} />
                <InfoItem label="담당자" value={beneficiary.manager ?? '-'} />
              </div>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <SectionTitle>건강 정보</SectionTitle>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px',
                  boxShadow: '0 10px 26px rgba(15,23,42,0.06)',
                }}
              >
                <InfoItem
                  label="기저질환"
                  value={
                    detail.diseases.length
                      ? detail.diseases.map(item => `#${item}`).join(' ')
                      : '-'
                  }
                />
                <InfoItem label="복약 정보" value={detail.medication ?? '-'} />
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 10px 26px rgba(15,23,42,0.06)',
            }}
          >
            <SectionTitle>참고사항 (특이사항)</SectionTitle>
            <div
              style={{
                color: '#92400e',
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              {detail.notes || '추가 메모가 없습니다.'}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 10px 26px rgba(15,23,42,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <SectionTitle>최근 안부 및 상담 기록</SectionTitle>
              <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
                총 {detail.recentLogs.length}건
              </div>
            </div>
            {detail.recentLogs.length === 0 ? (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  fontWeight: 700,
                }}
              >
                최근 기록이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {detail.recentLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: log.type.includes('AI') ? '#2563eb' : '#334155',
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: '12px',
                      }}
                    >
                      {log.type.includes('AI') ? 'AI' : 'LOG'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            fontWeight: 800,
                            color: '#0f172a',
                          }}
                        >
                          <span>{log.type}</span>
                          <SentimentBadge sentiment={log.sentiment} />
                        </div>
                        <div
                          style={{
                            color: '#94a3b8',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}
                        >
                          {log.date}
                        </div>
                      </div>
                      <div style={{ color: '#334155', fontWeight: 700, lineHeight: 1.5 }}>
                        {log.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 22px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            type="button"
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#ef4444',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            대상자 삭제
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                fontWeight: 700,
              }}
            >
              최근 통화: {beneficiary.lastCall ?? '정보 없음'}
            </div>
            <button
              type="button"
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#4A5D23',
                color: '#ffffff',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              정보 수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: '13px',
        fontWeight: 900,
        color: '#0f172a',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
      }}
    >
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 800 }}>
        {label}
      </span>
      <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '14px' }}>
        {value ?? '-'}
      </span>
    </div>
  );
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: BeneficiaryLog['sentiment'];
}) {
  if (!sentiment) return null;
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '999px',
    fontWeight: 800,
    fontSize: '11px',
  };
  if (sentiment === 'negative') {
    return (
      <span
        style={{
          ...style,
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecdd3',
        }}
      >
        위험 감지
      </span>
    );
  }
  if (sentiment === 'positive') {
    return (
      <span
        style={{
          ...style,
          backgroundColor: '#ecfdf3',
          color: '#15803d',
          border: '1px solid #bbf7d0',
        }}
      >
        기분 좋음
      </span>
    );
  }
  return (
    <span
      style={{
        ...style,
        backgroundColor: '#f8fafc',
        color: '#475569',
        border: '1px solid #e2e8f0',
      }}
    >
      특이사항 없음
    </span>
  );
}
