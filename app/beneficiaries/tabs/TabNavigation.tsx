'use client';

import { User, Activity, BookOpen, X } from 'lucide-react';
import styles from '../DetailModal.module.css';

export type TabType = 'basic' | 'usage' | 'logs';

interface TabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    onClose: () => void;
}

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'basic', label: '기본정보', icon: <User size={18} /> },
    { key: 'usage', label: '사용정보', icon: <Activity size={18} /> },
    { key: 'logs', label: '담소일지', icon: <BookOpen size={18} /> },
];

export default function TabNavigation({
    activeTab,
    onTabChange,
    onClose,
}: TabNavigationProps) {
    return (
        <div className={styles.tabHeader}>
            <div className={styles.tabGroup} role="tablist" aria-label="수급자 정보 탭">
                {TABS.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        type="button"
                        className={`${styles.tabButton} ${activeTab === key ? styles.tabActive : ''}`}
                        onClick={() => onTabChange(key)}
                        aria-selected={activeTab === key}
                        role="tab"
                    >
                        {icon}
                        <span>{label}</span>
                    </button>
                ))}
            </div>
            <button
                type="button"
                className={styles.tabCloseButton}
                onClick={onClose}
                aria-label="닫기"
            >
                <X size={24} />
            </button>
        </div>
    );
}
