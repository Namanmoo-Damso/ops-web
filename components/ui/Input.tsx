import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from './utils';

/**
 * Input Component
 *
 * shadcn/ui 패턴 준수: forwardRef, cn() 유틸리티, displayName, 접근성 (useId, ARIA)
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
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    const containerClassName = fullWidth ? 'w-full' : '';

    const inputBaseStyles = cn(
      'w-full px-4 py-2.5 text-base rounded-xl border',
      'transition-all duration-150',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'disabled:bg-[var(--color-bg-elevated-1)]',
      'focus:outline-none focus:ring-2',
    );

    const inputVariantStyles = hasError
      ? cn(
          'border-[var(--color-danger-border)]',
          'bg-[var(--color-danger-soft)]',
          'text-[var(--color-text-primary)]',
          'focus:ring-red-200',
          'focus:border-[var(--color-danger-main)]',
        )
      : cn(
          'border-[var(--color-border)]',
          'bg-white',
          'text-[var(--color-text-primary)]',
          'focus:ring-[var(--color-primary-light)]/30',
          'focus:border-[var(--color-primary)]',
          'hover:border-[var(--color-border-strong)]',
        );

    const combinedInputClassName = cn(
      inputBaseStyles,
      inputVariantStyles,
      className,
    );

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
