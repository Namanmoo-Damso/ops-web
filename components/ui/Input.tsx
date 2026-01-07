import { InputHTMLAttributes, forwardRef } from 'react';

/**
 * Input Component
 *
 * DESIGN_GUIDE_V2 준수:
 * - Body 16px 기본
 * - 명확한 피드백 (focus, error)
 */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const containerClassName = fullWidth ? 'w-full' : '';

    const inputBaseStyles = `
      w-full
      px-4 py-2.5
      text-base
      rounded-xl
      border
      transition-all duration-150
      disabled:opacity-50 disabled:cursor-not-allowed
      disabled:bg-[var(--color-bg-elevated-1)]
      focus:outline-none focus:ring-2
    `.trim().replace(/\s+/g, ' ');

    const inputVariantStyles = hasError
      ? `
          border-[var(--color-danger-border)]
          bg-[var(--color-danger-soft)]
          text-[var(--color-text-primary)]
          focus:ring-red-200
          focus:border-[var(--color-danger-main)]
        `.trim().replace(/\s+/g, ' ')
      : `
          border-[var(--color-border)]
          bg-white
          text-[var(--color-text-primary)]
          focus:ring-[var(--color-primary-light)]/30
          focus:border-[var(--color-primary)]
          hover:border-[var(--color-border-strong)]
        `.trim().replace(/\s+/g, ' ');

    const combinedInputClassName = `
      ${inputBaseStyles}
      ${inputVariantStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={combinedInputClassName}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm font-medium text-[var(--color-danger-main)]"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-[var(--color-text-muted)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
