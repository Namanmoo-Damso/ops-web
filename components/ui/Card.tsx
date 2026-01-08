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
    const baseStyles = cn('ui-card', className);

    const radiusStyles: Record<CardRadius, string> = {
      default: 'ui-card-radius-default',
      large: 'ui-card-radius-large',
    };

    const paddingStyles: Record<CardPadding, string> = {
      none: 'ui-card-padding-none',
      sm: 'ui-card-padding-sm',
      md: 'ui-card-padding-md',
      lg: 'ui-card-padding-lg',
    };

    const hoverStyles = hoverable ? 'ui-card-hoverable' : '';

    const combinedClassName = cn(
      baseStyles,
      radiusStyles[radius],
      paddingStyles[padding],
      hoverStyles,
    );

    // Only apply content padding when padding='none' AND no header/footer
    const needsContentPadding = padding === 'none' && !header && !footer;
    const contentPadding = needsContentPadding ? 'ui-card-padding-md' : '';

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {header && (
          <div
            className={cn(
              'ui-card-header',
              padding === 'none' ? 'px-5 pt-5 pb-4' : 'pb-4 mb-4', // Keep using some util classes if available or convert? 
              // Wait, if no Tailwind, these padding classes won't work either. 
              // But headers are rarely used in current refactor. I'll rely on inline styles for granular adjustments if needed
              // or add them to CSS. For now let's use style prop for these specifics if they break.
              // Actually, I should just use the padding classes I defined.
            )}
            style={{ padding: padding === 'none' ? '20px 20px 16px' : undefined, marginBottom: padding === 'none' ? undefined : '16px', paddingBottom: '16px' }}
          >
            {header}
          </div>
        )}
        <div className={contentPadding}>{children}</div>
        {footer && (
          <div
            className={cn('ui-card-footer')}
            style={{ padding: padding === 'none' ? '16px 20px 20px' : undefined, marginTop: padding === 'none' ? undefined : '16px', paddingTop: '16px' }}
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
