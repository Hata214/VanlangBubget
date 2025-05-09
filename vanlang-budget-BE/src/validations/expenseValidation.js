import Joi from 'joi';

/**
 * Schema xác thực dữ liệu tạo chi tiêu mới
 */
export const createExpenseSchema = Joi.object({
    amount: Joi.number().required().min(0)
        .messages({
            'any.required': 'Số tiền chi tiêu là bắt buộc',
            'number.base': 'Số tiền phải là một số',
            'number.min': 'Số tiền không thể là số âm'
        }),
    description: Joi.string().required()
        .messages({
            'any.required': 'Mô tả chi tiêu là bắt buộc',
            'string.empty': 'Mô tả chi tiêu không được để trống'
        }),
    category: Joi.string().required()
        .messages({
            'any.required': 'Danh mục chi tiêu là bắt buộc',
            'string.empty': 'Danh mục chi tiêu không được để trống'
        }),
    date: Joi.date().default(Date.now)
        .messages({
            'date.base': 'Ngày chi tiêu không hợp lệ'
        }),
    location: Joi.object({
        lat: Joi.number().default(0)
            .messages({
                'number.base': 'Vĩ độ phải là một số'
            }),
        lng: Joi.number().default(0)
            .messages({
                'number.base': 'Kinh độ phải là một số'
            }),
        address: Joi.string().required()
            .messages({
                'any.required': 'Địa chỉ là bắt buộc khi cung cấp vị trí',
                'string.empty': 'Địa chỉ không được để trống'
            })
    }).optional(),
    attachments: Joi.array().items(Joi.string().uri())
        .messages({
            'array.base': 'Danh sách đính kèm phải là một mảng',
            'string.uri': 'URL đính kèm không hợp lệ'
        })
});

/**
 * Schema xác thực dữ liệu cập nhật chi tiêu
 */
export const updateExpenseSchema = Joi.object({
    amount: Joi.number().min(0)
        .messages({
            'number.base': 'Số tiền phải là một số',
            'number.min': 'Số tiền không thể là số âm'
        }),
    description: Joi.string()
        .messages({
            'string.empty': 'Mô tả chi tiêu không được để trống'
        }),
    category: Joi.string()
        .messages({
            'string.empty': 'Danh mục chi tiêu không được để trống'
        }),
    date: Joi.date()
        .messages({
            'date.base': 'Ngày chi tiêu không hợp lệ'
        }),
    location: Joi.object({
        lat: Joi.number().default(0)
            .messages({
                'number.base': 'Vĩ độ phải là một số'
            }),
        lng: Joi.number().default(0)
            .messages({
                'number.base': 'Kinh độ phải là một số'
            }),
        address: Joi.string().required()
            .messages({
                'any.required': 'Địa chỉ là bắt buộc khi cung cấp vị trí',
                'string.empty': 'Địa chỉ không được để trống'
            })
    }).optional(),
    attachments: Joi.array().items(Joi.string().uri())
        .messages({
            'array.base': 'Danh sách đính kèm phải là một mảng',
            'string.uri': 'URL đính kèm không hợp lệ'
        })
}).min(1).messages({
    'object.min': 'Cần cung cấp ít nhất một trường để cập nhật'
});

/**
 * Schema xác thực cho tham số query khi lấy danh sách chi tiêu
 */
export const getExpensesQuerySchema = Joi.object({
    startDate: Joi.date()
        .messages({
            'date.base': 'Ngày bắt đầu không hợp lệ'
        }),
    endDate: Joi.date()
        .messages({
            'date.base': 'Ngày kết thúc không hợp lệ'
        }),
    category: Joi.string()
        .messages({
            'string.empty': 'Danh mục không được để trống nếu được cung cấp'
        }),
    limit: Joi.number().integer().min(1).max(100).default(50)
        .messages({
            'number.base': 'Limit phải là một số',
            'number.integer': 'Limit phải là số nguyên',
            'number.min': 'Limit phải lớn hơn 0',
            'number.max': 'Limit không thể lớn hơn 100'
        }),
    page: Joi.number().integer().min(1).default(1)
        .messages({
            'number.base': 'Page phải là một số',
            'number.integer': 'Page phải là số nguyên',
            'number.min': 'Page phải lớn hơn 0'
        }),
    // Cho phép tham số chống cache
    _t: Joi.any().optional(), // Cho phép tham số timestamp để tránh cache
    cache: Joi.any().optional(), // Cho phép các tham số cache control khác
    noCache: Joi.any().optional(),
    bust: Joi.any().optional()
}).unknown(true); // Cho phép các tham số query không xác định khác

/**
 * Schema xác thực cho tham số query khi lấy tổng chi tiêu theo tháng
 */
export const monthlyQuerySchema = Joi.object({
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
 * Schema xác thực tham số route (ID)
 */
export const idParamSchema = Joi.object({
    id: Joi.string().required()
        .messages({
            'any.required': 'ID là bắt buộc',
            'string.empty': 'ID không được để trống'
        })
}); 