/**
 * Định dạng số thành tiền tệ
 * @param value Số tiền cần định dạng
 * @returns Chuỗi tiền tệ đã định dạng
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value) + ' VND';
};

/**
 * Định dạng số thành chuỗi có dấu phân cách hàng nghìn
 * @param value Số cần định dạng
 * @returns Chuỗi số đã định dạng
 */
export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
};

/**
 * Định dạng số thành phần trăm
 * @param value Số cần định dạng
 * @param digits Số chữ số thập phân (mặc định: 2)
 * @returns Chuỗi phần trăm đã định dạng
 */
export const formatPercent = (value: number, digits: number = 2): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'percent',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).format(value / 100);
}; 