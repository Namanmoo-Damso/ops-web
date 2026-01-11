'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './DetailModal.module.css';
import { formatTags } from '../../utils/formatters';
import { Button } from '../../components/ui';
import type { BeneficiarySummary } from '../../types/models';
import TabNavigation, { type TabType } from './tabs/TabNavigation';
import BasicInfoTab, { type BasicInfoFormData } from './tabs/BasicInfoTab';
import UsageInfoTab from './tabs/UsageInfoTab';

export type BeneficiaryLog = {
  id: string | number;
  date: string;
  type: string;
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
};

export type BeneficiaryDetail = {
  name: string; // Required field
  email: string | null;
  phoneNumber: string | null;
  birthDate: string | null;
  address: string | null;
  gender: string | null;
  type: string | null;
  emergencyContact: string | null;
  diseases: string[]; // Always an array, never null
  medication: string | null;
  notes: string | null;
  recentLogs: BeneficiaryLog[]; // Always an array, never null
};

export type BeneficiaryUpdatePayload = {
  name: string;
  phoneNumber: string;
  birthDate: string | null;
  address: string | null;
  gender: string | null;
  wardType: string | null;
  emergencyContact: string | null;
  diseases: string[];
  medication: string | null;
  notes: string | null;
};

// Form data type now imported from BasicInfoTab
type BeneficiaryFormData = BasicInfoFormData;

// Re-export for backward compatibility
export type { BeneficiarySummary } from '../../types/models';

type DetailModalProps = {
  beneficiary: BeneficiarySummary | undefined;
  detail: BeneficiaryDetail;
  onClose: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  deleteError?: string | null;
  onUpdate?: (payload: BeneficiaryUpdatePayload) => Promise<BeneficiaryDetail | null>;
  initialEditMode?: boolean;
};

export default function DetailModal({
  beneficiary,
  detail,
  onClose,
  onDelete,
  deleting = false,
  deleteError = null,
  onUpdate,
  initialEditMode = false,
}: DetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const confirmPrimaryRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState<BeneficiaryFormData>({
    name: '',
    phoneNumber: '',
    birthDate: '',
    address: '',
    emergencyContact: '',
    gender: '',
    wardType: '',
    diseases: '',
    medication: '',
    notes: '',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const diseaseText = detail.diseases.join(', ');
  const defaultForm = useMemo(
    () => ({
      name: detail.name ?? beneficiary?.name ?? '',
      phoneNumber: detail.phoneNumber ?? '',
      birthDate: detail.birthDate ?? '',
      address: detail.address ?? beneficiary?.address ?? '',
      emergencyContact: detail.emergencyContact ?? '',
      gender: detail.gender ?? beneficiary?.gender ?? '',
      wardType: detail.type ?? beneficiary?.type ?? '',
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
      detail.emergencyContact,
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

  const handleCloseRequest = useCallback(() => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
    } else {
      onClose();
    }
  }, [onClose, showDeleteConfirm]);

  // ESC로 닫기 + 포커스 트랩
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleCloseRequest();
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
  }, [handleCloseRequest, showDeleteConfirm]);

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
      handleCloseRequest();
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
  const headerClassName = `${styles.header} ${isWarning ? styles.headerWarning : ''
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
    setIsEditing(true);
    setIsDirty(false);
  };

  const handleEditCancel = () => {
    setForm(defaultForm);
    setIsEditing(false);
    setIsDirty(false);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleFieldChange = (field: keyof BeneficiaryFormData, value: string) => {
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
        emergencyContact: form.emergencyContact.trim() || null,
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
        {/* Tab Navigation replaces old header */}
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={onClose}
        />

        {/* Tab Content */}
        <div className={styles.body}>
          {activeTab === 'basic' && (
            <BasicInfoTab
              beneficiary={beneficiary}
              detail={detail}
              isEditing={isEditing}
              form={form}
              onChange={handleFieldChange}
              managerName={managerName}
              onEditToggle={isEditing ? handleEditCancel : handleEditStart}
              onDelete={handleDeleteClick}
              onSave={handleSave}
              isSaving={saveLoading}
            />
          )}

          {activeTab === 'usage' && (
            <UsageInfoTab
              beneficiaryId={beneficiary.id}
              beneficiaryName={beneficiary.name}
            />
          )}

          {activeTab === 'logs' && (
            <div className={styles.tabContent} style={{ textAlign: 'center', color: 'var(--beneficiary-muted)', padding: '48px' }}>
              <p>담소일지 탭 준비 중...</p>
            </div>
          )}
        </div>
      </div >

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
              <Button
                type="button"
                variant="secondary"
                className={styles.confirmCancel}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="danger"
                className={styles.confirmDelete}
                onClick={handleDeleteConfirm}
                disabled={deleting}
                loading={deleting}
              >
                {deleting ? '삭제 중...' : '삭제하기'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// 헬퍼 함수 추가
function getSentimentClassName(sentiment: string): string {
  const capitalized = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  return styles[`sentiment${capitalized}`] || '';
}

function getSentimentLabel(sentiment: string): string {
  const labels: Record<string, string> = {
    positive: '긍정',
    negative: '부정',
    neutral: '중립',
  };
  return labels[sentiment] || '알 수 없음';
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
  a: BeneficiaryFormData,
  b: BeneficiaryFormData,
) {
  return (
    a.name === b.name &&
    a.phoneNumber === b.phoneNumber &&
    a.birthDate === b.birthDate &&
    a.address === b.address &&
    a.emergencyContact === b.emergencyContact &&
    a.gender === b.gender &&
    a.wardType === b.wardType &&
    a.diseases === b.diseases &&
    a.medication === b.medication &&
    a.notes === b.notes
  );
}

function validateForm(form: BeneficiaryFormData) {
  if (!form.name.trim()) {
    return '이름은 필수입니다.';
  }
  if (!form.phoneNumber.trim()) {
    return '전화번호는 필수입니다.';
  }
  if (!form.birthDate.trim()) {
    return '생년월일은 필수입니다.';
  }
  if (!form.address.trim()) {
    return '주소는 필수입니다.';
  }
  return null;
}
