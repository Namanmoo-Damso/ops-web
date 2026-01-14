import { type CSSProperties, useMemo } from 'react';

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
    /** Minute interval (default: 15) */
    minuteInterval?: number;
}

/**
 * Time picker component using dropdown with 15-minute intervals
 */
export default function TimePicker({
    value,
    onChange,
    label,
    disabled = false,
    error,
    helperText,
    fullWidth = false,
    minuteInterval = 15
}: TimePickerProps) {
    // Generate time options with specified interval
    const timeOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += minuteInterval) {
                const h = hour.toString().padStart(2, '0');
                const m = minute.toString().padStart(2, '0');
                const timeValue = `${h}:${m}`;

                // Format display label (12-hour format with AM/PM)
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                const period = hour < 12 ? '오전' : '오후';
                const displayLabel = `${period} ${displayHour}:${m}`;

                options.push({ value: timeValue, label: displayLabel });
            }
        }
        return options;
    }, [minuteInterval]);

    const containerStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        width: fullWidth ? '100%' : 'auto',
    };

    const labelStyle: CSSProperties = {
        fontSize: '16px',
        fontWeight: 'var(--font-weight-semibold)',
        color: error ? 'var(--color-danger-main)' : 'var(--color-text-primary)',
        marginBottom: '4px',
    };

    const selectStyle: CSSProperties = {
        width: fullWidth ? '100%' : 'auto',
        minWidth: '160px',
        padding: '12px 16px',
        paddingRight: '40px',
        borderRadius: '8px',
        border: `1px solid ${error ? 'var(--color-danger-main)' : 'var(--color-border)'}`,
        backgroundColor: disabled ? 'var(--color-bg-elevated-1)' : 'white',
        fontSize: '16px',
        color: 'var(--color-text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
    };

    const helperStyle: CSSProperties = {
        fontSize: '14px',
        color: error ? 'var(--color-danger-main)' : 'var(--color-text-muted)',
        marginTop: '4px',
    };

    return (
        <div style={containerStyle}>
            {label && <label style={labelStyle}>{label}</label>}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                style={selectStyle}
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
            >
                {timeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {(error || helperText) && (
                <span style={helperStyle}>{error || helperText}</span>
            )}
        </div>
    );
}
