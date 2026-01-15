'use client';

import { useRef, useState, useMemo } from 'react';
import { palette, shadows } from '../app/theme';
import {
  SharedInput,
  SharedSelect,
  SharedTextArea,
  SharedButton,
} from './RegistrationShared';

export type ManualWardPayload = {
  name: string;
  email: string;
  phone_number: string;
  birth_date?: string;
  address?: string;
  gender?: string;
  diseases?: string;
  medication?: string;
  emergency_contact?: string;
  notes?: string;
};

type FieldKey =
  | 'name'
  | 'email'
  | 'phone_number'
  | 'birth_date'
  | 'address'
  | 'gender'
  | 'diseases'
  | 'medication'
  | 'emergency_contact'
  | 'notes';

type ManualWardFormProps = {
  onSubmit: (payload: ManualWardPayload) => Promise<void> | void;
  onCancel: () => void;
  loading: boolean;
};

export default function ManualWardForm({
  onSubmit,
  onCancel,
  loading,
}: ManualWardFormProps) {
  const formatPhoneNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 15);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    birth_date: '',
    address: '',
    gender: '',
    diseases: '',
    medication: '',
    emergency_contact: '',
    notes: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<FieldKey | 'global', string>>
  >({});

  const allowManualSubmit =
    manualForm.name.trim().length > 0 &&
    (manualForm.email.trim().length > 0 ||
      manualForm.phone_number.trim().length > 0);

  const fieldErrors = useMemo(
    () => ({
      name: errors.name,
      email: errors.email,
      phone_number: errors.phone_number,
      birth_date: errors.birth_date,
      address: errors.address,
      gender: errors.gender,
      diseases: errors.diseases,
      medication: errors.medication,
      emergency_contact: errors.emergency_contact,
      notes: errors.notes,
    }),
    [errors],
  );

  const validate = () => {
    const nextErrors: Partial<Record<FieldKey | 'global', string>> = {};
    const name = manualForm.name.trim();
    const email = manualForm.email.trim();
    const phone = manualForm.phone_number.trim();
    const birth = manualForm.birth_date.trim();

    if (!name) {
      nextErrors.name = '이름을 입력해주세요.';
    }

    if (!email && !phone) {
      nextErrors.email = '이메일 또는 전화번호 중 하나는 필수입니다.';
      nextErrors.phone_number = '이메일 또는 전화번호 중 하나는 필수입니다.';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = '이메일 형식이 올바르지 않습니다.';
    }

    if (phone) {
      const normalized = phone.replace(/-/g, '');
      if (
        normalized.length < 7 ||
        normalized.length > 15 ||
        !/^[\d-]+$/.test(phone)
      ) {
        nextErrors.phone_number = '전화번호는 숫자/하이픈 7~15자리여야 합니다.';
      }
    }

    if (birth) {
      const date = new Date(birth);
      if (Number.isNaN(date.getTime())) {
        nextErrors.birth_date =
          '생년월일 형식을 확인해주세요. (예: 1990-01-01)';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!allowManualSubmit) {
      setErrors(prev => ({
        ...prev,
        global: '이름과 이메일/전화번호를 입력해주세요.',
      }));
      return;
    }

    if (!validate()) return;

    const payload: ManualWardPayload = {
      name: manualForm.name.trim(),
      email: manualForm.email.trim(),
      phone_number: manualForm.phone_number.trim(),
      birth_date: manualForm.birth_date.trim() || undefined,
      address: manualForm.address.trim() || undefined,
      gender: manualForm.gender || undefined,
      diseases: manualForm.diseases.trim() || undefined,
      medication: manualForm.medication.trim() || undefined,
      emergency_contact: manualForm.emergency_contact.trim() || undefined,
      notes: manualForm.notes.trim() || undefined,
    };

    try {
      await onSubmit(payload);
      setErrors({});
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        global: (error as Error).message || '등록에 실패했습니다. 다시 시도해주세요.',
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      {/* Form Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>

        {/* Row 1: 50/50 Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <SharedInput
            label="이름"
            value={manualForm.name}
            onChange={e => setManualForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="홍길동"
            error={!!fieldErrors.name}
            requiredMark
          />
          <SharedSelect
            label="성별"
            value={manualForm.gender}
            onChange={e => setManualForm(prev => ({ ...prev, gender: e.target.value }))}
            error={!!fieldErrors.gender}
            requiredMark
            options={[
              { value: '', label: '선택 안함' },
              { value: 'male', label: '남성' },
              { value: 'female', label: '여성' },
            ]}
          />
        </div>

        {/* Row 2: 50/50 Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <SharedInput
            label="전화번호"
            value={manualForm.phone_number}
            onChange={e => setManualForm(prev => ({ ...prev, phone_number: formatPhoneNumber(e.target.value) }))}
            placeholder="010-1234-5678"
            error={!!fieldErrors.phone_number}
            requiredMark
          />
          <SharedInput
            label="생년월일"
            type="date"
            value={manualForm.birth_date}
            onChange={e => setManualForm(prev => ({ ...prev, birth_date: e.target.value }))}
            error={!!fieldErrors.birth_date}
            requiredMark
          />
        </div>

        {/* Full Width Fields */}
        <SharedInput
          label="이메일"
          value={manualForm.email}
          onChange={e => setManualForm(prev => ({ ...prev, email: e.target.value }))}
          placeholder="user@example.com"
          error={!!fieldErrors.email}
          requiredMark
        />

        <SharedInput
          label="주소"
          value={manualForm.address}
          onChange={e => setManualForm(prev => ({ ...prev, address: e.target.value }))}
          placeholder="서울특별시 ..."
        />

        <SharedInput
          label="기저질환"
          value={manualForm.diseases}
          onChange={e => setManualForm(prev => ({ ...prev, diseases: e.target.value }))}
          placeholder="고혈압, 당뇨 등"
        />

        <SharedInput
          label="복약정보"
          value={manualForm.medication}
          onChange={e => setManualForm(prev => ({ ...prev, medication: e.target.value }))}
          placeholder="혈압약, 당뇨약 등"
        />

        <SharedInput
          label="비상 연락처"
          value={manualForm.emergency_contact}
          onChange={e => setManualForm(prev => ({ ...prev, emergency_contact: formatPhoneNumber(e.target.value) }))}
          placeholder="010-5678-1234"
        />

        <SharedTextArea
          label="비고"
          value={manualForm.notes}
          onChange={e => setManualForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="참고사항을 입력해주세요"
          rows={3}
        />
      </div>

      {errors.global && (
        <div
          style={{
            backgroundColor: palette.dangerSoft || '#fff1f2',
            color: '#f97316',
            border: '1px solid #fecdd3',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '14px',
          }}
        >
          {errors.global}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <SharedButton
          onClick={handleSubmit}
          disabled={loading}
          fullWidth
          fontSize="20px"
        >
          {loading ? '등록 중...' : '등록하기'}
        </SharedButton>
      </div>
    </div>
  );
}
