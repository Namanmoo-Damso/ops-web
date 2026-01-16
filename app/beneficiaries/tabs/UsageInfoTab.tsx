'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Copy,
  Phone,
  Timer,
  TrendingUp,
  Loader2,
  Save,
  Check,
  X,
} from 'lucide-react';
import styles from '../DetailModal.module.css';
import { SectionTitle } from '../../../components/ui';
import {
  useBeneficiaryStatsApi,
  BeneficiaryUsageStats,
  BeneficiarySchedule,
} from '../../../hooks';
import {
  type PeriodFilter,
  PERIOD_LABELS,
  getDateRangeForPeriod,
  getStartOfMonth,
  getDaysInMonth,
  parseDateInput,
} from '../../../lib/date-utils';

// Days of the week - matching Korean display order (Mon-Sun)
const DAYS_DISPLAY = ['월', '화', '수', '목', '금', '토', '일'] as const;
type DayDisplay = (typeof DAYS_DISPLAY)[number];

// API day names (matching backend format)
type DayName =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

// Mapping from display to API format
const DAY_TO_API: Record<DayDisplay, DayName> = {
  일: 'sunday',
  월: 'monday',
  화: 'tuesday',
  수: 'wednesday',
  목: 'thursday',
  금: 'friday',
  토: 'saturday',
};

// Mapping from API to display format
const API_TO_DAY: Record<DayName, DayDisplay> = {
  sunday: '일',
  monday: '월',
  tuesday: '화',
  wednesday: '수',
  thursday: '목',
  friday: '금',
  saturday: '토',
};

// Schedule type with nullable values
type DailySchedule = Record<DayDisplay, string | null>;

const DEFAULT_SCHEDULE: DailySchedule = {
  월: null,
  화: null,
  수: null,
  목: null,
  금: null,
  토: null,
  일: null,
};

// Exclude 'custom' for this component
type UsagePeriodFilter = Exclude<PeriodFilter, 'custom'>;

// Generate time slots (10-minute intervals)
function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  // 10-minute intervals
  // Review feedback: ensure last slot logic is consistent
  for (let t = startTotal; t < endTotal; t += 10) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(
      `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
    );
  }

  // Fallback if empty (e.g. invalid range)
  if (slots.length === 0 && startTime) {
    slots.push(startTime);
  }

  return slots;
}

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
    loading: apiLoading,
    error: apiError,
    getUsageStats,
    getSchedule,
    updateSchedule,
  } = useBeneficiaryStatsApi();

  // Stats state (from API)
  const [stats, setStats] = useState<BeneficiaryUsageStats | null>(null);
  const [callDates, setCallDates] = useState<string[]>([]);

  // Schedule state - defaults to all null (no schedule)
  const [schedule, setSchedule] = useState<DailySchedule>(DEFAULT_SCHEDULE);
  const [originalSchedule, setOriginalSchedule] =
    useState<DailySchedule>(DEFAULT_SCHEDULE);
  const [applyAllTime, setApplyAllTime] = useState('09:00');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Organization service hours
  const [serviceHours, setServiceHours] = useState({
    startTime: '09:00',
    endTime: '18:00',
  });

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

  // Generate time slots based on service hours
  const timeSlots = useMemo(
    () => generateTimeSlots(serviceHours.startTime, serviceHours.endTime),
    [serviceHours],
  );

  // Check if schedule has changes
  const hasScheduleChanges = useMemo(() => {
    return DAYS_DISPLAY.some(day => schedule[day] !== originalSchedule[day]);
  }, [schedule, originalSchedule]);

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
  }, [beneficiaryId, startDate, endDate, getUsageStats]);

  // Fetch schedule on mount
  const fetchSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const result = await getSchedule(String(beneficiaryId));
      if (result && result.schedule) {
        const newSchedule: DailySchedule = { ...DEFAULT_SCHEDULE };
        (Object.keys(result.schedule) as DayName[]).forEach((apiDay) => {
          const displayDay = API_TO_DAY[apiDay];
          if (displayDay) {
            newSchedule[displayDay] = result.schedule[apiDay];
          }
        });
        setSchedule(newSchedule);
        setOriginalSchedule(newSchedule);
        setServiceHours(result.organizationServiceHours);
      } else {
        setSchedule(DEFAULT_SCHEDULE);
        setOriginalSchedule(DEFAULT_SCHEDULE);
      }
    } catch (e) {
      console.error('Fetch schedule failed', e);
      setSchedule(DEFAULT_SCHEDULE);
      setOriginalSchedule(DEFAULT_SCHEDULE);
    } finally {
      setScheduleLoading(false);
    }
  }, [beneficiaryId, getSchedule]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleTimeChange = (day: DayDisplay, time: string | null) => {
    setSchedule(prev => ({ ...prev, [day]: time }));
    setSaveSuccess(false);
  };

  const handleApplyAll = () => {
    const newSchedule: DailySchedule = {} as DailySchedule;
    DAYS_DISPLAY.forEach(day => {
      newSchedule[day] = applyAllTime;
    });
    setSchedule(newSchedule);
    setSaveSuccess(false);
  };

  const handleSaveSchedule = async () => {
    setScheduleLoading(true);
    setSaveSuccess(false);

    try {
      const apiSchedule: Record<DayName, string | null> = {
        sunday: schedule['일'],
        monday: schedule['월'],
        tuesday: schedule['화'],
        wednesday: schedule['수'],
        thursday: schedule['목'],
        friday: schedule['금'],
        saturday: schedule['토'],
      };

      const result = await updateSchedule(String(beneficiaryId), apiSchedule);
      if (result) {
        setOriginalSchedule({ ...schedule });
        setSaveSuccess(true);
      } else {
        alert('스케줄 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setScheduleLoading(false);
    }
  };

  // Cleanup for success message
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (saveSuccess) {
      timer = setTimeout(() => setSaveSuccess(false), 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [saveSuccess]);

  const handleCancelSchedule = () => {
    setSchedule({ ...originalSchedule });
    setSaveSuccess(false);
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
          {apiLoading ? (
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
          ) : apiError ? (
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
              <select
                value={applyAllTime}
                onChange={e => setApplyAllTime(e.target.value)}
                className={styles.usageTimeSelect}
              >
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
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
            {DAYS_DISPLAY.map(day => {
              const isDisabled = schedule[day] === null;
              return (
                <div
                  key={day}
                  className={`${styles.usageScheduleRow} ${isDisabled ? styles.usageScheduleRowDisabled : ''}`}
                >
                  <span className={styles.usageDayLabel}>{day}요일</span>
                  <select
                    value={schedule[day] ?? ''}
                    onChange={e =>
                      handleTimeChange(
                        day,
                        e.target.value === '' ? null : e.target.value,
                      )
                    }
                    className={styles.usageTimeSelect}
                  >
                    <option value="">없음</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          {/* Save/Cancel Buttons */}
          <div className={styles.usageScheduleFooter}>
            {hasScheduleChanges && (
              <button
                type="button"
                onClick={handleCancelSchedule}
                disabled={scheduleLoading}
                className={styles.usageCancelBtn}
              >
                <X size={16} />
                <span>취소</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveSchedule}
              disabled={scheduleLoading || !hasScheduleChanges}
              className={`${styles.usageSaveBtn} ${saveSuccess ? styles.usageSaveBtnSuccess : ''}`}
            >
              {scheduleLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={16} />
                  <span>저장 완료</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>저장</span>
                </>
              )}
            </button>
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
