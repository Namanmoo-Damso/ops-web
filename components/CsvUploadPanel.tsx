'use client';

import { useState } from 'react';

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

export type CleanRow = {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  birth_date: string;
  address: string;
  notes: string;
};

type ParsedRow = CleanRow & { errors: string[] };

type CsvUploadPanelProps = {
  onConfirm: (file: File, rows: CleanRow[]) => void;
  onCancel: () => void;
};

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsvText(text: string): { rows: CleanRow[] } {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return { rows: [] };
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const rows: CleanRow[] = [];

  for (let idx = 1; idx < lines.length; idx++) {
    const cols = splitCsvLine(lines[idx]);
    const row: CleanRow = {
      id: `${idx}`,
      name: '',
      email: '',
      phone_number: '',
      birth_date: '',
      address: '',
      notes: '',
    };

    headers.forEach((header, hIdx) => {
      const value = cols[hIdx]?.trim() ?? '';
      if (header === 'name') row.name = value;
      if (header === 'email') row.email = value;
      if (header === 'phone_number' || header === 'phone') row.phone_number = value;
      if (header === 'birth_date' || header === 'birth') row.birth_date = value;
      if (header === 'address') row.address = value;
      if (header === 'notes' || header === 'note') row.notes = value;
    });

    rows.push(row);
  }

  return { rows };
}

function validateRow(row: CleanRow): string[] {
  const errors: string[] = [];

  if (!row.name.trim()) errors.push('이름 필수');
  if (!row.email.trim()) {
    errors.push('이메일 필수');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
    errors.push('이메일 형식 오류');
  }
  if (!row.phone_number.trim()) errors.push('전화번호 필수');
  if (row.birth_date.trim()) {
    const date = new Date(row.birth_date.trim());
    if (Number.isNaN(date.getTime())) errors.push('생년월일 형식 오류');
  }

  return errors;
}

export default function CsvUploadPanel({
  onConfirm,
  onCancel,
}: CsvUploadPanelProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadStage, setUploadStage] = useState<'select' | 'preview'>('select');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const hasRowErrors = parsedRows.some(r => r.errors.length > 0);
  const uploadDisabled =
    uploadStage === 'select' ? !csvFile : parsedRows.length === 0;

  const handlePreview = async () => {
    if (!csvFile) return;
    try {
      const text = await csvFile.text();
      const { rows } = parseCsvText(text);
      if (rows.length === 0) {
        setParseError('CSV에 데이터가 없습니다.');
        return;
      }
      const validated = rows.map(r => ({
        ...r,
        errors: validateRow(r),
      }));
      setParsedRows(validated);
      setParseError(null);
      setUploadStage('preview');
    } catch (error) {
      console.error(error);
      setParseError('CSV 파싱 중 오류가 발생했습니다.');
    }
  };

  const handleConfirm = () => {
    const revalidated = parsedRows.map(row => ({
      ...row,
      errors: validateRow(row),
    }));
    setParsedRows(revalidated);
    const hasErrors = revalidated.some(r => r.errors.length > 0);
    if (hasErrors) {
      setParseError('오류를 모두 수정한 뒤 업로드하세요.');
      return;
    }
    if (!csvFile) {
      setParseError('CSV 파일을 선택하세요.');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanedRows = revalidated.map(({ errors: _errors, ...rest }) => rest);
    onConfirm(csvFile, cleanedRows);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {uploadStage === 'select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
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
          {parseError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '13px',
              }}
            >
              {parseError}
            </div>
          )}
        </div>
      )}

      {uploadStage === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '14px', color: '#1e293b' }}>
              총 {parsedRows.length}건 •{' '}
              {hasRowErrors ? '오류를 수정해야 합니다' : '모두 유효합니다'}
            </div>
            <button
              onClick={() => {
                setUploadStage('select');
                setParsedRows([]);
                setParseError(null);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              파일 다시 선택
            </button>
          </div>

          {parseError && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '13px',
              }}
            >
              {parseError}
            </div>
          )}

          <div
            style={{
              maxHeight: '320px',
              overflow: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.8fr 1.6fr 1fr 1fr 1fr',
                padding: '10px 12px',
                backgroundColor: '#f8fafc',
                fontSize: '12px',
                fontWeight: 700,
                color: '#475569',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <span>이름*</span>
              <span>이메일*</span>
              <span>전화번호*</span>
              <span>생년월일</span>
              <span>주소</span>
              <span>비고</span>
            </div>
            {parsedRows.map((row, idx) => (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1.8fr 1.6fr 1fr 1fr 1fr',
                  gap: '6px',
                  padding: '10px 12px',
                  borderBottom:
                    idx === parsedRows.length - 1
                      ? 'none'
                      : '1px solid #f1f5f9',
                  backgroundColor: row.errors.length ? '#fff7ed' : '#ffffff',
                }}
              >
                {(
                  ['name', 'email', 'phone_number', 'birth_date', 'address', 'notes'] as const
                ).map(field => (
                  <input
                    key={field}
                    value={row[field]}
                    onChange={e => {
                      const value = e.target.value;
                      setParsedRows(prev =>
                        prev.map(r =>
                          r.id === row.id
                            ? {
                                ...r,
                                [field]: value,
                                errors: validateRow({
                                  ...r,
                                  [field]: value,
                                }),
                              }
                            : r,
                        ),
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: row.errors.length
                        ? '1px solid #fb7185'
                        : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      fontSize: '13px',
                      color: '#1f2937',
                    }}
                    placeholder={
                      field === 'birth_date'
                        ? 'YYYY-MM-DD'
                        : field === 'notes'
                          ? '비고'
                          : ''
                    }
                  />
                ))}
                {row.errors.length > 0 && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      fontSize: '12px',
                      color: '#b91c1c',
                      marginTop: '6px',
                    }}
                  >
                    {row.errors.join(' • ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '8px',
        }}
      >
        <button
          onClick={onCancel}
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
        {uploadStage === 'preview' && (
          <button
            onClick={() => {
              setUploadStage('select');
              setParsedRows([]);
              setParseError(null);
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
          >
            뒤로
          </button>
        )}
        <button
          disabled={uploadDisabled}
          onClick={uploadStage === 'select' ? handlePreview : handleConfirm}
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
          {uploadStage === 'select' ? '미리보기' : '확인 후 업로드'}
        </button>
      </div>
    </div>
  );
}
