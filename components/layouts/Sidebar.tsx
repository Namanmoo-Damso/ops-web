'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { forwardRef, type CSSProperties } from 'react';
import { colors, borderRadius, spacing, typography } from '../../styles/tokens';
import { cn } from '../ui/utils';

// Sidebar Icons
const IconMonitor = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect
            x="2"
            y="3"
            width="20"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.6"
        />
        <path
            d="M8 21h8M12 17v4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
);

const IconDashboard = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="3" width="7" height="4" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="10" width="7" height="11" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3" y="13" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
);

const IconUpload = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 16V4M8 8l4-4 4 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
);

const IconLocation = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 21c4-4 6-7.5 6-10a6 6 0 1 0-12 0c0 2.5 2 6 6 10z"
            stroke="currentColor"
            strokeWidth="1.6"
        />
        <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
);

const IconStats = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
            d="M3 3v18h18"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M7 16l4-4 4 4 6-6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconStaff = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path
            d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
);

const IconSettings = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
            d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconMyWards = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path
            d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
        <circle cx="17" cy="11" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
            d="M21 21v-1.5a3 3 0 0 0-3-3h-.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
);

const IconBeneficiaries = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
            d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M16 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M3 19v-1.5A3.5 3.5 0 0 1 6.5 14h3A3.5 3.5 0 0 1 13 17.5V19"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
        <path
            d="M13 16a3 3 0 0 1 2.5-1.5h3A3.5 3.5 0 0 1 22 18v1"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
);

const IconLogout = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
        <path
            d="M16 17l5-5-5-5M21 12H9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

/** Navigation items configuration */
const navItems = [
    { href: '/dashboard', label: '대시보드', icon: IconDashboard },
    { href: '/', label: '영상 모니터링', icon: IconMonitor },
    { href: '/locations', label: '지도 모니터링', icon: IconLocation },
    { href: '/beneficiaries', label: '전체 대상자 관리', icon: IconBeneficiaries },
    { href: '/my-wards', label: '대상자 연동 현황', icon: IconMyWards },
    { href: '/stats', label: '통계/리포트', icon: IconStats },
    { href: '/staff', label: '직원관리', icon: IconStaff },
    { href: '/settings', label: '설정', icon: IconSettings },
];

export interface SidebarProps {
    /** Whether sidebar is collapsed */
    collapsed?: boolean;
    /** Callback when upload button is clicked */
    onUploadClick?: () => void;
    /** Callback when logout button is clicked */
    onLogout?: () => void;
    /** Top offset for header (default: 64px) */
    headerHeight?: string;
    /** Additional className */
    className?: string;
}

const SIDEBAR_WIDTH = '240px';

/**
 * Sidebar component for dashboard navigation
 *
 * Damso Design System: Nature Palette, 240px width
 * Positioned below Header component
 */
const Sidebar = forwardRef<HTMLElement, SidebarProps>(
    ({ collapsed = false, onUploadClick, onLogout, headerHeight = '64px', className }, ref) => {
        const pathname = usePathname();
        const router = useRouter();

        // Styles using design tokens
        const sidebarStyle: CSSProperties = {
            position: 'fixed',
            top: headerHeight,
            left: 0,
            bottom: 0,
            width: SIDEBAR_WIDTH,
            backgroundColor: colors.panel.main,
            borderRight: `1px solid ${colors.border.main}`,
            display: 'flex',
            flexDirection: 'column',
            transform: collapsed ? `translateX(-${SIDEBAR_WIDTH})` : 'translateX(0)',
            transition: 'transform 200ms ease',
            zIndex: 9998, // Below header (10000)
        };

        const navStyle: CSSProperties = {
            flex: 1,
            padding: `${spacing.lg} ${spacing.md}`,
            paddingTop: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
        };

        const footerStyle: CSSProperties = {
            padding: `${spacing.lg} ${spacing.md}`,
        };

        return (
            <>
                {/* Sidebar */}
                <aside ref={ref} className={cn(className)} style={sidebarStyle}>
                    {/* Navigation */}
                    <nav style={navStyle}>
                        {navItems.map(item => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.href}
                                    type="button"
                                    onClick={() => router.push(item.href)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing.md,
                                        padding: `${spacing.md} ${spacing.lg}`,
                                        borderRadius: borderRadius.sm,
                                        border: 'none',
                                        textDecoration: 'none',
                                        fontSize: typography.fontSize.caption,
                                        fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                                        color: isActive ? colors.primary.dark : colors.text.muted,
                                        backgroundColor: isActive ? colors.accent.soft : 'transparent',
                                        transition: 'all 150ms ease',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = colors.background.elevated1;
                                            e.currentTarget.style.color = colors.text.primary;
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = colors.text.muted;
                                        }
                                    }}
                                >
                                    <Icon />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div style={footerStyle}>
                        {/* Upload Button */}
                        <button
                            onClick={onUploadClick}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.md,
                                width: '100%',
                                padding: `${spacing.md} ${spacing.lg}`,
                                marginBottom: spacing.sm,
                                borderRadius: borderRadius.sm,
                                border: `1px solid ${colors.border.main}`,
                                background: colors.background.elevated1,
                                fontSize: typography.fontSize.caption,
                                fontWeight: typography.fontWeight.semibold,
                                color: colors.text.primary,
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = colors.primary.light;
                                e.currentTarget.style.borderColor = colors.primary.light;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = colors.background.elevated1;
                                e.currentTarget.style.borderColor = colors.border.main;
                            }}
                        >
                            <IconUpload />
                            <span>피보호자 등록</span>
                        </button>

                        <div
                            style={{
                                height: '1px',
                                backgroundColor: colors.border.main,
                                marginBottom: spacing.sm,
                                marginTop: spacing.sm,
                            }}
                        />

                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.md,
                                padding: `${spacing.md} ${spacing.lg}`,
                                borderRadius: borderRadius.sm,
                                border: 'none',
                                background: 'transparent',
                                fontSize: typography.fontSize.caption,
                                fontWeight: typography.fontWeight.medium,
                                color: colors.text.muted,
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = colors.status.danger.soft;
                                e.currentTarget.style.color = colors.status.danger.main;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.text.muted;
                            }}
                        >
                            <IconLogout />
                            <span>로그아웃</span>
                        </button>
                    </div>
                </aside>
            </>
        );
    }
);

Sidebar.displayName = 'Sidebar';

export default Sidebar;

/** Export sidebar width for layout calculations */
export const SIDEBAR_WIDTH_VALUE = SIDEBAR_WIDTH;
