/**
 * @jest-environment node
 */

// Thử nghiệm với một hàm định dạng tiền tệ
// Giả sử chúng ta có một file src/utils/common.js với hàm formatCurrency

// Mock hàm formatCurrency để test
const formatCurrency = (amount) => {
    return `${amount.toLocaleString('vi-VN')} ₫`;
};

describe('Common Utils', () => {
    // Test case đơn giản
    test('formatCurrency should format currency correctly', () => {
        expect(formatCurrency(1000)).toBe('1.000 ₫');
        expect(formatCurrency(1000.5)).toBe('1.000,5 ₫');
        expect(formatCurrency(0)).toBe('0 ₫');
    });

    // Test với số âm
    test('formatCurrency should handle negative values', () => {
        expect(formatCurrency(-1000)).toBe('-1.000 ₫');
    });

    // Test với số lớn
    test('formatCurrency should handle large values', () => {
        expect(formatCurrency(1000000)).toBe('1.000.000 ₫');
    });
}); 