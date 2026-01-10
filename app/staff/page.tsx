'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
    Users,
    UserPlus,
    Phone,
    Mail,
    MoreHorizontal,
    Edit2,
    Trash2,
} from 'lucide-react';
import {
    UsersIcon,
} from '../my-wards/icons';
import BeneficiaryListModal, { Beneficiary } from '../../components/staff/BeneficiaryListModal';
import StatsSummary from '../../components/ui/StatsSummary';
import '../../styles/staff.css';

// --- Types ---
type Staff = {
    id: string;
    name: string;
    phone: string;
    email: string;
    currentAssigned: number;
};

// --- Mock Data ---
const MOCK_STAFF: Staff[] = [
    {
        id: '1',
        name: '김민정',
        phone: '010-1234-5678',
        email: 'kim.mj@damso.kr',
        currentAssigned: 18,
    },
    {
        id: '2',
        name: '이수진',
        phone: '010-2345-6789',
        email: 'lee.sj@damso.kr',
        currentAssigned: 15,
    },
    {
        id: '3',
        name: '박현우',
        phone: '010-3456-7890',
        email: 'park.hw@damso.kr',
        currentAssigned: 12,
    },
    {
        id: '4',
        name: '최영희',
        phone: '010-4567-8901',
        email: 'choi.yh@damso.kr',
        currentAssigned: 20,
    },
    {
        id: '5',
        name: '정태호',
        phone: '010-5678-9012',
        email: 'jung.th@damso.kr',
        currentAssigned: 8,
    },
    {
        id: '6',
        name: '강미래',
        phone: '010-6789-0123',
        email: 'kang.mr@damso.kr',
        currentAssigned: 16,
    },
];

const MOCK_BENEFICIARIES: Beneficiary[] = [
    { id: '1', name: '이순자', phone: '010-9876-5432' },
    { id: '2', name: '김철수', phone: '010-8765-4321' },
    { id: '3', name: '박영희', phone: '010-7654-3210' },
];

function getInitial(name: string): string {
    return name.charAt(0);
}

export default function StaffPage() {
    // --- State ---
    const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [isBeneficiaryModalOpen, setIsBeneficiaryModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Inline Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ name: string; phone: string; email: string }>({
        name: '',
        phone: '',
        email: '',
    });

    // Click outside handler for dropdown
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Handlers ---
    const handleAddStaff = () => {
        console.log('[Staff] Add staff clicked');
        // TODO: Open add staff modal
    };

    const handleAssignClick = (staffId: string) => {
        setSelectedStaffId(staffId);
        setIsBeneficiaryModalOpen(true);
        setOpenMenuId(null);
    };

    const handleMoreClick = (staffId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === staffId ? null : staffId);
    };

    const handleEdit = (staff: Staff) => {
        setEditingId(staff.id);
        setEditForm({
            name: staff.name,
            phone: staff.phone,
            email: staff.email,
        });
        setOpenMenuId(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
    };

    const handleSaveEdit = (staffId: string) => {
        setStaffList(prev => prev.map(s =>
            s.id === staffId
                ? { ...s, name: editForm.name, phone: editForm.phone, email: editForm.email }
                : s
        ));
        setEditingId(null);
    };

    const handleDelete = (staffId: string) => {
        if (confirm('정말로 이 직원을 삭제하시겠습니까?')) {
            setStaffList(prev => prev.filter(s => s.id !== staffId));
            setOpenMenuId(null);
        }
    };

    const handleAssignMore = () => {
        console.log('[Staff] Assign more beneficiaries');
        // TODO: Open selection modal
    };

    const selectedStaff = staffList.find(s => s.id === selectedStaffId);
    const totalStaff = staffList.length;
    const avgAssigned = totalStaff > 0 ? (staffList.reduce((acc, s) => acc + s.currentAssigned, 0) / totalStaff) : 0;
    const unassignedCount = 5; // Mock value for now

    return (
        <DashboardLayout>
            <div className="staff-container">
                {/* Summary Section */}
                <StatsSummary
                    title="직원 현황"
                    icon={<UsersIcon size={24} />}
                    items={[
                        { label: '총 직원 수', value: `${totalStaff}명`, color: 'var(--color-primary)' },
                        { label: '평균 담당', value: `${avgAssigned.toFixed(1)}명` },
                        { label: '미배정 대상자', value: `${unassignedCount}명`, color: 'var(--color-danger-main)' },
                    ]}
                />

                {/* Staff Grid */}
                <div className="staff-grid">
                    {staffList.map((staff) => {
                        const isEditing = editingId === staff.id;
                        return (
                            <Card key={staff.id} padding="lg" className={`staff-card relative ${isEditing ? 'is-editing' : ''}`}>
                                {/* Card Header (Profile) */}
                                <div className="staff-header">
                                    <div className="staff-avatar">
                                        {getInitial(isEditing ? editForm.name : staff.name)}
                                    </div>
                                    <div className="staff-info">
                                        {isEditing ? (
                                            <input
                                                className="staff-name-input"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="staff-name">{staff.name}</div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        {!isEditing && (
                                            <button
                                                className="staff-more-btn"
                                                onClick={(e) => handleMoreClick(staff.id, e)}
                                                aria-label="더보기"
                                            >
                                                <MoreHorizontal size={20} />
                                            </button>
                                        )}

                                        {/* Dropdown Menu */}
                                        {openMenuId === staff.id && (
                                            <div ref={menuRef} className="staff-dropdown-menu">
                                                <button onClick={() => handleEdit(staff)} className="staff-dropdown-item">
                                                    <Edit2 size={16} />
                                                    수정하기
                                                </button>
                                                <button onClick={() => handleDelete(staff.id)} className="staff-dropdown-item delete">
                                                    <Trash2 size={16} />
                                                    삭제하기
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="staff-contact">
                                    <div className="staff-contact-item">
                                        <Phone size={20} />
                                        {isEditing ? (
                                            <input
                                                className="staff-contact-input"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                            />
                                        ) : (
                                            <span className="staff-contact-text">{staff.phone}</span>
                                        )}
                                    </div>
                                    <div className="staff-contact-item">
                                        <Mail size={20} />
                                        {isEditing ? (
                                            <input
                                                className="staff-contact-input"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                            />
                                        ) : (
                                            <span className="staff-contact-text">{staff.email}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons (Footer) */}
                                {isEditing ? (
                                    <div className="staff-edit-actions">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            className="flex-1"
                                        >
                                            취소
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleSaveEdit(staff.id)}
                                            className="flex-1"
                                        >
                                            저장
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        size="md"
                                        fullWidth
                                        onClick={() => handleAssignClick(staff.id)}
                                        className="staff-assign-btn"
                                    >
                                        <Users size={18} className="mr-2" />
                                        담당 인원 ({staff.currentAssigned}명)
                                    </Button>
                                )}
                            </Card>
                        );
                    })}

                    {/* Add Staff Card */}
                    <button className="staff-add-card" onClick={handleAddStaff}>
                        <UserPlus size={32} />
                        <span>신규 직원 추가하기</span>
                    </button>
                </div>

                {/* Beneficiary List Modal */}
                {selectedStaff && (
                    <BeneficiaryListModal
                        open={isBeneficiaryModalOpen}
                        onClose={() => setIsBeneficiaryModalOpen(false)}
                        staffName={selectedStaff.name}
                        beneficiaries={MOCK_BENEFICIARIES} // Using mock list for now
                        onAssignMore={handleAssignMore}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
