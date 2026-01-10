import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { UserPlus, Phone, User } from 'lucide-react';

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
    onAssignMore: () => void;
}

export default function BeneficiaryListModal({
    open,
    onClose,
    staffName,
    beneficiaries,
    onAssignMore,
}: BeneficiaryListModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`${staffName} 담당 대상자 목록`}
            description={`총 ${beneficiaries.length}명의 대상자가 배정되어 있습니다.`}
            size="md"
            footer={
                <Button onClick={onAssignMore} fullWidth>
                    <UserPlus size={18} className="mr-2" />
                    대상자 추가 배정
                </Button>
            }
        >
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                {beneficiaries.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                        배정된 대상자가 없습니다.
                    </div>
                ) : (
                    beneficiaries.map((b) => (
                        <div
                            key={b.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-muted)]">
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-[var(--font-size-body)] text-[var(--color-text-primary)]">
                                        {b.name}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                <Phone size={16} />
                                <span className="text-[var(--font-size-small)] font-medium">
                                    {b.phone}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
}
