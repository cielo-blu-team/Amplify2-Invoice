'use client';
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, style, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 [&>span]:line-clamp-1 focus:outline-none',
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
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
      e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)';
    }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4" style={{ color: 'rgba(0,0,0,0.4)' }} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
      {...props}
    >
      <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]')}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm outline-none transition-colors duration-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      className
    )}
    style={{ color: '#0f0f1a' }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '#0f0f1a'; }}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5" style={{ color: '#6366f1' }} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-3 pr-2 text-[10px] font-semibold uppercase tracking-[0.1em]', className)}
    style={{ color: '#9098a8' }}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px', className)}
    style={{ background: 'rgba(0,0,0,0.07)' }}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectLabel, SelectSeparator };
