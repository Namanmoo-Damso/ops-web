'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Copy, Phone, Timer, TrendingUp, Loader2 } from 'lucide-react';
import styles from '../DetailModal.module.css';
import { SectionTitle } from '../../../components/ui';
import { useBeneficiaryStatsApi, BeneficiaryUsageStats } from '../../../hooks';
import {
  type PeriodFilter,
  PERIOD_LABELS,
  formatDateToInput,
  getDateRangeForPeriod,
  getStartOfMonth,
  getDaysInMonth,
  parseDateInput,
} from '../../../lib/date-utils';

// Days of the week
const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
type Day = (typeof DAYS)[number];

// Schedule type
type DailySchedule = Record<Day, string>;

// Exclude 'custom' for this component
type UsagePeriodFilter = Exclude<PeriodFilter, 'custom'>;

interface UsageInfoTabProps {
  beneficiaryId: string | number;
  beneficiaryName: string;
}

export default function UsageInfoTab({
  beneficiaryId,
  beneficiaryName,
}: UsageInfoTabProps) {
  // API hook
  const {
    loading: statsLoading,
    error: statsError,
    getUsageStats,
  } = useBeneficiaryStatsApi();

  // Stats state (from API)
  const [stats, setStats] = useState<BeneficiaryUsageStats | null>(null);
  const [callDates, setCallDates] = useState<string[]>([]);

  // Schedule state
  const [schedule, setSchedule] = useState<DailySchedule>({
    월: '09:00',
    화: '09:00',
    수: '09:00',
    목: '09:00',
    금: '09:00',
    토: '10:00',
    일: '10:00',
  });
  const [applyAllTime, setApplyAllTime] = useState('09:00');

  // Period and date state - defaults to last month (past data)
  const [period, setPeriod] = useState<UsagePeriodFilter>('month');
  const [startDate, setStartDate] = useState(
    () => getDateRangeForPeriod('month').startDate,
  );
  const [endDate, setEndDate] = useState(
    () => getDateRangeForPeriod('month').endDate,
  );

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() =>
    getStartOfMonth(new Date()),
  );

  // Handle period change - recalculate both start and end dates
  const handlePeriodChange = useCallback((newPeriod: UsagePeriodFilter) => {
    setPeriod(newPeriod);
    const range = getDateRangeForPeriod(newPeriod);
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

  // Fetch stats when dates change
  const fetchStats = useCallback(async () => {
    // Validate dates before fetching
    if (!startDate || !endDate) return;

    const result = await getUsageStats(
      String(beneficiaryId),
      startDate,
      endDate,
    );
    if (result) {
      setStats(result);
      setCallDates(result.callDates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiaryId, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTimeChange = (day: Day, time: string) => {
    setSchedule(prev => ({ ...prev, [day]: time }));
  };

  const handleApplyAll = () => {
    const newSchedule: DailySchedule = {} as DailySchedule;
    DAYS.forEach(day => {
      newSchedule[day] = applyAllTime;
    });
    setSchedule(newSchedule);
  };

  // Computed stats for display
  const displayStats = useMemo(() => {
    if (!stats) {
      return { callCount: 0, totalMinutes: 0, avgMinutes: 0 };
    }
    return {
      callCount: stats.summary.totalCalls,
      totalMinutes: stats.summary.totalDurationMinutes,
      avgMinutes: stats.summary.averageDurationMinutes,
    };
  }, [stats]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: {
      date: string;
      dayNum: number;
      hasCall: boolean;
      isCurrentMonth: boolean;
    }[] = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ date: '', dayNum: 0, hasCall: false, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        dayNum: d,
        hasCall: callDates.includes(dateStr),
        isCurrentMonth: true,
      });
    }
    return days;
  }, [calendarMonth, callDates]);

  // Available periods for this component (exclude 'custom')
  const availablePeriods: UsagePeriodFilter[] = [
    'today',
    'week',
    'month',
    '3month',
    '6month',
    'year',
  ];

  return (
    <div className={styles.usageTabContent}>
      {/* Stats Section - Full Width at Top */}
      <section className={styles.usageStatsSection}>
        <div className={styles.usageStatsHeader}>
          <SectionTitle>사용 통계</SectionTitle>
          <div className={styles.usageFilterRow}>
            <select
              value={period}
              onChange={e =>
                handlePeriodChange(e.target.value as UsagePeriodFilter)
              }
              className={styles.periodSelect}
            >
              {availablePeriods.map(p => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
            <div className={styles.usageDateInputs}>
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className={styles.usageDateInput}
              />
              <span className={styles.usageDateSep}>~</span>
              <input
                type="date"
                value={endDate}
                onChange={e => handleEndDateChange(e.target.value)}
                className={styles.usageDateInput}
              />
            </div>
          </div>
        </div>
        {/* Stats Row - Horizontal with icon on left */}
        <div className={styles.usageStatsRow}>
          {statsLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '20px',
              }}
            >
              <Loader2 size={20} className="animate-spin" />
              <span>통계 로딩 중...</span>
            </div>
          ) : statsError ? (
            <div style={{ color: 'var(--error)', padding: '20px' }}>
              통계를 불러오지 못했습니다.
            </div>
          ) : (
            <>
              <div className={styles.usageStatItemV}>
                <Phone size={20} className={styles.usageStatIcon} />
                <div className={styles.usageStatTextGroup}>
                  <span className={styles.usageStatValue}>
                    {displayStats.callCount}회
                  </span>
                  <span className={styles.usageStatLabel}>통화 횟수</span>
                </div>
              </div>
              <div className={styles.usageStatDivider} />
              <div className={styles.usageStatItemV}>
                <Timer size={20} className={styles.usageStatIcon} />
                <div className={styles.usageStatTextGroup}>
                  <span className={styles.usageStatValue}>
                    {Math.floor(displayStats.totalMinutes / 60)}시간{' '}
                    {Math.round(displayStats.totalMinutes % 60)}분
                  </span>
                  <span className={styles.usageStatLabel}>총 통화 시간</span>
                </div>
              </div>
              <div className={styles.usageStatDivider} />
              <div className={styles.usageStatItemV}>
                <TrendingUp size={20} className={styles.usageStatIcon} />
                <div className={styles.usageStatTextGroup}>
                  <span className={styles.usageStatValue}>
                    {Math.floor(displayStats.avgMinutes)}분{' '}
                    {Math.round((displayStats.avgMinutes % 1) * 60)}초
                  </span>
                  <span className={styles.usageStatLabel}>평균 통화 시간</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Schedule + Calendar Row */}
      <div className={styles.usageBottomRow}>
        {/* Schedule Card */}
        <div className={styles.usageScheduleCard}>
          <div className={styles.usageScheduleHeader}>
            <span className={styles.usageScheduleTitle}>안부전화 시간</span>
            <div className={styles.usageApplyAll}>
              <input
                type="time"
                value={applyAllTime}
                onChange={e => setApplyAllTime(e.target.value)}
                className={styles.usageTimeInput}
              />
              <button
                type="button"
                onClick={handleApplyAll}
                className={styles.usageApplyBtn}
              >
                <Copy size={14} />
                <span>전체 적용</span>
              </button>
            </div>
          </div>
          <div className={styles.usageScheduleList}>
            {DAYS.map(day => (
              <div key={day} className={styles.usageScheduleRow}>
                <span className={styles.usageDayLabel}>{day}요일</span>
                <input
                  type="time"
                  value={schedule[day]}
                  onChange={e => handleTimeChange(day, e.target.value)}
                  className={styles.usageTimeInput}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className={styles.usageCalendar}>
          <div className={styles.usageCalendarHeader}>
            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              className={styles.usageCalendarNav}
            >
              ‹
            </button>
            <span className={styles.usageCalendarMonth}>
              {calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월
            </span>
            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              className={styles.usageCalendarNav}
            >
              ›
            </button>
          </div>
          <div className={styles.usageCalendarWeekdays}>
            {['월', '화', '수', '목', '금', '토', '일'].map(d => (
              <span key={d} className={styles.usageWeekdayLabel}>
                {d}
              </span>
            ))}
          </div>
          <div className={styles.usageCalendarGrid}>
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`${styles.usageCalendarDay} ${!day.isCurrentMonth ? styles.usageCalendarDayEmpty : ''} ${day.hasCall ? styles.usageCalendarDayHasCall : ''}`}
              >
                {day.isCurrentMonth && day.dayNum}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
