import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, style, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg px-3 py-2 text-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 resize-none focus:outline-none',
        className
      )}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.15)',
        color: '#0f0f1a',
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
Textarea.displayName = 'Textarea';

export { Textarea };
