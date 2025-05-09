import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    title: string;
    description?: string;
    type: ToastType;
    duration?: number;
}

interface UseToastReturn {
    toasts: Toast[];
    toast: (props: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

export function useToast(defaultDuration = 5000): UseToastReturn {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = ({ title, description, type, duration = defaultDuration }: Omit<Toast, 'id'>) => {
        const id = uuidv4();
        const newToast = {
            id,
            title,
            description,
            type,
            duration,
        };

        setToasts((currentToasts) => [...currentToasts, newToast]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id: string) => {
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    };

    const clearToasts = () => {
        setToasts([]);
    };

    return {
        toasts,
        toast,
        removeToast,
        clearToasts,
    };
} 