import { HTMLAttributes, ReactNode, forwardRef } from 'react';

/**
 * Card Component
 *
 * DESIGN_GUIDE_V2 준수:
 * - Radius: 24~32px 범위
 * - Shadow: shadow-sm 기본, 강조 시 shadow-md
 * - Background: bg-card (white)
 * - Padding: 20~28px 권장
 */

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardRadius = 'default' | 'large';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  radius?: CardRadius;
  hoverable?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      padding = 'md',
      radius = 'default',
      hoverable = false,
      header,
      footer,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles = `
      bg-white
      border border-[var(--color-border)]
      transition-all duration-150
    `.trim().replace(/\s+/g, ' ');

    const radiusStyles: Record<CardRadius, string> = {
      default: 'rounded-3xl',  // 24px - DESIGN_GUIDE_V2
      large: 'rounded-[32px]', // 32px
    };

    const paddingStyles: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',   // 16px
      md: 'p-5',   // 20px - DESIGN_GUIDE_V2 기본
      lg: 'p-7',   // 28px
    };

    const hoverStyles = hoverable
      ? `
          hover:shadow-md
          hover:border-[var(--color-border-strong)]
          cursor-pointer
        `.trim().replace(/\s+/g, ' ')
      : 'shadow-sm';

    const combinedClassName = `
      ${baseStyles}
      ${radiusStyles[radius]}
      ${paddingStyles[padding]}
      ${hoverStyles}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const contentPadding = padding === 'none' ? 'p-5' : '';

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {header && (
          <div
            className={`
              border-b border-[var(--color-border)]
              ${padding === 'none' ? 'px-5 pt-5 pb-4' : 'pb-4 mb-4'}
            `.trim().replace(/\s+/g, ' ')}
          >
            {header}
          </div>
        )}
        <div className={contentPadding}>{children}</div>
        {footer && (
          <div
            className={`
              border-t border-[var(--color-border)]
              ${padding === 'none' ? 'px-5 pb-5 pt-4' : 'pt-4 mt-4'}
            `.trim().replace(/\s+/g, ' ')}
          >
            {footer}
          </div>
        )}
      </div>
    );
  },
);

Card.displayName = 'Card';

export default Card;
