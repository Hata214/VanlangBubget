import React, { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    children: React.ReactNode
    className?: string
    showCloseButton?: boolean
    closeOnOverlayClick?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
    showCloseButton = true,
    closeOnOverlayClick = true,
    size = 'md',
}: ModalProps) {
    if (!isOpen) return null

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose()
        }
    }

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full mx-4'
    }

    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center"
                onClick={handleOverlayClick}
            >
                <div
                    className={cn(
                        'relative bg-white rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto',
                        sizeClasses[size],
                        className
                    )}
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between p-4 border-b">
                            <div>
                                {title && (
                                    <h2 className="text-lg font-semibold">{title}</h2>
                                )}
                                {description && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        {description}
                                    </p>
                                )}
                            </div>
                            {showCloseButton && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700"
                                    aria-label="Close"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-4">{children}</div>
                </div>
            </div>
        </Fragment>
    )
} 