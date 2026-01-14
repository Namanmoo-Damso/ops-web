'use client';

import { useState, useMemo, useEffect } from 'react';
import { Clock, Copy, Phone, Timer, TrendingUp } from 'lucide-react';
import styles from '../DetailModal.module.css';
import { SectionTitle } from '../../../components/ui';

// Days of the week
const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
type Day = typeof DAYS[number];

// Schedule type
type DailySchedule = Record<Day, string>;

// Period type
type PeriodFilter = 'today' | 'week' | 'month' | '3month' | '6month' | 'year';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
    today: '오늘',
    week: '주간',
    month: '월간',
    '3month': '3개월',
    '6month': '6개월',
    year: '1년',
};

// Mock call dates for calendar
const MOCK_CALL_DATES = ['2026-01-02', '2026-01-03', '2026-01-05', '2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10', '2026-01-11'];

// Mock stats
const MOCK_STATS = {
    callCount: 42,
    totalMinutes: 208,
    avgMinutes: 4.95,
};

interface UsageInfoTabProps {
    beneficiaryId: string | number;
    beneficiaryName: string;
}

function formatDateToInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

function getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

// Calculate end date based on start date and period
function getEndDateForPeriod(startDateStr: string, periodKey: PeriodFilter): string {
    const start = new Date(startDateStr);
    let end: Date;

    switch (periodKey) {
        case 'today':
            end = new Date(start);
            break;
        case 'week':
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            break;
        case 'month':
            end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
            if (end.getDate() !== start.getDate()) {
                end = new Date(start.getFullYear(), start.getMonth() + 2, 0);
            }
            end.setDate(end.getDate() - 1);
            break;
        case '3month':
            end = new Date(start.getFullYear(), start.getMonth() + 3, start.getDate());
            if (end.getDate() !== start.getDate()) {
                end = new Date(start.getFullYear(), start.getMonth() + 4, 0);
            }
            end.setDate(end.getDate() - 1);
            break;
        case '6month':
            end = new Date(start.getFullYear(), start.getMonth() + 6, start.getDate());
            if (end.getDate() !== start.getDate()) {
                end = new Date(start.getFullYear(), start.getMonth() + 7, 0);
            }
            end.setDate(end.getDate() - 1);
            break;
        case 'year':
            end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
            if (end.getDate() !== start.getDate()) {
                end = new Date(start.getFullYear() + 1, start.getMonth() + 1, 0);
            }
            end.setDate(end.getDate() - 1);
            break;
        default:
            end = new Date(start);
    }

    return formatDateToInput(end);
}

