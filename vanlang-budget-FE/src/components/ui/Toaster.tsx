'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toast, ToastContainer } from './Toast';

export type ToastMessage = {
    id: string;
    title: string;
    description?: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
};

export type ToastContextType = {
    toasts: ToastMessage[];
    addToast: (toast: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;
};

export const useToastStore = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (toast: Omit<ToastMessage, 'id'>) => {
        const id = uuidv4();
        setToasts((prev) => [...prev, { ...toast, id }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const clearToasts = () => {
        setToasts([]);
    };

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
    };
};

export function Toaster() {
    const [mounted, setMounted] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Connect to the global toast events
    useEffect(() => {
        setMounted(true);

        const handleToast = (event: CustomEvent<Omit<ToastMessage, 'id'>>) => {
            const id = uuidv4();
            setToasts((prev) => [...prev, { ...event.detail, id }]);
        };

        // Listen for toast events
        window.addEventListener('toast' as any, handleToast as any);

        return () => {
            window.removeEventListener('toast' as any, handleToast as any);
        };
    }, []);

    // Helper function to remove a toast
    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    if (!mounted) return null;

    return (
        <ToastContainer>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    title={toast.title}
                    description={toast.description}
                    type={toast.type}
                    duration={toast.duration || 5000}
                    onClose={removeToast}
                />
            ))}
        </ToastContainer>
    );
}

// Global toast function that can be used anywhere
export const toast = {
    success(title: string, description?: string, duration?: number) {
        dispatchToastEvent({ title, description, type: 'success', duration });
    },
    error(title: string, description?: string, duration?: number) {
        dispatchToastEvent({ title, description, type: 'error', duration });
    },
    info(title: string, description?: string, duration?: number) {
        dispatchToastEvent({ title, description, type: 'info', duration });
    },
    warning(title: string, description?: string, duration?: number) {
        dispatchToastEvent({ title, description, type: 'warning', duration });
    },
};

// Helper to dispatch toast events
function dispatchToastEvent(toast: Omit<ToastMessage, 'id'>) {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', { detail: toast });
        window.dispatchEvent(event);
    }
} 