/**
 * Middleware xử lý các lỗi trong ứng dụng
 * Chuẩn hóa các lỗi và trả về response với format nhất quán
 */

import logger from '../utils/logger.js';

// Custom error class
export class AppError extends Error {
    constructor(message, statusCode, errors = {}) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Xử lý lỗi từ Mongoose
 */
const handleMongooseValidationError = (err) => {
    const errors = {};
    Object.values(err.errors).forEach((error) => {
        errors[error.path] = [error.message];
    });

    return new AppError(
        'Lỗi xác thực dữ liệu',
        400,
        errors
    );
};

/**
 * Xử lý lỗi trùng key MongoDB
 */
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];

    const errors = {};
    errors[field] = [`Giá trị '${value}' đã tồn tại. Vui lòng sử dụng giá trị khác.`];

    return new AppError(
        'Giá trị trùng lặp',
        400,
        errors
    );
};

/**
 * Xử lý lỗi cast MongoDB (sai định dạng ID)
 */
const handleCastError = (err) => {
    const errors = {};
    errors[err.path] = [`Định dạng không hợp lệ cho ${err.path}: ${err.value}`];

    return new AppError(
        'Định dạng dữ liệu không hợp lệ',
        400,
        errors
    );
};

/**
 * Xử lý lỗi JWT
 */
const handleJWTError = () => {
    return new AppError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401);
};

/**
 * Xử lý lỗi JWT hết hạn
 */
const handleJWTExpiredError = () => {
    return new AppError('Token đã hết hạn. Vui lòng đăng nhập lại.', 401);
};

/**
 * Xử lý lỗi CORS
 */
const handleCORSError = (err) => {
    logger.warn('CORS error detected:', err.message);
    return new AppError('CORS không được phép', 403, {
        cors: ['Nguồn gốc yêu cầu không được phép truy cập. Vui lòng liên hệ quản trị viên.']
    });
};

/**
 * Xử lý lỗi tải file
 */
const handleFileUploadError = (err) => {
    let errorMessage = 'Lỗi khi tải file lên';
    const errors = {};

    if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'File quá lớn';
        errors.file = ['Kích thước file vượt quá giới hạn cho phép'];
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        errorMessage = 'Loại file không hợp lệ';
        errors.file = ['Loại file không được hỗ trợ'];
    } else if (err.code === 'LIMIT_FILE_COUNT') {
        errorMessage = 'Quá nhiều file';
        errors.file = ['Số lượng file vượt quá giới hạn cho phép'];
    } else {
        errors.file = ['Lỗi khi tải file: ' + (err.message || 'Không xác định')];
    }

    return new AppError(errorMessage, 400, errors);
};

/**
 * Xử lý lỗi validation từ thư viện express-validator
 */
const handleExpressValidatorError = (err) => {
    const errors = {};

    if (err.array && typeof err.array === 'function') {
        const validationErrors = err.array();

        validationErrors.forEach((error) => {
            const field = error.param;
            if (!errors[field]) {
                errors[field] = [];
            }
            errors[field].push(error.msg);
        });

        return new AppError('Lỗi xác thực dữ liệu', 400, errors);
    }

    return err;
};

/**
 * Xử lý lỗi trong môi trường development
 */
const sendErrorDev = (err, res) => {
    logger.debug('Detailed error in development:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
        errors: err.errors
    });

    return res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message,
        errors: err.errors,
        stack: err.stack,
        error: err
    });
};

/**
 * Xử lý lỗi trong môi trường production
 */
const sendErrorProd = (err, res) => {
    // Lỗi được xác định (đã xử lý)
    if (err.isOperational) {
        logger.info('Operational error:', {
            statusCode: err.statusCode,
            message: err.message
        });

        return res.status(err.statusCode || 500).json({
            status: 'error',
            message: err.message,
            errors: err.errors
        });
    }

    // Lỗi không xác định (lỗi lập trình hoặc lỗi không xử lý)
    logger.error('Unhandled error:', err);
    return res.status(500).json({
        status: 'error',
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    });
};

/**
 * Middleware xử lý lỗi toàn cục
 */
export const errorHandler = (err, req, res, next) => {
    // Kiểm tra nếu là yêu cầu API để tránh vòng lặp vô hạn
    const isApiRequest = req.path.includes('/investments') || req.path.startsWith('/api/');

    // Giảm thiểu log cho các yêu cầu API
    if (!isApiRequest) {
        logger.debug('Error handler triggered:', err.message);
    }

    err.statusCode = err.statusCode || 500;

    // Phân biệt môi trường để xử lý lỗi phù hợp
    if (process.env.NODE_ENV === 'development') {
        // Xử lý lỗi CORS trong development mode
        if (err.message && err.message.includes('CORS')) {
            if (next) return next();
        }

        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;

        // Xử lý các lỗi từ Mongoose và MongoDB
        if (error.name === 'ValidationError') error = handleMongooseValidationError(error);
        if (error.code === 11000) error = handleDuplicateKeyError(error);
        if (error.name === 'CastError') error = handleCastError(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        // Xử lý lỗi CORS
        if (error.message && error.message.includes('CORS')) error = handleCORSError(error);
        // Xử lý lỗi tải file
        if (error.code && error.code.startsWith('LIMIT_')) error = handleFileUploadError(error);
        // Xử lý lỗi express-validator
        if (error.array && typeof error.array === 'function') error = handleExpressValidatorError(error);

        sendErrorProd(error, res);
    }
}; 