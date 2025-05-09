import { useState, useEffect } from 'react';

/**
 * Hook để debounce một giá trị.
 * Trả về giá trị đã được debounce, cập nhật sau một khoảng thời gian đã xác định.
 * Hữu ích khi làm việc với các thao tác tìm kiếm và cập nhật dữ liệu theo thời gian thực.
 * 
 * @param value Giá trị cần debounce
 * @param delay Thời gian trễ tính bằng mili giây
 * @returns Giá trị đã được debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Thiết lập timeout để cập nhật giá trị debounced sau khoảng thời gian delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Hủy timeout trước đó khi value hoặc delay thay đổi
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
} 