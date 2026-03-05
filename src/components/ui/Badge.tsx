import React from 'react';
import { cn } from '../../lib/utils';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'waiting' | 'loading' | 'completed' | 'entering' | 'default';
    children: React.ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
    return (
        <span className={cn('badge-base', `badge-${variant}`, className)} {...props}>
            {children}
        </span>
    );
}
