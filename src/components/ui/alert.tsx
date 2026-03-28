import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default:     'bg-white border-black/10 text-gray-700',
        destructive: 'bg-red-50 border-red-200 text-red-700 [&>svg]:text-red-500',
        success:     'bg-emerald-50 border-emerald-200 text-emerald-700 [&>svg]:text-emerald-500',
        warning:     'bg-amber-50 border-amber-200 text-amber-700 [&>svg]:text-amber-500',
        info:        'bg-blue-50 border-blue-200 text-blue-700 [&>svg]:text-blue-500',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm opacity-85 [&_p]:leading-relaxed', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
