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

  if (!open) return null;

  const handleClose = () => {
    if (uploading) return;
    setMode('upload');
    onClose();
  };

  const handleCsvConfirm = async (file: File, rows: CleanRow[]) => {
    try {
      await onUpload?.(file, rows);
      handleClose();
    } catch {
      // 부모에서 에러를 처리(알림 등)하므로 모달은 그대로 둠
    }
  };

  const handleManualSubmit = async (payload: ManualWardPayload) => {
    try {
      await onManualSubmit?.(payload);
      handleClose();
    } catch {
      // ManualWardForm에서 에러 메시지를 처리하도록 둠 (모달 닫지 않음)
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
                onClick={() => setMode(option.key as typeof mode)}
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

        {mode === 'upload' ? (
          <CsvUploadPanel
            onConfirm={handleCsvConfirm}
            onCancel={handleClose}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        ) : (
          <ManualWardForm onSubmit={handleManualSubmit} onCancel={onClose} />
        )}
      </div>
    </div>
  );
}
