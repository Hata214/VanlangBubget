import { AppError } from './errorMiddleware.js';
import logger from '../utils/logger.js';
import { body, validationResult } from 'express-validator';

/**
 * Middleware validation sử dụng Joi 
 * Xác thực dữ liệu request body
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = {};
            error.details.forEach(detail => {
                const path = detail.path.join('.') || 'error';
                if (!errors[path]) {
                    errors[path] = [];
                }
                errors[path].push(detail.message);
            });

            logger.debug('Validation failed for request body:', {
                path: req.path,
                errors
            });

            return next(new AppError('Lỗi xác thực dữ liệu', 400, errors));
        }

        // Gán lại giá trị đã xác thực và chuyển đổi kiểu
        req.body = value;
        next();
    };
};

/**
 * Middleware validation sử dụng Joi
 * Xác thực dữ liệu request query
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = {};
            error.details.forEach(detail => {
                const path = detail.path.join('.') || 'error';
                if (!errors[path]) {
                    errors[path] = [];
                }
                errors[path].push(detail.message);
            });

            logger.debug('Validation failed for request query:', {
                path: req.path,
                errors
            });

            return next(new AppError('Lỗi xác thực tham số truy vấn', 400, errors));
        }

        // Gán lại giá trị đã xác thực và chuyển đổi kiểu
        req.query = value;
        next();
    };
};

/**
 * Middleware validation sử dụng Joi
 * Xác thực dữ liệu request params
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
export const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = {};
            error.details.forEach(detail => {
                const path = detail.path.join('.') || 'error';
                if (!errors[path]) {
                    errors[path] = [];
                }
                errors[path].push(detail.message);
            });

            logger.debug('Validation failed for request params:', {
                path: req.path,
                errors
            });

            return next(new AppError('Lỗi xác thực tham số đường dẫn', 400, errors));
        }

        // Gán lại giá trị đã xác thực và chuyển đổi kiểu
        req.params = value;
        next();
    };
};

/**
 * Middleware validation sử dụng express-validator
 * @returns {Function} Express middleware xử lý kết quả validation
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const formattedErrors = {};
    errors.array().forEach(error => {
        const field = error.path;
        if (!formattedErrors[field]) {
            formattedErrors[field] = [];
        }
        formattedErrors[field].push(error.msg);
    });

    logger.debug('Express-validator validation failed:', {
        path: req.path,
        errors: formattedErrors
    });

    return next(new AppError('Lỗi xác thực dữ liệu', 400, formattedErrors));
};

/**
 * Tạo middleware kiểm tra dữ liệu tải lên
 * @param {Object} options - Các tùy chọn kiểm tra
 * @returns {Function} Express middleware
 */
export const validateUpload = (options = {}) => {
    const {
        maxFileSize = 5 * 1024 * 1024, // 5MB mặc định
        allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'],
        maxFiles = 5,
        fieldName = 'file'
    } = options;

    return (req, res, next) => {
        // Nếu không có file, bỏ qua
        if (!req.file && (!req.files || req.files.length === 0)) {
            return next();
        }

        const files = req.file ? [req.file] : (Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat());
        const errors = {};

        // Kiểm tra số lượng file
        if (files.length > maxFiles) {
            errors.files = [`Tối đa ${maxFiles} file được phép tải lên`];
            return next(new AppError('Quá nhiều file', 400, errors));
        }

        // Kiểm tra từng file
        for (const file of files) {
            // Kiểm tra kích thước
            if (file.size > maxFileSize) {
                errors[file.fieldname || fieldName] = [`File "${file.originalname}" quá lớn. Kích thước tối đa là ${maxFileSize / 1024 / 1024}MB`];
            }

            // Kiểm tra loại file
            if (!allowedMimeTypes.includes(file.mimetype)) {
                if (!errors[file.fieldname || fieldName]) {
                    errors[file.fieldname || fieldName] = [];
                }
                errors[file.fieldname || fieldName].push(`Loại file "${file.mimetype}" không được hỗ trợ. Chỉ chấp nhận: ${allowedMimeTypes.join(', ')}`);
            }
        }

        if (Object.keys(errors).length > 0) {
            logger.debug('File validation failed:', errors);
            return next(new AppError('Lỗi xác thực file', 400, errors));
        }

        next();
    };
};

/**
 * Object chứa các hàm validation thông dụng cho express-validator
 */
export const validators = {
    // Kiểm tra email
    email: () => body('email')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),

    // Kiểm tra mật khẩu mạnh
    password: (fieldName = 'password', options = {}) => {
        const { min = 8, max = 100 } = options;
        return body(fieldName)
            .isLength({ min, max }).withMessage(`Mật khẩu phải từ ${min} đến ${max} ký tự`)
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/).withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
    },

    // Kiểm tra ID MongoDB
    mongoId: (fieldName = 'id', location = 'params') => {
        if (location === 'params') {
            return body(fieldName).isMongoId().withMessage('ID không hợp lệ');
        } else if (location === 'body') {
            return body(fieldName).isMongoId().withMessage('ID không hợp lệ');
        }
    },

    // Kiểm tra số điện thoại
    phone: (fieldName = 'phone') => body(fieldName)
        .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),

    // Kiểm tra tên (không chứa ký tự đặc biệt)
    name: (fieldName = 'name', options = {}) => {
        const { min = 2, max = 50 } = options;
        return body(fieldName)
            .isLength({ min, max }).withMessage(`Tên phải từ ${min} đến ${max} ký tự`)
            .matches(/^[a-zA-Z\sÀ-ỹ]+$/).withMessage('Tên không được chứa ký tự đặc biệt hoặc số');
    }
}; 