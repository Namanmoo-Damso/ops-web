import { type CSSProperties, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import IconButton from './IconButton';

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
        backgroundColor: 'white',
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '16px 20px',
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
                <IconButton
                    variant="close"
                    onClick={onClose}
                    aria-label="닫기"
                    style={{ padding: '4px' }}
                />
            </div>
        </>
    );
}
