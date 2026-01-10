import { type CSSProperties } from 'react';

export interface SwitchProps {
    /** Whether the switch is checked */
    checked: boolean;
    /** Callback when switch state changes */
    onChange: (checked: boolean) => void;
    /** Whether the switch is disabled */
    disabled?: boolean;
    /** Accessible label for screen readers */
    'aria-label'?: string;
}

/**
 * iOS-style toggle switch component
 *
 * Usage:
 * ```tsx
 * <Switch
 *   checked={enabled}
 *   onChange={setEnabled}
 *   aria-label="Enable notifications"
 * />
 * ```
 */
export default function Switch({
    checked,
    onChange,
    disabled = false,
    'aria-label': ariaLabel
}: SwitchProps) {
    const containerStyle: CSSProperties = {
        position: 'relative',
        display: 'inline-block',
        width: '44px',
        height: '24px',
    };

    const inputStyle: CSSProperties = {
        opacity: 0,
        width: 0,
        height: 0,
        position: 'absolute',
    };

    const sliderStyle: CSSProperties = {
        position: 'absolute',
        cursor: disabled ? 'not-allowed' : 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: checked
            ? 'var(--color-primary)'
            : 'var(--color-border)',
        transition: 'background-color 200ms ease',
        borderRadius: 'var(--radius-full)',
        opacity: disabled ? 0.5 : 1,
    };

    const thumbStyle: CSSProperties = {
        position: 'absolute',
        content: '""',
        height: '18px',
        width: '18px',
        left: checked ? '23px' : '3px',
        bottom: '3px',
        backgroundColor: 'white',
        transition: 'left 200ms ease',
        borderRadius: '50%',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    };

    return (
        <label style={containerStyle}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
                aria-label={ariaLabel}
                style={inputStyle}
            />
            <span style={sliderStyle}>
                <span style={thumbStyle} />
            </span>
        </label>
    );
}
