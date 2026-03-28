import * as React from 'react';
import { cn } from '@/lib/utils';

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto" style={{ background: '#ffffff' }}>
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('[&_tr]:border-b', className)}
      style={{ borderColor: 'rgba(0,0,0,0.06)', background: '#f8f8fc' }}
      {...props}
    />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, style, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('transition-colors group', className)}
      style={{
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        background: '#ffffff',
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)';
        props.onMouseEnter?.(e as React.MouseEvent<HTMLTableRowElement>);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = '#ffffff';
        props.onMouseLeave?.(e as React.MouseEvent<HTMLTableRowElement>);
      }}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-9 px-4 text-left align-middle text-[10px] font-semibold uppercase tracking-[0.1em] [&:has([role=checkbox])]:pr-0',
        className
      )}
      style={{ color: '#71717a' }}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('px-4 py-3 align-middle text-sm [&:has([role=checkbox])]:pr-0', className)}
      style={{ color: '#0f0f1a' }}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-4 text-sm', className)} style={{ color: '#9098a8' }} {...props} />
  )
);
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
