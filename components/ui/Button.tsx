import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './utils';
import LoadingSpinner from './LoadingSpinner';

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
    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'font-semibold rounded-xl',
      'transition-all duration-150',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
    );

    const variantStyles: Record<ButtonVariant, string> = {
      primary: cn(
        'bg-[var(--color-primary)] text-white',
        'hover:bg-[var(--color-primary-dark)]',
        'active:scale-95',
        'focus:ring-[var(--color-primary-light)]',
        'shadow-sm',
      ),
      secondary: cn(
        'bg-[var(--color-bg-elevated-1)]',
        'text-[var(--color-text-primary)]',
        'border border-[var(--color-border)]',
        'hover:bg-[var(--color-bg-elevated-2)]',
        'hover:border-[var(--color-border-strong)]',
        'active:scale-95',
        'focus:ring-[var(--color-primary-light)]',
      ),
      danger: cn(
        'bg-[var(--color-danger-main)] text-white',
        'hover:bg-red-600',
        'active:scale-95',
        'focus:ring-red-300',
        'shadow-sm',
      ),
      ghost: cn(
        'bg-transparent',
        'text-[var(--color-text-primary)]',
        'hover:bg-[var(--color-bg-elevated-1)]',
        'active:bg-[var(--color-bg-elevated-2)]',
        'focus:ring-[var(--color-primary-light)]',
      ),
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'h-9 px-3 text-sm',      // 36px
      md: 'h-10 px-4 text-base',   // 40px - DESIGN_GUIDE_V2 기본
      lg: 'h-12 px-6 text-lg',     // 48px
    };

    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      className,
    );

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner className="-ml-1 mr-2" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
