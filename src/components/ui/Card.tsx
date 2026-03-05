import React from 'react';
import { cn } from '../../lib/utils';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div className={cn('card-container', className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: CardProps) {
    return (
        <div className={cn('card-header', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: CardProps) {
    return (
        <h3 className={cn('card-title', className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }: CardProps) {
    return (
        <div className={cn('card-content', className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }: CardProps) {
    return (
        <div className={cn('card-footer', className)} {...props}>
            {children}
        </div>
    );
}
