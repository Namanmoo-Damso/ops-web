import { type CSSProperties } from 'react';

export interface TimePickerProps {
    /** Current time value in HH:mm format */
    value: string;
    /** Callback when time changes */
    onChange: (value: string) => void;
    /** Label for the time picker */
    label?: string;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text to display below input */
    helperText?: string;
    /** Whether to take full width */
    fullWidth?: boolean;
}

/**
 * Time picker component for selecting time
 *
 * Usage:
 * ```tsx
 * <TimePicker
 *   label="시작 시간"
 *   value={startTime}
 *   onChange={setStartTime}
 * />
 * ```
 */
export default function TimePicker({
    value,
    onChange,
    label,
    disabled = false,
    error,
    helperText,
    fullWidth = false
}: TimePickerProps) {
    const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        width: fullWidth ? '100%' : 'auto',
    };

    const labelStyle: CSSProperties = {
        fontSize: 'var(--font-size-caption)',
        fontWeight: 'var(--font-weight-semibold)',
        color: error ? 'var(--color-danger-main)' : 'var(--color-text-primary)',
        marginBottom: '2px',
    };

    const inputStyle: CSSProperties = {
        width: fullWidth ? '100%' : 'auto',
        minWidth: '150px',
        padding: '10px 16px',
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${error ? 'var(--color-danger-main)' : 'var(--color-border)'}`,
        backgroundColor: disabled ? 'var(--color-bg-elevated-1)' : 'var(--color-panel)',
        fontSize: 'var(--font-size-body)',
        color: 'var(--color-text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
    };

    const helperStyle: CSSProperties = {
        fontSize: 'var(--font-size-small)',
        color: error ? 'var(--color-danger-main)' : 'var(--color-text-muted)',
        marginTop: '2px',
    };

    return (
        <div style={containerStyle}>
            {label && <label style={labelStyle}>{label}</label>}
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                style={inputStyle}
                onFocus={(e) => {
                    if (!error) {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-light)';
                    }
                }}
                onBlur={(e) => {
                    e.currentTarget.style.borderColor = error
                        ? 'var(--color-danger-main)'
                        : 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            />
            {(error || helperText) && (
                <span style={helperStyle}>{error || helperText}</span>
            )}
        </div>
    );
}
