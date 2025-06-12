import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Các chức năng thiết lập Swagger cho ứng dụng
 */
export const setupSwagger = (app) => {
    // Swigger options
    const swaggerOptions = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'VanLang Budget API',
                version: '1.0.0',
                description: 'API Documentation for VanLang Budget Application',
                contact: {
                    name: 'VanLang University',
                    url: 'https://vanlanguni.edu.vn',
                },
            },
            servers: [
                {
                    url: process.env.NODE_ENV === 'production'
                        ? 'https://vanlang-budget-api.vercel.app'
                        : 'http://localhost:4000',
                    description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
                schemas: {
                    User: {
                        type: 'object',
                        required: ['email', 'firstName', 'lastName', 'password'],
                        properties: {
                            _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                            email: { type: 'string', format: 'email', description: 'User email address' },
                            firstName: { type: 'string', description: 'User first name' },
                            lastName: { type: 'string', description: 'User last name' },
                            password: { type: 'string', format: 'password', description: 'User password (hashed)' },
                            isVerified: { type: 'boolean', description: 'Whether the user email is verified' },
                            profileImage: { type: 'string', description: 'URL to profile image' },
                            notificationPreferences: {
                                type: 'object',
                                properties: {
                                    email: { type: 'boolean', description: 'Email notifications enabled' },
                                    push: { type: 'boolean', description: 'Push notifications enabled' },
                                },
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Budget: {
                        type: 'object',
                        required: ['userId', 'name', 'amount', 'category', 'startDate', 'endDate'],
                        properties: {
                            _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                            userId: { type: 'string', description: 'Reference to User' },
                            name: { type: 'string', description: 'Budget name' },
                            amount: { type: 'number', description: 'Budget amount' },
                            category: { type: 'string', description: 'Budget category' },
                            startDate: { type: 'string', format: 'date' },
                            endDate: { type: 'string', format: 'date' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Income: {
                        type: 'object',
                        required: ['userId', 'amount', 'category', 'date', 'description'],
                        properties: {
                            _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                            userId: { type: 'string', description: 'Reference to User' },
                            amount: { type: 'number', description: 'Income amount' },
                            category: { type: 'string', description: 'Income category' },
                            date: { type: 'string', format: 'date' },
                            description: { type: 'string' },
                            attachments: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    description: 'URLs to attachment files'
                                }
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Expense: {
                        type: 'object',
                        required: ['userId', 'amount', 'category', 'date', 'description'],
                        properties: {
                            _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                            userId: { type: 'string', description: 'Reference to User' },
                            amount: { type: 'number', description: 'Expense amount' },
                            category: { type: 'string', description: 'Expense category' },
                            date: { type: 'string', format: 'date' },
                            description: { type: 'string' },
                            attachments: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    description: 'URLs to attachment files'
                                }
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Loan: {
                        type: 'object',
                        required: ['userId', 'amount', 'interestRate', 'startDate', 'endDate', 'description', 'type'],
                        properties: {
                            _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                            userId: { type: 'string', description: 'Reference to User' },
                            amount: { type: 'number', description: 'Loan amount' },
                            interestRate: { type: 'number', description: 'Annual interest rate in percentage' },
                            startDate: { type: 'string', format: 'date' },
                            endDate: { type: 'string', format: 'date' },
                            description: { type: 'string' },
                            type: { type: 'string', enum: ['borrowing', 'lending'], description: 'Loan type' },
                            status: { type: 'string', enum: ['active', 'completed', 'defaulted'] },
                            payments: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/LoanPayment'
                                }
                            },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    LoanPayment: {
                        type: 'object',
                        required: ['loanId', 'amount', 'date'],
                        properties: {
                            _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                            loanId: { type: 'string', description: 'Reference to Loan' },
                            amount: { type: 'number', description: 'Payment amount' },
                            date: { type: 'string', format: 'date' },
                            notes: { type: 'string' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    Notification: {
                        type: 'object',
                        properties: {
                            _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                            userId: { type: 'string', description: 'Reference to User' },
                            title: { type: 'string' },
                            message: { type: 'string' },
                            type: { type: 'string', enum: ['info', 'warning', 'success', 'error'] },
                            isRead: { type: 'boolean' },
                            link: { type: 'string', description: 'Optional link related to the notification' },
                            data: { type: 'object', description: 'Additional data related to the notification' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                    ErrorResponse: {
                        type: 'object',
                        properties: {
                            statusCode: { type: 'integer' },
                            message: { type: 'string' },
                            stack: { type: 'string' }
                        }
                    },
                    AuthResponse: {
                        type: 'object',
                        properties: {
                            token: { type: 'string' },
                            user: { $ref: '#/components/schemas/User' }
                        }
                    },
                    PaymentTransaction: {
                        type: 'object',
                        required: ['userId', 'transactionId', 'type', 'planType', 'planName', 'amount', 'paymentMethod', 'paymentGateway'],
                        properties: {
                            _id: { type: 'string', description: 'Auto-generated MongoDB ObjectId' },
                            transactionId: { type: 'string', description: 'Unique transaction identifier' },
                            userId: {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    email: { type: 'string' }
                                }
                            },
                            type: {
                                type: 'string',
                                enum: ['subscription', 'upgrade', 'renewal', 'refund'],
                                description: 'Payment transaction type'
                            },
                            status: {
                                type: 'string',
                                enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
                                description: 'Transaction status'
                            },
                            planType: {
                                type: 'string',
                                enum: ['basic', 'standard', 'premium'],
                                description: 'Service plan type'
                            },
                            planName: { type: 'string', description: 'Service plan name' },
                            amount: { type: 'number', description: 'Payment amount' },
                            currency: { type: 'string', enum: ['VND', 'USD'], default: 'VND' },
                            paymentMethod: {
                                type: 'string',
                                enum: ['credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'paypal', 'stripe'],
                                description: 'Payment method used'
                            },
                            paymentGateway: {
                                type: 'string',
                                enum: ['vnpay', 'momo', 'zalopay', 'paypal', 'stripe'],
                                description: 'Payment gateway used'
                            },
                            gatewayTransactionId: { type: 'string', description: 'Transaction ID from payment gateway' },
                            subscriptionStartDate: { type: 'string', format: 'date' },
                            subscriptionEndDate: { type: 'string', format: 'date' },
                            description: { type: 'string' },
                            notes: { type: 'string' },
                            ipAddress: { type: 'string' },
                            userAgent: { type: 'string' },
                            refundAmount: { type: 'number' },
                            refundReason: { type: 'string' },
                            refundDate: { type: 'string', format: 'date' },
                            processedBy: {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    email: { type: 'string' }
                                }
                            },
                            processedAt: { type: 'string', format: 'date-time' },
                            metadata: { type: 'object' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                        }
                    }
                },
                responses: {
                    ValidationError: {
                        description: 'Validation Error',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', default: false },
                                        message: { type: 'string', example: 'Dữ liệu không hợp lệ' },
                                        errors: {
                                            type: 'object',
                                            additionalProperties: {
                                                type: 'array',
                                                items: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    UnauthorizedError: {
                        description: 'Unauthorized Error',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', default: false },
                                        message: { type: 'string', example: 'Không có quyền truy cập' }
                                    }
                                }
                            }
                        }
                    },
                    ServerError: {
                        description: 'Server Error',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', default: false },
                                        message: { type: 'string', example: 'Lỗi máy chủ' },
                                        stack: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    NotFoundError: {
                        description: 'Resource Not Found',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', default: false },
                                        message: { type: 'string', example: 'Không tìm thấy tài nguyên' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        apis: ['./src/routes/*.js'], // Đường dẫn đến các file chứa annotations
    };

    // Khởi tạo swagger-jsdoc
    const swaggerSpec = swaggerJSDoc(swaggerOptions);

    // Setup swagger UI
    app.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'VanLang Budget API Documentation',
            customfavIcon: '/favicon.ico',
            explorer: true,
        })
    );

    // Endpoint để lấy swagger.json
    app.get('/swagger.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('Swagger documentation initialized');
}; 