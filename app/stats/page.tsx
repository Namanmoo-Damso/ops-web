'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Card from '../../components/ui/Card';
import StatsSummary from '../../components/ui/StatsSummary';
import {
  ChartSettingsButton,
  CHART_COLORS,
  type ChartDisplayConfig,
} from '../../components/ui/ChartSettings';
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
  Loader2,
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
import { useDashboardApi, StatsResponse } from '../../hooks';
import {
  formatDateToInput,
  parseDateInput,
  getDateRangeForStatsPeriod,
  type StatsPeriodFilter,
  STATS_PERIOD_LABELS,
} from '../../lib/date-utils';

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
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Handle future dates (negative diff)
  if (diffMs < 0) return '예정';

  if (diffDays > 0) return `${diffDays}일 전`;
  if (diffHours > 0) return `${diffHours}시간 전`;
  if (diffMinutes > 0) return `${diffMinutes}분 전`;
  return '방금 전';
}

// --- Page Component ---
export default function StatsPage() {
  const { getStats } = useDashboardApi();

  // Period and date state - defaults to daily (today)
  const [period, setPeriod] = useState<StatsPeriodFilter>('daily');
  const [startDate, setStartDate] = useState(
    () => getDateRangeForStatsPeriod('daily').startDate,
  );
  const [endDate, setEndDate] = useState(
    () => getDateRangeForStatsPeriod('daily').endDate,
  );
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // API data state
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle period change - recalculate both start and end dates
  const handlePeriodChange = useCallback((newPeriod: StatsPeriodFilter) => {
    setPeriod(newPeriod);
    const range = getDateRangeForStatsPeriod(newPeriod);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }, []);

  // Handle manual date input changes
  const handleStartDateChange = useCallback((value: string) => {
    const parsed = parseDateInput(value);
    if (parsed) {
      setStartDate(value);
    }
  }, []);

  const handleEndDateChange = useCallback((value: string) => {
    const parsed = parseDateInput(value);
    if (parsed) {
      setEndDate(value);
    }
  }, []);

  // Load stats on mount
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      const result = await getStats();
      if (result) {
        setStats(result);
      }
      setIsLoading(false);
    };
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chart display settings (axis labels, display options - not data manipulation)
  const [trendChartConfig, setTrendChartConfig] = useState<ChartDisplayConfig>({
    title: '통화 추이',
    xAxisLabel: '요일',
    yAxisLabel: '건수',
    showLegend: true,
    showGrid: true,
  });

  const [scheduleChartConfig, setScheduleChartConfig] =
    useState<ChartDisplayConfig>({
      title: '시간대별 통화 스케줄',
      xAxisLabel: '시간대',
      yAxisLabel: '건수',
      showLegend: true,
      showGrid: true,
    });

  const [keywordsChartConfig, setKeywordsChartConfig] =
    useState<ChartDisplayConfig>({
      title: '주요 언급 키워드',
      xAxisLabel: '키워드',
      yAxisLabel: '언급 횟수',
      showLegend: false,
      showGrid: true,
    });

  const [sentimentChartConfig, setSentimentChartConfig] =
    useState<ChartDisplayConfig>({
      title: '정서 분석',
      xAxisLabel: '',
      yAxisLabel: '',
      showLegend: true,
      showGrid: false,
    });

  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  const handleDownload = () => {
    // TODO: Implement download modal with component selection
    setDownloadMessage('다운로드 기능은 추후 구현 예정입니다.');
    // Auto-hide after 3 seconds
    setTimeout(() => setDownloadMessage(null), 3000);
  };

  // Transform API data to component formats
  const callStats = stats
    ? {
        totalCalls: stats.overview.totalCalls,
        avgCallsPerWard:
          stats.overview.totalWards > 0
            ? Math.round(
                (stats.overview.totalCalls / stats.overview.totalWards) * 10,
              ) / 10
            : 0,
        avgCallDuration: `${stats.todayStats.avgDuration}분`,
        inboundCalls: Math.round(stats.overview.totalCalls * 0.25), // Estimate - API doesn't have this breakdown for all-time
        outboundCalls: Math.round(stats.overview.totalCalls * 0.75),
      }
    : MOCK_CALL_STATS;

  const weeklyTrendData = stats?.weeklyTrend
    ? stats.weeklyTrend.labels.map((label, i) => ({
        dayLabel: label,
        calls: stats.weeklyTrend.calls[i] || 0,
        emergencies: stats.weeklyTrend.emergencies[i] || 0,
      }))
    : MOCK_WEEKLY_TREND;

  const sentimentData = stats?.moodDistribution
    ? [
        {
          name: '긍정',
          value: stats.moodDistribution.positive,
          color: MOOD_COLORS.positive,
        },
        {
          name: '중립',
          value: stats.moodDistribution.neutral,
          color: MOOD_COLORS.neutral,
        },
        {
          name: '부정',
          value: stats.moodDistribution.negative,
          color: MOOD_COLORS.negative,
        },
      ]
    : MOCK_SENTIMENT_DATA;

  const keywordsData =
    stats?.topKeywords && stats.topKeywords.length > 0
      ? stats.topKeywords
      : MOCK_KEYWORDS;

  const riskCount = stats?.healthAlerts?.warning || MOCK_RISK_COUNT;
  const riskResponseCount = MOCK_RISK_RESPONSE_COUNT;
  const riskReports = MOCK_RISK_REPORTS;

  return (
    <DashboardLayout>
      <div className="stats-container">
        {/* Notification Toast */}
        {downloadMessage && (
          <div
            className="stats-notification-toast"
            role="alert"
            aria-live="polite"
          >
            {downloadMessage}
          </div>
        )}

        {/* Period Filter */}
        <div className="stats-filter-section">
          <div className="stats-filter-presets">
            {(Object.keys(STATS_PERIOD_LABELS) as StatsPeriodFilter[]).map(
              key => (
                <button
                  key={key}
                  className={`stats-filter-btn ${period === key ? 'active' : ''}`}
                  onClick={() => handlePeriodChange(key)}
                >
                  {STATS_PERIOD_LABELS[key]}
                </button>
              ),
            )}
          </div>
          <div className="stats-filter-dates">
            <input
              type="date"
              className="stats-date-input"
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>~</span>
            <input
              type="date"
              className="stats-date-input"
              value={endDate}
              onChange={e => handleEndDateChange(e.target.value)}
            />
          </div>
          <div className="stats-filter-spacer" />
          <button className="stats-download-btn" onClick={handleDownload}>
            <Download size={16} />
            다운로드
          </button>
        </div>

        {/* Call Statistics - Combined Module */}
        <StatsSummary
          title="통화 통계"
          icon={<Phone size={20} />}
          items={[
            {
              label: '총 통화 건수',
              value: `${callStats.totalCalls.toLocaleString()}건`,
              color: 'var(--color-primary)',
              subtext: `수신 ${callStats.inboundCalls}건 / 발신 ${callStats.outboundCalls}건`,
            },
            {
              label: '위험 대응 / 감지',
              value: `${riskResponseCount}건 / ${riskCount}건`,
              color:
                riskCount > 0
                  ? 'var(--color-danger-main)'
                  : 'var(--color-success-main)',
              subtext: `대응율 ${riskCount > 0 ? Math.round((riskResponseCount / riskCount) * 100) : 100}%`,
            },
            {
              label: '평균 통화 횟수',
              value: `${callStats.avgCallsPerWard}회`,
            },
            {
              label: '평균 통화 시간',
              value: callStats.avgCallDuration,
            },
          ]}
        />

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
                {isLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 200,
                    }}
                  >
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : (
                  <WeeklyTrendChart data={weeklyTrendData} />
                )}
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="stats-chart-card">
              <div className="stats-chart-header">
                <PieChart size={20} color={CHART_COLORS.primary} />
                <h3 className="stats-chart-title">
                  {sentimentChartConfig.title}
                </h3>
                <ChartSettingsButton
                  config={sentimentChartConfig}
                  onSave={setSentimentChartConfig}
                />
              </div>
              <div
                className="stats-chart-body"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xl)',
                }}
              >
                <div style={{ flex: 1 }}>
                  {isLoading ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 200,
                      }}
                    >
                      <Loader2 className="animate-spin" size={24} />
                    </div>
                  ) : (
                    <MoodPieChart data={sentimentData} />
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                  }}
                >
                  {sentimentData.map(item => (
                    <div
                      key={item.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: item.color,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
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
                <h3 className="stats-chart-title">
                  {scheduleChartConfig.title}
                </h3>
                <ChartSettingsButton
                  config={scheduleChartConfig}
                  onSave={setScheduleChartConfig}
                />
              </div>
              <div className="stats-chart-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={MOCK_SCHEDULE_DATA}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={CHART_COLORS.border}
                    />
                    <XAxis
                      dataKey="time"
                      stroke={CHART_COLORS.muted}
                      fontSize={12}
                    />
                    <YAxis stroke={CHART_COLORS.muted} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: CHART_COLORS.background,
                        border: `1px solid ${CHART_COLORS.primaryLight}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill={CHART_COLORS.success}
                      name="완료"
                    />
                    <Bar
                      dataKey="scheduled"
                      stackId="a"
                      fill={CHART_COLORS.primary}
                      name="예약"
                    />
                    <Bar
                      dataKey="incoming"
                      stackId="a"
                      fill={CHART_COLORS.info}
                      name="추가"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="stats-chart-card">
              <div className="stats-chart-header">
                <MessageSquare size={20} color={CHART_COLORS.primary} />
                <h3 className="stats-chart-title">
                  {keywordsChartConfig.title}
                </h3>
                <ChartSettingsButton
                  config={keywordsChartConfig}
                  onSave={setKeywordsChartConfig}
                />
              </div>
              <div className="stats-chart-body">
                {isLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 200,
                    }}
                  >
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : (
                  <KeywordsBarChart data={keywordsData} />
                )}
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
                <div
                  className={`stats-risk-count ${riskCount === 0 ? 'safe' : ''}`}
                >
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
                  <div className="stats-empty-title">
                    위험 감지 내역이 없습니다
                  </div>
                  <div className="stats-empty-desc">
                    모든 대상자가 안전한 상태입니다.
                  </div>
                </div>
              ) : (
                riskReports.map(report => (
                  <div key={report.id} className="stats-risk-report-item">
                    <div className="stats-risk-report-icon">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="stats-risk-report-content">
                      <p className="stats-risk-report-title">
                        {report.wardName}
                      </p>
                      <p className="stats-risk-report-desc">
                        {report.description}
                      </p>
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
