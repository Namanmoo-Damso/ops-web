'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Smile, Meh, Frown, Calendar, Clock } from 'lucide-react';
import styles from '../DetailModal.module.css';
import { SectionTitle } from '../../../components/ui';
import type { BeneficiaryLog } from '../DetailModal';

interface DamsoLogTabProps {
    logs: BeneficiaryLog[];
    beneficiaryName: string;
    onWriteLog?: () => void;
}

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
    const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

    const filteredLogs = filter === 'all'
        ? displayLogs
        : displayLogs.filter(log => log.sentiment === filter);

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
            {/* Header */}
            <div className={styles.logsHeader}>
                <SectionTitle>담소일지</SectionTitle>
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
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('all')}
                >
                    전체 <span className={styles.filterCount}>{sentimentCounts.all}</span>
                </button>
                <button
                    type="button"
                    className={`${styles.filterBtn} ${styles.filterPositive} ${filter === 'positive' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('positive')}
                >
                    <Smile size={14} /> 긍정 <span className={styles.filterCount}>{sentimentCounts.positive}</span>
                </button>
                <button
                    type="button"
                    className={`${styles.filterBtn} ${styles.filterNeutral} ${filter === 'neutral' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('neutral')}
                >
                    <Meh size={14} /> 중립 <span className={styles.filterCount}>{sentimentCounts.neutral}</span>
                </button>
                <button
                    type="button"
                    className={`${styles.filterBtn} ${styles.filterNegative} ${filter === 'negative' ? styles.filterBtnActive : ''}`}
                    onClick={() => setFilter('negative')}
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
