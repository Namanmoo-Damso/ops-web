import React from 'react';
import { cn } from './utils';

interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div className={cn('ui-section-title', className)} {...props}>
            {children}
        </div>
    );
};

export default SectionTitle;
