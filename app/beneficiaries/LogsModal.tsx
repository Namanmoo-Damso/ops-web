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
                                    <div className={`${styles.sentiment} ${log.sentiment === 'positive' ? styles.sentimentPositive : log.sentiment === 'negative' ? styles.sentimentNegative : styles.sentimentNeutral}`}>
                                        {log.sentiment === 'positive' ? '기분 좋음' : log.sentiment === 'negative' ? '위험 감지' : '특이사항 없음'}
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

export default LogsModal;
