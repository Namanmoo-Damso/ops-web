'use client';

import { useEffect, useState } from 'react';

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

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 16V4M8 8l4-4 4 4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

type CsvUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onUpload?: (file: File) => void;
  onManualSubmit?: (payload: {
    name: string;
    email: string;
    phone_number: string;
    birth_date?: string;
    address?: string;
  }) => void;
};

export default function CsvUploadModal({
  open,
  onClose,
  onUpload,
  onManualSubmit,
}: CsvUploadModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [isDragActive, setIsDragActive] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    birth_date: '',
    address: '',
  });

  useEffect(() => {
    if (!open) {
      setCsvFile(null);
      setMode('upload');
      setManualForm({
        name: '',
        email: '',
        phone_number: '',
        birth_date: '',
        address: '',
      });
      setIsDragActive(false);
    }
  }, [open]);

  if (!open) return null;

  const handleUpload = () => {
    if (mode === 'upload') {
      if (!csvFile) return;
      console.log('[DEBUG] Upload clicked - file:', csvFile.name);
      onUpload?.(csvFile);
      onClose();
    } else {
      const payload = {
        name: manualForm.name.trim(),
        email: manualForm.email.trim(),
        phone_number: manualForm.phone_number.trim(),
        birth_date: manualForm.birth_date.trim() || undefined,
        address: manualForm.address.trim() || undefined,
      };
      console.log('[DEBUG] Manual submit:', payload);
      onManualSubmit?.(payload);
      onClose();
    }
  };

  const allowManualSubmit =
    manualForm.name.trim().length > 0 &&
    (manualForm.email.trim().length > 0 ||
      manualForm.phone_number.trim().length > 0);

  const uploadDisabled = mode === 'upload' ? !csvFile : !allowManualSubmit;

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
      onClick={() => {
        console.log('[DEBUG] Modal overlay clicked - closing modal');
        onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
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
            Register CSV
          </h3>
          <button
            onClick={() => {
              console.log('[DEBUG] Modal close button clicked');
              onClose();
            }}
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
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            ></label>
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragActive(true);
              }}
              onDragLeave={e => {
                e.preventDefault();
                setIsDragActive(false);
              }}
              onDrop={e => {
                e.preventDefault();
                setIsDragActive(false);
                const dropped = e.dataTransfer.files?.[0] ?? null;
                if (dropped) {
                  setCsvFile(dropped);
                  console.log('[DEBUG] CSV dropped:', dropped.name);
                }
              }}
              onClick={() => {
                document.getElementById('csv-file-input')?.click();
              }}
              style={{
                width: '100%',
                minHeight: '220px',
                borderRadius: '12px',
                border: `2px dashed ${isDragActive ? '#2563eb' : '#e2e8f0'}`,
                backgroundColor: isDragActive ? '#eff6ff' : '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#2563eb',
                }}
              >
                <IconUpload />
              </div>
              <div
                style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}
              >
                {csvFile
                  ? csvFile.name
                  : '여기에 파일을 끌어다 놓거나 클릭해서 선택'}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                CSV 형식만 업로드 가능합니다
              </div>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null;
                  setCsvFile(file);
                  console.log(
                    '[DEBUG] CSV file selected:',
                    file ? file.name : 'none',
                  );
                }}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {[
              {
                key: 'name',
                label: '이름',
                required: true,
                placeholder: '홍길동',
              },
              {
                key: 'email',
                label: '이메일',
                required: false,
                placeholder: 'user@example.com',
              },
              {
                key: 'phone_number',
                label: '전화번호',
                required: false,
                placeholder: '010-1234-5678',
              },
              {
                key: 'birth_date',
                label: '생년월일',
                required: false,
                placeholder: '1990-01-01',
              },
              {
                key: 'address',
                label: '주소',
                required: false,
                placeholder: '서울특별시 ...',
              },
            ].map(field => (
              <div
                key={field.key}
                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <label
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1e293b',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  <span>{field.label}</span>
                  {field.required && (
                    <span style={{ color: '#dc2626' }}>*</span>
                  )}
                </label>
                <input
                  value={(manualForm as any)[field.key]}
                  onChange={e =>
                    setManualForm(prev => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    fontSize: '14px',
                    color: '#1f2937',
                  }}
                />
              </div>
            ))}
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              이름과 이메일 또는 전화번호 중 하나는 반드시 입력해주세요.
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '18px',
          }}
        >
          <button
            onClick={() => {
              console.log('[DEBUG] Modal cancel clicked');
              onClose();
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = '#1e293b';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            Cancel
          </button>
          <button
            disabled={uploadDisabled}
            onClick={handleUpload}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: uploadDisabled ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: uploadDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
              boxShadow: uploadDisabled
                ? 'none'
                : '0 10px 30px rgba(37,99,235,0.15)',
            }}
            onMouseEnter={e => {
              if (uploadDisabled) return;
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={e => {
              if (uploadDisabled) return;
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            {mode === 'upload' ? 'Upload' : '추가하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