export default function UsageInfoTab({
    beneficiaryId,
    beneficiaryName,
}: UsageInfoTabProps) {
    // Schedule state
    const [schedule, setSchedule] = useState<DailySchedule>({
        '월': '09:00', '화': '09:00', '수': '09:00', '목': '09:00',
        '금': '09:00', '토': '10:00', '일': '10:00',
    });
    const [applyAllTime, setApplyAllTime] = useState('09:00');

    // Period and date state - start date defaults to today
    const [period, setPeriod] = useState<PeriodFilter>('month');
    const [startDate, setStartDate] = useState(() => formatDateToInput(new Date()));
    const [endDate, setEndDate] = useState(() => getEndDateForPeriod(formatDateToInput(new Date()), 'month'));

    // Calendar state
    const [calendarMonth, setCalendarMonth] = useState(() => getStartOfMonth(new Date()));

    // Update end date when period or start date changes
    useEffect(() => {
        const newEndDate = getEndDateForPeriod(startDate, period);
        setEndDate(newEndDate);
    }, [period, startDate]);

    const handleTimeChange = (day: Day, time: string) => {
        setSchedule(prev => ({ ...prev, [day]: time }));
    };

    const handleApplyAll = () => {
        const newSchedule: DailySchedule = {} as DailySchedule;
        DAYS.forEach(day => { newSchedule[day] = applyAllTime; });
        setSchedule(newSchedule);
    };

    const handlePeriodChange = (newPeriod: PeriodFilter) => {
        setPeriod(newPeriod);
    };

    const handleStartDateChange = (value: string) => {
        setStartDate(value);
    };

    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfWeek = new Date(year, month, 1).getDay();
        const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        const days: { date: string; dayNum: number; hasCall: boolean; isCurrentMonth: boolean }[] = [];
        for (let i = 0; i < adjustedFirstDay; i++) {
            days.push({ date: '', dayNum: 0, hasCall: false, isCurrentMonth: false });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ date: dateStr, dayNum: d, hasCall: MOCK_CALL_DATES.includes(dateStr), isCurrentMonth: true });
        }
        return days;
    }, [calendarMonth]);

    return (
        <div className={styles.usageTabContent}>
            {/* Stats Section - Full Width at Top */}
            <section className={styles.usageStatsSection}>
                <div className={styles.usageStatsHeader}>
                    <SectionTitle>사용 통계</SectionTitle>
                    <div className={styles.usageFilterRow}>
                        <select
                            value={period}
                            onChange={e => handlePeriodChange(e.target.value as PeriodFilter)}
                            className={styles.periodSelect}
                        >
                            {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map(p => (
                                <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                            ))}
                        </select>
                        <div className={styles.usageDateInputs}>
                            <input type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} className={styles.usageDateInput} />
                            <span className={styles.usageDateSep}>~</span>
                            <input type="date" value={endDate} readOnly className={styles.usageDateInput} />
                        </div>
                    </div>
                </div>
                {/* Stats Row - Horizontal with icon on left */}
                <div className={styles.usageStatsRow}>
                    <div className={styles.usageStatItemV}>
                        <Phone size={20} className={styles.usageStatIcon} />
                        <div className={styles.usageStatTextGroup}>
                            <span className={styles.usageStatValue}>{MOCK_STATS.callCount}회</span>
                            <span className={styles.usageStatLabel}>통화 횟수</span>
                        </div>
                    </div>
                    <div className={styles.usageStatDivider} />
                    <div className={styles.usageStatItemV}>
                        <Timer size={20} className={styles.usageStatIcon} />
                        <div className={styles.usageStatTextGroup}>
                            <span className={styles.usageStatValue}>{Math.floor(MOCK_STATS.totalMinutes / 60)}시간 {MOCK_STATS.totalMinutes % 60}분</span>
                            <span className={styles.usageStatLabel}>총 통화 시간</span>
                        </div>
                    </div>
                    <div className={styles.usageStatDivider} />
                    <div className={styles.usageStatItemV}>
                        <TrendingUp size={20} className={styles.usageStatIcon} />
                        <div className={styles.usageStatTextGroup}>
                            <span className={styles.usageStatValue}>{Math.floor(MOCK_STATS.avgMinutes)}분 {Math.round((MOCK_STATS.avgMinutes % 1) * 60)}초</span>
                            <span className={styles.usageStatLabel}>평균 통화 시간</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Schedule + Calendar Row */}
            <div className={styles.usageBottomRow}>
                {/* Schedule Card */}
                <div className={styles.usageScheduleCard}>
                    <div className={styles.usageScheduleHeader}>
                        <span className={styles.usageScheduleTitle}>안부전화 시간</span>
                        <div className={styles.usageApplyAll}>
                            <input type="time" value={applyAllTime} onChange={e => setApplyAllTime(e.target.value)} className={styles.usageTimeInput} />
                            <button type="button" onClick={handleApplyAll} className={styles.usageApplyBtn}>
                                <Copy size={14} />
                                <span>전체 적용</span>
                            </button>
                        </div>
                    </div>
                    <div className={styles.usageScheduleList}>
                        {DAYS.map(day => (
                            <div key={day} className={styles.usageScheduleRow}>
                                <span className={styles.usageDayLabel}>{day}요일</span>
                                <input type="time" value={schedule[day]} onChange={e => handleTimeChange(day, e.target.value)} className={styles.usageTimeInput} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calendar */}
                <div className={styles.usageCalendar}>
                    <div className={styles.usageCalendarHeader}>
                        <button type="button" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className={styles.usageCalendarNav}>‹</button>
                        <span className={styles.usageCalendarMonth}>{calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월</span>
                        <button type="button" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className={styles.usageCalendarNav}>›</button>
                    </div>
                    <div className={styles.usageCalendarWeekdays}>
                        {['월', '화', '수', '목', '금', '토', '일'].map(d => (
                            <span key={d} className={styles.usageWeekdayLabel}>{d}</span>
                        ))}
                    </div>
                    <div className={styles.usageCalendarGrid}>
                        {calendarDays.map((day, idx) => (
                            <div key={idx} className={`${styles.usageCalendarDay} ${!day.isCurrentMonth ? styles.usageCalendarDayEmpty : ''} ${day.hasCall ? styles.usageCalendarDayHasCall : ''}`}>
                                {day.isCurrentMonth && day.dayNum}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
