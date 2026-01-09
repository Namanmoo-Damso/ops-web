'use client';

import { forwardRef, useState, type CSSProperties } from 'react';
import { colors, shadows, spacing, typography } from '../../styles/tokens';
import { cn } from '../ui/utils';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

// Header Icons
const IconBell = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M13.73 21a2 2 0 0 1-3.46 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconChevronDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IconUser = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.6" />
        <path
            d="M3 21v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
);

const IconSettings = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path
            d="M12 1v6m0 6v6M1 12h6m6 0h6"
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

export interface HeaderProps {
    /** Callback when 대상자 등록 button is clicked */
    onRegisterClick?: () => void;
    /** Callback when notification icon is clicked */
    onNotificationsClick?: () => void;
    /** Additional className */
    className?: string;
}

/** Fixed height for header */
export const HEADER_HEIGHT = '64px';

/**
 * Global Header component
 *
 * Displays at the top of all pages with:
 * - 담소 logo and service name
 * - 대상자 등록 button
 * - Notifications icon
 * - User profile dropdown
 */
const Header = forwardRef<HTMLElement, HeaderProps>(
    ({ onRegisterClick, onNotificationsClick, className }, ref) => {
        const { user, logout } = useAuth();
        const [isProfileOpen, setIsProfileOpen] = useState(false);

        const headerStyle: CSSProperties = {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: HEADER_HEIGHT,
            backgroundColor: colors.panel.main,
            borderBottom: `1px solid ${colors.border.main}`,
            boxShadow: shadows.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0 ${spacing['3xl']}`,
            zIndex: 10000, // Above sidebar (9999)
        };

        const logoSectionStyle: CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
        };

        const logoStyle: CSSProperties = {
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.light})`,
            boxShadow: `0 0 0 3px ${colors.accent.soft}`,
            flexShrink: 0,
        };

        const serviceNameStyle: CSSProperties = {
            fontSize: typography.fontSize.value,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
        };

        const actionsSectionStyle: CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.lg,
        };

        const iconButtonStyle: CSSProperties = {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            display: 'grid',
            placeItems: 'center',
            color: colors.text.muted,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            position: 'relative',
        };

        const profileButtonStyle: CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: '20px',
            border: `1px solid ${colors.border.main}`,
            background: colors.panel.main,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            position: 'relative',
        };

        const dropdownStyle: CSSProperties = {
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: '200px',
            backgroundColor: colors.panel.main,
            border: `1px solid ${colors.border.main}`,
            borderRadius: spacing.md,
            boxShadow: shadows.lg,
            padding: spacing.sm,
            zIndex: 10001,
        };

        const dropdownItemStyle: CSSProperties = {
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: spacing.sm,
            border: 'none',
            background: 'transparent',
            fontSize: typography.fontSize.caption,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            width: '100%',
            textAlign: 'left',
        };

        return (
            <header ref={ref} className={cn(className)} style={headerStyle}>
                {/* Left: Logo + Service Name */}
                <div style={logoSectionStyle}>
                    <div style={logoStyle} />
                    <span style={serviceNameStyle}>담소</span>
                </div>

                {/* Right: Actions */}
                <div style={actionsSectionStyle}>
                    {/* 대상자 등록 Button */}
                    <Button
                        variant="primary"
                        size="md"
                        onClick={onRegisterClick}
                    >
                        대상자 등록
                    </Button>

                    {/* Notifications */}
                    <button
                        style={iconButtonStyle}
                        onClick={onNotificationsClick}
                        aria-label="알림"
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = colors.background.elevated1;
                            e.currentTarget.style.color = colors.text.primary;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = colors.text.muted;
                        }}
                    >
                        <IconBell />
                    </button>

                    {/* User Profile Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            style={profileButtonStyle}
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = colors.background.elevated1;
                                e.currentTarget.style.borderColor = colors.border.strong;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = colors.panel.main;
                                e.currentTarget.style.borderColor = colors.border.main;
                            }}
                        >
                            <div
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: colors.primary.light,
                                    display: 'grid',
                                    placeItems: 'center',
                                    color: colors.primary.dark,
                                }}
                            >
                                <IconUser />
                            </div>
                            <span
                                style={{
                                    fontSize: typography.fontSize.caption,
                                    fontWeight: typography.fontWeight.semibold,
                                    color: colors.text.primary,
                                }}
                            >
                                {user?.name || '사용자'}
                            </span>
                            <IconChevronDown />
                        </button>

                        {/* Dropdown Menu */}
                        {isProfileOpen && (
                            <div style={dropdownStyle}>
                                {/* User Info */}
                                <div
                                    style={{
                                        padding: `${spacing.md} ${spacing.lg}`,
                                        borderBottom: `1px solid ${colors.border.main}`,
                                        marginBottom: spacing.sm,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: typography.fontSize.caption,
                                            fontWeight: typography.fontWeight.semibold,
                                            color: colors.text.primary,
                                            marginBottom: '4px',
                                        }}
                                    >
                                        {user?.name || '사용자'}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: typography.fontSize.small,
                                            color: colors.text.muted,
                                        }}
                                    >
                                        {user?.email}
                                    </div>
                                    {user?.organizationName && (
                                        <div
                                            style={{
                                                fontSize: typography.fontSize.small,
                                                color: colors.text.soft,
                                                marginTop: '2px',
                                            }}
                                        >
                                            {user.organizationName}
                                        </div>
                                    )}
                                </div>

                                {/* Settings */}
                                <button
                                    style={dropdownItemStyle}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = colors.background.elevated1;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        // TODO: Navigate to settings page
                                    }}
                                >
                                    <IconSettings />
                                    <span>설정</span>
                                </button>

                                <div
                                    style={{
                                        height: '1px',
                                        backgroundColor: colors.border.main,
                                        margin: `${spacing.sm} 0`,
                                    }}
                                />

                                {/* Logout */}
                                <button
                                    style={{
                                        ...dropdownItemStyle,
                                        color: colors.status.danger.main,
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.backgroundColor = colors.status.danger.soft;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        logout();
                                    }}
                                >
                                    <IconLogout />
                                    <span>로그아웃</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        );
    }
);

Header.displayName = 'Header';

export default Header;
