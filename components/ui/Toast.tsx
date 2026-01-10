import { type CSSProperties, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    /** Toast message */
    message: string;
    /** Toast type */
    type?: ToastType;
    /** Whether toast is visible */
    isOpen: boolean;
    /** Callback when toast is closed */
    onClose: () => void;
    /** Auto-close duration in milliseconds (0 to disable) */
    duration?: number;
}

/**
 * Toast notification component
 *
 * Usage:
 * ```tsx
 * const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' as ToastType });
 *
 * <Toast
 *   message={toast.message}
 *   type={toast.type}
 *   isOpen={toast.isOpen}
 *   onClose={() => setToast({ ...toast, isOpen: false })}
 * />
 * ```
 */
export default function Toast({
    message,
    type = 'info',
    isOpen,
    onClose,
    duration = 4000
}: ToastProps) {
    useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <XCircle size={20} />;
            case 'warning':
                return <AlertCircle size={20} />;
            default:
                return <AlertCircle size={20} />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'var(--color-success-light)',
                    border: 'var(--color-success-main)',
                    icon: 'var(--color-success-main)',
                };
            case 'error':
                return {
                    bg: 'var(--color-danger-light)',
                    border: 'var(--color-danger-main)',
                    icon: 'var(--color-danger-main)',
                };
            case 'warning':
                return {
                    bg: 'var(--color-warning-light)',
                    border: 'var(--color-warning-main)',
                    icon: 'var(--color-warning-main)',
                };
            default:
                return {
                    bg: 'var(--color-bg-elevated-1)',
                    border: 'var(--color-border)',
                    icon: 'var(--color-text-primary)',
                };
        }
    };

    const colors = getColors();

    const containerStyle: CSSProperties = {
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 10001,
        minWidth: '320px',
        maxWidth: '480px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px',
        animation: 'slideInRight 0.3s ease-out',
    };

    const iconStyle: CSSProperties = {
        color: colors.icon,
        flexShrink: 0,
        marginTop: '2px',
    };

    const contentStyle: CSSProperties = {
        flex: 1,
        fontSize: '14px',
        color: 'var(--color-text-primary)',
        lineHeight: 1.5,
    };

    const closeButtonStyle: CSSProperties = {
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        color: 'var(--color-text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        transition: 'background-color 150ms ease',
    };

    return (
        <>
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
            <div style={containerStyle} role="alert" aria-live="polite">
                <div style={iconStyle}>{getIcon()}</div>
                <div style={contentStyle}>{message}</div>
                <button
                    type="button"
                    onClick={onClose}
                    style={closeButtonStyle}
                    aria-label="닫기"
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated-2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <X size={16} />
                </button>
            </div>
        </>
    );
}
