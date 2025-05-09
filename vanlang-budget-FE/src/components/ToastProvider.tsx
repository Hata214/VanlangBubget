'use client';

import React, { createContext, useContext, useState } from 'react';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    title: string;
    description?: string;
    type: ToastType;
    duration?: number;
    variant?: 'default' | 'destructive';
}

interface ToastContextType {
    toast: (props: Omit<ToastProps, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const addToast = (props: Omit<ToastProps, 'id'>) => {
        const id = uuidv4();
        const newToast = { ...props, id };
        setToasts((prev) => [...prev, newToast]);
        return id;
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            <ToastContainer>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        title={toast.title}
                        description={toast.description}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={removeToast}
                    />
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
}; 