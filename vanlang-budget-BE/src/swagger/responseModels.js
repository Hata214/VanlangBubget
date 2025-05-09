/**
 * Swagger response models
 * File này chứa các schemas cho response models sử dụng trong Swagger
 */

export const responseModels = {
    // User models
    User: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của người dùng' },
            email: { type: 'string', description: 'Email người dùng' },
            firstName: { type: 'string', description: 'Tên người dùng' },
            lastName: { type: 'string', description: 'Họ người dùng' },
            phoneNumber: { type: 'string', description: 'Số điện thoại' },
            role: { type: 'string', enum: ['user', 'admin'], description: 'Vai trò người dùng' },
            isEmailVerified: { type: 'boolean', description: 'Trạng thái xác thực email' },
            fullName: { type: 'string', description: 'Tên đầy đủ (virtual)' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    // Auth models
    AuthResponse: {
        type: 'object',
        properties: {
            status: { type: 'string', example: 'success', description: 'Trạng thái request' },
            token: { type: 'string', description: 'JWT access token' },
            refreshToken: { type: 'string', description: 'JWT refresh token' },
            user: { $ref: '#/components/schemas/User' }
        }
    },

    // Budget models
    Budget: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của ngân sách' },
            userId: { type: 'string', description: 'ID của người dùng sở hữu' },
            category: { type: 'string', description: 'Danh mục ngân sách' },
            amount: { type: 'number', description: 'Số tiền dự kiến' },
            spent: { type: 'number', description: 'Số tiền đã chi tiêu' },
            month: { type: 'integer', minimum: 1, maximum: 12, description: 'Tháng của ngân sách' },
            year: { type: 'integer', minimum: 2000, description: 'Năm của ngân sách' },
            percentage: { type: 'number', description: 'Phần trăm đã chi tiêu (virtual)' },
            remaining: { type: 'number', description: 'Số tiền còn lại (virtual)' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    // Expense models
    Expense: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của khoản chi' },
            userId: { type: 'string', description: 'ID của người dùng sở hữu' },
            amount: { type: 'number', description: 'Số tiền chi tiêu' },
            description: { type: 'string', description: 'Mô tả khoản chi' },
            category: { type: 'string', description: 'Danh mục khoản chi' },
            date: { type: 'string', format: 'date-time', description: 'Ngày chi tiêu' },
            location: {
                type: 'object',
                properties: {
                    lat: { type: 'number', description: 'Vĩ độ' },
                    lng: { type: 'number', description: 'Kinh độ' },
                    address: { type: 'string', description: 'Địa chỉ' }
                }
            },
            attachments: {
                type: 'array',
                items: { type: 'string', description: 'URL đính kèm' }
            },
            month: { type: 'integer', description: 'Tháng của khoản chi (virtual)' },
            year: { type: 'integer', description: 'Năm của khoản chi (virtual)' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    // Income models
    Income: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của khoản thu' },
            userId: { type: 'string', description: 'ID của người dùng sở hữu' },
            amount: { type: 'number', description: 'Số tiền thu nhập' },
            description: { type: 'string', description: 'Mô tả khoản thu' },
            category: { type: 'string', description: 'Danh mục khoản thu' },
            date: { type: 'string', format: 'date-time', description: 'Ngày thu nhập' },
            attachments: {
                type: 'array',
                items: { type: 'string', description: 'URL đính kèm' }
            },
            month: { type: 'integer', description: 'Tháng của khoản thu (virtual)' },
            year: { type: 'integer', description: 'Năm của khoản thu (virtual)' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    // Category models
    Category: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của danh mục' },
            userId: { type: 'string', description: 'ID của người dùng sở hữu' },
            name: { type: 'string', description: 'Tên danh mục' },
            icon: { type: 'string', description: 'Icon của danh mục' },
            color: { type: 'string', description: 'Màu sắc của danh mục' },
            isDefault: { type: 'boolean', description: 'Danh mục mặc định hay không' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    // Loan models
    Loan: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của khoản vay' },
            userId: { type: 'string', description: 'ID của người dùng sở hữu' },
            amount: { type: 'number', description: 'Số tiền vay' },
            description: { type: 'string', description: 'Mô tả khoản vay' },
            lender: { type: 'string', description: 'Người cho vay' },
            interestRate: { type: 'number', description: 'Lãi suất khoản vay' },
            startDate: { type: 'string', format: 'date-time', description: 'Ngày bắt đầu' },
            dueDate: { type: 'string', format: 'date-time', description: 'Ngày đáo hạn' },
            status: {
                type: 'string',
                enum: ['ACTIVE', 'PAID', 'OVERDUE'],
                description: 'Trạng thái khoản vay'
            },
            attachments: {
                type: 'array',
                items: { type: 'string', description: 'URL đính kèm' }
            },
            totalPaid: { type: 'number', description: 'Tổng số tiền đã thanh toán (virtual)' },
            remainingAmount: { type: 'number', description: 'Số tiền còn lại (virtual)' },
            daysRemaining: { type: 'number', description: 'Số ngày còn lại (virtual)' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    // LoanPayment models
    LoanPayment: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của thanh toán' },
            loanId: { type: 'string', description: 'ID của khoản vay' },
            userId: { type: 'string', description: 'ID của người dùng sở hữu' },
            amount: { type: 'number', description: 'Số tiền thanh toán' },
            paymentDate: { type: 'string', format: 'date-time', description: 'Ngày thanh toán' },
            description: { type: 'string', description: 'Mô tả thanh toán' },
            attachments: {
                type: 'array',
                items: { type: 'string', description: 'URL đính kèm' }
            },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    // Notification models
    Notification: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của thông báo' },
            userId: { type: 'string', description: 'ID của người dùng sở hữu' },
            title: { type: 'string', description: 'Tiêu đề thông báo' },
            message: { type: 'string', description: 'Nội dung thông báo' },
            type: {
                type: 'string',
                enum: ['expense', 'income', 'budget', 'loan', 'system'],
                description: 'Loại thông báo'
            },
            read: { type: 'boolean', description: 'Đánh dấu đã đọc hay chưa' },
            relatedId: { type: 'string', description: 'ID đối tượng liên quan (nếu có)' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    // Pagination models
    PaginationResponse: {
        type: 'object',
        properties: {
            status: { type: 'string', example: 'success', description: 'Trạng thái request' },
            results: { type: 'integer', description: 'Số lượng kết quả trả về' },
            total: { type: 'integer', description: 'Tổng số bản ghi' },
            page: { type: 'integer', description: 'Trang hiện tại' },
            totalPages: { type: 'integer', description: 'Tổng số trang' },
            limit: { type: 'integer', description: 'Số bản ghi trên mỗi trang' },
            hasMore: { type: 'boolean', description: 'Còn trang tiếp theo không' },
            data: {
                type: 'array',
                description: 'Mảng dữ liệu',
                items: {
                    type: 'object',
                    description: 'Đối tượng dữ liệu'
                }
            }
        }
    },

    // Error models
    ErrorResponse: {
        type: 'object',
        properties: {
            status: { type: 'string', example: 'error', description: 'Trạng thái request' },
            message: { type: 'string', description: 'Thông báo lỗi' },
            errors: {
                type: 'object',
                description: 'Chi tiết lỗi cho từng trường',
                additionalProperties: {
                    type: 'array',
                    items: { type: 'string' }
                },
                example: {
                    email: ['Email không hợp lệ', 'Email đã được sử dụng']
                }
            }
        }
    },

    // Generic success response
    SuccessResponse: {
        type: 'object',
        properties: {
            status: { type: 'string', example: 'success', description: 'Trạng thái request' },
            message: { type: 'string', description: 'Thông báo' }
        }
    },

    // Investment models
    Transaction: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của giao dịch' },
            type: {
                type: 'string',
                enum: ['buy', 'sell'],
                description: 'Loại giao dịch (mua hoặc bán)'
            },
            price: { type: 'number', description: 'Giá giao dịch' },
            quantity: { type: 'number', description: 'Số lượng' },
            fee: { type: 'number', description: 'Phí giao dịch' },
            date: { type: 'string', format: 'date-time', description: 'Ngày giao dịch' },
            notes: { type: 'string', description: 'Ghi chú giao dịch' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    Investment: {
        type: 'object',
        properties: {
            _id: { type: 'string', description: 'ID của khoản đầu tư' },
            userId: { type: 'string', description: 'ID của người dùng sở hữu' },
            type: {
                type: 'string',
                enum: ['stock', 'gold', 'crypto'],
                description: 'Loại đầu tư'
            },
            assetName: { type: 'string', description: 'Tên tài sản' },
            symbol: { type: 'string', description: 'Ký hiệu tài sản' },
            currentPrice: { type: 'number', description: 'Giá hiện tại' },
            totalQuantity: { type: 'number', description: 'Tổng số lượng đang nắm giữ' },
            initialInvestment: { type: 'number', description: 'Tổng giá trị đầu tư ban đầu' },
            currentValue: { type: 'number', description: 'Giá trị hiện tại' },
            profitLoss: { type: 'number', description: 'Lãi/lỗ hiện tại' },
            roi: { type: 'number', description: 'ROI (Return on Investment) tính bằng %' },
            lastUpdated: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật giá cuối cùng' },
            transactions: {
                type: 'array',
                items: { $ref: '#/components/schemas/Transaction' },
                description: 'Danh sách các giao dịch'
            },
            notes: { type: 'string', description: 'Ghi chú' },
            createdAt: { type: 'string', format: 'date-time', description: 'Thời gian tạo' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật' }
        }
    },

    InvestmentSummary: {
        type: 'object',
        properties: {
            totalInvestment: { type: 'number', description: 'Tổng giá trị đầu tư ban đầu' },
            totalCurrentValue: { type: 'number', description: 'Tổng giá trị hiện tại' },
            totalProfitLoss: { type: 'number', description: 'Tổng lãi/lỗ' },
            overallROI: { type: 'number', description: 'ROI tổng thể (%)' },
            byType: {
                type: 'object',
                properties: {
                    stock: {
                        type: 'object',
                        properties: {
                            count: { type: 'number', description: 'Số lượng khoản đầu tư' },
                            investment: { type: 'number', description: 'Tổng giá trị đầu tư' },
                            currentValue: { type: 'number', description: 'Giá trị hiện tại' },
                            profitLoss: { type: 'number', description: 'Lãi/lỗ' },
                            roi: { type: 'number', description: 'ROI (%)' }
                        }
                    },
                    gold: {
                        type: 'object',
                        properties: {
                            count: { type: 'number', description: 'Số lượng khoản đầu tư' },
                            investment: { type: 'number', description: 'Tổng giá trị đầu tư' },
                            currentValue: { type: 'number', description: 'Giá trị hiện tại' },
                            profitLoss: { type: 'number', description: 'Lãi/lỗ' },
                            roi: { type: 'number', description: 'ROI (%)' }
                        }
                    },
                    crypto: {
                        type: 'object',
                        properties: {
                            count: { type: 'number', description: 'Số lượng khoản đầu tư' },
                            investment: { type: 'number', description: 'Tổng giá trị đầu tư' },
                            currentValue: { type: 'number', description: 'Giá trị hiện tại' },
                            profitLoss: { type: 'number', description: 'Lãi/lỗ' },
                            roi: { type: 'number', description: 'ROI (%)' }
                        }
                    }
                }
            }
        }
    },

    // Investment Input
    InvestmentInput: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['stock', 'gold', 'crypto'],
                description: 'Loại đầu tư'
            },
            assetName: { type: 'string', description: 'Tên tài sản' },
            symbol: { type: 'string', description: 'Ký hiệu tài sản' },
            currentPrice: { type: 'number', description: 'Giá hiện tại' },
            notes: { type: 'string', description: 'Ghi chú' },
            transaction: { $ref: '#/components/schemas/TransactionInput' }
        },
        required: ['type', 'assetName', 'symbol']
    },

    InvestmentUpdate: {
        type: 'object',
        properties: {
            assetName: { type: 'string', description: 'Tên tài sản' },
            symbol: { type: 'string', description: 'Ký hiệu tài sản' },
            currentPrice: { type: 'number', description: 'Giá hiện tại' },
            notes: { type: 'string', description: 'Ghi chú' }
        }
    },

    TransactionInput: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['buy', 'sell'],
                description: 'Loại giao dịch (mua hoặc bán)'
            },
            price: { type: 'number', description: 'Giá giao dịch' },
            quantity: { type: 'number', description: 'Số lượng' },
            fee: { type: 'number', description: 'Phí giao dịch' },
            date: { type: 'string', format: 'date-time', description: 'Ngày giao dịch' },
            notes: { type: 'string', description: 'Ghi chú giao dịch' }
        },
        required: ['type', 'price', 'quantity']
    }
}; 