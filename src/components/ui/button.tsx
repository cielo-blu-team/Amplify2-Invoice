import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110',
        destructive:
          'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 hover:text-red-300 hover:border-red-400/40 shadow-sm',
        outline:
          'border border-zinc-200 bg-transparent text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300',
        secondary:
          'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200 hover:text-zinc-900',
        ghost:
          'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800',
        link:
          'text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300',
        success:
          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 hover:text-emerald-300',
        warning:
          'bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 hover:text-amber-300',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-7 rounded-md px-3 text-xs',
        lg:      'h-10 rounded-lg px-6',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const isDefault = !variant || variant === 'default';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        style={isDefault ? {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          ...style,
        } : style}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </>
        ) : children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
