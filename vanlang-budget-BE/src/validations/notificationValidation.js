import Joi from 'joi';
import { messages } from '../utils/validationMessages.js';

/**
 * Schema xác thực cho tham số query khi lấy danh sách thông báo
 */
export const getNotificationsQuerySchema = Joi.object({
    read: Joi.string().valid('true', 'false').optional()
        .messages({
            'any.only': 'Trạng thái đọc phải là "true" hoặc "false"'
        }),
    limit: Joi.number().integer().min(1).max(100).optional().default(20)
        .messages({
            'number.base': 'Giới hạn phải là số',
            'number.integer': 'Giới hạn phải là số nguyên',
            'number.min': 'Giới hạn phải lớn hơn hoặc bằng 1',
            'number.max': 'Giới hạn không được vượt quá 100'
        }),
    page: Joi.number().integer().min(1).optional().default(1)
        .messages({
            'number.base': 'Trang phải là số',
            'number.integer': 'Trang phải là số nguyên',
            'number.min': 'Trang phải lớn hơn hoặc bằng 1'
        })
});

/**
 * Schema xác thực tham số route (ID)
 */
export const idParamSchema = Joi.object({
    id: Joi.string().hex().length(24).required()
        .messages({
            'string.base': 'ID phải là chuỗi',
            'string.hex': 'ID phải là chuỗi hex hợp lệ',
            'string.length': 'ID phải có độ dài 24 ký tự',
            'any.required': 'ID là bắt buộc'
        })
});

/**
 * Schema xác thực trống cho route không cần tham số
 */
export const emptySchema = Joi.object({});

// Schema cho việc tạo thông báo (sử dụng trong socketManager)
export const createNotificationSchema = Joi.object({
    userId: Joi.string().hex().length(24).required()
        .messages(messages.mongoId('ID người dùng')),
    title: Joi.string().trim().min(2).max(100).required()
        .messages(messages.string('Tiêu đề', 2, 100)),
    message: Joi.string().trim().min(2).max(500).required()
        .messages(messages.string('Nội dung', 2, 500)),
    type: Joi.string().valid('expense', 'income', 'budget', 'loan', 'system').required()
        .messages({
            'any.only': 'Loại thông báo không hợp lệ',
            'any.required': 'Loại thông báo là bắt buộc'
        }),
    relatedId: Joi.string().hex().length(24).optional()
        .messages(messages.mongoId('ID liên quan')),
    read: Joi.boolean().default(false)
}); 