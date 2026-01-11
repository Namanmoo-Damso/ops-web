'use client';

import { useMemo, useState } from 'react';
import { Search, AlertTriangle, Phone } from 'lucide-react';
import { WardLocation } from '../LocationMap';
import { getKoreanConsonant } from '../../lib/date-utils';

type WardListProps = {
    locations: WardLocation[];
    selectedWardId: string | null;
    onSelect: (wardId: string) => void;
};

type CallFilter = 'all' | 'lt24h' | 'lt3d' | 'gt3d' | 'gt7d';

export default function WardList({ locations, selectedWardId, onSelect }: WardListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [callFilter, setCallFilter] = useState<CallFilter>('all');

    // Helper to check 24h inactivity
    const isInactive = (lastUpdated: string) => {
        const diff = Date.now() - new Date(lastUpdated).getTime();
        return diff > 24 * 60 * 60 * 1000;
    };

    // Filter Logic
    const filteredLocations = useMemo(() => {
        let result = locations;

        // 1. Search (Name)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (loc) =>
                    loc.wardName.toLowerCase().includes(query) ||
                    getKoreanConsonant(loc.wardName).includes(query)
            );
        }

        // 2. Call Filter
        if (callFilter !== 'all') {
            const now = Date.now();
            result = result.filter((loc) => {
                const diff = now - new Date(loc.lastUpdated).getTime();
                const days = diff / (1000 * 60 * 60 * 24);

                switch (callFilter) {
                    case 'lt24h': return days < 1;
                    case 'lt3d': return days < 3;
                    case 'gt3d': return days >= 3;
                    case 'gt7d': return days >= 7;
                    default: return true;
                }
            });
        }

        // Sort: Inactive > Emergency > Warning > Normal
        return result.sort((a, b) => {
            const inactiveA = isInactive(a.lastUpdated);
            const inactiveB = isInactive(b.lastUpdated);
            // Inactive first
            if (inactiveA && !inactiveB) return -1;
            if (!inactiveA && inactiveB) return 1;

            return 0; // Default sort order
        });
    }, [locations, searchQuery, callFilter]);

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return new Date(dateStr).toLocaleDateString('ko-KR');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search & Filter */}
            <div className="monitoring-filters">
                <div className="monitoring-search">
                    <Search size={16} className="monitoring-search-icon" />
                    <input
                        type="text"
                        className="monitoring-search-input"
                        placeholder="대상자 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="monitoring-filter-row">
                    <select
                        className="monitoring-filter-select"
                        value={callFilter}
                        onChange={(e) => setCallFilter(e.target.value as CallFilter)}
                    >
                        <option value="all">전체 (마지막 통화)</option>
                        <option value="lt24h">24시간 이내</option>
                        <option value="lt3d">3일 이내</option>
                        <option value="gt3d">3일 이상 경과</option>
                        <option value="gt7d">7일 이상 경과</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="monitoring-ward-list">
                {filteredLocations.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        검색 결과가 없습니다.
                    </div>
                ) : (
                    filteredLocations.map((loc) => {
                        const inactive = isInactive(loc.lastUpdated);

                        return (
                            <div
                                key={loc.wardId}
                                className={`monitoring-ward-item ${selectedWardId === loc.wardId ? 'selected' : ''}`}
                                onClick={() => onSelect(loc.wardId)}
                            >
                                <div className="ward-avatar">
                                    {loc.wardName.charAt(0)}
                                </div>
                                <div className="ward-info">
                                    <div className="ward-header">
                                        <span className="ward-name">{loc.wardName}</span>
                                        {inactive && (
                                            <div className="ward-warning-badge" title="24시간 이상 활동 없음">
                                                <AlertTriangle size={12} />
                                                <span>24h 미활동</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ward-details">
                                        <span className="ward-time">
                                            마지막 전화: {getTimeAgo(loc.lastUpdated)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
