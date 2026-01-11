'use client';

import { WardLocation } from '../LocationMap';
import MonitoringStats from './MonitoringStats';
import WardList from './WardList';
import '../../styles/monitoring.css';

type MonitoringSidebarProps = {
    locations: WardLocation[];
    selectedWardId: string | null;
    onSelect: (wardId: string) => void;
};

export default function MonitoringSidebar({ locations, selectedWardId, onSelect }: MonitoringSidebarProps) {
    // Calculate stats
    const stats = locations.reduce(
        (acc, loc) => {
            acc.total++;
            acc[loc.status]++;
            return acc;
        },
        { total: 0, normal: 0, warning: 0, emergency: 0 } as Record<string, number>
    );

    return (
        <aside className="monitoring-sidebar">
            {/* Header */}
            <div className="monitoring-sidebar-header">
                <div className="monitoring-title-row">
                    <h2 className="monitoring-title">실시간 위치 현황</h2>
                    <span className="monitoring-count">총 {stats.total}명</span>
                </div>
                <MonitoringStats
                    total={stats.total}
                    normal={stats.normal}
                    warning={stats.warning}
                    emergency={stats.emergency}
                />
            </div>

            {/* Ward List (includes Filters) */}
            <WardList
                locations={locations}
                selectedWardId={selectedWardId}
                onSelect={onSelect}
            />
        </aside>
    );
}
