import Joi from 'joi';

/**
 * Schema xác thực dữ liệu tạo ngân sách mới
 */
export const createBudgetSchema = Joi.object({
    category: Joi.string().required()
        .messages({
            'any.required': 'Danh mục ngân sách là bắt buộc',
            'string.empty': 'Danh mục ngân sách không được để trống'
        }),
    amount: Joi.number().required().min(0)
        .messages({
            'any.required': 'Số tiền ngân sách là bắt buộc',
            'number.base': 'Số tiền phải là một số',
            'number.min': 'Số tiền không thể là số âm'
        }),
    month: Joi.number().required().min(1).max(12)
        .messages({
            'any.required': 'Tháng là bắt buộc',
            'number.base': 'Tháng phải là một số',
            'number.min': 'Tháng phải từ 1 đến 12',
            'number.max': 'Tháng phải từ 1 đến 12'
        }),
    year: Joi.number().required().min(2000)
        .messages({
            'any.required': 'Năm là bắt buộc',
            'number.base': 'Năm phải là một số',
            'number.min': 'Năm phải từ 2000 trở lên'
        })
});

/**
 * Schema xác thực dữ liệu cập nhật ngân sách
 */
export const updateBudgetSchema = Joi.object({
    category: Joi.string()
        .messages({
            'string.empty': 'Danh mục ngân sách không được để trống'
        }),
    amount: Joi.number().min(0)
        .messages({
            'number.base': 'Số tiền phải là một số',
            'number.min': 'Số tiền không thể là số âm'
        }),
    month: Joi.number().min(1).max(12)
        .messages({
            'number.base': 'Tháng phải là một số',
            'number.min': 'Tháng phải từ 1 đến 12',
            'number.max': 'Tháng phải từ 1 đến 12'
        }),
    year: Joi.number().min(2000)
        .messages({
            'number.base': 'Năm phải là một số',
            'number.min': 'Năm phải từ 2000 trở lên'
        })
}).min(1).messages({
    'object.min': 'Cần cung cấp ít nhất một trường để cập nhật'
});

/**
 * Schema cho query params khi lấy danh sách ngân sách
 */
export const getBudgetsQuerySchema = Joi.object({
    month: Joi.number().integer().min(1).max(12),
    year: Joi.number().integer().min(2000),
    category: Joi.string().trim(),
    categories: Joi.alternatives().try(
        Joi.array().items(Joi.string().trim()),
        Joi.string().trim()
    ),
    group: Joi.string().trim(),
    startDate: Joi.date(),
    endDate: Joi.date(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    page: Joi.number().integer().min(1).default(1)
});

/**
 * Schema xác thực cho tham số query khi lấy thống kê ngân sách
 */
export const budgetStatsQuerySchema = Joi.object({
    month: Joi.number().min(1).max(12)
        .messages({
            'number.base': 'Tháng phải là một số',
            'number.min': 'Tháng phải từ 1 đến 12',
            'number.max': 'Tháng phải từ 1 đến 12'
        }),
    year: Joi.number().min(2000)
        .messages({
            'number.base': 'Năm phải là một số',
            'number.min': 'Năm phải từ 2000 trở lên'
        })
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