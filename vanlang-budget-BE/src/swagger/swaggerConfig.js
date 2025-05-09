import swaggerJsDoc from 'swagger-jsdoc';
import { responseModels } from './responseModels.js';

// Lấy port từ biến môi trường hoặc sử dụng mặc định
const PORT = process.env.PORT || 3001;

/**
 * Cấu hình Swagger cho API
 */
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'VanLang Budget API',
            version: '1.0.0',
            description: 'API cho ứng dụng quản lý ngân sách cá nhân VanLang Budget',
            contact: {
                name: 'VanLang University',
                email: 'support@vanlanguni.vn',
            },
            license: {
                name: 'ISC License',
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development Server'
            },
            {
                url: `https://vanlang-budget-be.vercel.app`,
                description: 'Production Server'
            }
        ],
        tags: [
            { name: 'Authentication', description: 'API quản lý xác thực người dùng' },
            { name: 'Budgets', description: 'API quản lý ngân sách' },
            { name: 'Expenses', description: 'API quản lý chi tiêu' },
            { name: 'Incomes', description: 'API quản lý thu nhập' },
            { name: 'Expense Categories', description: 'API quản lý danh mục chi tiêu' },
            { name: 'Income Categories', description: 'API quản lý danh mục thu nhập' },
            { name: 'Loans', description: 'API quản lý khoản vay' },
            { name: 'Loan Payments', description: 'API quản lý thanh toán khoản vay' },
            { name: 'Notifications', description: 'API quản lý thông báo' }
        ],
        components: {
            schemas: {
                ...responseModels
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Nhập JWT token của bạn ở đây'
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'JWT token không hợp lệ hoặc không được cung cấp',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                status: 'error',
                                message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Dữ liệu đầu vào không hợp lệ',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                status: 'error',
                                message: 'Dữ liệu không hợp lệ',
                                errors: {
                                    email: ['Email không hợp lệ'],
                                    password: ['Mật khẩu phải có ít nhất 8 ký tự']
                                }
                            }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Không tìm thấy dữ liệu',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                status: 'error',
                                message: 'Không tìm thấy dữ liệu với ID này'
                            }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'Không có quyền truy cập',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                status: 'error',
                                message: 'Bạn không có quyền thực hiện hành động này'
                            }
                        }
                    }
                },
                ServerError: {
                    description: 'Lỗi máy chủ',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            },
                            example: {
                                status: 'error',
                                message: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js'] // Đường dẫn tới các file chứa JSDoc comments cho API
};

/**
 * Tạo Swagger docs từ cấu hình
 */
export const swaggerDocs = swaggerJsDoc(swaggerOptions);

/**
 * HTML template cho Swagger UI custom
 */
export const swaggerUITemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VanLang Budget API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    .topbar {
      background-color: #101a2b;
      padding: 15px 20px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .topbar-title {
      font-size: 1.4em;
      font-weight: 600;
    }
    .topbar-subtitle {
      font-size: 0.9em;
      opacity: 0.8;
    }
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { background: white; box-shadow: none; }
    
    @media (prefers-color-scheme: dark) {
      body { background-color: #1a1b26; color: #a9b1d6; }
      .swagger-ui .scheme-container { background: #1a1b26; }
      .swagger-ui .opblock .opblock-summary-path-description, 
      .swagger-ui .opblock .opblock-summary-description { color: #a9b1d6; }
      .swagger-ui .info .title, 
      .swagger-ui .info p, 
      .swagger-ui .info li, 
      .swagger-ui .info table { color: #c0caf5; }
      .swagger-ui .model-title, 
      .swagger-ui .model { color: #c0caf5; }
      .swagger-ui section.models { background-color: #24283b; }
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div>
      <div class="topbar-title">VanLang Budget API</div>
      <div class="topbar-subtitle">API Documentation</div>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api-docs.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 3,
        persistAuthorization: true,
      });
    }
  </script>
</body>
</html>
`; 