'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Smile, Meh, Frown, Calendar, Search } from 'lucide-react';
import styles from '../DetailModal.module.css';
import type { BeneficiaryLog } from '../DetailModal';

interface DamsoLogTabProps {
    logs: BeneficiaryLog[];
    beneficiaryName: string;
    onWriteLog?: () => void;
}

// Period type (reused from UsageInfoTab)
type PeriodFilter = 'today' | 'week' | 'month' | '3month' | '6month' | 'year';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
    today: '오늘',
    week: '주간',
    month: '월간',
    '3month': '3개월',
    '6month': '6개월',
    year: '1년',
};

// Mock logs for demo
const MOCK_LOGS: BeneficiaryLog[] = [
    {
        id: '1',
        date: '2026-01-11',
        type: '일일 통화',
        content: '오늘 기분이 좋다고 하셨습니다. 손녀가 방문 예정이라 기대하신다고 합니다. 건강 상태 양호.',
        sentiment: 'positive',
    },
    {
        id: '2',
        date: '2026-01-10',
        type: '일일 통화',
        content: '허리가 약간 불편하다고 하셨으나 전반적으로 건강 상태 양호합니다.',
        sentiment: 'neutral',
    },
    {
        id: '3',
        date: '2026-01-09',
        type: '방문 기록',
        content: '복지사 방문. 복약 상태 확인 및 주거 환경 점검 완료.',
        sentiment: 'neutral',
    },
    {
        id: '4',
        date: '2026-01-08',
        type: '일일 통화',
        content: '식욕이 떨어지셨다고 합니다. 보호자에게 연락 드림.',
        sentiment: 'negative',
    },
];

function formatDateToInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

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

function getSentimentClass(sentiment?: 'positive' | 'neutral' | 'negative'): string {
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
    // Use mock logs if none provided
    const displayLogs = logs.length > 0 ? logs : MOCK_LOGS;

    // Sentiment filter
    const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Period and date filter
    const [period, setPeriod] = useState<PeriodFilter>('month');
    const [startDate, setStartDate] = useState(() => formatDateToInput(new Date()));
    const [endDate, setEndDate] = useState(() => getEndDateForPeriod(formatDateToInput(new Date()), 'month'));

    // Update end date when period or start date changes
    useEffect(() => {
        const newEndDate = getEndDateForPeriod(startDate, period);
        setEndDate(newEndDate);
    }, [period, startDate]);

    // Filter logs by sentiment, search query, and date range
    const filteredLogs = displayLogs.filter(log => {
        // Sentiment filter
        if (sentimentFilter !== 'all' && log.sentiment !== sentimentFilter) {
            return false;
        }
        // Search filter
        if (searchQuery && !log.content.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        // Date range filter
        const logDate = log.date;
        if (logDate < startDate || logDate > endDate) {
            return false;
        }
        return true;
    });

    const handleWriteLog = () => {
        if (onWriteLog) {
            onWriteLog();
        } else {
            alert('담소일지 작성 기능은 준비 중입니다.');
        }
    };

    const sentimentCounts = {
        all: displayLogs.length,
        positive: displayLogs.filter(l => l.sentiment === 'positive').length,
        neutral: displayLogs.filter(l => l.sentiment === 'neutral').length,
        negative: displayLogs.filter(l => l.sentiment === 'negative').length,
    };

    return (
        <div className={styles.logsTabContent}>
            {/* Top Row: Search + Period Filter + Write Button */}
            <div className={styles.logsTopRow}>
                {/* Search Box */}
                <div className={styles.logsSearchBox}>
                    <Search size={16} className={styles.logsSearchIcon} />
                    <input
                        type="text"
                        placeholder="일지 내용 검색..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={styles.logsSearchInput}
                    />
                </div>
                {/* Period Filter */}
                <div className={styles.usageFilterRow}>
                    <select
                        value={period}
                        onChange={e => setPeriod(e.target.value as PeriodFilter)}
                        className={styles.periodSelect}
                    >
                        {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map(p => (
                            <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                        ))}
                    </select>
                    <div className={styles.usageDateInputs}>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={styles.usageDateInput} />
                        <span className={styles.usageDateSep}>~</span>
                        <input type="date" value={endDate} readOnly className={styles.usageDateInput} />
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
                    <Smile size={14} /> 긍정 <span className={styles.filterCount}>{sentimentCounts.positive}</span>
                </button>
                <button
                    type="button"
                    className={`${styles.filterBtn} ${styles.filterNeutral} ${sentimentFilter === 'neutral' ? styles.filterBtnActive : ''}`}
                    onClick={() => setSentimentFilter('neutral')}
                >
                    <Meh size={14} /> 중립 <span className={styles.filterCount}>{sentimentCounts.neutral}</span>
                </button>
                <button
                    type="button"
                    className={`${styles.filterBtn} ${styles.filterNegative} ${sentimentFilter === 'negative' ? styles.filterBtnActive : ''}`}
                    onClick={() => setSentimentFilter('negative')}
                >
                    <Frown size={14} /> 부정 <span className={styles.filterCount}>{sentimentCounts.negative}</span>
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
