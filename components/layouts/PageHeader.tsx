'use client';

import { forwardRef, type ReactNode } from 'react';
import { colors, typography, spacing } from '../../styles/tokens';
import { cn } from '../ui/utils';

export interface PageHeaderProps {
    /** Page title */
    title: string;
    /** Optional description below title */
    description?: string;
    /** Action buttons or elements on the right */
    actions?: ReactNode;
    /** Additional className */
    className?: string;
}

/**
 * PageHeader component for standardized page headers
 * 
 * Damso Design System: H2 22px, sticky header
 */
const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(
    ({ title, description, actions, className }, ref) => {
        return (
            <header
                ref={ref}
                className={cn(className)}
                style={{
                    backgroundColor: colors.panel.main,
                    padding: `${spacing.xl} ${spacing['3xl']}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.lg,
                }}
            >
                <div style={{ flex: 1 }}>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: typography.fontSize.h2,
                            fontWeight: typography.fontWeight.bold,
                            color: colors.text.primary,
                            lineHeight: typography.lineHeight.tight,
                        }}
                    >
                        {title}
                    </h1>
                    {description && (
                        <p
                            style={{
                                margin: `${spacing.xs} 0 0 0`,
                                fontSize: typography.fontSize.body,
                                color: colors.text.muted,
                                lineHeight: typography.lineHeight.normal,
                            }}
                        >
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.md,
                            flexShrink: 0,
                        }}
                    >
                        {actions}
                    </div>
                )}
            </header>
        );
    }
);

PageHeader.displayName = 'PageHeader';

export default PageHeader;
