'use client';

import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

type MonitoringStatsProps = {
    total: number;
    normal: number;
    warning: number;
    emergency: number;
};

export default function MonitoringStats({ total, normal, warning, emergency }: MonitoringStatsProps) {
    return (
        <div className="monitoring-stats">
            <div className="monitoring-stat-item">
                <span className="monitoring-stat-label">정상</span>
                <div className="monitoring-stat-value stat-normal">{normal}</div>
            </div>
            <div className="monitoring-stat-item">
                <span className="monitoring-stat-label">주의</span>
                <div className="monitoring-stat-value stat-warning">{warning}</div>
            </div>
            <div className="monitoring-stat-item">
                <span className="monitoring-stat-label">비상</span>
                <div className="monitoring-stat-value stat-emergency">{emergency}</div>
            </div>
        </div>
    );
}
