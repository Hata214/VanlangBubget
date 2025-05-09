/**
 * Function bắt lỗi async cho các controller
 * Giúp tránh việc phải sử dụng try-catch trong mỗi controller
 * @param {Function} fn - Hàm async cần được bọc
 * @returns {Function} Express middleware đã được bọc với xử lý lỗi
 */
const catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

export default catchAsync; 