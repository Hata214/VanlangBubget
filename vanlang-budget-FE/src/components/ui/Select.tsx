'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'
import { Check, ChevronDown } from 'lucide-react'

const Select = SelectPrimitive.Root

const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
        error?: string;
        label?: string;
    }
>(({ className, children, error, label, ...props }, ref) => (
    <div className="w-full">
        {label && (
            <label className="block text-sm font-medium text-foreground mb-1">
                {label}
            </label>
        )}
        <SelectPrimitive.Trigger
            ref={ref}
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-input focus:ring-indigo-500',
                className
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectValue = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Value>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Value
        ref={ref}
        className={cn('text-sm', className)}
        {...props}
    />
))
SelectValue.displayName = SelectPrimitive.Value.displayName

const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={cn(
                'relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-input bg-background text-foreground shadow-md animate-in fade-in-80',
                className
            )}
            {...props}
        >
            <SelectPrimitive.Viewport className="p-1">
                {children}
            </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <Check className="h-4 w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} 