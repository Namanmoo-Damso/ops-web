'use client';

import { Fragment, ReactNode } from 'react';
import Card from './Card';
import '../../styles/stats-summary.css';

export type StatItem = {
    label: string;
    value: string | number;
    subtext?: string;
    color?: string;
    extra?: ReactNode;
};

type StatsSummaryProps = {
    items: StatItem[];
    title?: string;
    icon?: ReactNode;
};

export default function StatsSummary({ items, title, icon }: StatsSummaryProps) {
    return (
        <Card padding="lg">
            {/* Optional Header */}
            {(title || icon) && (
                <div className="stats-summary-header">
                    {icon && <span className="stats-summary-icon">{icon}</span>}
                    {title && <h3 className="stats-summary-title">{title}</h3>}
                </div>
            )}

            {/* Stats Row */}
            <div className="stats-summary-content">
                {items.map((item, index) => (
                    <Fragment key={item.label}>
                        <div className="stats-summary-item">
                            <div className="stats-summary-label">{item.label}</div>
                            <div className="stats-summary-value-wrapper">
                                <div
                                    className="stats-summary-value"
                                    style={item.color ? { color: item.color } : undefined}
                                >
                                    {item.value}
                                </div>
                                {item.extra && (
                                    <div className="stats-summary-extra">{item.extra}</div>
                                )}
                            </div>
                            {item.subtext && (
                                <div className="stats-summary-subtext">{item.subtext}</div>
                            )}
                            {item.extra && (
                                <div className="stats-summary-extra">{item.extra}</div>
                            )}
                        </div>
                        {index < items.length - 1 && (
                            <div className="stats-summary-divider" />
                        )}
                    </Fragment>
                ))}
            </div>
        </Card>
    );
}
