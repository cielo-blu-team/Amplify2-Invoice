import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none tracking-wide',
  {
    variants: {
      variant: {
        default:     'bg-indigo-100 text-indigo-700 border border-indigo-200',
        secondary:   'bg-zinc-100 text-zinc-600 border border-zinc-200',
        destructive: 'bg-red-100 text-red-700 border border-red-200',
        outline:     'bg-zinc-50 text-zinc-500 border border-zinc-300',
        success:     'bg-emerald-100 text-emerald-700 border border-emerald-200',
        warning:     'bg-amber-100 text-amber-700 border border-amber-200',
        info:        'bg-blue-100 text-blue-700 border border-blue-200',
        purple:      'bg-violet-100 text-violet-700 border border-violet-200',
        cyan:        'bg-cyan-100 text-cyan-700 border border-cyan-200',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
