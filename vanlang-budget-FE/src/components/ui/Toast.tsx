'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, X } from 'lucide-react'

export interface ToastProps {
    id: string
    title: string
    description?: string
    type: 'success' | 'error' | 'info' | 'warning'
    duration?: number
    onClose: (id: string) => void
}

const toastTypeStyles = {
    success: 'bg-green-50 border-green-500 text-green-700',
    error: 'bg-red-50 border-red-500 text-red-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    info: 'bg-blue-50 border-blue-500 text-blue-700',
}

const toastIcons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <CheckCircle className="h-5 w-5 text-yellow-500" />,
    info: <CheckCircle className="h-5 w-5 text-blue-500" />,
}

export function Toast({ id, title, description, type, duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true)

    // Tự động đóng toast sau khoảng thời gian duration
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => onClose(id), 300) // Đợi animation kết thúc
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, id, onClose])

    return (
        <div
            className={cn(
                'relative flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-md transition-all duration-300',
                toastTypeStyles[type],
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            )}
            role="alert"
        >
            <div className="flex-shrink-0">
                {toastIcons[type]}
            </div>
            <div className="flex-1">
                <h3 className="font-medium">{title}</h3>
                {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
            </div>
            <button
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                onClick={() => {
                    setIsVisible(false)
                    setTimeout(() => onClose(id), 300)
                }}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {children}
        </div>
    )
} 