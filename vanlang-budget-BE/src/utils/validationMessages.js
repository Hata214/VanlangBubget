/**
 * Tập hợp các thông báo lỗi thường dùng cho validation
 */

export const messages = {
    /**
     * Thông báo lỗi cho trường chuỗi
     * @param {string} fieldName - Tên trường
     * @param {number} min - Độ dài tối thiểu
     * @param {number} max - Độ dài tối đa
     * @returns {Object} - Object chứa các thông báo lỗi
     */
    string: (fieldName, min = 2, max = 100) => ({
        'string.base': `${fieldName} phải là chuỗi`,
        'string.empty': `${fieldName} không được để trống`,
        'string.min': `${fieldName} phải có ít nhất ${min} ký tự`,
        'string.max': `${fieldName} không được vượt quá ${max} ký tự`,
        'any.required': `${fieldName} là bắt buộc`
    }),

    /**
     * Thông báo lỗi cho trường số
     * @param {string} fieldName - Tên trường
     * @param {number} min - Giá trị tối thiểu
     * @param {number} max - Giá trị tối đa
     * @returns {Object} - Object chứa các thông báo lỗi
     */
    number: (fieldName, min = 0, max = Number.MAX_SAFE_INTEGER) => ({
        'number.base': `${fieldName} phải là số`,
        'number.empty': `${fieldName} không được để trống`,
        'number.min': `${fieldName} không được nhỏ hơn ${min}`,
        'number.max': `${fieldName} không được lớn hơn ${max}`,
        'number.integer': `${fieldName} phải là số nguyên`,
        'any.required': `${fieldName} là bắt buộc`
    }),

    /**
     * Thông báo lỗi cho trường ngày tháng
     * @param {string} fieldName - Tên trường
     * @returns {Object} - Object chứa các thông báo lỗi
     */
    date: (fieldName) => ({
        'date.base': `${fieldName} phải là ngày hợp lệ`,
        'date.format': `${fieldName} phải đúng định dạng ngày`,
        'date.min': `${fieldName} phải sau ngày hiện tại`,
        'date.max': `${fieldName} phải trước ngày hiện tại`,
        'any.required': `${fieldName} là bắt buộc`
    }),

    /**
     * Thông báo lỗi cho trường boolean
     * @param {string} fieldName - Tên trường
     * @returns {Object} - Object chứa các thông báo lỗi
     */
    boolean: (fieldName) => ({
        'boolean.base': `${fieldName} phải là giá trị boolean (true/false)`,
        'any.required': `${fieldName} là bắt buộc`
    }),

    /**
     * Thông báo lỗi cho trường array
     * @param {string} fieldName - Tên trường
     * @returns {Object} - Object chứa các thông báo lỗi
     */
    array: (fieldName) => ({
        'array.base': `${fieldName} phải là mảng`,
        'array.min': `${fieldName} phải có ít nhất một phần tử`,
        'array.max': `${fieldName} có quá nhiều phần tử`,
        'any.required': `${fieldName} là bắt buộc`
    }),

    /**
     * Thông báo lỗi cho trường MongoDB ID
     * @param {string} fieldName - Tên trường
     * @returns {Object} - Object chứa các thông báo lỗi
     */
    mongoId: (fieldName) => ({
        'string.base': `${fieldName} phải là chuỗi`,
        'string.hex': `${fieldName} phải là ID hợp lệ`,
        'string.length': `${fieldName} phải có độ dài 24 ký tự`,
        'any.required': `${fieldName} là bắt buộc`
    }),

    /**
     * Thông báo lỗi cho trường email
     * @returns {Object} - Object chứa các thông báo lỗi
     */
    email: () => ({
        'string.base': 'Email phải là chuỗi',
        'string.empty': 'Email không được để trống',
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
    })
}; 