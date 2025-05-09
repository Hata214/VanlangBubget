import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'spinner' | 'dots' | 'pulse'
    size?: 'sm' | 'md' | 'lg'
    fullScreen?: boolean
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
}

export function Loading({
    variant = 'spinner',
    size = 'md',
    fullScreen = false,
    className,
    ...props
}: LoadingProps) {
    const sizeClass = sizeClasses[size]

    const LoadingContent = () => {
        switch (variant) {
            case 'spinner':
                return (
                    <div
                        className={cn(
                            'animate-spin rounded-full border-2 border-current border-t-transparent',
                            sizeClass,
                            className
                        )}
                        {...props}
                    />
                )
            case 'dots':
                return (
                    <div className={cn('flex space-x-1', className)} {...props}>
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'animate-bounce rounded-full bg-current',
                                    size === 'sm' ? 'h-1 w-1' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2',
                                    {
                                        'animation-delay-200': i === 1,
                                        'animation-delay-400': i === 2,
                                    }
                                )}
                                style={{
                                    animationDelay: i === 1 ? '0.2s' : i === 2 ? '0.4s' : '0s',
                                }}
                            />
                        ))}
                    </div>
                )
            case 'pulse':
                return (
                    <div
                        className={cn(
                            'animate-pulse rounded-full bg-current',
                            sizeClass,
                            className
                        )}
                        {...props}
                    />
                )
            default:
                return null
        }
    }

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <LoadingContent />
            </div>
        )
    }

    return <LoadingContent />
} 