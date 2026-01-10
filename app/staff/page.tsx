'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {
    Users,
    UserPlus,
    AlertTriangle,
    Phone,
    Mail,
    MoreHorizontal,
    Search,
    TrendingUp,
    UserX,
} from 'lucide-react';
import '../../styles/staff.css';

// --- Constants ---
const LOAD_THRESHOLD_HIGH = 0.9;
const LOAD_THRESHOLD_NORMAL = 0.5;
const RECOMMENDED_MAX_CAPACITY = 15;

// --- Types ---
type Staff = {
    id: string;
    name: string;
    team: string;
    role: string;
    phone: string;
    email: string;
    currentAssigned: number;
    maxCapacity: number;
};

type TeamFilter = 'all' | 'team1' | 'team2' | 'team3';

// --- Mock Data ---
const MOCK_STAFF: Staff[] = [
    {
        id: '1',
        name: '김민정',
        team: '방문 1팀',
        role: '사회복지사',
        phone: '010-1234-5678',
        email: 'kim.mj@damso.kr',
        currentAssigned: 18,
        maxCapacity: 20,
    },
    {
        id: '2',
        name: '이수진',
        team: '방문 1팀',
        role: '사회복지사',
        phone: '010-2345-6789',
        email: 'lee.sj@damso.kr',
        currentAssigned: 15,
        maxCapacity: 20,
    },
    {
        id: '3',
        name: '박현우',
        team: '방문 2팀',
        role: '팀장',
        phone: '010-3456-7890',
        email: 'park.hw@damso.kr',
        currentAssigned: 12,
        maxCapacity: 15,
    },
    {
        id: '4',
        name: '최영희',
        team: '방문 2팀',
        role: '사회복지사',
        phone: '010-4567-8901',
        email: 'choi.yh@damso.kr',
        currentAssigned: 20,
        maxCapacity: 20,
    },
    {
        id: '5',
        name: '정태호',
        team: '방문 1팀',
        role: '사회복지사',
        phone: '010-5678-9012',
        email: 'jung.th@damso.kr',
        currentAssigned: 8,
        maxCapacity: 20,
    },
    {
        id: '6',
        name: '강미래',
        team: '방문 3팀',
        role: '사회복지사',
        phone: '010-6789-0123',
        email: 'kang.mr@damso.kr',
        currentAssigned: 16,
        maxCapacity: 20,
    },
];

const MOCK_UNASSIGNED_COUNT = 5;

// Unified team mapping - used for both labels and filtering
const TEAM_CONFIG: Record<TeamFilter, { label: string; teamName: string }> = {
    all: { label: '전체', teamName: '' },
    team1: { label: '방문 1팀', teamName: '방문 1팀' },
    team2: { label: '방문 2팀', teamName: '방문 2팀' },
    team3: { label: '방문 3팀', teamName: '방문 3팀' },
};

// --- Helper Functions ---
function getInitial(name: string): string {
    return name.charAt(0);
}

function getLoadStatus(current: number, max: number): 'high' | 'normal' | 'low' {
    if (max === 0) return 'low'; // Guard against division by zero
    const ratio = current / max;
    if (ratio >= LOAD_THRESHOLD_HIGH) return 'high';
    if (ratio >= LOAD_THRESHOLD_NORMAL) return 'normal';
    return 'low';
}

function getLoadColor(status: 'high' | 'normal' | 'low'): string {
    const colors: Record<typeof status, string> = {
        high: 'var(--color-danger-main)',
        normal: 'var(--color-primary)',
        low: 'var(--color-text-muted)',
    };
    return colors[status];
}

