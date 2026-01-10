import { type CSSProperties } from 'react';

export interface SliderProps {
    /** Current value */
    value: number;
    /** Callback when value changes */
    onChange: (value: number) => void;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Step increment */
    step?: number;
    /** Whether the slider is disabled */
    disabled?: boolean;
    /** Labels to show at specific positions */
    labels?: string[];
    /** Accessible label for screen readers */
    'aria-label'?: string;
}

/**
 * Slider component for selecting numeric values
 *
 * Usage:
 * ```tsx
 * <Slider
 *   value={sensitivity}
 *   onChange={setSensitivity}
 *   min={1}
 *   max={3}
 *   step={1}
 *   labels={['둔감', '보통', '민감']}
 * />
 * ```
 */
export default function Slider({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    labels = [],
    'aria-label': ariaLabel
}: SliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    const containerStyle: CSSProperties = {
        width: '100%',
        padding: '8px 0',
    };

    const sliderContainerStyle: CSSProperties = {
        position: 'relative',
        width: '100%',
        height: '8px',
        marginBottom: labels.length > 0 ? '24px' : '0',
    };

    const trackStyle: CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '8px',
        backgroundColor: 'var(--color-bg-elevated-2)',
        borderRadius: 'var(--radius-full)',
        top: '50%',
        transform: 'translateY(-50%)',
    };

    const progressStyle: CSSProperties = {
        position: 'absolute',
        height: '8px',
        backgroundColor: disabled ? 'var(--color-border)' : 'var(--color-primary)',
        borderRadius: 'var(--radius-full)',
        width: `${percentage}%`,
        top: '50%',
        transform: 'translateY(-50%)',
        transition: 'width 150ms ease',
    };

    const inputStyle: CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        margin: 0,
        zIndex: 2,
    };

    const thumbStyle: CSSProperties = {
        position: 'absolute',
        width: '20px',
        height: '20px',
        backgroundColor: disabled ? 'var(--color-text-muted)' : 'var(--color-primary)',
        borderRadius: '50%',
        border: '3px solid white',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        left: `calc(${percentage}% - 10px)`,
        top: '50%',
        transform: 'translateY(-50%)',
        transition: 'left 150ms ease',
        pointerEvents: 'none',
    };

    const labelsContainerStyle: CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
    };

    const labelStyle: CSSProperties = {
        fontSize: 'var(--font-size-small)',
        color: 'var(--color-text-muted)',
        fontWeight: 'var(--font-weight-medium)',
    };

    return (
        <div style={containerStyle}>
            <div style={sliderContainerStyle}>
                <div style={trackStyle} />
                <div style={progressStyle} />
                <div style={thumbStyle} />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    aria-label={ariaLabel}
                    style={inputStyle}
                />
            </div>
            {labels.length > 0 && (
                <div style={labelsContainerStyle}>
                    {labels.map((label, index) => (
                        <span key={index} style={labelStyle}>
                            {label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
