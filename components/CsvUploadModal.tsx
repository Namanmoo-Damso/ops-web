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

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M12 16v-4M12 8h.01"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 200ms ease',
    }}
  >
    <path
      d="M6 9l6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function CsvFormatGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const columns = [
    { name: '이름', required: true, example: '홍길동' },
    { name: '이메일', required: true, example: 'hong@example.com' },
    { name: '전화번호', required: true, example: '010-1234-5678' },
    { name: '생년월일', required: false, example: '1945-03-15' },
    { name: '주소', required: false, example: '서울시 강남구' },
    { name: '성별', required: false, example: 'male / female' },
    { name: '기저질환', required: false, example: '고혈압, 당뇨' },
    { name: '복약정보', required: false, example: '혈압약, 당뇨약' },
    { name: '비상 연락처', required: false, example: '홍길순 010-5678-1234' },
    { name: '비고', required: false, example: '오전 통화 선호' },
  ];

  return (
    <div
      style={{
        marginBottom: '12px',
        border: `1px solid ${palette.border}`,
        borderRadius: '12px',
        backgroundColor: palette.background,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          width: '100%',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: palette.primaryDark,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: palette.primary }}>
            <IconInfo />
          </span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>
            CSV 형식 가이드
          </span>
        </div>
        <IconChevron open={isOpen} />
      </button>

      {isOpen && (
        <div
          style={{
            padding: '0 14px 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Download Button */}
          <a
            href="/templates/ward_upload_template.csv"
            download="ward_upload_template.csv"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: palette.primary,
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              width: 'fit-content',
            }}
          >
            <IconDownload />
            템플릿 CSV 다운로드
          </a>

          {/* Column Table */}
          <div
            style={{
              borderRadius: '8px',
              border: `1px solid ${palette.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.6fr 1.2fr',
                padding: '10px 14px',
                backgroundColor: palette.soft,
                fontSize: '16px',
                fontWeight: 700,
                color: palette.primaryDark,
              }}
            >
              <span>항목</span>
              <span>필수</span>
              <span>예시</span>
            </div>
            {columns.map((col, idx) => (
              <div
                key={col.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.6fr 1.2fr',
                  padding: '10px 14px',
                  fontSize: '16px',
                  color: palette.primaryDark,
                  borderTop: idx === 0 ? 'none' : `1px solid ${palette.border}`,
                  backgroundColor:
                    idx % 2 === 0 ? palette.panel : palette.background,
                }}
              >
                <span style={{ fontWeight: 600 }}>{col.name}</span>
                <span
                  style={{
                    color: col.required ? palette.danger : palette.textMuted,
                  }}
                >
                  {col.required ? '필수' : '선택'}
                </span>
                <span style={{ color: palette.textMuted }}>{col.example}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: '16px', color: palette.textMuted }}>
            💡 헤더는 한글/영어 모두 인식됩니다.
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [kakaoEditOpen, setKakaoEditOpen] = useState(false);
  const [modeLocked, setModeLocked] = useState(false);
  const [kakaoMessage, setKakaoMessage] = useState(
    [
      '안녕하세요, 00기관에서 연락드립니다.',
      '예전에 돌봄을 도와드렸던 기관에서 소식을 전해드립니다.',
      '아래 링크로 앱을 설치하시면 AI 얼굴 통화를 받을 수 있어요.',
      '담소 앱 다운로드: damso://invite',
      '궁금한 점은 기관으로 문의해주세요.',
    ].join('\n'),
  );
  const [showGuide, setShowGuide] = useState(true);

  if (!open) return null;

  const handleClose = () => {
    if (uploading) return;
    setMode('upload');
    setStep('form');
    setPendingCsv(null);
    setPendingManual(null);
    setKakaoHint(null);
    setKakaoEditOpen(false);
    setModeLocked(false);
    onClose();
  };

  const handleCsvConfirm = async (file: File, rows: CleanRow[]) => {
    setPendingCsv({ file, rows });
    setPendingManual(null);
    setKakaoHint(null);
    setKakaoEditOpen(false);
    setModeLocked(true);
    setStep('kakao');
  };

  const handleManualSubmit = async (payload: ManualWardPayload) => {
    setPendingManual(payload);
    setPendingCsv(null);
    setKakaoHint(null);
    setKakaoEditOpen(false);
    setModeLocked(true);
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
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        zIndex: 10000,
        padding: '16px',
      }}
      onClick={handleClose}
    >
      {/* Main Registration Modal */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '16px',
          backgroundColor: palette.panel,
          boxShadow: shadows.deep,
          padding: '20px',
          border: `1px solid ${palette.border}`,
          height: 'min(680px, 85vh)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
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
              fontSize: '20px',
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

        {step === 'form' && (
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
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${isActive ? palette.primary : palette.border}`,
                    backgroundColor: isActive ? palette.soft : palette.panel,
                    color: isActive ? palette.primaryDark : palette.textMuted,
                    fontSize: '16px',
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
        )}

        <div style={{ display: step === 'form' ? 'block' : 'none' }}>
          {mode === 'upload' ? (
            <CsvUploadPanel
              onConfirm={handleCsvConfirm}
              onCancel={handleClose}
              uploading={uploading}
              uploadProgress={uploadProgress}
            />
          ) : (
            <ManualWardForm
              onSubmit={handleManualSubmit}
              onCancel={handleClose}
            />
          )}
        </div>

        {step === 'kakao' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
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
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: palette.primaryDark,
                }}
              >
                카카오 알림톡 초대장
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: palette.textMuted,
                  lineHeight: 1.5,
                }}
              >
                {mode === 'upload'
                  ? `CSV 이메일 기준으로 ${pendingCsv?.rows.length ?? 0}명에게 초대장을 보낼 수 있습니다.`
                  : `입력한 이메일/전화번호로 초대장을 보낼 수 있습니다.`}
              </div>
            </div>

            <div
              style={{
                borderRadius: '14px',
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.panel,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: palette.primaryDark,
                  }}
                >
                  메시지 미리보기
                </div>
                <button
                  onClick={() => setKakaoEditOpen(prev => !prev)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: kakaoEditOpen
                      ? palette.primary
                      : palette.background,
                    color: kakaoEditOpen ? palette.panel : palette.primaryDark,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = kakaoEditOpen
                      ? palette.primaryDark
                      : palette.soft;
                    e.currentTarget.style.color = kakaoEditOpen
                      ? palette.panel
                      : palette.primaryDark;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = kakaoEditOpen
                      ? palette.primary
                      : palette.background;
                    e.currentTarget.style.color = kakaoEditOpen
                      ? palette.panel
                      : palette.primaryDark;
                  }}
                >
                  {kakaoEditOpen ? '수정완료' : '수정하기'}
                </button>
              </div>
              {kakaoEditOpen ? (
                <textarea
                  value={kakaoMessage}
                  onChange={e => setKakaoMessage(e.target.value)}
                  rows={10}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: '#fff7c2',
                    fontSize: '13px',
                    color: palette.primaryDark,
                    lineHeight: 1.7,
                  }}
                />
              ) : (
                <div
                  style={{
                    borderRadius: '12px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.background,
                    padding: '18px',
                    fontSize: '13px',
                    color: '#1f2937',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    minHeight: '200px',
                  }}
                >
                  {kakaoMessage}
                </div>
              )}
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
                border: 'none',
                backgroundColor: '#FFE81D',
                color: palette.primaryDark,
                fontSize: '14px',
                fontWeight: 700,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                if (uploading) return;
                e.currentTarget.style.backgroundColor = '#f5de0f';
              }}
              onMouseLeave={e => {
                if (uploading) return;
                e.currentTarget.style.backgroundColor = '#FFE81D';
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
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
                    uploading || !hasPending
                      ? palette.secondary
                      : palette.primary,
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

      {/* Side Reference Guide Panel */}
      {showGuide && step === 'form' && (
        <div
          style={{
            width: '100%',
            maxWidth: '340px',
            borderRadius: '16px',
            backgroundColor: palette.panel,
            boxShadow: shadows.deep,
            padding: '20px',
            border: `1px solid ${palette.border}`,
            height: 'min(680px, 85vh)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: palette.primaryDark,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: palette.primary }}>
                <IconInfo />
              </span>
              입력 항목 가이드
            </h4>
            <button
              onClick={() => setShowGuide(false)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                display: 'grid',
                placeItems: 'center',
                color: palette.textSoft,
                cursor: 'pointer',
              }}
            >
              <IconClose />
            </button>
          </div>

          {/* Download Button */}
          <a
            href="/templates/ward_upload_template.csv"
            download="ward_upload_template.csv"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: palette.primary,
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: '16px',
            }}
          >
            <IconDownload />
            템플릿 CSV 다운로드
          </a>

          {/* Column Table */}
          <div
            style={{
              borderRadius: '8px',
              border: `1px solid ${palette.border}`,
              overflow: 'hidden',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr',
                padding: '12px 14px',
                backgroundColor: palette.soft,
                fontSize: '16px',
                fontWeight: 700,
                color: palette.primaryDark,
              }}
            >
              <span>항목</span>
              <span>예시</span>
            </div>
            {[
              { name: '이름', example: '홍길동' },
              { name: '성별', example: '남 / 여' },
              { name: '생년월일', example: '1945-03-15' },
              { name: '전화번호', example: '010-1234-5678' },
              { name: '이메일', example: 'hong@example.com' },
              { name: '기저질환', example: '고혈압, 당뇨' },
              { name: '복약정보', example: '혈압약, 항생제' },
              { name: '비상 연락처', example: '010-5678-1234' },
              { name: '비고', example: '기타 참고사항' },
            ].map((col, idx) => (
              <div
                key={col.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.5fr',
                  padding: '10px 14px',
                  fontSize: '16px',
                  color: palette.primaryDark,
                  borderTop: idx === 0 ? 'none' : `1px solid ${palette.border}`,
                  backgroundColor:
                    idx % 2 === 0 ? palette.panel : palette.background,
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {col.name}
                  {idx < 5 && (
                    <span style={{ color: '#f97316', marginLeft: '4px' }}>
                      *
                    </span>
                  )}
                </span>
                <span style={{ color: palette.textMuted, fontSize: '16px' }}>
                  {col.example}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
