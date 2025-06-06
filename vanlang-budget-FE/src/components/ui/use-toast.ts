// Simplified toast implementation
export interface ToastProps {
    title?: string;
    description?: string;
    duration?: number;
}

// Simple toast function
export const toast = {
    // Show a toast with description
    description(description: string, duration = 2000) {
        // Toast implementation would go here
    }
};