// --- Page Component ---
export default function StaffPage() {
    const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Memoized filtered staff for performance
    const filteredStaff = useMemo(() => {
        return MOCK_STAFF.filter((staff) => {
            // Team filter - use TEAM_CONFIG for consistent mapping
            if (teamFilter !== 'all') {
                if (staff.team !== TEAM_CONFIG[teamFilter].teamName) return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    staff.name.toLowerCase().includes(query) ||
                    staff.email.toLowerCase().includes(query) ||
                    staff.team.toLowerCase().includes(query)
                );
            }

            return true;
        });
    }, [teamFilter, searchQuery]);

    // Calculate stats with division-by-zero guard
    const totalStaff = MOCK_STAFF.length;
    const avgAssigned = totalStaff > 0
        ? MOCK_STAFF.reduce((sum, e) => sum + e.currentAssigned, 0) / totalStaff
        : 0;
    const unassignedCount = MOCK_UNASSIGNED_COUNT;

    const handleTeamFilterChange = (team: TeamFilter) => {
        console.log('[Staff] Filter changed:', team);
        setTeamFilter(team);
    };

    const handleAssignClick = (staffId: string) => {
        console.log('[Staff] Assign clicked for staff:', staffId);
        // TODO: Open assignment modal
    };

    const handleAddStaff = () => {
        console.log('[Staff] Add staff clicked');
        // TODO: Open add staff modal
    };

    const handleMoreClick = (staffId: string) => {
        console.log('[Staff] More options clicked for staff:', staffId);
        // TODO: Open dropdown menu
    };

    return (
        <DashboardLayout>
            <div className="staff-container">
                {/* Summary Cards */}
                <div className="staff-summary-grid">
                    <Card padding="lg">
                        <div className="staff-summary-card">
                            <div className="staff-summary-icon" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                                <Users size={24} color="var(--color-primary-dark)" />
                            </div>
                            <div className="staff-summary-content">
                                <div className="staff-summary-label">총 직원 수</div>
                                <div className="staff-summary-value">{totalStaff}명</div>
                                <div className="staff-summary-sub" style={{ color: 'var(--color-primary)' }}>
                                    가동 인원 100%
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <div className="staff-summary-card">
                            <div className="staff-summary-icon" style={{ backgroundColor: 'var(--color-info-light)' }}>
                                <TrendingUp size={24} color="var(--color-info-main)" />
                            </div>
                            <div className="staff-summary-content">
                                <div className="staff-summary-label">평균 담당 인원</div>
                                <div className="staff-summary-value">{avgAssigned.toFixed(1)}명/인</div>
                                <div className="staff-summary-sub">
                                    권장: 15명 이하
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <div className="staff-summary-card">
                            <div className="staff-summary-icon" style={{ backgroundColor: 'var(--color-danger-light)' }}>
                                <AlertTriangle size={24} color="var(--color-danger-main)" />
                            </div>
                            <div className="staff-summary-content">
                                <div className="staff-summary-label">미배정 대상자</div>
                                <div className="staff-summary-value" style={{ color: 'var(--color-danger-main)' }}>
                                    {unassignedCount}명
                                </div>
                                <div className="staff-summary-sub" style={{ color: 'var(--color-danger-main)' }}>
                                    즉시 배정 필요
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter Bar */}
                <div className="staff-filter-bar">
                    <h2 className="staff-filter-title">
                        직원 목록 <span className="staff-filter-count">({filteredStaff.length})</span>
                    </h2>

                    <div className="staff-filter-tabs">
                        {(Object.keys(TEAM_CONFIG) as TeamFilter[]).map((key) => (
                            <button
                                key={key}
                                className={`staff-filter-tab ${teamFilter === key ? 'active' : ''}`}
                                onClick={() => handleTeamFilterChange(key)}
                            >
                                {TEAM_CONFIG[key].label}
                            </button>
                        ))}
                    </div>

                    <div className="staff-search">
                        <Search size={18} className="staff-search-icon" />
                        <Input
                            placeholder="직원 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="staff-search-input"
                        />
                    </div>
                </div>

                {/* Staff Grid */}
                <div className="staff-grid">
                    {filteredStaff.length === 0 ? (
                        <div className="staff-empty-state">
                            <UserX size={48} />
                            <p>검색 결과가 없습니다</p>
                        </div>
                    ) : filteredStaff.map((staff) => {
                        const loadStatus = getLoadStatus(staff.currentAssigned, staff.maxCapacity);
                        const loadPercent = staff.maxCapacity > 0
                            ? (staff.currentAssigned / staff.maxCapacity) * 100
                            : 0;

                        return (
                            <Card key={staff.id} padding="lg" className="staff-card">
                                {/* Card Header */}
                                <div className="staff-header">
                                    <div className="staff-avatar">
                                        {getInitial(staff.name)}
                                    </div>
                                    <div className="staff-info">
                                        <div className="staff-name">{staff.name}</div>
                                        <div className="staff-role">{staff.team} · {staff.role}</div>
                                    </div>
                                    <button
                                        className="staff-more-btn"
                                        onClick={() => handleMoreClick(staff.id)}
                                        aria-label="더보기"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>

                                {/* Contact Info */}
                                <div className="staff-contact">
                                    <div className="staff-contact-item">
                                        <Phone size={16} />
                                        <span>{staff.phone}</span>
                                    </div>
                                    <div className="staff-contact-item">
                                        <Mail size={16} />
                                        <span>{staff.email}</span>
                                    </div>
                                </div>

                                {/* Workload Progress */}
                                <div className="staff-workload">
                                    <div className="staff-workload-header">
                                        <span className="staff-workload-label">담당 인원</span>
                                        <span className="staff-workload-value">
                                            {staff.currentAssigned} / {staff.maxCapacity}명
                                        </span>
                                    </div>
                                    <div className="staff-progress-bar">
                                        <div
                                            className="staff-progress-fill"
                                            style={{
                                                width: `${Math.min(loadPercent, 100)}%`,
                                                backgroundColor: getLoadColor(loadStatus),
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Button
                                    variant="secondary"
                                    size="md"
                                    fullWidth
                                    onClick={() => handleAssignClick(staff.id)}
                                    disabled={loadStatus === 'high'}
                                    className="staff-assign-btn"
                                >
                                    <UserPlus size={16} />
                                    대상자 배정
                                </Button>
                            </Card>
                        );
                    })}

                    {/* Add Staff Card */}
                    <button className="staff-add-card" onClick={handleAddStaff}>
                        <UserPlus size={32} />
                        <span>신규 직원 추가하기</span>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
