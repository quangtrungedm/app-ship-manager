import React from 'react';
import { cn } from '../../lib/utils';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'btn-base',
                    `btn-${variant}`,
                    `btn-${size}`,
                    isLoading && 'btn-loading',
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading ? (
                    <span className="spinner" />
                ) : null}
                <span className="btn-content">{children}</span>
            </button>
        );
    }
);
Button.displayName = 'Button';
