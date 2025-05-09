'use client'

import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Toast, ToastContainer } from '@/components/ui/Toast'

type ToastType = 'info' | 'success' | 'warning' | 'error'

interface Toast {
    id: string
    type: ToastType
    title?: string
    message: string
}

interface ToastContextProps {
    toasts: Toast[]
    info: (title: string, message: string) => void
    success: (title: string, message: string) => void
    warning: (title: string, message: string) => void
    error: (title: string, message: string) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextProps>({
    toasts: [],
    info: () => { },
    success: () => { },
    warning: () => { },
    error: () => { },
    removeToast: () => { }
})

export const useToast = () => useContext(ToastContext)

interface ToastProviderProps {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, title: string, message: string) => {
        const id = uuidv4()

        setToasts((prevToasts) => [
            ...prevToasts,
            { id, type, title, message }
        ])

        setTimeout(() => {
            removeToast(id)
        }, 5000)

        return id
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id))
    }, [])

    const info = useCallback((title: string, message: string) => {
        return addToast('info', title, message)
    }, [addToast])

    const success = useCallback((title: string, message: string) => {
        return addToast('success', title, message)
    }, [addToast])

    const warning = useCallback((title: string, message: string) => {
        return addToast('warning', title, message)
    }, [addToast])

    const error = useCallback((title: string, message: string) => {
        return addToast('error', title, message)
    }, [addToast])

    return (
        <ToastContext.Provider
            value={{ toasts, info, success, warning, error, removeToast }}
        >
            {children}

            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`rounded-md shadow-md p-4 flex items-start animate-fade-in ${toast.type === 'info'
                                ? 'bg-blue-50 border-blue-500 text-blue-800'
                                : toast.type === 'success'
                                    ? 'bg-green-50 border-green-500 text-green-800'
                                    : toast.type === 'warning'
                                        ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                                        : 'bg-red-50 border-red-500 text-red-800'
                                } border-l-4`}
                            role="alert"
                        >
                            <div className="flex-1">
                                {toast.title && (
                                    <h4 className="font-semibold mb-1">{toast.title}</h4>
                                )}
                                <p className="text-sm">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                aria-label="Close"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    )
} 