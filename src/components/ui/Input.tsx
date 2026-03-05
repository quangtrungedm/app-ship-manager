import React from 'react';
import { cn } from '../../lib/utils';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="input-group">
                {label && <label className="input-label">{label}</label>}
                <input
                    className={cn('input-field', error && 'input-error', className)}
                    ref={ref}
                    {...props}
                />
                {error && <span className="input-error-msg">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';
