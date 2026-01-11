'use client';

import { Edit2, Trash2, Save } from 'lucide-react';
import styles from '../DetailModal.module.css';
import { SectionTitle } from '../../../components/ui';
import { formatTags } from '../../../utils/formatters';
import type { BeneficiarySummary } from '../../../types/models';
import type { BeneficiaryDetail } from '../DetailModal';

// Form data type for editing
export type BasicInfoFormData = {
    name: string;
    phoneNumber: string;
    birthDate: string;
    address: string;
    emergencyContact: string;
    gender: string;
    wardType: string;
    diseases: string;
    medication: string;
    notes: string;
};

interface BasicInfoTabProps {
    beneficiary: BeneficiarySummary;
    detail: BeneficiaryDetail;
    isEditing: boolean;
    form: BasicInfoFormData;
    onChange: (field: keyof BasicInfoFormData, value: string) => void;
    managerName: string;
    onEditToggle: () => void;
    onDelete: () => void;
    onSave: () => void;
    isSaving?: boolean;
}

export default function BasicInfoTab({
    beneficiary,
    detail,
    isEditing,
    form,
    onChange,
    managerName,
    onEditToggle,
    onDelete,
    onSave,
    isSaving = false,
}: BasicInfoTabProps) {
    const displayName = detail.name ?? beneficiary.name;
    const displayGender = detail.gender ?? beneficiary.gender;
    const displayAge = detail.birthDate
        ? calculateAgeFromBirthDate(detail.birthDate)
        : beneficiary.age;
    const displayGenderShort =
        displayGender === 'male' || displayGender === 'm'
            ? '남'
            : displayGender === 'female' || displayGender === 'f'
                ? '여'
                : '-';
    const displayAddress = detail.address ?? beneficiary.address ?? null;

    const status = beneficiary.status;
    const isWarning = status === 'WARNING';

    return (
        <>
            {/* Profile Section */}
            <section className={styles.profileSection}>
                <div className={styles.profileLeft}>
                    <div
                        className={`${styles.profileAvatar} ${isWarning ? styles.avatarWarning : styles.avatarDefault}`}
                        aria-hidden="true"
                    >
                        {displayName ? displayName.charAt(0) : '?'}
                    </div>
                </div>
                <div className={styles.profileRight}>
                    <div className={styles.profileNameRow}>
                        <span className={styles.profileName}>{displayName}</span>
                        <span className={styles.profileMeta}>
                            ({displayAge ?? '-'}세 /{' '}
                            {isEditing ? (
                                <select
                                    className={styles.genderSelect}
                                    value={form.gender}
                                    onChange={e => onChange('gender', e.target.value)}
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
                    </div>
                    {/* Manager Row */}
                    <div className={styles.profileManagerRow}>
                        <span className={styles.profileManagerLabel}>담당자</span>
                        <select
                            className={styles.profileManagerSelect}
                            value={managerName}
                            disabled={!isEditing}
                            onChange={(e) => {
                                // TODO: API 연동 시 매니저 변경 로직 구현
                                console.log('매니저 변경:', e.target.value);
                            }}
                        >
                            <option value={managerName}>{managerName}</option>
                            {/* TODO: 직원 목록 API 연동 시 실제 담당자 리스트로 교체 */}
                        </select>
                    </div>
                </div>
                {/* Action Buttons - positioned top-right via CSS */}
                <div className={styles.profileActions}>
                    {isEditing && (
                        <button
                            type="button"
                            className={`${styles.profileActionButton} ${styles.saveButton}`}
                            onClick={onSave}
                            disabled={isSaving}
                            aria-label="저장하기"
                        >
                            <Save size={16} />
                            <span>{isSaving ? '저장 중...' : '저장'}</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className={`${styles.profileActionButton} ${isEditing ? styles.editActive : ''}`}
                        onClick={onEditToggle}
                        disabled={isSaving}
                        aria-label={isEditing ? '편집 취소' : '정보 수정'}
                    >
                        <Edit2 size={16} />
                        <span>{isEditing ? '취소' : '수정'}</span>
                    </button>
                    {!isEditing && (
                        <button
                            type="button"
                            className={`${styles.profileActionButton} ${styles.deleteButton}`}
                            onClick={onDelete}
                            disabled={isSaving}
                            aria-label="대상자 삭제"
                        >
                            <Trash2 size={16} />
                            <span>삭제</span>
                        </button>
                    )}
                </div>
            </section>

            {/* Basic Info Section */}
            <section className={styles.section}>
                <div className={styles.basicCard}>
                    <div className={styles.cardHeader}>
                        <SectionTitle>기본 정보</SectionTitle>
                    </div>
                    <div className={styles.basicGrid}>
                        <div className={styles.editField}>
                            <span className={styles.editLabel}>전화번호 *</span>
                            <input
                                className={styles.editInput}
                                value={isEditing ? form.phoneNumber : detail.phoneNumber ?? ''}
                                readOnly={!isEditing}
                                onChange={
                                    isEditing
                                        ? e => onChange('phoneNumber', e.target.value)
                                        : undefined
                                }
                                placeholder={isEditing ? '' : '-'}
                            />
                        </div>
                        <div className={styles.editField}>
                            <span className={styles.editLabel}>생년월일 *</span>
                            <input
                                type="date"
                                className={styles.editInput}
                                value={isEditing ? form.birthDate : detail.birthDate ?? ''}
                                readOnly={!isEditing}
                                onChange={
                                    isEditing
                                        ? e => onChange('birthDate', e.target.value)
                                        : undefined
                                }
                            />
                        </div>
                        <div className={styles.editField}>
                            <span className={styles.editLabel}>카카오톡 ID</span>
                            <input
                                className={styles.editInput}
                                value={detail.email ?? ''}
                                readOnly
                                placeholder="-"
                            />
                        </div>
                        <div className={`${styles.editField} ${styles.spanTwo}`}>
                            <span className={styles.editLabel}>주소 *</span>
                            <input
                                className={styles.editInput}
                                value={isEditing ? form.address : displayAddress ?? ''}
                                readOnly={!isEditing}
                                onChange={
                                    isEditing
                                        ? e => onChange('address', e.target.value)
                                        : undefined
                                }
                            />
                        </div>
                        <div className={styles.editField}>
                            <span className={styles.editLabel}>비상연락처</span>
                            <input
                                className={styles.editInput}
                                value={isEditing ? form.emergencyContact : detail.emergencyContact ?? ''}
                                readOnly={!isEditing}
                                onChange={
                                    isEditing
                                        ? e => onChange('emergencyContact', e.target.value)
                                        : undefined
                                }
                                placeholder={isEditing ? '010-0000-0000' : '-'}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Health Info Section */}
            <section className={styles.healthLogSection}>
                <div className={styles.healthColumn}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <SectionTitle>건강 정보</SectionTitle>
                        </div>
                        <div className={styles.healthGrid}>
                            <div className={styles.editField}>
                                <span className={styles.editLabel}>기저질환</span>
                                <textarea
                                    className={styles.editInputTwoLine}
                                    value={isEditing ? form.diseases : formatTags(detail.diseases)}
                                    readOnly={!isEditing}
                                    onChange={
                                        isEditing
                                            ? e => onChange('diseases', e.target.value)
                                            : undefined
                                    }
                                    placeholder={isEditing ? '예: 고혈압, 당뇨' : ''}
                                />
                            </div>
                            <div className={styles.editField}>
                                <span className={styles.editLabel}>복약 정보</span>
                                <textarea
                                    className={styles.editInputTwoLine}
                                    value={isEditing ? form.medication : formatTags(detail.medication)}
                                    readOnly={!isEditing}
                                    onChange={
                                        isEditing
                                            ? e => onChange('medication', e.target.value)
                                            : undefined
                                    }
                                    placeholder={isEditing ? '예: 위장약, 혈압약' : ''}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.logsColumn}>
                    <div className={styles.logsCard}>
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
                                        ? e => onChange('notes', e.target.value)
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

// Helper function
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
