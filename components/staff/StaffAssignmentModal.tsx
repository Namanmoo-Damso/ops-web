'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './StaffAssignmentModal.module.css';
import { IconButton, SectionTitle, Button } from '../ui';
import { UserPlus, Phone, User, Trash2, Check, Loader2, X } from 'lucide-react';

export type Beneficiary = {
  id: string;
  name: string;
  phone: string;
};

export interface UnassignedWard {
  id: string;
  name: string;
  phoneNumber: string;
}

interface StaffAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  staffName: string;
  beneficiaries: Beneficiary[];
  onDelete: (id: string) => void;
  unassignedWards: UnassignedWard[];
  isLoadingUnassigned: boolean;
  onLoadUnassigned: () => Promise<void>;
  onAssign: (wardIds: string[]) => Promise<void>;
}

export default function StaffAssignmentModal({
  open,
  onClose,
  staffName,
  beneficiaries,
  onDelete,
  unassignedWards,
  isLoadingUnassigned,
  onLoadUnassigned,
  onAssign,
}: StaffAssignmentModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESC to close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showUnassigned) {
          setShowUnassigned(false);
        } else {
          onClose();
        }
      }
    };

    dialogRef.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, showUnassigned]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setShowUnassigned(false);
      setSelectedIds(new Set());
    }
  }, [open]);

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

  const handleAssignMore = async () => {
    setShowUnassigned(true);
    setSelectedIds(new Set());
    await onLoadUnassigned();
  };

  const handleCloseUnassigned = () => {
    setShowUnassigned(false);
    setSelectedIds(new Set());
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
      setShowUnassigned(false);
      setSelectedIds(new Set());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={`${styles.container} ${showUnassigned ? styles.containerDual : ''}`}
      >
        {/* Left Panel - Assigned Beneficiaries */}
        <div
          ref={dialogRef}
          tabIndex={-1}
          className={styles.dialog}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <SectionTitle className={styles.title}>
              {staffName} 담당 대상자 ({beneficiaries.length}명)
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
            {beneficiaries.length === 0 ? (
              <div className={styles.empty}>배정된 대상자가 없습니다.</div>
            ) : (
              <div className={styles.list}>
                {beneficiaries.map(b => (
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
            <Button
              onClick={handleAssignMore}
              fullWidth
              disabled={showUnassigned}
            >
              <UserPlus size={18} style={{ marginRight: '8px' }} />
              대상자 추가 배정
            </Button>
          </div>
        </div>

        {/* Right Panel - Unassigned Wards (appears when showUnassigned is true) */}
        {showUnassigned && (
          <div className={styles.dialog} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.header}>
              <SectionTitle className={styles.title}>
                미배정 대상자
              </SectionTitle>
              <IconButton
                variant="close"
                className={styles.closeButton}
                onClick={handleCloseUnassigned}
                aria-label="닫기"
              />
            </div>

            {/* Body */}
            <div className={styles.body}>
              {isLoadingUnassigned ? (
                <div className={styles.empty}>
                  <Loader2 size={24} className="animate-spin" />
                  <span style={{ marginLeft: 8 }}>불러오는 중...</span>
                </div>
              ) : unassignedWards.length === 0 ? (
                <div className={styles.empty}>미배정 대상자가 없습니다.</div>
              ) : (
                <div className={styles.list}>
                  {unassignedWards.map(w => {
                    const isSelected = selectedIds.has(w.id);
                    return (
                      <div
                        key={w.id}
                        className={`${styles.itemCard} ${isSelected ? styles.itemCardSelected : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleSelection(w.id)}
                      >
                        <div className={styles.itemLeft}>
                          <div
                            className={`${styles.avatar} ${isSelected ? styles.avatarSelected : ''}`}
                          >
                            {isSelected ? (
                              <Check size={18} />
                            ) : (
                              <User size={20} />
                            )}
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
                className={`${styles.submitBtn} ${selectedIds.size === 0 ? styles.submitBtnDisabled : ''}`}
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
        )}
      </div>
    </div>
  );
}
