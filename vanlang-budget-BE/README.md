# VanLang Budget Backend API

Hệ thống quản lý ngân sách cá nhân VanLang Budget - Backend API

## Giới thiệu

VanLang Budget Backend API là hệ thống quản lý ngân sách cá nhân được xây dựng bằng Node.js, Express và MongoDB. Hệ thống cung cấp các API để quản lý ngân sách, thu chi, khoản vay và nhiều tính năng khác.

## Tính năng chính

- **Quản lý người dùng**: Đăng ký, đăng nhập, quản lý thông tin cá nhân
- **Quản lý ngân sách**: Tạo và theo dõi ngân sách theo danh mục và thời gian
- **Quản lý thu nhập**: Theo dõi các khoản thu nhập theo danh mục
- **Quản lý chi tiêu**: Theo dõi chi tiêu theo danh mục, địa điểm
- **Quản lý khoản vay**: Theo dõi các khoản vay và thanh toán
- **Thông báo**: Hệ thống thông báo thông minh về ngân sách, khoản vay
- **Báo cáo**: Thống kê và báo cáo tài chính theo thời gian
- **Real-time updates**: Cập nhật dữ liệu theo thời gian thực với Socket.io
- **API Documentation**: Tài liệu API đầy đủ với Swagger
- **Validation**: Xác thực dữ liệu đầu vào chặt chẽ với Joi

## Công nghệ sử dụng

- **Node.js & Express**: Framework backend
- **MongoDB & Mongoose**: Database và ODM
- **JWT**: Xác thực và phân quyền
- **Socket.io**: Real-time communication
- **Swagger**: API documentation
- **Joi**: Data validation
- **Bcrypt**: Password hashing
- **Helmet**: Security headers
- **Rate Limit**: API rate limiting

## Cài đặt và Chạy

### Yêu cầu hệ thống

- Node.js v18 trở lên
- MongoDB (local hoặc Atlas)

### Cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/vanlang-budget-BE.git
cd vanlang-budget-BE
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env (tham khảo file .env.example)

4. Chạy ứng dụng:
```bash
# Development mode (chạy trên port 1000)
npm run dev

# Production mode (chạy trên port 1000)
npm start
```

Ứng dụng sẽ chạy trên http://localhost:1000

## API Documentation

Sau khi chạy ứng dụng, bạn có thể truy cập Swagger UI tại:

- `http://localhost:1000/api-docs`: Giao diện Swagger UI
- `http://localhost:1000/swagger`: Giao diện Swagger UI sử dụng CDN (khuyến nghị trên môi trường production)
- `http://localhost:1000/api-docs.json`: Swagger JSON specification

Chi tiết về các API routes có thể xem tại file `api-routes.md`.

## Validation

Hệ thống sử dụng Joi để validate dữ liệu đầu vào với các tính năng:

- Validation middleware được áp dụng cho tất cả các routes
- Thông báo lỗi chi tiết bằng tiếng Việt
- Validation cho params, query và body
- Cấu trúc thông báo lỗi chuẩn hóa

Ví dụ về cấu trúc lỗi validation:
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "field": "email",
      "message": "Email không đúng định dạng"
    }
  ]
}
```

## JWT Authentication

Hệ thống sử dụng JWT để xác thực người dùng với các tính năng:

- Access token và refresh token
- Token blacklisting khi đăng xuất
- Middleware bảo vệ routes
- Kiểm tra quyền sở hữu dữ liệu

Để sử dụng API được bảo vệ, gửi token trong header:
```
Authorization: Bearer your_token_here
```

## Deployment

### Vercel

Dự án được cấu hình sẵn để deploy lên Vercel. Sử dụng file `vercel.json` để cấu hình deployment.

Các biến môi trường bắt buộc:
- `MONGODB_URI`: Connection string tới MongoDB
- `JWT_SECRET`: Secret key cho JWT
- `CORS_ORIGIN`: URL của frontend

## Cấu trúc thư mục

```
vanlang-budget-BE/
├── src/                   # Source code
│   ├── config/            # Cấu hình ứng dụng
│   ├── controllers/       # Xử lý logic cho routes
│   ├── middlewares/       # Middleware cho Express
│   │   ├── authMiddleware.js      # JWT authentication
│   │   ├── errorMiddleware.js     # Error handling
│   │   ├── validationMiddleware.js # Validation middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── socket/            # Socket.io configuration
│   │   ├── socketManager.js        # Socket manager
│   ├── utils/             # Utility functions
│   ├── validations/       # Validation schemas (Joi)
│   │   ├── authValidation.js       # Auth validation
│   │   ├── budgetValidation.js     # Budget validation
│   │   ├── expenseValidation.js    # Expense validation
│   │   ├── incomeValidation.js     # Income validation
│   │   ├── categoryValidation.js   # Category validation
│   │   ├── loanValidation.js       # Loan validation
│   │   ├── notificationValidation.js # Notification validation
│   └── server.js          # Entry point
├── .env                   # Environment variables
├── .env.production        # Production environment variables
├── api-routes.md          # API routes documentation
├── socket-integration-guide.md # Socket.io integration guide
├── jwt-auth-improvements.md # JWT authentication documentation
├── project-progress.md    # Project progress tracking
├── TODO.md                # TODO list
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Đóng góp

Nếu bạn muốn đóng góp vào dự án, vui lòng fork repository, tạo branch, commit các thay đổi và mở pull request.

## Giấy phép

Dự án này được phân phối theo giấy phép ISC.

## Liên hệ

Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ qua email: [your-email@example.com] 