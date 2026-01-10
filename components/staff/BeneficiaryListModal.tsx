'use client';

import { useEffect, useRef } from 'react';
import styles from './BeneficiaryListModal.module.css';
import Button from '../ui/Button';
import { UserPlus, Phone, User, Trash2 } from 'lucide-react';

export type Beneficiary = {
    id: string;
    name: string;
    phone: string;
};

interface BeneficiaryListModalProps {
    open: boolean;
    onClose: () => void;
    staffName: string;
    beneficiaries: Beneficiary[];
    onDelete: (id: string) => void;
    onAssignMore: () => void;
}

export default function BeneficiaryListModal({
    open,
    onClose,
    staffName,
    beneficiaries,
    onDelete,
    onAssignMore,
}: BeneficiaryListModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

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

    const handleDelete = (id: string) => {
        if (confirm('이 대상자를 목록에서 삭제하시겠습니까?')) {
            onDelete(id);
        }
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
                    <h2 className={styles.title}>
                        {staffName} 담당 대상자 ({beneficiaries.length}명)
                    </h2>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {beneficiaries.length === 0 ? (
                        <div className={styles.empty}>배정된 대상자가 없습니다.</div>
                    ) : (
                        <div className={styles.list}>
                            {beneficiaries.map((b) => (
                                <div key={b.id} className={styles.itemCard}>
                                    <div className={styles.itemLeft}>
                                        <div className={styles.avatar}>
                                            <User size={20} />
                                        </div>
                                        <div className={styles.itemName}>{b.name}</div>
                                        <div className={styles.itemPhone}>
                                            <Phone size={14} />
                                            {b.phone}
                                        </div>
                                    </div>

                                    <button
                                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                        onClick={() => handleDelete(b.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <Button onClick={onAssignMore} fullWidth>
                        <UserPlus size={18} style={{ marginRight: '8px' }} />
                        대상자 추가 배정
                    </Button>
                </div>
            </div>
        </div>
    );
}
