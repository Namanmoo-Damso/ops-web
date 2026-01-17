'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { UsersIcon } from '../../components/icons/shared-icons';
import StaffAssignmentModal, {
  Beneficiary,
  UnassignedWard,
} from '../../components/staff/StaffAssignmentModal';
import AddStaffModal, {
  NewStaffData,
} from '../../components/staff/AddStaffModal';
import StatsSummary from '../../components/ui/StatsSummary';
import {
  useStaffApi,
  Staff,
  StaffStats,
  StaffAssignment,
} from '../../hooks/useStaffApi';
import '../../styles/staff.css';

function getInitial(name: string | null): string {
  return name?.charAt(0) || '?';
}

export default function StaffPage() {
  // --- API Hook ---
  const staffApi = useStaffApi();

  // --- State ---
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Beneficiary[]>(
    [],
  );
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [unassignedWards, setUnassignedWards] = useState<UnassignedWard[]>([]);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    email: string;
  }>({
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

  // --- Load Data ---
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [staffRes, statsRes] = await Promise.all([
      staffApi.listStaff({ pageSize: 100 }),
      staffApi.getStats(),
    ]);
    if (staffRes?.data) {
      setStaffList(staffRes.data);
    }
    if (statsRes) {
      setStats(statsRes);
    }
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Handlers ---
  const handleAddStaff = () => {
    setIsAddStaffModalOpen(true);
  };

  const handleAddStaffSubmit = async (data: NewStaffData) => {
    const result = await staffApi.createStaff({
      email: data.email,
      name: data.name,
      phoneNumber: data.phone,
      team: data.team,
      jobTitle: data.jobTitle,
    });
    if (result) {
      loadData(); // Reload data
    }
  };

  const handleAssignClick = async (staffId: string) => {
    setSelectedStaffId(staffId);
    // Load assignments for this staff
    const assignments = await staffApi.getAssignments(staffId);
    setSelectedAssignments(
      assignments.map(a => ({
        id: a.id,
        name: a.wardName,
        phone: a.wardPhoneNumber,
      })),
    );
    setIsAssignmentModalOpen(true);
    setOpenMenuId(null);
  };

  const handleMoreClick = (staffId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === staffId ? null : staffId);
  };

  const handleEdit = (staff: Staff) => {
    setEditingId(staff.id);
    setEditForm({
      name: staff.name || '',
      phone: staff.phoneNumber || '',
      email: staff.email || '',
    });
    setOpenMenuId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (staffId: string) => {
    // Validation
    if (!editForm.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    if (!editForm.phone.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }
    if (!editForm.email.trim() || !editForm.email.includes('@')) {
      alert('유효한 이메일을 입력해주세요.');
      return;
    }

    const success = await staffApi.updateStaff(staffId, {
      name: editForm.name.trim(),
      phoneNumber: editForm.phone.trim(),
    });

    if (success) {
      loadData();
    }
    setEditingId(null);
  };

  const handleDelete = async (staffId: string) => {
    if (confirm('정말로 이 직원을 삭제하시겠습니까?')) {
      const success = await staffApi.deleteStaff(staffId);
      if (success) {
        loadData();
      }
      setOpenMenuId(null);
    }
  };

  const handleLoadUnassigned = async () => {
    setIsLoadingUnassigned(true);
    const wards = await staffApi.getUnassignedWards();
    setUnassignedWards(wards);
    setIsLoadingUnassigned(false);
  };

  const handleAssignWards = async (wardIds: string[]) => {
    if (!selectedStaffId) return;
    // Assign each ward sequentially
    for (const wardId of wardIds) {
      await staffApi.assignWard(selectedStaffId, wardId);
    }
    // Reload assignments
    const assignments = await staffApi.getAssignments(selectedStaffId);
    setSelectedAssignments(
      assignments.map(a => ({
        id: a.id,
        name: a.wardName,
        phone: a.wardPhoneNumber,
      })),
    );
    // Reload staff list to update counts
    loadData();
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!selectedStaffId) return;
    const success = await staffApi.unassignWard(selectedStaffId, assignmentId);
    if (success) {
      // Reload assignments
      const assignments = await staffApi.getAssignments(selectedStaffId);
      setSelectedAssignments(
        assignments.map(a => ({
          id: a.id,
          name: a.wardName,
          phone: a.wardPhoneNumber,
        })),
      );
      // Also reload staff list to update counts
      loadData();
    }
  };

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);
  const totalStaff = stats?.totalStaff ?? staffList.length;
  const avgAssigned = stats?.avgAssigned ?? 0;
  const unassignedCount = stats?.unassignedWards ?? 0;

  return (
    <DashboardLayout>
      <div className="staff-container">
        {/* Summary Section */}
        <StatsSummary
          title="직원 현황"
          icon={<UsersIcon size={24} />}
          items={[
            {
              label: '총 직원 수',
              value: `${totalStaff}명`,
              color: 'var(--color-primary)',
            },
            { label: '평균 담당', value: `${avgAssigned.toFixed(1)}명` },
            {
              label: '미배정 대상자',
              value: `${unassignedCount}명`,
              color: 'var(--color-danger-main)',
            },
          ]}
        />

        {/* Loading State */}
        {isLoading ? (
          <div className="staff-loading">
            <Loader2 size={40} className="animate-spin" />
            <span>직원 정보를 불러오는 중...</span>
          </div>
        ) : (
          /* Staff Grid */
          <div className="staff-grid">
            {staffList.map(staff => {
              const isEditing = editingId === staff.id;
              const displayName = isEditing
                ? editForm.name
                : staff.name || '이름 없음';
              const displayPhone = isEditing
                ? editForm.phone
                : staff.phoneNumber || '-';
              const displayEmail = staff.email;
              return (
                <Card
                  key={staff.id}
                  padding="lg"
                  className={`staff-card relative ${isEditing ? 'is-editing' : ''}`}
                >
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
                          onChange={e =>
                            setEditForm(prev => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="staff-name">{displayName}</div>
                          {staff.team && (
                            <div className="staff-team">
                              {staff.team} · {staff.jobTitle}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="relative">
                      {!isEditing && (
                        <button
                          className="staff-more-btn"
                          onClick={e => handleMoreClick(staff.id, e)}
                          aria-label="더보기"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      )}

                      {/* Dropdown Menu */}
                      {openMenuId === staff.id && (
                        <div ref={menuRef} className="staff-dropdown-menu">
                          <button
                            onClick={() => handleEdit(staff)}
                            className="staff-dropdown-item"
                          >
                            <Edit2 size={16} />
                            수정하기
                          </button>
                          <button
                            onClick={() => handleDelete(staff.id)}
                            className="staff-dropdown-item delete"
                          >
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
                          onChange={e =>
                            setEditForm(prev => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span className="staff-contact-text">
                          {displayPhone}
                        </span>
                      )}
                    </div>
                    <div className="staff-contact-item">
                      <Mail size={20} />
                      {isEditing ? (
                        <input
                          className="staff-contact-input"
                          value={editForm.email}
                          onChange={e =>
                            setEditForm(prev => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span className="staff-contact-text">
                          {displayEmail}
                        </span>
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
        )}

        {/* Staff Assignment Modal (combined) */}
        {selectedStaff && (
          <StaffAssignmentModal
            open={isAssignmentModalOpen}
            onClose={() => setIsAssignmentModalOpen(false)}
            staffName={selectedStaff.name || '직원'}
            beneficiaries={selectedAssignments}
            onDelete={handleUnassign}
            unassignedWards={unassignedWards}
            isLoadingUnassigned={isLoadingUnassigned}
            onLoadUnassigned={handleLoadUnassigned}
            onAssign={handleAssignWards}
          />
        )}

        {/* Add Staff Modal */}
        <AddStaffModal
          open={isAddStaffModalOpen}
          onClose={() => setIsAddStaffModalOpen(false)}
          onAdd={handleAddStaffSubmit}
        />
      </div>
    </DashboardLayout>
  );
}
