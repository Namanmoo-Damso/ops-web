'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './BeneficiaryListModal.module.css';
import { IconButton, SectionTitle } from '../ui';
import { Phone, User, Check, Loader2 } from 'lucide-react';

export interface UnassignedWard {
  id: string;
  name: string;
  phoneNumber: string;
}

interface UnassignedWardsModalProps {
  open: boolean;
  onClose: () => void;
  staffName: string;
  wards: UnassignedWard[];
  loading?: boolean;
  onAssign: (wardIds: string[]) => Promise<void>;
}

export default function UnassignedWardsModal({
  open,
  onClose,
  staffName,
  wards,
  loading = false,
  onAssign,
}: UnassignedWardsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      await onAssign(Array.from(selectedIds));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={styles.dialog}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <SectionTitle className={styles.title}>
            대상자 추가 배정 ({staffName})
          </SectionTitle>
          <IconButton
            variant="close"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          />
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.empty}>
              <Loader2 size={24} className="animate-spin" />
              <span style={{ marginLeft: 8 }}>불러오는 중...</span>
            </div>
          ) : wards.length === 0 ? (
            <div className={styles.empty}>미배정 대상자가 없습니다.</div>
          ) : (
            <div className={styles.list}>
              {wards.map(w => {
                const isSelected = selectedIds.has(w.id);
                return (
                  <div
                    key={w.id}
                    className={styles.itemCard}
                    style={{
                      cursor: 'pointer',
                      borderColor: isSelected
                        ? 'var(--color-primary)'
                        : undefined,
                      background: isSelected
                        ? 'var(--color-primary-lighter)'
                        : undefined,
                    }}
                    onClick={() => toggleSelection(w.id)}
                  >
                    <div className={styles.itemLeft}>
                      <div
                        className={styles.avatar}
                        style={{
                          background: isSelected
                            ? 'var(--color-primary)'
                            : undefined,
                          color: isSelected ? 'white' : undefined,
                        }}
                      >
                        {isSelected ? <Check size={18} /> : <User size={20} />}
                      </div>
                      <div className={styles.itemName}>{w.name}</div>
                      <div className={styles.itemPhone}>
                        <Phone size={14} />
                        {w.phoneNumber}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || isSubmitting}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background:
                selectedIds.size === 0
                  ? 'var(--color-bg-secondary)'
                  : 'var(--color-primary)',
              color: selectedIds.size === 0 ? 'var(--color-text-muted)' : 'white',
              fontWeight: 600,
              fontSize: '14px',
              cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                배정 중...
              </>
            ) : (
              `${selectedIds.size}명 배정하기`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
