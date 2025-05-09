import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    // Kiểm tra đầu vào trước khi định dạng
    if (amount === null || amount === undefined || isNaN(amount)) {
        console.warn('Invalid amount value for formatCurrency:', amount);
        return "0 đ"; // Trả về 0 đồng nếu giá trị không hợp lệ
    }

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

export function formatDate(date: string | Date): string {
    try {
        // Kiểm tra xem date có phải là chuỗi hợp lệ hoặc đối tượng Date không
        if (!date) {
            return "Không có ngày";
        }

        // Chuyển đổi định dạng ngày nếu cần thiết
        let dateObj: Date;

        if (typeof date === 'string') {
            // Xử lý một số định dạng chuỗi ngày phổ biến
            if (date.includes('T')) {
                // Định dạng ISO (yyyy-MM-ddThh:mm:ss.sssZ)
                dateObj = new Date(date);
            } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Định dạng yyyy-MM-dd
                const [year, month, day] = date.split('-').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                // Các định dạng khác
                dateObj = new Date(date);
            }
        } else {
            dateObj = date;
        }

        // Kiểm tra xem dateObj có hợp lệ không
        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date value:', date);
            return "Ngày không hợp lệ";
        }

        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(dateObj);
    } catch (error) {
        console.error('Error formatting date:', error, date);
        return "Lỗi định dạng ngày";
    }
}

export function formatDateTime(date: string | Date): string {
    try {
        if (!date) {
            return "Không có thời gian";
        }

        const dateObj = typeof date === 'string' ? new Date(date) : date;

        // Kiểm tra xem dateObj có hợp lệ không
        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid datetime value:', date);
            return "Thời gian không hợp lệ";
        }

        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj);
    } catch (error) {
        console.error('Error formatting datetime:', error, date);
        return "Lỗi định dạng thời gian";
    }
}

export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
}

/**
 * Format a date to a relative time string (e.g. "2 minutes ago")
 * @param date Date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInSecs < 60) {
        return 'Just now';
    } else if (diffInMins < 60) {
        return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 30) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInMonths < 12) {
        return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    } else {
        return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
    }
} 