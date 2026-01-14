'use client';

import { useMemo, useState } from 'react';
import { palette } from '../app/theme';

export type ManualWardPayload = {
  name: string;
  email: string;
  phone_number: string;
  birth_date?: string;
  address?: string;
};

type FieldKey = 'name' | 'email' | 'phone_number' | 'birth_date' | 'address';

type ManualWardFormProps = {
  onSubmit: (payload: ManualWardPayload) => Promise<void> | void;
  onCancel: () => void;
};

const borderStyle = `1px solid ${palette.border}`;

export default function ManualWardForm({
  onSubmit,
  onCancel,
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
  });
  const [errors, setErrors] = useState<
    Partial<Record<FieldKey | 'global', string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const fields: Array<{
    key: FieldKey;
    label: string;
    required: boolean;
    placeholder: string;
  }> = [
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
  ];

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
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
      setErrors({});
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        global:
          (error as Error).message || '등록에 실패했습니다. 다시 시도해주세요.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {fields.map(field => (
          <div
            key={field.key}
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: palette.primaryDark,
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
              }}
            >
              <span>{field.label}</span>
              {field.required && <span style={{ color: palette.danger }}>*</span>}
            </label>
            <input
              value={manualForm[field.key as FieldKey]}
              onChange={e => {
                const value =
                  field.key === 'phone_number'
                    ? formatPhoneNumber(e.target.value)
                    : e.target.value;
                setManualForm(prev => ({
                  ...prev,
                  [field.key as FieldKey]: value,
                }));
              }}
              placeholder={field.placeholder}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: fieldErrors[field.key]
                  ? '1px solid #ef4444'
                  : borderStyle,
                backgroundColor: palette.background,
                fontSize: '14px',
                color: palette.primaryDark,
              }}
            />
            {fieldErrors[field.key] && (
              <span style={{ color: palette.danger, fontSize: '12px' }}>
                {fieldErrors[field.key]}
              </span>
            )}
          </div>
        ))}
        <div style={{ fontSize: '12px', color: palette.textMuted }}>
          이름과 이메일 또는 전화번호 중 하나는 반드시 입력해주세요.
        </div>
        {errors.global && (
          <div
            style={{
              backgroundColor: palette.dangerSoft,
              color: palette.danger,
              border: '1px solid #fecdd3',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '12px',
            }}
          >
            {errors.global}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}
      >
        <button
          onClick={onCancel}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: borderStyle,
            backgroundColor: palette.panel,
            color: palette.primaryDark,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
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
        <button
          disabled={!allowManualSubmit || submitting}
          onClick={handleSubmit}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor:
              allowManualSubmit && !submitting ? palette.primary : palette.secondary,
            color: palette.panel,
            fontSize: '14px',
            fontWeight: 700,
            cursor:
              allowManualSubmit && !submitting ? 'pointer' : 'not-allowed',
            transition: 'all 150ms ease',
            boxShadow: allowManualSubmit
              ? '0 10px 30px rgba(37,99,235,0.15)'
              : 'none',
          }}
          onMouseEnter={e => {
            if (!allowManualSubmit || submitting) return;
            e.currentTarget.style.backgroundColor = palette.primaryDark;
          }}
          onMouseLeave={e => {
            if (!allowManualSubmit || submitting) return;
            e.currentTarget.style.backgroundColor = palette.primary;
          }}
        >
          {submitting ? '등록 중...' : '추가하기'}
        </button>
      </div>
    </div>
  );
}
