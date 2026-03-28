'use client';
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('inline-flex h-9 items-center justify-center rounded-lg p-1', className)}
    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40',
      className
    )}
    style={{ color: 'rgba(0,0,0,0.45)' }}
    onFocus={(e) => {
      const el = e.currentTarget as HTMLElement;
      if (el.getAttribute('data-state') !== 'active') {
        el.style.color = 'rgba(0,0,0,0.75)';
      }
    }}
    onBlur={(e) => {
      const el = e.currentTarget as HTMLElement;
      if (el.getAttribute('data-state') !== 'active') {
        el.style.color = 'rgba(0,0,0,0.45)';
      }
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget as HTMLElement;
      if (el.getAttribute('data-state') !== 'active') {
        el.style.color = 'rgba(0,0,0,0.75)';
      }
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget as HTMLElement;
      if (el.getAttribute('data-state') !== 'active') {
        el.style.color = 'rgba(0,0,0,0.45)';
      }
    }}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-2 focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
