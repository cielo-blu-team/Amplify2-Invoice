import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, style, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg px-3 py-1 text-sm transition-all duration-150',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className
      )}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.15)',
        color: '#0f0f1a',
        outline: 'none',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
        e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04), 0 0 0 3px rgba(99,102,241,0.12)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
        e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)';
        props.onBlur?.(e);
      }}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
