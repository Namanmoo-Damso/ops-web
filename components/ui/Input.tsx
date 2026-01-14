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

    return (
      <div className={cn('ui-input-container', className)} style={{ width: fullWidth ? '100%' : undefined }}>
        {label && (
          <label htmlFor={inputId} className="ui-input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn('ui-input', hasError && 'ui-input-error')}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="ui-input-msg error">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="ui-input-msg helper">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
