'use client';

import { useEffect, useRef } from 'react';
import styles from './DetailModal.module.css';

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
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC로 닫기 + 포커스 트랩
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a, button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!active) {
          first.focus();
          e.preventDefault();
          return;
        }

        if (e.shiftKey && active === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    const root = dialogRef.current;
    if (root) {
      root.focus();
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  const handleOverlayClick: React.MouseEventHandler<HTMLDivElement> = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!beneficiary) return null;

  const status = beneficiary.status;
  const isWarning = status === 'WARNING';
  const statusTagClass =
    status === 'WARNING'
      ? styles.tagWarning
      : status === 'CAUTION'
      ? styles.tagCaution
      : styles.tagNormal;
  const headerClassName = `${styles.header} ${
    isWarning ? styles.headerWarning : ''
  }`.trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
      className={styles.overlay}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className={styles.dialog}
      >
        <div className={headerClassName}>
          <div className={styles.userRow}>
            <div
              aria-hidden="true"
              className={`${styles.avatar} ${
                isWarning ? styles.avatarWarning : styles.avatarDefault
              }`}
            >
              {beneficiary.name ? beneficiary.name.charAt(0) : '?'}
            </div>
            <div className={styles.titleBlock}>
              <div className={styles.titleRow}>
                <div className={styles.name}>{beneficiary.name}</div>
                <span className={styles.age}>
                  ({beneficiary.age ?? '-'}세 / {beneficiary.gender ?? '-'})
                </span>
              </div>
              <div className={styles.metaRow}>
                <span
                  className={`${styles.tag} ${statusTagClass}`}
                >
                  ●{' '}
                  {status === 'WARNING'
                    ? '케어 필요 (Warning)'
                    : status === 'CAUTION'
                    ? '주의 필요'
                    : '안정적'}
                </span>
                <span className={styles.metaSeparator}>|</span>
                <span className={styles.metaValue}>
                  {beneficiary.type ?? '유형 정보 없음'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.ghostButton}>
              담소일지 (상담 기록)
            </button>
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className={styles.closeButton}
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.grid}>
            <div className={styles.column}>
              <SectionTitle>기본 정보</SectionTitle>
              <div className={styles.card}>
                <InfoItem label="대상자 전화번호" value={detail.phoneNumber} />
                <InfoItem label="주소" value={beneficiary.address ?? '-'} />
                <InfoItem label="보호자" value={detail.guardian ?? '-'} />
                <InfoItem label="담당자" value={beneficiary.manager ?? '-'} />
              </div>
            </div>

            <div className={styles.column}>
              <SectionTitle>건강 정보</SectionTitle>
              <div className={styles.card}>
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

          <div className={styles.noteCard}>
            <SectionTitle>참고사항 (특이사항)</SectionTitle>
            <div className={styles.noteText}>{detail.notes || '추가 메모가 없습니다.'}</div>
          </div>

          <div className={styles.card}>
            <div className={styles.logHeader}>
              <SectionTitle>최근 안부 및 상담 기록</SectionTitle>
              <div className={styles.logCount}>총 {detail.recentLogs.length}건</div>
            </div>
            {detail.recentLogs.length === 0 ? (
              <div className={styles.emptyLogs}>최근 기록이 없습니다.</div>
            ) : (
              <div className={styles.logList}>
                {detail.recentLogs.map(log => (
                  <div key={log.id} className={styles.logCard}>
                    <div
                      aria-hidden="true"
                      className={`${styles.logBadge} ${
                        log.type.includes('AI') ? styles.logBadgeAi : styles.logBadgeDefault
                      }`}
                    >
                      {log.type.includes('AI') ? 'AI' : 'LOG'}
                    </div>
                    <div className={styles.logBody}>
                      <div className={styles.logMeta}>
                        <div className={styles.logTitle}>
                          <span>{log.type}</span>
                          <SentimentBadge sentiment={log.sentiment} />
                        </div>
                        <div className={styles.textMuted}>{log.date}</div>
                      </div>
                      <div className={styles.logContent}>{log.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.deleteButton}>
            대상자 삭제
          </button>
          <div className={styles.footerActions}>
            <div className={styles.textMuted}>
              최근 통화: {beneficiary.lastCall ?? '정보 없음'}
            </div>
            <button type="button" className={styles.editButton}>
              정보 수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <div className={styles.sectionTitle}>{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value ?? '-'}</span>
    </div>
  );
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: BeneficiaryLog['sentiment'];
}) {
  if (!sentiment) return null;

  if (sentiment === 'negative') {
    return (
      <span className={`${styles.sentiment} ${styles.sentimentNegative}`}>위험 감지</span>
    );
  }
  if (sentiment === 'positive') {
    return (
      <span className={`${styles.sentiment} ${styles.sentimentPositive}`}>기분 좋음</span>
    );
  }
  return (
    <span className={`${styles.sentiment} ${styles.sentimentNeutral}`}>특이사항 없음</span>
  );
}
