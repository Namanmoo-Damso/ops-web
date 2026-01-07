import { HTMLAttributes, ReactNode, forwardRef } from 'react';

/**
 * Badge Component
 *
 * DESIGN_GUIDE_V2 준수:
 * - 상태 정보 전달
 * - 은은한 배경 (bg-secondary/20) + 진한 텍스트 컬러
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
    const baseStyles = `
      inline-flex items-center gap-1.5
      font-bold
      rounded-full
      border
      transition-colors duration-150
    `.trim().replace(/\s+/g, ' ');

    const variantStyles: Record<BadgeVariant, string> = {
      default: `
        bg-[var(--color-accent-soft)]
        text-[var(--color-accent-strong)]
        border-[var(--color-primary-light)]
      `.trim().replace(/\s+/g, ' '),

      warning: `
        bg-[var(--color-warning-soft)]
        text-[#c2410c]
        border-[#fed7aa]
      `.trim().replace(/\s+/g, ' '),

      danger: `
        bg-[var(--color-danger-soft)]
        text-[var(--color-danger-main)]
        border-[var(--color-danger-border)]
      `.trim().replace(/\s+/g, ' '),

      success: `
        bg-[var(--color-success-soft)]
        text-[var(--color-success-dark)]
        border-[#a7f3d0]
      `.trim().replace(/\s+/g, ' '),

      info: `
        bg-[#e0ecff]
        text-[var(--color-primary)]
        border-[#cbdafe]
      `.trim().replace(/\s+/g, ' '),
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

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}
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
