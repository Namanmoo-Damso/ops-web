import { ButtonHTMLAttributes, forwardRef } from 'react';

/**
 * Button Component
 *
 * DESIGN_GUIDE_V2 준수:
 * - 높이: 최소 h-10 (40px) 이상
 * - 크기: 기본 16~18px
 * - 피드백: hover, active 상태 명확
 */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center
      font-semibold
      rounded-xl
      transition-all duration-150
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-2
    `.trim().replace(/\s+/g, ' ');

    const variantStyles: Record<ButtonVariant, string> = {
      primary: `
        bg-[var(--color-primary)]
        text-white
        hover:bg-[var(--color-primary-dark)]
        active:scale-95
        focus:ring-[var(--color-primary-light)]
        shadow-sm
      `.trim().replace(/\s+/g, ' '),

      secondary: `
        bg-[var(--color-bg-elevated-1)]
        text-[var(--color-text-primary)]
        border border-[var(--color-border)]
        hover:bg-[var(--color-bg-elevated-2)]
        hover:border-[var(--color-border-strong)]
        active:scale-95
        focus:ring-[var(--color-primary-light)]
      `.trim().replace(/\s+/g, ' '),

      danger: `
        bg-[var(--color-danger-main)]
        text-white
        hover:bg-red-600
        active:scale-95
        focus:ring-red-300
        shadow-sm
      `.trim().replace(/\s+/g, ' '),

      ghost: `
        bg-transparent
        text-[var(--color-text-primary)]
        hover:bg-[var(--color-bg-elevated-1)]
        active:bg-[var(--color-bg-elevated-2)]
        focus:ring-[var(--color-primary-light)]
      `.trim().replace(/\s+/g, ' '),
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-sm',      // 36px
      md: 'h-10 px-4 text-base',   // 40px - DESIGN_GUIDE_V2 기본
      lg: 'h-12 px-6 text-lg',     // 48px
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${widthStyle}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
