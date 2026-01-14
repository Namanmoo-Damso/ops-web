import React from 'react';
import { cn } from './utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'close';
    children?: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({
    variant = 'default',
    children,
    className,
    ...props
}) => {
    const variantClass = variant === 'close' ? 'ui-icon-btn-close' : '';

    return (
        <button
            className={cn('ui-icon-btn', variantClass, className)}
            {...props}
        >
            {variant === 'close' && !children ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            ) : children}
        </button>
    );
};

export default IconButton;
