import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './utils';
import LoadingSpinner from './LoadingSpinner';

/**
 * Button Component
 *
 * shadcn/ui 패턴 준수: forwardRef, variant props, cn() 유틸리티, displayName
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
    const baseStyles = cn('ui-btn');

    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'ui-btn-primary',
      secondary: 'ui-btn-secondary',
      danger: 'ui-btn-danger',
      ghost: 'ui-btn-ghost',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'ui-btn-sm',
      md: 'ui-btn-md',
      lg: 'ui-btn-lg',
    };

    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'ui-btn-full',
      className,
    );

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || loading}
        aria-busy={loading}
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
