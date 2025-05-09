import Joi from 'joi';

/**
 * Schema xác thực dữ liệu tạo danh mục mới
 */
export const createCategorySchema = Joi.object({
    name: Joi.string().required()
        .messages({
            'any.required': 'Tên danh mục là bắt buộc',
            'string.empty': 'Tên danh mục không được để trống'
        }),
    icon: Joi.string().allow('')
        .messages({
            'string.base': 'Icon phải là một chuỗi'
        }),
    color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).allow('')
        .messages({
            'string.base': 'Màu sắc phải là một chuỗi',
            'string.pattern.base': 'Màu sắc phải ở định dạng hex (ví dụ: #FF0000)'
        }),
    isDefault: Joi.boolean().default(false)
});

/**
 * Schema xác thực dữ liệu cập nhật danh mục
 */
export const updateCategorySchema = Joi.object({
    name: Joi.string()
        .messages({
            'string.empty': 'Tên danh mục không được để trống'
        }),
    icon: Joi.string().allow('')
        .messages({
            'string.base': 'Icon phải là một chuỗi'
        }),
    color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).allow('')
        .messages({
            'string.base': 'Màu sắc phải là một chuỗi',
            'string.pattern.base': 'Màu sắc phải ở định dạng hex (ví dụ: #FF0000)'
        })
}).min(1).messages({
    'object.min': 'Cần cung cấp ít nhất một trường để cập nhật'
});

/**
 * Schema validation cho query của route get categories
 */
export const getCategoriesQuerySchema = Joi.object({
    isDefault: Joi.boolean(),
    group: Joi.string().trim(),
    grouped: Joi.boolean()
});

/**
 * Schema xác thực tham số route (ID)
 */
export const idParamSchema = Joi.object({
    id: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'any.required': 'ID là bắt buộc',
            'string.empty': 'ID không được để trống',
            'string.pattern.base': 'ID không hợp lệ, phải là một MongoDB ObjectId'
        })
}); 