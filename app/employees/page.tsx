'use client';

import { useState } from 'react';
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
} from 'lucide-react';

// --- Types ---
type Employee = {
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
const MOCK_EMPLOYEES: Employee[] = [
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

const TEAM_LABELS: Record<TeamFilter, string> = {
    all: '전체',
    team1: '방문 1팀',
    team2: '방문 2팀',
    team3: '방문 3팀',
};

// --- Helper Functions ---
function getInitial(name: string): string {
    return name.charAt(0);
}

function getLoadStatus(current: number, max: number): 'high' | 'normal' | 'low' {
    const ratio = current / max;
    if (ratio >= 0.9) return 'high';
    if (ratio >= 0.5) return 'normal';
    return 'low';
}

function getLoadColor(status: 'high' | 'normal' | 'low'): string {
    switch (status) {
        case 'high':
            return 'var(--color-danger-main)';
        case 'normal':
            return 'var(--color-primary)';
        case 'low':
            return 'var(--color-text-muted)';
    }
}

// --- Page Component ---
export default function EmployeesPage() {
    const [teamFilter, setTeamFilter] = useState<TeamFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter employees
    const filteredEmployees = MOCK_EMPLOYEES.filter((employee) => {
        // Team filter
        if (teamFilter !== 'all') {
            const teamMap: Record<TeamFilter, string> = {
                all: '',
                team1: '방문 1팀',
                team2: '방문 2팀',
                team3: '방문 3팀',
            };
            if (employee.team !== teamMap[teamFilter]) return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                employee.name.toLowerCase().includes(query) ||
                employee.email.toLowerCase().includes(query) ||
                employee.team.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Calculate stats
    const totalEmployees = MOCK_EMPLOYEES.length;
    const avgAssigned =
        MOCK_EMPLOYEES.reduce((sum, e) => sum + e.currentAssigned, 0) / totalEmployees;
    const unassignedCount = MOCK_UNASSIGNED_COUNT;

    const handleTeamFilterChange = (team: TeamFilter) => {
        console.log('[Employees] Filter changed:', team);
        setTeamFilter(team);
    };

    const handleAssignClick = (employeeId: string) => {
        console.log('[Employees] Assign clicked for employee:', employeeId);
        // TODO: Open assignment modal
    };

    const handleAddEmployee = () => {
        console.log('[Employees] Add employee clicked');
        // TODO: Open add employee modal
    };

    const handleMoreClick = (employeeId: string) => {
        console.log('[Employees] More options clicked for employee:', employeeId);
        // TODO: Open dropdown menu
    };

    return (
        <DashboardLayout>
            <div className="employees-container">
                {/* Summary Cards */}
                <div className="employees-summary-grid">
                    <Card padding="lg">
                        <div className="employees-summary-card">
                            <div className="employees-summary-icon" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                                <Users size={24} color="var(--color-primary-dark)" />
                            </div>
                            <div className="employees-summary-content">
                                <div className="employees-summary-label">총 직원 수</div>
                                <div className="employees-summary-value">{totalEmployees}명</div>
                                <div className="employees-summary-sub" style={{ color: 'var(--color-primary)' }}>
                                    가동 인원 100%
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <div className="employees-summary-card">
                            <div className="employees-summary-icon" style={{ backgroundColor: 'var(--color-info-light)' }}>
                                <TrendingUp size={24} color="var(--color-info-main)" />
                            </div>
                            <div className="employees-summary-content">
                                <div className="employees-summary-label">평균 담당 인원</div>
                                <div className="employees-summary-value">{avgAssigned.toFixed(1)}명/인</div>
                                <div className="employees-summary-sub">
                                    권장: 15명 이하
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <div className="employees-summary-card">
                            <div className="employees-summary-icon" style={{ backgroundColor: 'var(--color-danger-light)' }}>
                                <AlertTriangle size={24} color="var(--color-danger-main)" />
                            </div>
                            <div className="employees-summary-content">
                                <div className="employees-summary-label">미배정 대상자</div>
                                <div className="employees-summary-value" style={{ color: 'var(--color-danger-main)' }}>
                                    {unassignedCount}명
                                </div>
                                <div className="employees-summary-sub" style={{ color: 'var(--color-danger-main)' }}>
                                    즉시 배정 필요
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter Bar */}
                <div className="employees-filter-bar">
                    <h2 className="employees-filter-title">
                        직원 목록 <span className="employees-filter-count">({filteredEmployees.length})</span>
                    </h2>

                    <div className="employees-filter-tabs">
                        {(Object.keys(TEAM_LABELS) as TeamFilter[]).map((key) => (
                            <button
                                key={key}
                                className={`employees-filter-tab ${teamFilter === key ? 'active' : ''}`}
                                onClick={() => handleTeamFilterChange(key)}
                            >
                                {TEAM_LABELS[key]}
                            </button>
                        ))}
                    </div>

                    <div className="employees-search">
                        <Search size={18} className="employees-search-icon" />
                        <Input
                            placeholder="직원 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="employees-search-input"
                        />
                    </div>
                </div>

                {/* Employee Grid */}
                <div className="employees-grid">
                    {filteredEmployees.map((employee) => {
                        const loadStatus = getLoadStatus(employee.currentAssigned, employee.maxCapacity);
                        const loadPercent = (employee.currentAssigned / employee.maxCapacity) * 100;

                        return (
                            <Card key={employee.id} padding="lg" className="employee-card">
                                {/* Card Header */}
                                <div className="employee-header">
                                    <div className="employee-avatar">
                                        {getInitial(employee.name)}
                                    </div>
                                    <div className="employee-info">
                                        <div className="employee-name">{employee.name}</div>
                                        <div className="employee-role">{employee.team} · {employee.role}</div>
                                    </div>
                                    <button
                                        className="employee-more-btn"
                                        onClick={() => handleMoreClick(employee.id)}
                                        aria-label="더보기"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>

                                {/* Contact Info */}
                                <div className="employee-contact">
                                    <div className="employee-contact-item">
                                        <Phone size={16} />
                                        <span>{employee.phone}</span>
                                    </div>
                                    <div className="employee-contact-item">
                                        <Mail size={16} />
                                        <span>{employee.email}</span>
                                    </div>
                                </div>

                                {/* Workload Progress */}
                                <div className="employee-workload">
                                    <div className="employee-workload-header">
                                        <span className="employee-workload-label">담당 인원</span>
                                        <span className="employee-workload-value">
                                            {employee.currentAssigned} / {employee.maxCapacity}명
                                        </span>
                                    </div>
                                    <div className="employee-progress-bar">
                                        <div
                                            className="employee-progress-fill"
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
                                    onClick={() => handleAssignClick(employee.id)}
                                    disabled={loadStatus === 'high'}
                                    className="employee-assign-btn"
                                >
                                    <UserPlus size={16} />
                                    대상자 배정
                                </Button>
                            </Card>
                        );
                    })}

                    {/* Add Employee Card */}
                    <button className="employee-add-card" onClick={handleAddEmployee}>
                        <UserPlus size={32} />
                        <span>신규 직원 추가하기</span>
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
