import Joi from 'joi';

// Định nghĩa các loại đầu tư được phép
const allowedInvestmentTypes = ['stock', 'crypto', 'gold', 'savings', 'fund', 'realestate', 'other'];
const allowedTransactionTypes = ['buy', 'sell', 'deposit', 'withdraw', 'dividend', 'interest'];

// Schema để tạo một khoản đầu tư đơn giản (chưa bao gồm giao dịch ban đầu)
const createInvestmentSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'string.empty': 'Tên khoản đầu tư không được để trống',
        'any.required': 'Tên khoản đầu tư là bắt buộc'
    }),
    type: Joi.string().valid(...allowedInvestmentTypes).required().messages({
        'any.only': 'Loại đầu tư không hợp lệ',
        'any.required': 'Loại đầu tư là bắt buộc'
    }),
    symbol: Joi.string().trim().uppercase().allow('', null), // Cho phép trống hoặc null
    category: Joi.string().trim().allow('', null),
    startDate: Joi.date().iso().max('now').allow(null).messages({
        'date.format': 'Ngày bắt đầu phải có định dạng YYYY-MM-DD',
        'date.max': 'Ngày bắt đầu không được lớn hơn ngày hiện tại'
    }),
    notes: Joi.string().trim().allow('', null),
    initialInvestment: Joi.number().min(0).optional().messages({ // Vốn ban đầu (nếu có)
        'number.base': 'Vốn ban đầu phải là số',
        'number.min': 'Vốn ban đầu không được âm'
    }),
    currentPrice: Joi.number().min(0).optional().messages({ // Giá hiện tại (nếu có)
        'number.base': 'Giá hiện tại phải là số',
        'number.min': 'Giá hiện tại không được âm'
    }),
    // Các trường cho đầu tư đất đai
    propertyType: Joi.string().valid('residential', 'agricultural', 'commercial', 'project', 'other').when('type', {
        is: 'realestate',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    address: Joi.string().trim().when('type', {
        is: 'realestate',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    legalStatus: Joi.string().valid('redbook', 'pinkbook', 'handwritten', 'pending', 'other').when('type', {
        is: 'realestate',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    area: Joi.number().min(0).when('type', {
        is: 'realestate',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    frontWidth: Joi.number().min(0).optional(),
    depth: Joi.number().min(0).optional(),
    additionalFees: Joi.number().min(0).default(0).optional(),
    ownershipType: Joi.string().valid('personal', 'shared', 'business', 'other').when('type', {
        is: 'realestate',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    investmentPurpose: Joi.string().valid('holding', 'appreciation', 'development', 'other').optional(),
    currentStatus: Joi.string().valid('holding', 'sold', 'renting', 'other').optional(),
    // Thêm trường transaction để hỗ trợ giao dịch ban đầu
    transaction: Joi.object({
        type: Joi.string().valid(...allowedTransactionTypes).optional(),
        price: Joi.number().min(0).optional(),
        quantity: Joi.number().min(0).optional(),
        fee: Joi.number().min(0).default(0).optional(),
        date: Joi.date().iso().max('now').optional(),
        notes: Joi.string().trim().allow('', null).optional()
    }).optional()
});

// Schema để cập nhật thông tin cơ bản của khoản đầu tư
const updateInvestmentSchema = Joi.object({
    name: Joi.string().trim().optional(),
    category: Joi.string().trim().allow('', null),
    notes: Joi.string().trim().allow('', null),
    currentPrice: Joi.number().min(0).optional().messages({ // Cho phép cập nhật giá
        'number.base': 'Giá hiện tại phải là số',
        'number.min': 'Giá hiện tại không được âm'
    }),
    // Các trường cho đầu tư đất đai
    propertyType: Joi.string().valid('residential', 'agricultural', 'commercial', 'project', 'other').optional(),
    address: Joi.string().trim().optional(),
    legalStatus: Joi.string().valid('redbook', 'pinkbook', 'handwritten', 'pending', 'other').optional(),
    area: Joi.number().min(0).optional(),
    frontWidth: Joi.number().min(0).optional(),
    depth: Joi.number().min(0).optional(),
    additionalFees: Joi.number().min(0).optional(),
    ownershipType: Joi.string().valid('personal', 'shared', 'business', 'other').optional(),
    investmentPurpose: Joi.string().valid('holding', 'appreciation', 'development', 'other').optional(),
    currentStatus: Joi.string().valid('holding', 'sold', 'renting', 'other').optional()
    // Không cho phép thay đổi type hoặc symbol ở đây
    // Các trường khác như interestRate, endDate... sẽ cần schema riêng nếu cần cập nhật
}).min(1); // Yêu cầu ít nhất một trường để cập nhật

// Schema cho việc thêm một giao dịch mới
const addTransactionSchema = Joi.object({
    type: Joi.string().valid(...allowedTransactionTypes).required().messages({
        'any.only': 'Loại giao dịch không hợp lệ',
        'any.required': 'Loại giao dịch là bắt buộc'
    }),
    amount: Joi.number().min(0).when('type', {
        is: Joi.valid('deposit', 'withdraw', 'dividend', 'interest'),
        then: Joi.required(),
        otherwise: Joi.optional()
    }).messages({
        'number.base': 'Số tiền phải là số',
        'number.min': 'Số tiền không được âm',
        'any.required': 'Số tiền là bắt buộc cho loại giao dịch này'
    }),
    price: Joi.number().min(0).when('type', {
        is: Joi.valid('buy', 'sell'),
        then: Joi.required(),
        otherwise: Joi.optional()
    }).messages({
        'number.base': 'Giá phải là số',
        'number.min': 'Giá không được âm',
        'any.required': 'Giá là bắt buộc cho giao dịch mua/bán'
    }),
    quantity: Joi.number().min(0).when('type', {
        is: Joi.valid('buy', 'sell'),
        then: Joi.required(),
        otherwise: Joi.optional()
    }).messages({
        'number.base': 'Số lượng phải là số',
        'number.min': 'Số lượng không được âm',
        'any.required': 'Số lượng là bắt buộc cho giao dịch mua/bán'
    }),
    fee: Joi.number().min(0).default(0).messages({
        'number.base': 'Phí phải là số',
        'number.min': 'Phí không được âm'
    }),
    date: Joi.date().iso().max('now').required().messages({
        'date.format': 'Ngày giao dịch phải có định dạng YYYY-MM-DD',
        'date.max': 'Ngày giao dịch không được lớn hơn ngày hiện tại',
        'any.required': 'Ngày giao dịch là bắt buộc'
    }),
    notes: Joi.string().trim().allow('', null)
});

// Schema cho ID trong params (/:id)
const idParamSchema = Joi.object({
    id: Joi.string().hex().length(24).required().messages({
        'string.hex': 'ID không hợp lệ',
        'string.length': 'ID không hợp lệ',
        'any.required': 'ID là bắt buộc'
    })
});

// Schema cho ID giao dịch trong params (/:transactionId)
const transactionIdParamSchema = Joi.object({
    transactionId: Joi.string().hex().length(24).required().messages({
        'string.hex': 'ID giao dịch không hợp lệ',
        'string.length': 'ID giao dịch không hợp lệ',
        'any.required': 'ID giao dịch là bắt buộc'
    })
});

// Schema cho cả ID investment và ID transaction trong params
const investmentTransactionParamsSchema = Joi.object({
    id: Joi.string().hex().length(24).required().messages({
        'string.hex': 'ID khoản đầu tư không hợp lệ',
        'string.length': 'ID khoản đầu tư không hợp lệ',
        'any.required': 'ID khoản đầu tư là bắt buộc'
    }),
    transactionId: Joi.string().hex().length(24).required().messages({
        'string.hex': 'ID giao dịch không hợp lệ',
        'string.length': 'ID giao dịch không hợp lệ',
        'any.required': 'ID giao dịch là bắt buộc'
    })
});

// Schema cho ID trong query params (?id=...)
const idQuerySchema = Joi.object({
    id: Joi.string().hex().length(24).required().messages({
        'string.hex': 'ID không hợp lệ',
        'string.length': 'ID không hợp lệ',
        'any.required': 'ID là bắt buộc'
    })
});

// Schema cho type trong params (/:type)
const typeParamSchema = Joi.object({
    type: Joi.string().valid(...allowedInvestmentTypes).required().messages({
        'any.only': 'Loại đầu tư không hợp lệ',
        'any.required': 'Loại đầu tư là bắt buộc'
    })
});

// Schema cho body của batch update price
const batchUpdatePriceSchema = Joi.object({
    updates: Joi.array().items(
        Joi.object({
            id: Joi.string().hex().length(24).required().messages({
                'string.hex': 'ID khoản đầu tư không hợp lệ',
                'string.length': 'ID khoản đầu tư không hợp lệ',
                'any.required': 'ID khoản đầu tư là bắt buộc'
            }),
            currentPrice: Joi.number().min(0).required().messages({
                'number.base': 'Giá hiện tại phải là số',
                'number.min': 'Giá hiện tại không được âm',
                'any.required': 'Giá hiện tại là bắt buộc'
            })
        })
    ).min(1).required().messages({
        'array.base': 'Dữ liệu cập nhật phải là một mảng',
        'array.min': 'Cần ít nhất một mục để cập nhật',
        'any.required': 'Dữ liệu cập nhật là bắt buộc'
    })
});

// Schema cho stockSymbol trong params (/:stockSymbol)
const stockSymbolParamSchema = Joi.object({
    stockSymbol: Joi.string().trim().uppercase().required().messages({
        'string.empty': 'Mã cổ phiếu không được để trống',
        'any.required': 'Mã cổ phiếu là bắt buộc'
    })
});

export {
    createInvestmentSchema,
    updateInvestmentSchema,
    addTransactionSchema,
    idParamSchema,
    transactionIdParamSchema,
    investmentTransactionParamsSchema,
    idQuerySchema,
    typeParamSchema,
    batchUpdatePriceSchema,
    stockSymbolParamSchema
};