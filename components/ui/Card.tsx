import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from './utils';

/**
 * Card Component
 *
 * shadcn/ui 패턴 준수: forwardRef, variant props, cn() 유틸리티, displayName
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
    const baseStyles = cn(
      'bg-white',
      'border border-[var(--color-border)]',
      'transition-all duration-150',
    );

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
      ? cn(
          'hover:shadow-md',
          'hover:border-[var(--color-border-strong)]',
          'cursor-pointer',
        )
      : 'shadow-sm';

    const combinedClassName = cn(
      baseStyles,
      radiusStyles[radius],
      paddingStyles[padding],
      hoverStyles,
      className,
    );

    // Only apply content padding when padding='none' AND no header/footer
    const needsContentPadding = padding === 'none' && !header && !footer;
    const contentPadding = needsContentPadding ? 'p-5' : '';

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {header && (
          <div
            className={cn(
              'border-b border-[var(--color-border)]',
              padding === 'none' ? 'px-5 pt-5 pb-4' : 'pb-4 mb-4',
            )}
          >
            {header}
          </div>
        )}
        <div className={contentPadding}>{children}</div>
        {footer && (
          <div
            className={cn(
              'border-t border-[var(--color-border)]',
              padding === 'none' ? 'px-5 pb-5 pt-4' : 'pt-4 mt-4',
            )}
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
