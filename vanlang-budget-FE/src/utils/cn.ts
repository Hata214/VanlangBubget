import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names using clsx and optimizes them with tailwind-merge
 * @param inputs Class names or conditional class objects
 * @returns Combined and optimized class string
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
} 