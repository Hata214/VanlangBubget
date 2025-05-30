'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const labelVariants = cva(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
)

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
    error?: string
}

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    LabelProps
>(({ className, error, ...props }, ref) => (
    <div>
        <LabelPrimitive.Root
            ref={ref}
            className={cn(labelVariants(), 'text-foreground', className)}
            {...props}
        />
        {error && (
            <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
    </div>
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label } 