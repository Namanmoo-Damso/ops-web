'use client';

import { useState } from 'react';
import { overlays, palette, shadows } from '../app/theme';
import CsvUploadPanel, { CleanRow } from './CsvUploadPanel';
import ManualWardForm, { ManualWardPayload } from './ManualWardForm';

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

type CsvUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onUpload?: (file: File, rows: CleanRow[]) => Promise<void> | void;
  onManualSubmit?: (payload: ManualWardPayload) => Promise<void> | void;
  uploading?: boolean;
  uploadProgress?: { processed: number; total: number } | null;
};

export default function CsvUploadModal({
  open,
  onClose,
  onUpload,
  onManualSubmit,
  uploading = false,
  uploadProgress,
}: CsvUploadModalProps) {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [step, setStep] = useState<'form' | 'kakao'>('form');
  const [pendingCsv, setPendingCsv] = useState<{
    file: File;
    rows: CleanRow[];
  } | null>(null);
  const [pendingManual, setPendingManual] = useState<ManualWardPayload | null>(
    null,
  );
  const [kakaoHint, setKakaoHint] = useState<string | null>(null);
  const hasPending =
    (mode === 'upload' && pendingCsv) || (mode === 'manual' && pendingManual);

  if (!open) return null;

  const handleClose = () => {
    if (uploading) return;
    setMode('upload');
    setStep('form');
    setPendingCsv(null);
    setPendingManual(null);
    setKakaoHint(null);
    onClose();
  };

  const handleCsvConfirm = async (file: File, rows: CleanRow[]) => {
    setPendingCsv({ file, rows });
    setPendingManual(null);
    setKakaoHint(null);
    setStep('kakao');
  };

  const handleManualSubmit = async (payload: ManualWardPayload) => {
    setPendingManual(payload);
    setPendingCsv(null);
    setKakaoHint(null);
    setStep('kakao');
  };

  const handleFinalSubmit = async () => {
    try {
      if (mode === 'upload' && pendingCsv) {
        await onUpload?.(pendingCsv.file, pendingCsv.rows);
      } else if (mode === 'manual' && pendingManual) {
        await onManualSubmit?.(pendingManual);
      }
      handleClose();
    } catch {
      setKakaoHint('등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: overlays.scrim,
        display: 'grid',
        placeItems: 'center',
        zIndex: 10000,
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          borderRadius: '16px',
          backgroundColor: palette.panel,
          boxShadow: shadows.deep,
          padding: '28px',
          border: `1px solid ${palette.border}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: palette.primaryDark,
            }}
          >
            피보호자 등록
          </h3>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              display: 'grid',
              placeItems: 'center',
              color: palette.textSoft,
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = palette.soft;
              e.currentTarget.style.color = palette.textMuted;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = palette.textSoft;
            }}
          >
            <IconClose />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          {[
            { key: 'upload', label: 'CSV 업로드' },
            { key: 'manual', label: '직접 입력' },
          ].map(option => {
            const isActive = mode === option.key;
            return (
              <button
                key={option.key}
                disabled={uploading}
                onClick={() => {
                  setMode(option.key as typeof mode);
                  setStep('form');
                  setPendingCsv(null);
                  setPendingManual(null);
                  setKakaoHint(null);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${isActive ? palette.primary : palette.border}`,
                  backgroundColor: isActive ? palette.soft : palette.panel,
                  color: isActive ? palette.primaryDark : palette.textMuted,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: step === 'form' ? 'block' : 'none' }}>
          {mode === 'upload' ? (
            <CsvUploadPanel
              onConfirm={handleCsvConfirm}
              onCancel={handleClose}
              uploading={uploading}
              uploadProgress={uploadProgress}
            />
          ) : (
            <ManualWardForm onSubmit={handleManualSubmit} onCancel={handleClose} />
          )}
        </div>

        {step === 'kakao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.background,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 700, color: palette.primaryDark }}>
                카카오 알림톡 초대장
              </div>
              <div style={{ fontSize: '13px', color: palette.textMuted, lineHeight: 1.5 }}>
                {mode === 'upload'
                  ? `CSV 이메일 기준으로 ${pendingCsv?.rows.length ?? 0}명에게 초대장을 보낼 수 있습니다.`
                  : `입력한 이메일/전화번호로 초대장을 보낼 수 있습니다.`}
              </div>
            </div>

            <button
              disabled={uploading}
              onClick={() => {
                setKakaoHint('알림톡 발송은 준비 중입니다.');
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: `1px solid ${palette.primary}`,
                backgroundColor: palette.panel,
                color: palette.primaryDark,
                fontSize: '14px',
                fontWeight: 700,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                if (uploading) return;
                e.currentTarget.style.backgroundColor = palette.soft;
              }}
              onMouseLeave={e => {
                if (uploading) return;
                e.currentTarget.style.backgroundColor = palette.panel;
              }}
            >
              카카오 알림톡으로 초대장 보내기
            </button>

            {kakaoHint && (
              <div
                style={{
                  backgroundColor: palette.soft,
                  border: `1px solid ${palette.border}`,
                  color: palette.textMuted,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '12px',
                }}
              >
                {kakaoHint}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                disabled={uploading}
                onClick={() => setStep('form')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.panel,
                  color: palette.primaryDark,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  if (uploading) return;
                  e.currentTarget.style.backgroundColor = palette.background;
                  e.currentTarget.style.color = palette.primaryDark;
                  e.currentTarget.style.borderColor = palette.secondary;
                }}
                onMouseLeave={e => {
                  if (uploading) return;
                  e.currentTarget.style.backgroundColor = palette.panel;
                  e.currentTarget.style.color = palette.primaryDark;
                  e.currentTarget.style.borderColor = palette.border;
                }}
              >
                뒤로
              </button>
              <button
                disabled={uploading || !hasPending}
                onClick={handleFinalSubmit}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor:
                    uploading || !hasPending ? palette.secondary : palette.primary,
                  color: palette.panel,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: uploading || !hasPending ? 'not-allowed' : 'pointer',
                  transition: 'all 150ms ease',
                  boxShadow: uploading
                    ? 'none'
                    : '0 10px 30px rgba(37,99,235,0.15)',
                }}
                onMouseEnter={e => {
                  if (uploading || !hasPending) return;
                  e.currentTarget.style.backgroundColor = palette.primaryDark;
                }}
                onMouseLeave={e => {
                  if (uploading || !hasPending) return;
                  e.currentTarget.style.backgroundColor = palette.primary;
                }}
              >
                {uploading ? '등록 중...' : '등록 완료'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
