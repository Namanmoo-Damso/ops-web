'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  MessageSquare,
  Smile,
  Meh,
  Frown,
  Search,
  Calendar,
} from 'lucide-react';
import styles from '../DetailModal.module.css';
import type { BeneficiaryLog } from '../DetailModal';
import {
  type PeriodFilter,
  PERIOD_LABELS,
  formatDateToInput,
  getDateRangeForPeriod,
  parseDateInput,
} from '../../../lib/date-utils';

interface DamsoLogTabProps {
  logs: BeneficiaryLog[];
  beneficiaryName: string;
  onWriteLog?: () => void;
}

// Exclude 'custom' for this component
type LogPeriodFilter = Exclude<PeriodFilter, 'custom'>;

function getSentimentClass(
  sentiment?: 'positive' | 'neutral' | 'negative',
): string {
  switch (sentiment) {
    case 'positive':
      return styles.logCardPositive;
    case 'negative':
      return styles.logCardNegative;
    case 'neutral':
    default:
      return styles.logCardNeutral;
  }
}

function formatDateKorean(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

export default function DamsoLogTab({
  logs,
  beneficiaryName,
  onWriteLog,
}: DamsoLogTabProps) {
  // Sentiment filter
  const [sentimentFilter, setSentimentFilter] = useState<
    'all' | 'positive' | 'neutral' | 'negative'
  >('all');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Period and date filter - defaults to last month (past data)
  const [period, setPeriod] = useState<LogPeriodFilter>('month');
  const [startDate, setStartDate] = useState(
    () => getDateRangeForPeriod('month').startDate,
  );
  const [endDate, setEndDate] = useState(
    () => getDateRangeForPeriod('month').endDate,
  );

  // Today's date for max attribute
  const today = formatDateToInput(new Date());

  // Handle period change - recalculate both start and end dates
  const handlePeriodChange = useCallback((newPeriod: LogPeriodFilter) => {
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

  // Memoized filtering for performance
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Sentiment filter
      if (sentimentFilter !== 'all' && log.sentiment !== sentimentFilter) {
        return false;
      }
      // Search filter
      if (
        searchQuery &&
        !log.content.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Date range filter - extract date part from ISO string
      const logDate = log.date.split('T')[0];
      if (logDate < startDate || logDate > endDate) {
        return false;
      }
      return true;
    });
  }, [logs, sentimentFilter, searchQuery, startDate, endDate]);

  const handleWriteLog = () => {
    if (onWriteLog) {
      onWriteLog();
    } else {
      alert('담소일지 작성 기능은 준비 중입니다.');
    }
  };

  const sentimentCounts = useMemo(
    () => ({
      all: logs.length,
      positive: logs.filter(l => l.sentiment === 'positive').length,
      neutral: logs.filter(l => l.sentiment === 'neutral').length,
      negative: logs.filter(l => l.sentiment === 'negative').length,
    }),
    [logs],
  );

  // Available periods for this component
  const availablePeriods: LogPeriodFilter[] = [
    'today',
    'week',
    'month',
    '3month',
    '6month',
    'year',
  ];

  return (
    <div className={styles.logsTabContent}>
      {/* Top Row: Search + Period Filter + Write Button */}
      <div className={styles.logsTopRow}>
        {/* Search Box */}
        <div className={styles.logsSearchBox}>
          <Search size={16} className={styles.logsSearchIcon} />
          <input
            type="search"
            placeholder="일지 내용 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setSearchQuery('');
              }
            }}
            className={styles.logsSearchInput}
            aria-label="담소일지 검색"
            autoComplete="off"
          />
        </div>
        {/* Period Filter */}
        <div className={styles.usageFilterRow}>
          <select
            value={period}
            onChange={e =>
              handlePeriodChange(e.target.value as LogPeriodFilter)
            }
            className={styles.periodSelect}
            aria-label="기간 선택"
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
              max={today}
              className={styles.usageDateInput}
              aria-label="시작 날짜"
            />
            <span className={styles.usageDateSep}>~</span>
            <input
              type="date"
              value={endDate}
              onChange={e => handleEndDateChange(e.target.value)}
              max={today}
              className={styles.usageDateInput}
              aria-label="종료 날짜"
            />
          </div>
        </div>
        {/* Write Button */}
        <button
          type="button"
          className={styles.writeLogButton}
          onClick={handleWriteLog}
        >
          <Plus size={16} />
          <span>일지 작성</span>
        </button>
      </div>

      {/* Sentiment Filter */}
      <div className={styles.logsFilter}>
        <button
          type="button"
          className={`${styles.filterBtn} ${sentimentFilter === 'all' ? styles.filterBtnActive : ''}`}
          onClick={() => setSentimentFilter('all')}
        >
          전체 <span className={styles.filterCount}>{sentimentCounts.all}</span>
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${styles.filterPositive} ${sentimentFilter === 'positive' ? styles.filterBtnActive : ''}`}
          onClick={() => setSentimentFilter('positive')}
        >
          <Smile size={14} /> 긍정{' '}
          <span className={styles.filterCount}>{sentimentCounts.positive}</span>
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${styles.filterNeutral} ${sentimentFilter === 'neutral' ? styles.filterBtnActive : ''}`}
          onClick={() => setSentimentFilter('neutral')}
        >
          <Meh size={14} /> 중립{' '}
          <span className={styles.filterCount}>{sentimentCounts.neutral}</span>
        </button>
        <button
          type="button"
          className={`${styles.filterBtn} ${styles.filterNegative} ${sentimentFilter === 'negative' ? styles.filterBtnActive : ''}`}
          onClick={() => setSentimentFilter('negative')}
        >
          <Frown size={14} /> 부정{' '}
          <span className={styles.filterCount}>{sentimentCounts.negative}</span>
        </button>
      </div>

      {/* Logs List */}
      <div className={styles.logsList}>
        {filteredLogs.length === 0 ? (
          <div className={styles.emptyLogs}>
            <MessageSquare size={40} className={styles.emptyIcon} />
            <p>기록된 담소일지가 없습니다.</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className={`${styles.logCard} ${getSentimentClass(log.sentiment)}`}
            >
              <div className={styles.logCardTop}>
                <span className={styles.logType}>{log.type}</span>
                <span className={styles.logDate}>
                  <Calendar size={12} />
                  {formatDateKorean(log.date)}
                </span>
              </div>
              <p className={styles.logContent}>{log.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
