'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AddStaffModal.module.css';
import { Button, IconButton } from '../ui';

export type NewStaffData = {
    name: string;
    phone: string;
    email: string;
};

interface AddStaffModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (staff: NewStaffData) => void;
}

export default function AddStaffModal({ open, onClose, onAdd }: AddStaffModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [form, setForm] = useState({ name: '', phone: '', email: '' });
    const [errors, setErrors] = useState({ name: '', phone: '', email: '' });

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setForm({ name: '', phone: '', email: '' });
            setErrors({ name: '', phone: '', email: '' });
        }
    }, [open]);

    // ESC to close
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        dialogRef.current?.focus();
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const validate = (): boolean => {
        const newErrors = { name: '', phone: '', email: '' };
        let isValid = true;

        if (!form.name.trim()) {
            newErrors.name = '이름을 입력해주세요.';
            isValid = false;
        }

        if (!form.phone.trim()) {
            newErrors.phone = '전화번호를 입력해주세요.';
            isValid = false;
        }

        if (!form.email.trim()) {
            newErrors.email = '이메일을 입력해주세요.';
            isValid = false;
        } else if (!form.email.includes('@')) {
            newErrors.email = '유효한 이메일을 입력해주세요.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        onAdd({
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
        });
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div
                ref={dialogRef}
                tabIndex={-1}
                className={styles.dialog}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>신규 직원 추가</h2>
                    <IconButton
                        variant="close"
                        onClick={onClose}
                        aria-label="닫기"
                    />
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>이름 *</label>
                            <input
                                className={styles.input}
                                value={form.name}
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="홍길동"
                                autoFocus
                            />
                            {errors.name && <div className={styles.error}>{errors.name}</div>}
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>전화번호 *</label>
                            <input
                                className={styles.input}
                                value={form.phone}
                                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="010-1234-5678"
                            />
                            {errors.phone && <div className={styles.error}>{errors.phone}</div>}
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>이메일 *</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="example@damso.kr"
                            />
                            {errors.email && <div className={styles.error}>{errors.email}</div>}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose} fullWidth>
                        취소
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} fullWidth>
                        추가하기
                    </Button>
                </div>
            </div>
        </div>
    );
}
