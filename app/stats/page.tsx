'use client';

import { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import { ChartSettingsButton, CHART_COLORS, type ChartDisplayConfig } from '../../components/ui/ChartSettings';
import {
    Phone,
    Clock,
    TrendingUp,
    AlertTriangle,
    MessageSquare,
    Calendar,
    BarChart3,
    PieChart,
    ShieldAlert,
    CheckCircle2,
    Download,
} from 'lucide-react';
import {
    WeeklyTrendChart,
    MoodPieChart,
    KeywordsBarChart,
    MOOD_COLORS,
} from '../../components/DashboardCharts';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// --- Types ---
type PeriodFilter = 'daily' | 'weekly' | 'monthly' | '3months' | '6months' | '1year';

// --- Mock Data ---
const MOCK_CALL_STATS = {
    totalCalls: 1247,
    avgCallsPerWard: 8.3,
    avgCallDuration: '12분 18초',
    inboundCalls: 312,
    outboundCalls: 935,
};

const MOCK_SENTIMENT_DATA = [
    { name: '긍정', value: 68, color: MOOD_COLORS.positive },
    { name: '중립', value: 24, color: MOOD_COLORS.neutral },
    { name: '부정', value: 8, color: MOOD_COLORS.negative },
];

const MOCK_WEEKLY_TREND = [
    { dayLabel: '월', calls: 45, emergencies: 1 },
    { dayLabel: '화', calls: 52, emergencies: 0 },
    { dayLabel: '수', calls: 48, emergencies: 2 },
    { dayLabel: '목', calls: 55, emergencies: 0 },
    { dayLabel: '금', calls: 60, emergencies: 1 },
    { dayLabel: '토', calls: 38, emergencies: 0 },
    { dayLabel: '일', calls: 35, emergencies: 0 },
];

const MOCK_SCHEDULE_DATA = [
    { time: '08-10시', scheduled: 25, completed: 22, incoming: 5 },
    { time: '10-12시', scheduled: 45, completed: 43, incoming: 12 },
    { time: '12-14시', scheduled: 20, completed: 18, incoming: 8 },
    { time: '14-16시', scheduled: 50, completed: 47, incoming: 15 },
    { time: '16-18시', scheduled: 35, completed: 32, incoming: 10 },
    { time: '18-20시', scheduled: 15, completed: 14, incoming: 3 },
];

const MOCK_KEYWORDS = [
    { keyword: '건강', count: 156 },
    { keyword: '약', count: 132 },
    { keyword: '병원', count: 98 },
    { keyword: '가족', count: 87 },
    { keyword: '식사', count: 76 },
    { keyword: '수면', count: 65 },
    { keyword: '외출', count: 54 },
    { keyword: '통증', count: 43 },
];

const MOCK_RISK_COUNT: number = 3;
const MOCK_RISK_RESPONSE_COUNT: number = 2;

const MOCK_RISK_REPORTS = [
    {
        id: '1',
        wardName: '김영숙',
        description: '낙상 위험 감지 - 갑작스러운 움직임 패턴',
        timestamp: '2026-01-10T08:32:00Z',
    },
    {
        id: '2',
        wardName: '이순자',
        description: '우울 경향 감지 - 부정적 감정 표현 증가',
        timestamp: '2026-01-09T14:15:00Z',
    },
    {
        id: '3',
        wardName: '박정희',
        description: '약 복용 누락 가능성 - 복용 확인 미응답',
        timestamp: '2026-01-08T19:45:00Z',
    },
];

// --- Helper Functions ---
function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}일 전`;
    if (diffHours > 0) return `${diffHours}시간 전`;
    return '방금 전';
}

function formatDateToInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getEndDateForPeriod(startDateStr: string, periodKey: PeriodFilter): string {
    const start = new Date(startDateStr);
    const end = new Date(start);

    switch (periodKey) {
        case 'daily':
            // Same day
            break;
        case 'weekly':
            end.setDate(start.getDate() + 6);
            break;
        case 'monthly':
            end.setMonth(start.getMonth() + 1);
            end.setDate(end.getDate() - 1);
            break;
        case '3months':
            end.setMonth(start.getMonth() + 3);
            end.setDate(end.getDate() - 1);
            break;
        case '6months':
            end.setMonth(start.getMonth() + 6);
            end.setDate(end.getDate() - 1);
            break;
        case '1year':
            end.setFullYear(start.getFullYear() + 1);
            end.setDate(end.getDate() - 1);
            break;
    }

    return formatDateToInput(end);
}

const PERIOD_LABELS: Record<PeriodFilter, string> = {
    daily: '일간',
    weekly: '주간',
    monthly: '월간',
    '3months': '3개월',
    '6months': '6개월',
    '1year': '1년',
};

// --- Page Component ---
export default function StatsPage() {
    const [period, setPeriod] = useState<PeriodFilter>('daily');
    const [startDate, setStartDate] = useState(() => formatDateToInput(new Date()));
    const [endDate, setEndDate] = useState(() => formatDateToInput(new Date()));
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // Chart display settings (axis labels, display options - not data manipulation)
    const [trendChartConfig, setTrendChartConfig] = useState<ChartDisplayConfig>({
        title: '통화 추이',
        xAxisLabel: '요일',
        yAxisLabel: '건수',
        showLegend: true,
        showGrid: true,
    });

    const [scheduleChartConfig, setScheduleChartConfig] = useState<ChartDisplayConfig>({
        title: '시간대별 통화 스케줄',
        xAxisLabel: '시간대',
        yAxisLabel: '건수',
        showLegend: true,
        showGrid: true,
    });

    const [keywordsChartConfig, setKeywordsChartConfig] = useState<ChartDisplayConfig>({
        title: '주요 언급 키워드',
        xAxisLabel: '키워드',
        yAxisLabel: '언급 횟수',
        showLegend: false,
        showGrid: true,
    });

    const [sentimentChartConfig, setSentimentChartConfig] = useState<ChartDisplayConfig>({
        title: '정서 분석',
        xAxisLabel: '',
        yAxisLabel: '',
        showLegend: true,
        showGrid: false,
    });

    // Update dates when period changes
    const handlePeriodChange = (newPeriod: PeriodFilter) => {
        setPeriod(newPeriod);
        const newEndDate = getEndDateForPeriod(startDate, newPeriod);
        setEndDate(newEndDate);
    };

    // Handle start date change - auto-update end date based on period
    const handleStartDateChange = (value: string) => {
        setStartDate(value);
        const newEndDate = getEndDateForPeriod(value, period);
        setEndDate(newEndDate);
    };

    // Handle end date change - manual override
    const handleEndDateChange = (value: string) => {
        setEndDate(value);
    };

    const handleDownload = () => {
        // TODO: Implement download modal with component selection
        alert('다운로드 기능은 추후 구현 예정입니다. 리포트 구성 요소를 선택하여 다운로드할 수 있습니다.');
    };

    // In real implementation, this would fetch data based on period/dates
    const callStats = MOCK_CALL_STATS;
    const riskCount = MOCK_RISK_COUNT;
    const riskResponseCount = MOCK_RISK_RESPONSE_COUNT;
    const riskReports = MOCK_RISK_REPORTS;

    return (
        <DashboardLayout>
            <div className="stats-container">
                {/* Page Header
                <div className="stats-page-header">
                    <h1 className="stats-page-title">통계 및 리포트</h1>
                    <p className="stats-page-description">
                        기간별 통화 데이터, 정서 분석, 위험 감지 현황을 확인합니다.
                    </p>
                </div> */}

                {/* Period Filter */}
                <div className="stats-filter-section">
                    <div className="stats-filter-presets">
                        {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((key) => (
                            <button
                                key={key}
                                className={`stats-filter-btn ${period === key ? 'active' : ''}`}
                                onClick={() => handlePeriodChange(key)}
                            >
                                {PERIOD_LABELS[key]}
                            </button>
                        ))}
                    </div>
                    <div className="stats-filter-dates">
                        <input
                            type="date"
                            className="stats-date-input"
                            value={startDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                        />
                        <span style={{ color: 'var(--color-text-muted)' }}>~</span>
                        <input
                            type="date"
                            className="stats-date-input"
                            value={endDate}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                        />
                    </div>
                    <div className="stats-filter-spacer" />
                    <button className="stats-download-btn" onClick={handleDownload}>
                        <Download size={16} />
                        다운로드
                    </button>
                </div>

                {/* Call Statistics - Combined Module */}
                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                        <Phone size={20} color="var(--color-primary)" />
                        <h3 style={{ fontSize: 'var(--font-size-h2)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>통화 통계</h3>
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xl)',
                        paddingBottom: 'var(--spacing-lg)',
                        borderBottom: '1px solid var(--color-border)',
                    }}>
                        {/* 총 통화 건수 */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--font-size-label)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                                총 통화 건수
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-primary)' }}>
                                {callStats.totalCalls.toLocaleString()}건
                            </div>
                            <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
                                수신 {callStats.inboundCalls}건 / 발신 {callStats.outboundCalls}건
                            </div>
                        </div>

                        <div style={{ width: '1px', height: '60px', backgroundColor: 'var(--color-border)' }} />

                        {/* 위험 감지 / 대응 */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--font-size-label)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                                위험 대응 / 감지
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: riskCount > 0 ? 'var(--color-danger-main)' : 'var(--color-success-main)' }}>
                                {riskResponseCount}건 / {riskCount}건
                            </div>
                            <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
                                대응율 {riskCount > 0 ? Math.round((riskResponseCount / riskCount) * 100) : 100}%
                            </div>
                        </div>

                        <div style={{ width: '1px', height: '60px', backgroundColor: 'var(--color-border)' }} />

                        {/* 평균 통화 횟수 */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--font-size-label)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                                평균 통화 횟수
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                                {callStats.avgCallsPerWard}회
                            </div>
                        </div>

                        <div style={{ width: '1px', height: '60px', backgroundColor: 'var(--color-border)' }} />

                        {/* 평균 통화 시간 */}
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 'var(--font-size-label)', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)', fontWeight: 600 }}>
                                평균 통화 시간
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                                {callStats.avgCallDuration}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Charts Row 1: Weekly Trend + Sentiment */}
                <div className="stats-charts-row">
                    <Card padding="lg">
                        <div className="stats-chart-card">
                            <div className="stats-chart-header">
                                <BarChart3 size={20} color={CHART_COLORS.primary} />
                                <h3 className="stats-chart-title">{trendChartConfig.title}</h3>
                                <ChartSettingsButton
                                    config={trendChartConfig}
                                    onSave={setTrendChartConfig}
                                />
                            </div>
                            <div className="stats-chart-body">
                                <WeeklyTrendChart data={MOCK_WEEKLY_TREND} />
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <div className="stats-chart-card">
                            <div className="stats-chart-header">
                                <PieChart size={20} color={CHART_COLORS.primary} />
                                <h3 className="stats-chart-title">{sentimentChartConfig.title}</h3>
                                <ChartSettingsButton
                                    config={sentimentChartConfig}
                                    onSave={setSentimentChartConfig}
                                />
                            </div>
                            <div className="stats-chart-body" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)' }}>
                                <div style={{ flex: 1 }}>
                                    <MoodPieChart data={MOCK_SENTIMENT_DATA} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                    {MOCK_SENTIMENT_DATA.map((item) => (
                                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <div
                                                style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    backgroundColor: item.color,
                                                }}
                                            />
                                            <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-text-secondary)' }}>
                                                {item.name}: {item.value}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts Row 2: Schedule + Keywords */}
                <div className="stats-charts-row">
                    <Card padding="lg">
                        <div className="stats-chart-card">
                            <div className="stats-chart-header">
                                <Calendar size={20} color={CHART_COLORS.primary} />
                                <h3 className="stats-chart-title">{scheduleChartConfig.title}</h3>
                                <ChartSettingsButton
                                    config={scheduleChartConfig}
                                    onSave={setScheduleChartConfig}
                                />
                            </div>
                            <div className="stats-chart-body">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={MOCK_SCHEDULE_DATA}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                                        <XAxis dataKey="time" stroke={CHART_COLORS.muted} fontSize={12} />
                                        <YAxis stroke={CHART_COLORS.muted} fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: CHART_COLORS.background,
                                                border: `1px solid ${CHART_COLORS.primaryLight}`,
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Bar dataKey="completed" stackId="a" fill={CHART_COLORS.success} name="완료" />
                                        <Bar dataKey="scheduled" stackId="a" fill={CHART_COLORS.primary} name="예약" />
                                        <Bar dataKey="incoming" stackId="a" fill={CHART_COLORS.info} name="추가" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    <Card padding="lg">
                        <div className="stats-chart-card">
                            <div className="stats-chart-header">
                                <MessageSquare size={20} color={CHART_COLORS.primary} />
                                <h3 className="stats-chart-title">{keywordsChartConfig.title}</h3>
                                <ChartSettingsButton
                                    config={keywordsChartConfig}
                                    onSave={setKeywordsChartConfig}
                                />
                            </div>
                            <div className="stats-chart-body">
                                <KeywordsBarChart data={MOCK_KEYWORDS} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Risk Detection Section */}
                <Card padding="lg">
                    <div className="stats-chart-header">
                        <ShieldAlert size={20} color="var(--color-danger-main)" />
                        <h3 className="stats-chart-title">위험 감지 현황</h3>
                    </div>

                    <div className="stats-risk-section">
                        {/* Risk Summary */}
                        <div className="stats-risk-summary">
                            <Card padding="lg" className="stats-risk-count-card">
                                <div className={`stats-risk-count ${riskCount === 0 ? 'safe' : ''}`}>
                                    {riskCount}
                                </div>
                                <div className="stats-risk-label">
                                    {riskCount > 0 ? '위험 감지 건수' : '현재 안전합니다'}
                                </div>
                            </Card>
                        </div>

                        {/* Risk Reports List */}
                        <div className="stats-risk-report-list">
                            {riskReports.length === 0 ? (
                                <div className="stats-empty-state">
                                    <div className="stats-empty-icon">✅</div>
                                    <div className="stats-empty-title">위험 감지 내역이 없습니다</div>
                                    <div className="stats-empty-desc">모든 대상자가 안전한 상태입니다.</div>
                                </div>
                            ) : (
                                riskReports.map((report) => (
                                    <div key={report.id} className="stats-risk-report-item">
                                        <div className="stats-risk-report-icon">
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div className="stats-risk-report-content">
                                            <p className="stats-risk-report-title">{report.wardName}</p>
                                            <p className="stats-risk-report-desc">{report.description}</p>
                                        </div>
                                        <div className="stats-risk-report-time">
                                            {formatTimeAgo(report.timestamp)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
