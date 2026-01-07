import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from './utils';

/**
 * Badge Component
 *
 * shadcn/ui 패턴 준수: forwardRef, variant props, displayName
 * DESIGN_GUIDE_V2 준수: 은은한 배경, 진한 텍스트 컬러
 */

type BadgeVariant = 'default' | 'warning' | 'danger' | 'success' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      icon,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = cn(
      'inline-flex items-center gap-1.5',
      'font-bold',
      'rounded-full',
      'border',
      'transition-colors duration-150',
    );

    const variantStyles: Record<BadgeVariant, string> = {
      default: cn(
        'bg-[var(--color-accent-soft)]',
        'text-[var(--color-accent-strong)]',
        'border-[var(--color-primary-light)]',
      ),

      warning: cn(
        'bg-[var(--color-warning-soft)]',
        'text-[#c2410c]',
        'border-[#fed7aa]',
      ),

      danger: cn(
        'bg-[var(--color-danger-soft)]',
        'text-[var(--color-danger-main)]',
        'border-[var(--color-danger-border)]',
      ),

      success: cn(
        'bg-[var(--color-success-soft)]',
        'text-[var(--color-success-dark)]',
        'border-[#a7f3d0]',
      ),

      info: cn(
        'bg-[#e0ecff]',
        'text-[var(--color-primary)]',
        'border-[#cbdafe]',
      ),
    };

    const sizeStyles: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs',   // 10px
      md: 'px-2.5 py-1 text-xs',   // 12px
      lg: 'px-3 py-1.5 text-sm',   // 14px
    };

    const dotColors: Record<BadgeVariant, string> = {
      default: 'bg-[var(--color-accent-strong)]',
      warning: 'bg-[#c2410c]',
      danger: 'bg-[var(--color-danger-main)]',
      success: 'bg-[var(--color-success-main)]',
      info: 'bg-[var(--color-primary)]',
    };

    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className,
    );

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
            aria-hidden="true"
          />
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export default Badge;
