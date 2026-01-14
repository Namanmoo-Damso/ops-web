import { type CSSProperties, type ReactNode } from 'react';

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectProps {
    /** Current selected value */
    value: string | number;
    /** Callback when value changes */
    onChange: (value: string | number) => void;
    /** Options to display */
    options: SelectOption[];
    /** Label for the select */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the select is disabled */
    disabled?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text to display below select */
    helperText?: string;
    /** Icon to show before the select */
    icon?: ReactNode;
    /** Whether to take full width */
    fullWidth?: boolean;
}

/**
 * Enhanced select dropdown component
 *
 * Usage:
 * ```tsx
 * <Select
 *   label="재시도 횟수"
 *   value={maxRetries}
 *   onChange={setMaxRetries}
 *   options={[
 *     { value: 1, label: '1회' },
 *     { value: 3, label: '3회' },
 *     { value: 5, label: '5회' }
 *   ]}
 * />
 * ```
 */
export default function Select({
    value,
    onChange,
    options,
    label,
    placeholder,
    disabled = false,
    error,
    helperText,
    icon,
    fullWidth = false
}: SelectProps) {
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

    const selectWrapperStyle: CSSProperties = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: fullWidth ? '100%' : 'auto',
    };

    const iconWrapperStyle: CSSProperties = {
        position: 'absolute',
        left: '12px',
        display: 'flex',
        alignItems: 'center',
        color: 'var(--color-text-muted)',
        pointerEvents: 'none',
    };

    const selectStyle: CSSProperties = {
        width: fullWidth ? '100%' : 'auto',
        minWidth: '200px',
        padding: icon ? '10px 16px 10px 40px' : '10px 16px',
        paddingRight: '36px',
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${error ? 'var(--color-danger-main)' : 'var(--color-border)'}`,
        backgroundColor: disabled ? 'var(--color-bg-elevated-1)' : 'var(--color-panel)',
        fontSize: 'var(--font-size-body)',
        color: 'var(--color-text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
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
            <div style={selectWrapperStyle}>
                {icon && <div style={iconWrapperStyle}>{icon}</div>}
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
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            {(error || helperText) && (
                <span style={helperStyle}>{error || helperText}</span>
            )}
        </div>
    );
}
