import React, { useEffect } from 'react';
import styles from './LogsModal.module.css';
import { BeneficiaryLog } from './DetailModal';
import { IconButton, SectionTitle } from '../../components/ui';

interface LogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: BeneficiaryLog[];
}

const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose, logs }) => {
    // ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <div className={`${styles.logsModal} ${isOpen ? styles.logsModalOpen : ''}`}>
            <div className={styles.header}>
                <SectionTitle>담소일지 전체 기록</SectionTitle>
            </div>
            <IconButton
                variant="close"
                onClick={onClose}
                aria-label="닫기"
                className={styles.closeButton}
            />

            <div className={styles.body}>
                {logs.length === 0 ? (
                    <div className={styles.emptyLogs}>기록이 없습니다.</div>
                ) : (
                    <div className={styles.logList}>
                        {logs.map(log => (
                            <div key={log.id} className={styles.logCard}>
                                <div className={styles.logHeader}>
                                    <span className={styles.logType}>{log.type}</span>
                                    <span className={styles.logDate}>{log.date}</span>
                                </div>
                                <p className={styles.logContent}>{log.content}</p>
                                {log.sentiment && (
                                    <div className={`${styles.sentiment} ${getSentimentClassName(log.sentiment)}`}>
                                        {getSentimentLabel(log.sentiment)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.footer}>
                <button
                    className={styles.writeButton}
                    onClick={() => alert('담소일지 작성 기능은 준비 중입니다.')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    담소일지 작성
                </button>
            </div>
        </div>
    );
};

// 헬퍼 함수 추가
function getSentimentClassName(sentiment: string): string {
    const capitalized = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
    return styles[`sentiment${capitalized}`] || '';
}

function getSentimentLabel(sentiment: string): string {
    const labels: Record<string, string> = {
        positive: '긍정',
        negative: '부정',
        neutral: '중립',
    };
    return labels[sentiment] || '알 수 없음';
}

export default LogsModal;
