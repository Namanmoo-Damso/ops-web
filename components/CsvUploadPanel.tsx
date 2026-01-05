'use client';

import { useState } from 'react';
import { palette } from '../app/theme';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  uploading?: boolean;
  uploadProgress?: { processed: number; total: number } | null;
};

const borderStyle = `1px solid ${palette.border}`;

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

// Map various header names to standard field names
function mapHeaderToField(header: string): keyof CleanRow | null {
  const normalized = header.toLowerCase().replace(/[\s-_]+/g, '');

  // Name variations
  if (['이름', '성명', 'name', '이룸', '대상자명'].some(v => normalized.includes(v.replace(/\s/g, '')))) {
    return 'name';
  }

  // Email variations
  if (['이메일', 'email', '메일', 'e-mail', 'mail'].some(v => normalized.includes(v.replace(/\s/g, '')))) {
    return 'email';
  }

  // Phone variations
  if (['전화번호', '전화', '휴대폰', '연락처', 'phone', 'phonenumber', 'mobile', 'contact', '핸드폰', '휴대전화'].some(v => normalized.includes(v.replace(/\s/g, '')))) {
    return 'phone_number';
  }

  // Birth date variations
  if (['생년월일', '생일', 'birthdate', 'birth', 'dateofbirth', 'dob', '태어난날'].some(v => normalized.includes(v.replace(/\s/g, '')))) {
    return 'birth_date';
  }

  // Address variations
  if (['주소', 'address', '거주지', '주거지', 'location'].some(v => normalized.includes(v.replace(/\s/g, '')))) {
    return 'address';
  }

  // Notes variations
  if (['비고', '메모', 'notes', 'note', 'memo', 'remark', '참고', '특이사항'].some(v => normalized.includes(v.replace(/\s/g, '')))) {
    return 'notes';
  }

  return null;
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

async function matchHeadersWithLLM(headers: string[]): Promise<Record<string, string | null>> {
  const TIMEOUT_MS = 10000; // 10초 타임아웃

  try {
    const token = localStorage.getItem('access_token');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${API_BASE}/v1/admin/csv/match-headers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ headers }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('LLM header matching failed:', response.statusText);
      return {};
    }

    const data = await response.json();

    // 타입 검증
    if (!data || typeof data.mapping !== 'object') {
      console.error('Invalid LLM response format');
      return {};
    }

    return data.mapping || {};
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('LLM header matching timeout');
    } else {
      console.error('LLM header matching error:', error);
    }
    return {};
  }
}

