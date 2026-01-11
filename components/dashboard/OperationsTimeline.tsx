'use client';

import { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import Card from '../ui/Card';
import { Clock } from 'lucide-react';
import '../../styles/dashboard.css';

// --- Types ---
export type HourlyCallData = {
    hour: string;
    scheduled: number;
    actual: number;
    incoming: number;
};

type OperationsTimelineProps = {
    data?: HourlyCallData[];
    loading?: boolean;
};

// Available hours for selection
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Toned-down aesthetic color palette
const CHART_COLORS = {
    actual: '#7BA05B', // Muted sage - completed/실시
    remaining: '#E8EFE0', // Very light sage - remaining scheduled/미실시
    incoming: '#4A5D23', // Olive moss - incoming/수신
};

// Generate default mock data for given hours
const generateMockData = (startHour: number, endHour: number): HourlyCallData[] => {
    const data: HourlyCallData[] = [];
    for (let h = startHour; h <= endHour; h++) {
        const hour = h < 10 ? `0${h}:00` : `${h}:00`;
        const scheduled = Math.floor(Math.random() * 12) + 8;
        const actual = Math.floor(Math.random() * scheduled);
        const incoming = Math.floor(Math.random() * 4);
        data.push({ hour, scheduled, actual, incoming });
    }
    return data;
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    if (!data) return null;
    const total = (data.actual || 0) + (data.incoming || 0);

    return (
        <div className="ops-timeline-tooltip">
            <div className="ops-timeline-tooltip-header">{label}</div>
            <div className="ops-timeline-tooltip-row">
                <span className="ops-timeline-tooltip-label">전체</span>
                <strong>{total}건</strong>
            </div>
            <div className="ops-timeline-tooltip-row">
                <span className="ops-timeline-tooltip-dot" style={{ background: CHART_COLORS.remaining }} />
                <span className="ops-timeline-tooltip-label">예정</span>
                <strong>{data.scheduled}건</strong>
            </div>
            <div className="ops-timeline-tooltip-row">
                <span className="ops-timeline-tooltip-dot" style={{ background: CHART_COLORS.actual }} />
                <span className="ops-timeline-tooltip-label">실시</span>
                <strong>{data.actual}건</strong>
            </div>
            <div className="ops-timeline-tooltip-row">
                <span className="ops-timeline-tooltip-dot" style={{ background: CHART_COLORS.incoming }} />
                <span className="ops-timeline-tooltip-label">수신</span>
                <strong>{data.incoming}건</strong>
            </div>
        </div>
    );
};

/**
 * OperationsTimeline
 *
 * Horizontal stacked bar chart with start/end time selectors.
 */
export default function OperationsTimeline({
    data,
    loading = false,
}: OperationsTimelineProps) {
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(18);

    // Handle start hour change - ensure it doesn't exceed end hour
    const handleStartChange = (value: number) => {
        if (value < endHour) {
            setStartHour(value);
        }
    };

    // Handle end hour change - ensure it doesn't go below start hour
    const handleEndChange = (value: number) => {
        if (value > startHour) {
            setEndHour(value);
        }
    };

    // Use provided data or generate mock based on selected range
    const displayData = useMemo(() => {
        if (data) {
            // Filter provided data by selected range
            return data.filter((item) => {
                const hour = parseInt(item.hour.split(':')[0], 10);
                return hour >= startHour && hour <= endHour;
            });
        }
        return generateMockData(startHour, endHour);
    }, [data, startHour, endHour]);

    const chartData = useMemo(() => {
        return displayData.map((item) => ({
            ...item,
            remaining: Math.max(0, item.scheduled - item.actual),
        }));
    }, [displayData]);

    // Format hour for display
    const formatHour = (h: number) => (h < 10 ? `0${h}:00` : `${h}:00`);

    return (
        <Card padding="md" className="ops-timeline-card">
            <div className="operations-timeline-header">
                <Clock size={24} className="operations-timeline-icon-simple" />
                <h3 className="operations-timeline-title">시간대별 통화 현황</h3>
                <div className="operations-timeline-range">
                    <select
                        className="operations-timeline-range-select"
                        value={startHour}
                        onChange={(e) => handleStartChange(Number(e.target.value))}
                    >
                        {HOURS.filter((h) => h < endHour).map((h) => (
                            <option key={h} value={h}>{formatHour(h)}</option>
                        ))}
                    </select>
                    <span className="operations-timeline-range-separator">~</span>
                    <select
                        className="operations-timeline-range-select"
                        value={endHour}
                        onChange={(e) => handleEndChange(Number(e.target.value))}
                    >
                        {HOURS.filter((h) => h > startHour).map((h) => (
                            <option key={h} value={h}>{formatHour(h)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="operations-timeline-chart-horizontal">
                {loading ? (
                    <div className="operations-timeline-loading">로딩 중...</div>
                ) : (
                    <ResponsiveContainer width="100%" height={340}>
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                            style={{ outline: 'none' }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                            <XAxis
                                type="number"
                                stroke="var(--color-text-muted)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={{ stroke: 'var(--color-border)' }}
                            />
                            <YAxis
                                type="category"
                                dataKey="hour"
                                stroke="var(--color-text-primary)"
                                fontSize={13}
                                fontWeight={500}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                            <Legend
                                wrapperStyle={{ fontSize: '15px', paddingTop: '8px' }}
                                iconType="circle"
                                iconSize={10}
                                formatter={(value) => (
                                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '15px' }}>{value}</span>
                                )}
                            />
                            {/* Left: Actual completed */}
                            <Bar
                                dataKey="actual"
                                stackId="calls"
                                fill={CHART_COLORS.actual}
                                name="실시"
                                radius={[0, 0, 0, 0]}
                                style={{ outline: 'none' }}
                            />
                            {/* Middle: Remaining scheduled */}
                            <Bar
                                dataKey="remaining"
                                stackId="calls"
                                fill={CHART_COLORS.remaining}
                                name="예정(미실시)"
                                radius={[0, 0, 0, 0]}
                                style={{ outline: 'none' }}
                            />
                            {/* Right: Incoming calls */}
                            <Bar
                                dataKey="incoming"
                                stackId="calls"
                                fill={CHART_COLORS.incoming}
                                name="수신"
                                radius={[0, 4, 4, 0]}
                                style={{ outline: 'none' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Card>
    );
}
