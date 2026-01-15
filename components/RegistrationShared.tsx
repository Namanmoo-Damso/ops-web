import React from 'react';
import { palette, shadows } from '../app/theme';

interface SharedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    labelWidth?: string;
    error?: boolean;
    requiredMark?: boolean;
}

export const SharedInput: React.FC<SharedInputProps> = ({
    label,
    labelWidth = '80px',
    error,
    requiredMark,
    style,
    ...props
}) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: error ? '1px solid #ef4444' : `1px solid ${palette.border}`,
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: palette.background,
                ...style,
            }}
        >
            <span
                style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#4a5d23',
                    width: labelWidth,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {label}
                {requiredMark && <span style={{ color: '#f97316', marginLeft: '4px' }}>*</span>}
            </span>
            <input
                style={{
                    flex: 1,
                    border: 'none',
                    borderLeft: '1px solid #e2e8f0',
                    paddingLeft: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: palette.primaryDark,
                    backgroundColor: 'transparent',
                    outline: 'none',
                    width: '100%',
                }}
                {...props}
            />
        </div>
    );
};

interface SharedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    labelWidth?: string;
    error?: boolean;
    requiredMark?: boolean;
    options: { value: string; label: string }[];
}

export const SharedSelect: React.FC<SharedSelectProps> = ({
    label,
    labelWidth = '80px',
    error,
    requiredMark,
    options,
    style,
    ...props
}) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: error ? '1px solid #ef4444' : `1px solid ${palette.border}`,
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: palette.background,
                ...style,
            }}
        >
            <span
                style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#4a5d23',
                    width: labelWidth,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {label}
                {requiredMark && <span style={{ color: '#f97316', marginLeft: '4px' }}>*</span>}
            </span>
            <select
                style={{
                    flex: 1,
                    border: 'none',
                    borderLeft: '1px solid #e2e8f0',
                    paddingLeft: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: palette.primaryDark,
                    backgroundColor: 'transparent',
                    outline: 'none',
                    width: '100%',
                }}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

interface SharedTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    labelWidth?: string;
    error?: boolean;
    requiredMark?: boolean;
}

export const SharedTextArea: React.FC<SharedTextAreaProps> = ({
    label,
    labelWidth = '80px',
    error,
    requiredMark,
    style,
    ...props
}) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'start',
                gap: '10px',
                border: error ? '1px solid #ef4444' : `1px solid ${palette.border}`,
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: palette.background,
                ...style,
            }}
        >
            <span
                style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#4a5d23',
                    width: labelWidth,
                    flexShrink: 0,
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {label}
                {requiredMark && <span style={{ color: '#f97316', marginLeft: '4px' }}>*</span>}
            </span>
            <textarea
                style={{
                    flex: 1,
                    border: 'none',
                    borderLeft: '1px solid #e2e8f0',
                    paddingLeft: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: palette.primaryDark,
                    backgroundColor: 'transparent',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    width: '100%',
                }}
                {...props}
            />
        </div>
    );
};

interface SharedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    fullWidth?: boolean;
    fontSize?: string;
}

export const SharedButton: React.FC<SharedButtonProps> = ({
    variant = 'primary',
    fullWidth = false,
    fontSize = '16px',
    children,
    style,
    disabled,
    ...props
}) => {
    const getBackgroundColor = () => {
        if (disabled) return palette.secondary;
        if (variant === 'danger') return '#ef4444';
        if (variant === 'secondary') return palette.soft;
        return palette.primary;
    };

    const getColor = () => {
        if (variant === 'secondary') return palette.primaryDark;
        return palette.panel;
    };

    return (
        <button
            disabled={disabled}
            style={{
                width: fullWidth ? '100%' : 'auto',
                padding: '12px 14px',
                borderRadius: '10px',
                border: variant === 'secondary' ? `1px solid ${palette.border}` : 'none',
                backgroundColor: getBackgroundColor(),
                color: getColor(),
                fontSize,
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
                ...style,
            }}
            {...props}
            onMouseEnter={e => {
                if (disabled) return;
                if (variant === 'primary') e.currentTarget.style.backgroundColor = palette.primaryDark;
                if (variant === 'secondary') e.currentTarget.style.backgroundColor = palette.border;
            }}
            onMouseLeave={e => {
                if (disabled) return;
                e.currentTarget.style.backgroundColor = getBackgroundColor();
            }}
        >
            {children}
        </button>
    );
};

export const ModalHeader = ({ title, onClose, IconClose }: { title: string; onClose?: () => void; IconClose?: React.FC | any }) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
        }}
    >
        <h3
            style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 700,
                color: palette.primaryDark,
            }}
        >
            {title}
        </h3>
        {onClose && IconClose && (
            <button
                onClick={onClose}
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    color: palette.textSoft,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = palette.soft;
                    e.currentTarget.style.color = '#64748b';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = palette.textSoft;
                }}
            >
                <IconClose />
            </button>
        )}
    </div>
);
