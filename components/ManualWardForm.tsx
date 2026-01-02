'use client';

import { useState } from 'react';

export type ManualWardPayload = {
  name: string;
  email: string;
  phone_number: string;
  birth_date?: string;
  address?: string;
};

type FieldKey = 'name' | 'email' | 'phone_number' | 'birth_date' | 'address';

type ManualWardFormProps = {
  onSubmit: (payload: ManualWardPayload) => void;
  onCancel: () => void;
};

export default function ManualWardForm({
  onSubmit,
  onCancel,
}: ManualWardFormProps) {
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    birth_date: '',
    address: '',
  });

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

  const handleSubmit = () => {
    if (!allowManualSubmit) return;
    const payload: ManualWardPayload = {
      name: manualForm.name.trim(),
      email: manualForm.email.trim(),
      phone_number: manualForm.phone_number.trim(),
      birth_date: manualForm.birth_date.trim() || undefined,
      address: manualForm.address.trim() || undefined,
    };
    onSubmit(payload);
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
                color: '#1e293b',
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
              }}
            >
              <span>{field.label}</span>
              {field.required && <span style={{ color: '#dc2626' }}>*</span>}
            </label>
            <input
              value={manualForm[field.key as FieldKey]}
              onChange={e =>
                setManualForm(prev => ({
                  ...prev,
                  [field.key as FieldKey]: e.target.value,
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
          disabled={!allowManualSubmit}
          onClick={handleSubmit}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: allowManualSubmit ? '#2563eb' : '#93c5fd',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 700,
            cursor: allowManualSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 150ms ease',
            boxShadow: allowManualSubmit
              ? '0 10px 30px rgba(37,99,235,0.15)'
              : 'none',
          }}
          onMouseEnter={e => {
            if (!allowManualSubmit) return;
            e.currentTarget.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={e => {
            if (!allowManualSubmit) return;
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
        >
          추가하기
        </button>
      </div>
    </div>
  );
}
