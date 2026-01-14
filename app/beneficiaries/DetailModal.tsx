'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './DetailModal.module.css';
import { formatTags } from '../../utils/formatters';

export type BeneficiaryLog = {
  id: string | number;
  date: string;
  type: string;
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
};

export type BeneficiaryDetail = {
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  birthDate: string | null;
  address: string | null;
  gender: string | null;
  type: string | null;
  guardian: string | null;
  diseases: string[];
  medication: string | null;
  notes: string | null;
  recentLogs: BeneficiaryLog[];
};

export type BeneficiaryUpdatePayload = {
  name: string;
  phoneNumber: string;
  birthDate: string | null;
  address: string | null;
  gender: string | null;
  wardType: string | null;
  guardian: string | null;
  diseases: string[];
  medication: string | null;
  notes: string | null;
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
  onDelete?: () => void;
  deleting?: boolean;
  deleteError?: string | null;
  onUpdate?: (payload: BeneficiaryUpdatePayload) => Promise<BeneficiaryDetail | null>;
};

export default function DetailModal({
  beneficiary,
  detail,
  onClose,
  onDelete,
  deleting = false,
  deleteError = null,
  onUpdate,
}: DetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const confirmPrimaryRef = useRef<HTMLButtonElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    birthDate: '',
    address: '',
    gender: '',
    wardType: '',
    guardian: '',
    diseases: '',
    medication: '',
    notes: '',
  });
  const [guardianForm, setGuardianForm] = useState({
    name: '',
    relation: '',
    contact: '',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const diseaseText = detail.diseases.join(', ');
  const defaultGuardianForm = useMemo(
    () => ({
      name: '',
      relation: '',
      contact: '',
    }),
    [],
  );
  const defaultForm = useMemo(
    () => ({
      name: detail.name ?? beneficiary?.name ?? '',
      phoneNumber: detail.phoneNumber ?? '',
      birthDate: detail.birthDate ?? '',
      address: detail.address ?? beneficiary?.address ?? '',
      gender: detail.gender ?? beneficiary?.gender ?? '',
      wardType: detail.type ?? beneficiary?.type ?? '',
      guardian: detail.guardian ?? '',
      diseases: diseaseText,
      medication: detail.medication ?? '',
      notes: detail.notes ?? '',
    }),
    [
      beneficiary?.address,
      beneficiary?.gender,
      beneficiary?.name,
      beneficiary?.type,
      detail.address,
      detail.birthDate,
      diseaseText,
      detail.gender,
      detail.guardian,
      detail.medication,
      detail.name,
      detail.notes,
      detail.phoneNumber,
      detail.type,
    ],
  );
  const managerName = useMemo(() => {
    if (typeof window === 'undefined') return '관리자';
    const raw = localStorage.getItem('admin_info');
    if (!raw) return '관리자';
    try {
      const parsed = JSON.parse(raw);
      return parsed?.name ?? '관리자';
    } catch {
      return '관리자';
    }
  }, []);

  // ESC로 닫기 + 포커스 트랩
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
        return;
      }
      if (e.key === 'Tab') {
        const root = showDeleteConfirm
          ? confirmDialogRef.current
          : dialogRef.current;
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

    const root = showDeleteConfirm
      ? confirmDialogRef.current
      : dialogRef.current;
    if (root) root.focus();

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose, showDeleteConfirm]);

  useEffect(() => {
    if (!isEditing) {
      setIsDirty(false);
      setSaveError(null);
      setSaveSuccess(null);
    }
  }, [isEditing]);

  useEffect(() => {
    if (showDeleteConfirm) {
      confirmPrimaryRef.current?.focus();
    }
  }, [showDeleteConfirm]);

  useEffect(() => {
    if (isEditing && !isDirty) {
      setForm(prev => (isFormEqual(prev, defaultForm) ? prev : defaultForm));
    }
  }, [defaultForm, isDirty, isEditing]);

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

  const displayName = detail.name ?? beneficiary.name;
  const displayGender = detail.gender ?? beneficiary.gender;
  const displayAddress = detail.address ?? beneficiary.address ?? null;
  const displayAge = detail.birthDate
    ? calculateAgeFromBirthDate(detail.birthDate)
    : beneficiary.age;
  const displayGenderShort =
    displayGender === 'male' || displayGender === 'm'
      ? '남'
      : displayGender === 'female' || displayGender === 'f'
      ? '여'
      : '-';

  const handleEditStart = () => {
    setForm(defaultForm);
    setGuardianForm(defaultGuardianForm);
    setIsEditing(true);
    setIsDirty(false);
  };

  const handleEditCancel = () => {
    setForm(defaultForm);
    setGuardianForm(defaultGuardianForm);
    setIsEditing(false);
    setIsDirty(false);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setIsDirty(true);
    setSaveError(null);
    setSaveSuccess(null);
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setSaveError(null);
    setSaveSuccess(null);
    const validationMessage = validateForm(form);
    if (validationMessage) {
      setSaveError(validationMessage);
      return;
    }

    setSaveLoading(true);
    try {
      const diseases = form.diseases
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const payload: BeneficiaryUpdatePayload = {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        birthDate: form.birthDate || null,
        address: form.address.trim() || null,
        gender: form.gender || null,
        wardType: form.wardType.trim() || null,
        guardian: form.guardian.trim() || null,
        diseases,
        medication: form.medication.trim() || null,
        notes: form.notes.trim() || null,
      };

      const updated = await onUpdate(payload);
      if (!updated) return;

      setSaveSuccess('대상자 정보가 업데이트되었습니다.');
      setIsEditing(false);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to update beneficiary detail.', error);
      setSaveError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

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
              {displayName ? displayName.charAt(0) : '?'}
            </div>
            <div className={styles.titleBlock}>
              <div className={styles.titleRow}>
                <div className={styles.name}>{displayName}</div>
                <span className={styles.age}>
                  ({displayAge ?? '-'}세 /{' '}
                  {isEditing ? (
                    <select
                      className={styles.genderSelect}
                      value={form.gender}
                      onChange={e => handleFieldChange('gender', e.target.value)}
                    >
                      <option value="">-</option>
                      <option value="male">남</option>
                      <option value="female">여</option>
                      <option value="other">기타</option>
                    </select>
                  ) : (
                    displayGenderShort
                  )}
                  )
                </span>
                <span className={`${styles.tag} ${statusTagClass}`}>
                  ●{' '}
                  {status === 'WARNING'
                    ? '케어 필요'
                    : status === 'CAUTION'
                    ? '주의 필요'
                    : '안정적'}
                </span>
              </div>
            </div>
          </div>

            <div className={styles.actions}>
              <div className={styles.managerToggle}>
                <span className={styles.managerLabel}>담당자</span>
                <select
                  className={styles.managerSelect}
                  value={managerName}
                  disabled={!isEditing}
                >
                  <option value={managerName}>{managerName}</option>
                </select>
                {/* TODO: 직원 목록 API 연동 시 실제 담당자 리스트로 교체 */}
              </div>
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
          <section className={styles.section}>
            <div className={styles.basicCard}>
              <div className={styles.cardHeader}>
                <SectionTitle>기본 정보</SectionTitle>
              </div>
              <div className={styles.basicGrid}>
                <div className={styles.editField}>
                  <span className={styles.editLabel}>이름 *</span>
                  <input
                    className={styles.editInput}
                    value={isEditing ? form.name : detail.name ?? beneficiary?.name ?? ''}
                    readOnly={!isEditing}
                      onChange={
                        isEditing
                          ? e => handleFieldChange('name', e.target.value)
                          : undefined
                      }
                    />
                  </div>
                <div className={styles.editField}>
                  <span className={styles.editLabel}>전화번호 *</span>
                  <input
                    className={styles.editInput}
                    value={isEditing ? form.phoneNumber : detail.phoneNumber ?? ''}
                    readOnly={!isEditing}
                      onChange={
                        isEditing
                          ? e => handleFieldChange('phoneNumber', e.target.value)
                          : undefined
                      }
                      placeholder={isEditing ? '' : '-'}
                    />
                  </div>
                <div className={styles.editField}>
                  <span className={styles.editLabel}>생년월일</span>
                  <input
                    type="date"
                    className={styles.editInput}
                    value={isEditing ? form.birthDate : detail.birthDate ?? ''}
                      readOnly={!isEditing}
                      onChange={
                        isEditing
                          ? e => handleFieldChange('birthDate', e.target.value)
                          : undefined
                      }
                    />
                  </div>
                <div className={`${styles.editField} ${styles.spanTwo}`}>
                  <span className={styles.editLabel}>주소</span>
                  <input
                    className={styles.editInput}
                    value={isEditing ? form.address : displayAddress ?? ''}
                    readOnly={!isEditing}
                      onChange={
                        isEditing
                          ? e => handleFieldChange('address', e.target.value)
                          : undefined
                      }
                    />
                  </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <SectionTitle>보호자 정보</SectionTitle>
              </div>
              <div className={styles.guardianGrid}>
                <div className={styles.editField}>
                  <span className={styles.editLabel}>보호자 성함</span>
                  <input
                    className={styles.editInput}
                    value={
                      isEditing
                        ? guardianForm.name
                        : guardianForm.name || '홍길동'
                    }
                    readOnly={!isEditing}
                    onChange={
                      isEditing
                        ? e =>
                            setGuardianForm(prev => ({
                              ...prev,
                              name: e.target.value,
                            }))
                        : undefined
                    }
                  />
                </div>
                <div className={styles.editField}>
                  <span className={styles.editLabel}>보호자 관계</span>
                  {isEditing ? (
                    <select
                      className={styles.editSelect}
                      value={guardianForm.relation}
                      onChange={e =>
                        setGuardianForm(prev => ({
                          ...prev,
                          relation: e.target.value,
                        }))
                      }
                    >
                      <option value="">없음</option>
                      <option value="자녀">자녀</option>
                      <option value="지인">지인</option>
                      <option value="기타">기타</option>
                    </select>
                  ) : (
                    <input
                      className={styles.editInput}
                      value={guardianForm.relation || '자녀'}
                      readOnly
                    />
                  )}
                </div>
                <div className={styles.editField}>
                  <span className={styles.editLabel}>보호자 연락처</span>
                  <input
                    className={styles.editInput}
                    value={
                      isEditing
                        ? guardianForm.contact
                        : guardianForm.contact || '010-1234-5678'
                    }
                    readOnly={!isEditing}
                    onChange={
                      isEditing
                        ? e =>
                            setGuardianForm(prev => ({
                              ...prev,
                              contact: e.target.value,
                            }))
                        : undefined
                    }
                  />
                </div>
              </div>
              {/* TODO: 보호자 관계/연락처 API 연동 후 저장/표시 로직 추가 */}
            </div>
          </section>

          <section className={styles.healthLogSection}>
            <div className={styles.healthColumn}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <SectionTitle>건강 정보</SectionTitle>
                </div>
                <div className={styles.healthGrid}>
                  <div className={styles.editSection}>
                    <div className={styles.editField}>
                      <span className={styles.editLabel}>기저질환</span>
                      <input
                        className={styles.editInput}
                        value={
                          isEditing ? form.diseases : formatTags(detail.diseases)
                        }
                        readOnly={!isEditing}
                        onChange={
                          isEditing
                            ? e => handleFieldChange('diseases', e.target.value)
                            : undefined
                        }
                      />
                    </div>
                    {isEditing && (
                      <div className={styles.editHelper}>
                        쉼표로 구분하여 입력하세요. (예: 고혈압, 당뇨)
                      </div>
                    )}
                  </div>
                  <div className={styles.editField}>
                    <span className={styles.editLabel}>복약 정보</span>
                    <input
                      className={styles.editInput}
                      value={
                        isEditing ? form.medication : formatTags(detail.medication)
                      }
                      readOnly={!isEditing}
                      onChange={
                        isEditing
                          ? e => handleFieldChange('medication', e.target.value)
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.logsColumn}>
              <div className={styles.logsCard}>
                <div className={styles.cardHeader}>
                  <SectionTitle>담소일지</SectionTitle>
                  <button type="button" className={styles.logMoreButton}>
                    자세히 보기 →
                  </button>
                </div>
                {detail.recentLogs.length === 0 ? (
                  <div className={styles.emptyLogs}>최근 기록이 없습니다.</div>
                ) : (
                  <div className={styles.logList}>
                    {detail.recentLogs.map(log => (
                      <div key={log.id} className={styles.logCard}>
                        <div className={styles.logTextBlock}>
                          <span className={styles.logType}>{log.type}</span>
                          <p className={styles.logContent}>{log.content}</p>
                        </div>
                        <span className={styles.logDate}>{log.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <SectionTitle>참고 및 특이사항</SectionTitle>
              </div>
              <div className={styles.noteField}>
                <textarea
                  className={styles.noteTextarea}
                  value={
                    isEditing
                      ? form.notes
                      : detail.notes || '추가 메모가 없습니다.'
                  }
                  readOnly={!isEditing}
                  onChange={
                    isEditing
                      ? e => handleFieldChange('notes', e.target.value)
                      : undefined
                  }
                />
              </div>
            </div>
          </section>

        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDeleteClick}
              disabled={!onDelete || deleting || isEditing || saveLoading}
            >
              {deleting ? '삭제 중...' : '대상자 삭제'}
            </button>
            {deleteError && <div className={styles.deleteError}>{deleteError}</div>}
          </div>
          <div className={styles.footerActions}>
            {isEditing ? (
              <div className={styles.footerEditActions}>
                <button
                  type="button"
                  className={styles.editSave}
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? '저장 중...' : '저장하기'}
                </button>
                <button
                  type="button"
                  className={styles.editCancel}
                  onClick={handleEditCancel}
                  disabled={saveLoading}
                >
                  취소
                </button>
                {saveError && <div className={styles.editError}>{saveError}</div>}
                {saveSuccess && (
                  <div className={styles.editSuccess}>{saveSuccess}</div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className={styles.editButton}
                onClick={handleEditStart}
              >
                정보 수정
              </button>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className={styles.confirmOverlay}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="beneficiary-delete-title"
            aria-describedby="beneficiary-delete-description"
            ref={confirmDialogRef}
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
            className={styles.confirmDialog}
          >
            <div className={styles.confirmTitle} id="beneficiary-delete-title">
              대상자 삭제 확인
            </div>
            <div
              className={styles.confirmDescription}
              id="beneficiary-delete-description"
            >
              삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?
            </div>
            {deleteError && (
              <div className={styles.confirmError}>{deleteError}</div>
            )}
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                취소
              </button>
              <button
                type="button"
                ref={confirmPrimaryRef}
                className={styles.confirmDelete}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <div className={styles.sectionTitle}>{children}</div>;
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

function calculateAgeFromBirthDate(value: string): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < parsed.getDate())
  ) {
    age -= 1;
  }
  return age;
}

function isFormEqual(
  a: {
    name: string;
    phoneNumber: string;
    birthDate: string;
    address: string;
    gender: string;
    wardType: string;
    guardian: string;
    diseases: string;
    medication: string;
    notes: string;
  },
  b: {
    name: string;
    phoneNumber: string;
    birthDate: string;
    address: string;
    gender: string;
    wardType: string;
    guardian: string;
    diseases: string;
    medication: string;
    notes: string;
  },
) {
  return (
    a.name === b.name &&
    a.phoneNumber === b.phoneNumber &&
    a.birthDate === b.birthDate &&
    a.address === b.address &&
    a.gender === b.gender &&
    a.wardType === b.wardType &&
    a.guardian === b.guardian &&
    a.diseases === b.diseases &&
    a.medication === b.medication &&
    a.notes === b.notes
  );
}

function validateForm(form: {
  name: string;
  phoneNumber: string;
  birthDate: string;
  address: string;
  gender: string;
  wardType: string;
  guardian: string;
  diseases: string;
  medication: string;
  notes: string;
}) {
  if (!form.name.trim()) {
    return '이름은 필수입니다.';
  }
  if (!form.phoneNumber.trim()) {
    return '전화번호는 필수입니다.';
  }
  return null;
}
