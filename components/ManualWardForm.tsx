'use client';

import { useMemo, useState } from 'react';
import { palette } from '../app/theme';

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
    gender: '',
    diseases: '',
    medication: '',
    emergency_contact: '',
    notes: '',
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
    type?: 'input' | 'select' | 'textarea';
    options?: Array<{ value: string; label: string }>;
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
    {
      key: 'gender',
      label: '성별',
      required: false,
      placeholder: '',
      type: 'select',
      options: [
        { value: '', label: '선택 안함' },
        { value: 'male', label: '남성' },
        { value: 'female', label: '여성' },
      ],
    },
    {
      key: 'notes',
      label: '비고',
      required: false,
      placeholder: '참고사항을 입력하세요',
      type: 'textarea',
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
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
    >
      {/* Grid Form Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          flex: 1,
        }}
      >
        {/* Row 1: Name + Gender */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: fieldErrors.name ? '1px solid #ef4444' : borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '45px',
            }}
          >
            이름 <span style={{ color: palette.danger }}>*</span>
          </span>
          <input
            value={manualForm.name}
            onChange={e =>
              setManualForm(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder="홍길동"
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '45px',
            }}
          >
            성별
          </span>
          <select
            value={manualForm.gender}
            onChange={e =>
              setManualForm(prev => ({ ...prev, gender: e.target.value }))
            }
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          >
            <option value="">선택 안함</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </div>

        {/* Row 2: Birth Date + Phone */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: fieldErrors.birth_date ? '1px solid #ef4444' : borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '60px',
            }}
          >
            생년월일
          </span>
          <input
            type="date"
            value={manualForm.birth_date}
            onChange={e =>
              setManualForm(prev => ({ ...prev, birth_date: e.target.value }))
            }
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: fieldErrors.phone_number
              ? '1px solid #ef4444'
              : borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '60px',
            }}
          >
            전화번호
          </span>
          <input
            value={manualForm.phone_number}
            onChange={e =>
              setManualForm(prev => ({
                ...prev,
                phone_number: formatPhoneNumber(e.target.value),
              }))
            }
            placeholder="010-1234-5678"
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
        </div>

        {/* Row 3: Email (full width) */}
        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: fieldErrors.email ? '1px solid #ef4444' : borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '60px',
            }}
          >
            이메일
          </span>
          <input
            value={manualForm.email}
            onChange={e =>
              setManualForm(prev => ({ ...prev, email: e.target.value }))
            }
            placeholder="user@example.com"
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
        </div>

        {/* Row 4: Address (full width) */}
        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '60px',
            }}
          >
            주소
          </span>
          <input
            value={manualForm.address}
            onChange={e =>
              setManualForm(prev => ({ ...prev, address: e.target.value }))
            }
            placeholder="서울특별시 ..."
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
        </div>

        {/* Row 5: Diseases (full width) */}
        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '65px',
            }}
          >
            기저질환
          </span>
          <input
            value={manualForm.diseases}
            onChange={e =>
              setManualForm(prev => ({ ...prev, diseases: e.target.value }))
            }
            placeholder="고혈압, 당뇨 등"
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
        </div>

        {/* Row 6: Medication (full width) */}
        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '65px',
            }}
          >
            복약정보
          </span>
          <input
            value={manualForm.medication}
            onChange={e =>
              setManualForm(prev => ({ ...prev, medication: e.target.value }))
            }
            placeholder="혈압약, 당뇨약 등"
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
        </div>

        {/* Row 7: Emergency Contact (full width) */}
        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '80px',
            }}
          >
            비상연락처
          </span>
          <input
            value={manualForm.emergency_contact}
            onChange={e =>
              setManualForm(prev => ({
                ...prev,
                emergency_contact: e.target.value,
              }))
            }
            placeholder="010-5678-1234"
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
            }}
          />
        </div>

        {/* Row 8: Notes (full width) */}
        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            border: borderStyle,
            borderRadius: '12px',
            padding: '10px 14px',
            backgroundColor: palette.background,
          }}
        >
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#4a5d23',
              minWidth: '60px',
              paddingTop: '4px',
            }}
          >
            비고
          </span>
          <textarea
            value={manualForm.notes}
            onChange={e =>
              setManualForm(prev => ({ ...prev, notes: e.target.value }))
            }
            placeholder="참고사항을 입력하세요"
            rows={2}
            style={{
              flex: 1,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
              fontSize: '16px',
              fontWeight: 600,
              color: palette.primaryDark,
              backgroundColor: 'transparent',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: '14px', color: palette.textMuted }}>
        이름과 이메일 또는 전화번호 중 하나는 반드시 입력해주세요.
      </div>
      {errors.global && (
        <div
          style={{
            backgroundColor: palette.dangerSoft,
            color: palette.danger,
            border: '1px solid #fecdd3',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '14px',
          }}
        >
          {errors.global}
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
              allowManualSubmit && !submitting
                ? palette.primary
                : palette.secondary,
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
