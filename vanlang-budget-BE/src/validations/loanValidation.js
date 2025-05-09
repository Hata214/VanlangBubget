import Joi from 'joi';

/**
 * Schema xác thực dữ liệu tạo khoản vay mới
 */
export const createLoanSchema = Joi.object({
    amount: Joi.number().required().min(0)
        .messages({
            'any.required': 'Số tiền khoản vay là bắt buộc',
            'number.base': 'Số tiền phải là một số',
            'number.min': 'Số tiền không thể là số âm'
        }),
    description: Joi.string().required()
        .messages({
            'any.required': 'Mô tả khoản vay là bắt buộc',
            'string.empty': 'Mô tả khoản vay không được để trống'
        }),
    startDate: Joi.date().default(Date.now)
        .messages({
            'date.base': 'Ngày bắt đầu không hợp lệ'
        }),
    dueDate: Joi.date().required()
        .messages({
            'any.required': 'Ngày đáo hạn là bắt buộc',
            'date.base': 'Ngày đáo hạn không hợp lệ',
        }),
    interestRate: Joi.number().min(0).default(0)
        .messages({
            'number.base': 'Lãi suất phải là một số',
            'number.min': 'Lãi suất không thể là số âm'
        }),
    interestRateType: Joi.string().valid('DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR').default('YEAR')
        .messages({
            'string.base': 'Đơn vị thời gian phải là một chuỗi',
            'any.only': 'Đơn vị thời gian phải là một trong: DAY, WEEK, MONTH, QUARTER, YEAR'
        }),
    lender: Joi.string().required()
        .messages({
            'any.required': 'Tên người cho vay là bắt buộc',
            'string.empty': 'Tên người cho vay không được để trống'
        }),
    status: Joi.string().valid('ACTIVE', 'PAID', 'OVERDUE').default('ACTIVE')
        .messages({
            'string.base': 'Trạng thái phải là một chuỗi',
            'any.only': 'Trạng thái phải là một trong: ACTIVE, PAID, OVERDUE'
        }),
    attachments: Joi.array().items(Joi.string().uri()).optional()
        .messages({
            'array.base': 'Danh sách đính kèm phải là một mảng',
            'string.uri': 'URL đính kèm không hợp lệ'
        }),
}).unknown(true); // Cho phép các trường không được định nghĩa trong schema

/**
 * Schema xác thực dữ liệu cập nhật khoản vay
 */
export const updateLoanSchema = Joi.object({
    amount: Joi.number().min(0)
        .messages({
            'number.base': 'Số tiền phải là một số',
            'number.min': 'Số tiền không thể là số âm'
        }),
    description: Joi.string()
        .messages({
            'string.empty': 'Mô tả khoản vay không được để trống'
        }),
    startDate: Joi.date()
        .messages({
            'date.base': 'Ngày bắt đầu không hợp lệ'
        }),
    dueDate: Joi.date()
        .messages({
            'date.base': 'Ngày đáo hạn không hợp lệ'
        }),
    interestRate: Joi.number().min(0)
        .messages({
            'number.base': 'Lãi suất phải là một số',
            'number.min': 'Lãi suất không thể là số âm'
        }),
    interestRateType: Joi.string().valid('DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR')
        .messages({
            'string.base': 'Đơn vị thời gian phải là một chuỗi',
            'any.only': 'Đơn vị thời gian phải là một trong: DAY, WEEK, MONTH, QUARTER, YEAR'
        }),
    lender: Joi.string()
        .messages({
            'string.empty': 'Tên người cho vay không được để trống'
        }),
    status: Joi.string().valid('ACTIVE', 'PAID', 'OVERDUE')
        .messages({
            'string.base': 'Trạng thái phải là một chuỗi',
            'any.only': 'Trạng thái phải là một trong: ACTIVE, PAID, OVERDUE'
        }),
    attachments: Joi.array().items(Joi.string().uri())
        .messages({
            'array.base': 'Danh sách đính kèm phải là một mảng',
            'string.uri': 'URL đính kèm không hợp lệ'
        }),
    // Thêm trường _forceUpdate để đảm bảo luôn có ít nhất một trường khi cập nhật
    _forceUpdate: Joi.boolean().optional()
}).min(1).unknown(true).messages({
    'object.min': 'Cần cung cấp ít nhất một trường để cập nhật'
});

/**
 * Schema xác thực cho thanh toán khoản vay
 */
export const loanPaymentSchema = Joi.object({
    amount: Joi.number().required().min(0)
        .messages({
            'any.required': 'Số tiền thanh toán là bắt buộc',
            'number.base': 'Số tiền phải là một số',
            'number.min': 'Số tiền không thể là số âm'
        }),
    date: Joi.date().default(Date.now)
        .messages({
            'date.base': 'Ngày thanh toán không hợp lệ'
        }),
    note: Joi.string().allow('')
        .messages({
            'string.base': 'Ghi chú phải là một chuỗi'
        }),
    attachments: Joi.array().items(Joi.string().uri())
        .messages({
            'array.base': 'Danh sách đính kèm phải là một mảng',
            'string.uri': 'URL đính kèm không hợp lệ'
        })
});

/**
 * Schema xác thực cho tham số query khi lấy danh sách khoản vay
 */
export const getLoansQuerySchema = Joi.object({
    status: Joi.string().valid('ACTIVE', 'PAID', 'OVERDUE')
        .messages({
            'string.base': 'Trạng thái phải là một chuỗi',
            'any.only': 'Trạng thái phải là một trong: ACTIVE, PAID, OVERDUE'
        }),
    limit: Joi.number().integer().min(1).max(100).default(20)
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
    // Cho phép các tham số chống cache
    _t: Joi.any().optional(), // Timestamp để tránh cache
    cache: Joi.any().optional(), // Các tham số cache control
    noCache: Joi.any().optional(), // Chặn cache
    bust: Joi.any().optional() // Cache busting
}).unknown(true); // Cho phép các tham số không xác định khác

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