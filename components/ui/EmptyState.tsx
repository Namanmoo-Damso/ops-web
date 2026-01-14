import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from './utils';

/**
 * EmptyState Component
 *
 * shadcn/ui 패턴 준수: forwardRef, cn() 유틸리티, displayName
 * DESIGN_GUIDE_V2 준수: 부드러운 회색 톤, 명확한 타이포그래피
 */

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      icon,
      title,
      description,
      action,
      className = '',
      ...props
    },
    ref,
  ) => {
    const containerStyles = cn(
      'flex flex-col items-center justify-center',
      'py-12 px-6',
      'text-center',
      className,
    );

    const iconStyles = cn(
      'mb-4',
      'text-[var(--color-text-muted)]',
      'opacity-50',
    );

    const titleStyles = cn(
      'text-xl font-bold',  // DESIGN_GUIDE_V2
      'text-[var(--color-text-primary)]',
      'mb-2',
    );

    const descriptionStyles = cn(
      'text-base',  // DESIGN_GUIDE_V2: 16px body
      'text-[var(--color-text-muted)]',
      'max-w-md',
      'mb-6',
    );

    return (
      <div ref={ref} className={containerStyles} {...props}>
        {icon && <div className={iconStyles}>{icon}</div>}

        <h3 className={titleStyles}>{title}</h3>

        {description && (
          <p className={descriptionStyles}>{description}</p>
        )}

        {action && <div>{action}</div>}
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
