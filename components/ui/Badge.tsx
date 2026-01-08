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
    const baseStyles = cn('ui-badge', className);

    const variantStyles: Record<BadgeVariant, string> = {
      default: 'ui-badge-default',
      warning: 'ui-badge-warning',
      danger: 'ui-badge-danger',
      success: 'ui-badge-success',
      info: 'ui-badge-info',
    };

    const sizeStyles: Record<BadgeSize, string> = {
      sm: 'ui-badge-sm',
      md: 'ui-badge-md',
      lg: 'ui-badge-lg',
    };

    const dotColors: Record<BadgeVariant, string> = {
      default: 'dot-default',
      warning: 'dot-warning',
      danger: 'dot-danger',
      success: 'dot-success',
      info: 'dot-info',
    };

    const combinedClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
    );

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {dot && (
          <span
            className={cn('ui-badge-dot', dotColors[variant])}
            aria-hidden="true"
          />
        )}
        {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export default Badge;
