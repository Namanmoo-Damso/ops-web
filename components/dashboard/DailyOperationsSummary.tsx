'use client';

import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Timer, Shield, CheckCircle2 } from 'lucide-react';
import '../../styles/dashboard.css';

// --- Types ---
export type DailyOperationsData = {
    totalCalls: number;
    incomingCalls: number;
    outgoingCalls: number;
    totalDurationMinutes: number;
    avgDurationMinutes: number;
    scheduledCheckIns: number;
    completedCheckIns: number;
};

type DailyOperationsSummaryProps = {
    organizationName?: string;
    data?: DailyOperationsData;
    loading?: boolean;
};

// Default mock data
const MOCK_DATA: DailyOperationsData = {
    totalCalls: 53,
    incomingCalls: 8,
    outgoingCalls: 45,
    totalDurationMinutes: 156,
    avgDurationMinutes: 3,
    scheduledCheckIns: 120,
    completedCheckIns: 45,
};

import { formatDateKorean } from '../../lib/date-utils';

/**
 * DailyOperationsSummary
 *
 * Hero-style gradient banner with organization name, date, and 3 key metric blocks.
 * Order: 전체 통화 건수 → 안부전화 실시율 → 총 통화 시간
 */
export default function DailyOperationsSummary({
    organizationName = '담소케어',
    data = MOCK_DATA,
    loading = false,
}: DailyOperationsSummaryProps) {
    const completionRate = data.scheduledCheckIns > 0
        ? Math.round((data.completedCheckIns / data.scheduledCheckIns) * 100)
        : 0;

    return (
        <section className="ops-hero">
            <div className="ops-hero-glow" />

            {/* Title Header */}
            <div className="ops-hero-title-header">
                <h1 className="ops-hero-title">{organizationName} {formatDateKorean()} 현황</h1>
            </div>

            {/* Divider */}
            <div className="ops-hero-title-divider" />

            {/* Stats Row */}
            <div className="ops-hero-stats-row">
                {/* Block 1: Total Calls */}
                <div className="ops-hero-block">
                    <div className="ops-hero-left">
                        <div className="ops-hero-main">
                            <Phone size={32} className="ops-hero-icon" />
                            <span className="ops-hero-value">{loading ? '-' : data.totalCalls}</span>
                            <span className="ops-hero-unit">회</span>
                        </div>
                        <div className="ops-hero-label">전체 통화 건수</div>
                    </div>
                    <div className="ops-hero-right">
                        <div className="ops-hero-detail-row">
                            <PhoneIncoming size={16} />
                            <span>수신</span>
                            <strong>{data.incomingCalls}</strong>
                        </div>
                        <div className="ops-hero-detail-row">
                            <PhoneOutgoing size={16} />
                            <span>발신</span>
                            <strong>{data.outgoingCalls}</strong>
                        </div>
                    </div>
                </div>

                <div className="ops-hero-divider" />

                {/* Block 2: Check-in Rate (swapped) */}
                <div className="ops-hero-block">
                    <div className="ops-hero-left">
                        <div className="ops-hero-main">
                            <Shield size={32} className="ops-hero-icon" />
                            <span className="ops-hero-value">{loading ? '-' : completionRate}</span>
                            <span className="ops-hero-unit">%</span>
                        </div>
                        <div className="ops-hero-label">안부전화 실시율</div>
                    </div>
                    <div className="ops-hero-right">
                        <div className="ops-hero-detail-row">
                            <CheckCircle2 size={16} />
                            <span>예정</span>
                            <strong>{data.scheduledCheckIns}건</strong>
                        </div>
                        <div className="ops-hero-detail-row">
                            <CheckCircle2 size={16} />
                            <span>실시</span>
                            <strong>{data.completedCheckIns}건</strong>
                        </div>
                    </div>
                </div>

                <div className="ops-hero-divider" />

                {/* Block 3: Call Duration (swapped, simplified) */}
                <div className="ops-hero-block">
                    <div className="ops-hero-left">
                        <div className="ops-hero-main">
                            <Clock size={32} className="ops-hero-icon" />
                            <span className="ops-hero-value">{loading ? '-' : data.totalDurationMinutes}</span>
                            <span className="ops-hero-unit">분</span>
                        </div>
                        <div className="ops-hero-label">총 통화 시간</div>
                    </div>
                    <div className="ops-hero-right">
                        <div className="ops-hero-detail-row">
                            <Timer size={16} />
                            <span>평균</span>
                            <strong>{data.avgDurationMinutes}분</strong>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
