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

/**
 * Định dạng ngày tháng
 * @param date Chuỗi ngày tháng hoặc đối tượng Date
 * @param dateFormat Chuỗi định dạng (mặc định: 'dd/MM/yyyy')
 * @returns Chuỗi ngày tháng đã định dạng hoặc chuỗi trống nếu ngày không hợp lệ
 */
import { format, isValid, parseISO } from 'date-fns';

export const formatDate = (date: string | Date | undefined | null, dateFormat: string = 'dd/MM/yyyy'): string => {
    if (!date) return '';
    let dateObj: Date;
    if (typeof date === 'string') {
        dateObj = parseISO(date);
    } else {
        dateObj = date;
    }
    if (isValid(dateObj)) {
        return format(dateObj, dateFormat);
    }
    return ''; // Trả về chuỗi trống nếu ngày không hợp lệ
};

/**
 * Định dạng một chuỗi số thành chuỗi có dấu chấm phân tách hàng nghìn khi người dùng nhập liệu.
 * @param numStr Chuỗi số (chỉ chứa chữ số)
 * @returns Chuỗi đã định dạng hoặc chuỗi trống
 */
export const formatInputNumberWithDots = (numStr: string): string => {
    if (!numStr) return '';
    // Loại bỏ tất cả các ký tự không phải là số để đảm bảo đầu vào sạch
    const cleanedNumStr = numStr.replace(/[^\d]/g, '');
    if (!cleanedNumStr) return '';
    // Thêm dấu chấm làm dấu phân cách hàng nghìn
    return cleanedNumStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Chuyển đổi một chuỗi số đã được định dạng (có dấu chấm) về giá trị số.
 * @param formattedValue Chuỗi số đã định dạng (ví dụ: "10.000.000")
 * @returns Giá trị số hoặc undefined nếu không hợp lệ
 */
export const parseFormattedInputNumber = (formattedValue: string): number | undefined => {
    if (!formattedValue) return undefined;
    const numericString = formattedValue.replace(/\./g, ''); // Loại bỏ tất cả dấu chấm
    if (numericString === '') return undefined;
    const number = parseInt(numericString, 10);
    return isNaN(number) ? undefined : number;
}; 