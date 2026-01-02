'use client';

import { useState } from 'react';
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
  onUpload?: (file: File, rows: CleanRow[]) => void;
  onManualSubmit?: (payload: ManualWardPayload) => Promise<void> | void;
};

export default function CsvUploadModal({
  open,
  onClose,
  onUpload,
  onManualSubmit,
}: CsvUploadModalProps) {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');

  if (!open) return null;

  const handleClose = () => {
    setMode('upload');
    onClose();
  };

  const handleCsvConfirm = (file: File, rows: CleanRow[]) => {
    onUpload?.(file, rows);
    handleClose();
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
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 50px rgba(15,23,42,0.15)',
          padding: '28px',
          border: '1px solid #e2e8f0',
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
              color: '#111827',
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
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
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
                onClick={() => setMode(option.key as typeof mode)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#eff6ff' : '#ffffff',
                  color: isActive ? '#1d4ed8' : '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {mode === 'upload' ? (
          <CsvUploadPanel onConfirm={handleCsvConfirm} onCancel={onClose} />
        ) : (
          <ManualWardForm onSubmit={handleManualSubmit} onCancel={onClose} />
        )}
      </div>
    </div>
  );
}
