// Simplified toast implementation
export interface ToastProps {
    title?: string;
    description?: string;
    duration?: number;
}

// Simple toast function that logs to console
export const toast = {
    // Show a toast with description
    description(description: string, duration = 2000) {
        console.log(`TOAST: ${description} (Duration: ${duration}ms)`);
    }
}; 