async function parseCsvText(text: string): Promise<{ rows: CleanRow[] }> {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return { rows: [] };
  }

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  // Step 1: Try hardcoded matching first
  const hardcodedMapping: Record<string, keyof CleanRow | null> = {};
  const unmatchedHeaders: string[] = [];

  rawHeaders.forEach((rawHeader, idx) => {
    const normalized = headers[idx];
    const field = mapHeaderToField(rawHeader);
    hardcodedMapping[normalized] = field;
    if (!field) {
      unmatchedHeaders.push(rawHeader);
    }
  });

  // Step 2: If there are unmatched headers, try LLM matching
  let llmMapping: Record<string, string | null> = {};
  if (unmatchedHeaders.length > 0) {
    console.log('[CSV] Trying LLM matching for unmatched headers:', unmatchedHeaders);
    llmMapping = await matchHeadersWithLLM(unmatchedHeaders);
  }

  // Step 3: Merge hardcoded and LLM mappings
  const finalMapping: Record<string, string | null> = {};
  rawHeaders.forEach((rawHeader, idx) => {
    const normalized = headers[idx];
    const hardcodedField = hardcodedMapping[normalized];
    if (hardcodedField) {
      finalMapping[normalized] = hardcodedField;
    } else {
      // Try LLM mapping
      const llmField = llmMapping[rawHeader];
      if (llmField) {
        finalMapping[normalized] = llmField;
      } else {
        finalMapping[normalized] = null;
      }
    }
  });

  console.log('[CSV] Final header mapping:', finalMapping);

  // Step 4: Parse rows using the final mapping
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
      const field = finalMapping[header];
      if (field && field !== 'id') {
        row[field as keyof CleanRow] = value;
      }
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
  uploading = false,
  uploadProgress,
}: CsvUploadPanelProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadStage, setUploadStage] = useState<'select' | 'preview'>(
    'select',
  );
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const hasRowErrors = parsedRows.some(r => r.errors.length > 0);
  const uploadDisabled =
    uploadStage === 'select' ? !csvFile : parsedRows.length === 0;

  const handlePreview = async () => {
    if (!csvFile) return;
    try {
      const text = await csvFile.text();
      const { rows } = await parseCsvText(text);
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
    if (uploading) return;
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
              border: `2px dashed ${isDragActive ? palette.primary : palette.border}`,
              backgroundColor: isDragActive ? palette.soft : palette.background,
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
                backgroundColor: palette.soft,
                display: 'grid',
                placeItems: 'center',
                color: palette.primary,
              }}
            >
              <IconUpload />
            </div>
            <div
              style={{ fontSize: '15px', fontWeight: 600, color: palette.primaryDark }}
            >
              {csvFile
                ? csvFile.name
                : '여기에 파일을 끌어다 놓거나 클릭해서 선택'}
            </div>
            <div style={{ fontSize: '13px', color: palette.textMuted }}>
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
                backgroundColor: palette.dangerSoft,
                border: '1px solid #fecaca',
                color: palette.danger,
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
            <div style={{ fontSize: '14px', color: palette.primaryDark }}>
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
                border: borderStyle,
                backgroundColor: palette.panel,
                color: palette.primaryDark,
                cursor: 'pointer',
              }}
            >
              파일 다시 선택
            </button>
          </div>

          {parseError && (
            <div
              style={{
                backgroundColor: palette.dangerSoft,
                border: '1px solid #fecaca',
                color: palette.danger,
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
              border: borderStyle,
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.8fr 1.6fr 1fr 1fr 1fr',
                padding: '10px 12px',
                backgroundColor: palette.background,
                fontSize: '12px',
                fontWeight: 700,
                color: palette.primaryDark,
                borderBottom: borderStyle,
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
                      : '1px solid #F0F5E8',
                  backgroundColor: row.errors.length ? palette.warningSoft : palette.panel,
                }}
              >
                {(
                  [
                    'name',
                    'email',
                    'phone_number',
                    'birth_date',
                    'address',
                    'notes',
                  ] as const
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
                        : borderStyle,
                      backgroundColor: palette.panel,
                      fontSize: '13px',
                      color: palette.primaryDark,
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
                      color: palette.danger,
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

      {uploadProgress && uploadProgress.total > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: palette.primaryDark,
            }}
          >
            <span>업로드 진행 중...</span>
            <span>
              {uploadProgress.processed} / {uploadProgress.total}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              backgroundColor: palette.border,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(
                  (uploadProgress.processed / uploadProgress.total) * 100,
                  100,
                ).toFixed(1)}%`,
                height: '100%',
                backgroundColor: palette.primary,
                transition: 'width 150ms ease',
              }}
            />
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
          disabled={uploading}
          onClick={onCancel}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: borderStyle,
            backgroundColor: palette.panel,
            color: palette.primaryDark,
            fontSize: '14px',
            fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = palette.background;
            e.currentTarget.style.color = palette.primaryDark;
            e.currentTarget.style.borderColor = palette.secondary;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = palette.panel;
            e.currentTarget.style.color = palette.primaryDark;
            e.currentTarget.style.borderColor = palette.border;
          }}
        >
          Cancel
        </button>
        {uploadStage === 'preview' && (
          <button
            disabled={uploading}
            onClick={() => {
              setUploadStage('select');
              setParsedRows([]);
              setParseError(null);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: borderStyle,
              backgroundColor: palette.panel,
              color: palette.primaryDark,
              fontSize: '14px',
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            뒤로
          </button>
        )}
        <button
          disabled={uploadDisabled || uploading}
          onClick={uploadStage === 'select' ? handlePreview : handleConfirm}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor:
              uploadDisabled || uploading ? palette.secondary : palette.primary,
            color: palette.panel,
            fontSize: '14px',
            fontWeight: 700,
            cursor: uploadDisabled || uploading ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease',
            boxShadow:
              uploadDisabled || uploading
                ? 'none'
                : '0 10px 30px rgba(37,99,235,0.15)',
          }}
          onMouseEnter={e => {
            if (uploadDisabled || uploading) return;
            e.currentTarget.style.backgroundColor = palette.primaryDark;
          }}
          onMouseLeave={e => {
            if (uploadDisabled || uploading) return;
            e.currentTarget.style.backgroundColor = palette.primary;
          }}
        >
          {uploading
            ? '업로드 중...'
            : uploadStage === 'select'
            ? '미리보기'
            : '확인 후 업로드'}
        </button>
      </div>
    </div>
  );
}
