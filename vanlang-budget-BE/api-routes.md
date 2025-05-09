# VanLang Budget API Routes

## Tổng quan

Tài liệu này liệt kê tất cả các API endpoints đã phát triển cho dự án VanLang Budget Backend. Tất cả API được thiết kế tuân theo RESTful API, sử dụng JWT để xác thực và bảo mật.

## Authentication API

| Phương thức | Đường dẫn                   | Mô tả                       | Access     |
|-------------|-----------------------------|-----------------------------|------------|
| POST        | `/api/auth/register`        | Đăng ký tài khoản           | Public     |
| POST        | `/api/auth/login`           | Đăng nhập                   | Public     |
| GET         | `/api/auth/logout`          | Đăng xuất                   | Protected  |
| GET         | `/api/auth/profile`         | Lấy thông tin tài khoản     | Protected  |
| PUT         | `/api/auth/profile`         | Cập nhật thông tin tài khoản | Protected  |
| PUT         | `/api/auth/password`        | Cập nhật mật khẩu           | Protected  |
| POST        | `/api/auth/forgot-password` | Yêu cầu khôi phục mật khẩu | Public     |
| POST        | `/api/auth/reset-password`  | Đặt lại mật khẩu           | Public     |
| GET         | `/api/auth/verifyemail/:token`   | Xác thực email        | Public     |

## Budget API

| Phương thức | Đường dẫn                      | Mô tả                       | Access     |
|-------------|--------------------------------|-----------------------------|------------|
| GET         | `/api/budgets`                 | Lấy danh sách ngân sách     | Protected  |
| POST        | `/api/budgets`                 | Tạo ngân sách mới           | Protected  |
| GET         | `/api/budgets/:id`             | Lấy ngân sách theo ID       | Protected  |
| PUT         | `/api/budgets/:id`             | Cập nhật ngân sách          | Protected  |
| DELETE      | `/api/budgets/:id`             | Xóa ngân sách               | Protected  |
| GET         | `/api/budgets/category/:category` | Lấy ngân sách theo danh mục | Protected  |
| GET         | `/api/budgets/statistics`      | Lấy thống kê ngân sách     | Protected  |

## Expense API

| Phương thức | Đường dẫn                      | Mô tả                       | Access     |
|-------------|--------------------------------|-----------------------------|------------|
| GET         | `/api/expenses`                | Lấy danh sách chi tiêu      | Protected  |
| POST        | `/api/expenses`                | Tạo chi tiêu mới            | Protected  |
| GET         | `/api/expenses/:id`            | Lấy chi tiêu theo ID        | Protected  |
| PUT         | `/api/expenses/:id`            | Cập nhật chi tiêu           | Protected  |
| DELETE      | `/api/expenses/:id`            | Xóa chi tiêu                | Protected  |
| GET         | `/api/expenses/summary/monthly` | Lấy tổng chi tiêu theo tháng| Protected  |
| GET         | `/api/expenses/summary/by-category` | Lấy tổng chi tiêu theo danh mục| Protected |

## Income API

| Phương thức | Đường dẫn                      | Mô tả                       | Access     |
|-------------|--------------------------------|-----------------------------|------------|
| GET         | `/api/incomes`                 | Lấy danh sách thu nhập      | Protected  |
| POST        | `/api/incomes`                 | Tạo thu nhập mới            | Protected  |
| GET         | `/api/incomes/:id`             | Lấy thu nhập theo ID        | Protected  |
| PUT         | `/api/incomes/:id`             | Cập nhật thu nhập           | Protected  |
| DELETE      | `/api/incomes/:id`             | Xóa thu nhập                | Protected  |
| GET         | `/api/incomes/summary/monthly` | Lấy tổng thu nhập theo tháng| Protected  |
| GET         | `/api/incomes/summary/by-category` | Lấy tổng thu nhập theo danh mục| Protected |

## Expense Category API

| Phương thức | Đường dẫn                      | Mô tả                       | Access     |
|-------------|--------------------------------|-----------------------------|------------|
| GET         | `/api/expense-categories`      | Lấy danh sách danh mục chi tiêu | Protected  |
| POST        | `/api/expense-categories`      | Tạo danh mục chi tiêu mới   | Protected  |
| GET         | `/api/expense-categories/:id`  | Lấy danh mục chi tiêu theo ID | Protected  |
| PUT         | `/api/expense-categories/:id`  | Cập nhật danh mục chi tiêu  | Protected  |
| DELETE      | `/api/expense-categories/:id`  | Xóa danh mục chi tiêu       | Protected  |
| POST        | `/api/expense-categories/reset-defaults` | Khôi phục danh mục mặc định | Protected |

## Income Category API

| Phương thức | Đường dẫn                      | Mô tả                       | Access     |
|-------------|--------------------------------|-----------------------------|------------|
| GET         | `/api/income-categories`       | Lấy danh sách danh mục thu nhập | Protected  |
| POST        | `/api/income-categories`       | Tạo danh mục thu nhập mới   | Protected  |
| GET         | `/api/income-categories/:id`   | Lấy danh mục thu nhập theo ID | Protected  |
| PUT         | `/api/income-categories/:id`   | Cập nhật danh mục thu nhập  | Protected  |
| DELETE      | `/api/income-categories/:id`   | Xóa danh mục thu nhập       | Protected  |
| POST        | `/api/income-categories/reset-defaults` | Khôi phục danh mục mặc định | Protected |

## Loan API

| Phương thức | Đường dẫn                      | Mô tả                       | Access     |
|-------------|--------------------------------|-----------------------------|------------|
| GET         | `/api/loans`                   | Lấy danh sách khoản vay     | Protected  |
| POST        | `/api/loans`                   | Tạo khoản vay mới           | Protected  |
| GET         | `/api/loans/:id`               | Lấy khoản vay theo ID       | Protected  |
| PUT         | `/api/loans/:id`               | Cập nhật khoản vay          | Protected  |
| DELETE      | `/api/loans/:id`               | Xóa khoản vay               | Protected  |
| GET         | `/api/loans/:id/payments`      | Lấy danh sách thanh toán của khoản vay | Protected |
| POST        | `/api/loans/:id/payments`      | Thêm thanh toán cho khoản vay | Protected |

## Loan Payment API

| Phương thức | Đường dẫn                      | Mô tả                       | Access     |
|-------------|--------------------------------|-----------------------------|------------|
| DELETE      | `/api/loan-payments/:id`       | Xóa thanh toán khoản vay    | Protected  |

## Notification API

| Phương thức | Đường dẫn                      | Mô tả                       | Access     |
|-------------|--------------------------------|-----------------------------|------------|
| GET         | `/api/notifications`           | Lấy danh sách thông báo     | Protected  |
| PATCH       | `/api/notifications/:id/read`  | Đánh dấu thông báo đã đọc   | Protected  |
| PATCH       | `/api/notifications/read-all`  | Đánh dấu tất cả thông báo đã đọc | Protected |
| DELETE      | `/api/notifications/:id`       | Xóa thông báo               | Protected  |
| DELETE      | `/api/notifications/read`      | Xóa tất cả thông báo đã đọc | Protected  |
| DELETE      | `/api/notifications`           | Xóa tất cả thông báo        | Protected  |

## WebSocket Events

Các sự kiện real-time được xử lý thông qua Socket.io:

| Sự kiện                | Mô tả                               | Dữ liệu gửi                          |
|------------------------|------------------------------------|--------------------------------------|
| `join`                 | Client tham gia room theo userID   | userId                              |
| `notification:new`     | Thông báo mới                      | Đối tượng thông báo                  |
| `budget:update`        | Cập nhật ngân sách                 | Đối tượng ngân sách                  |
| `expense:create`       | Tạo chi tiêu mới                   | Đối tượng chi tiêu                   |
| `expense:update`       | Cập nhật chi tiêu                  | Đối tượng chi tiêu                   |
| `expense:delete`       | Xóa chi tiêu                       | ID chi tiêu                          |
| `income:create`        | Tạo thu nhập mới                   | Đối tượng thu nhập                   |
| `income:update`        | Cập nhật thu nhập                  | Đối tượng thu nhập                   |
| `income:delete`        | Xóa thu nhập                       | ID thu nhập                          |
| `loan:create`          | Tạo khoản vay mới                  | Đối tượng khoản vay                  |
| `loan:update`          | Cập nhật khoản vay                 | Đối tượng khoản vay                  |
| `loan:delete`          | Xóa khoản vay                      | ID khoản vay                         |
| `loan:payment`         | Thêm thanh toán cho khoản vay      | Đối tượng thanh toán & khoản vay     |
| `loan:payment:delete`  | Xóa thanh toán                     | ID thanh toán & đối tượng khoản vay  |
| `notification`         | Gửi thông báo mới                  | Đối tượng thông báo                  |
| `expense:created`      | Thông báo khi tạo chi tiêu mới     | Đối tượng chi tiêu                   |
| `expense:updated`      | Thông báo khi cập nhật chi tiêu     | Đối tượng chi tiêu                   |
| `expense:deleted`      | Thông báo khi xóa chi tiêu          | ID chi tiêu                          |
| `income:created`        | Thông báo khi tạo thu nhập mới       | Đối tượng thu nhập                   |
| `income:updated`        | Thông báo khi cập nhật thu nhập      | Đối tượng thu nhập                   |
| `income:deleted`        | Thông báo khi xóa thu nhập           | ID thu nhập                          |
| `budget:created`        | Thông báo khi tạo ngân sách mới       | Đối tượng ngân sách                  |
| `budget:updated`        | Thông báo khi cập nhật ngân sách      | Đối tượng ngân sách                  |
| `budget:deleted`        | Thông báo khi xóa ngân sách           | ID ngân sách                         |
| `budget:threshold`      | Thông báo khi chi tiêu gần đạt ngưỡng ngân sách | Đối tượng ngân sách                  |

## Tài liệu API

Tài liệu chi tiết về API có thể được truy cập thông qua Swagger UI tại:

- `/api-docs`: Giao diện Swagger UI
- `/swagger`: Giao diện Swagger UI sử dụng CDN (khuyến nghị cho môi trường production)
- `/api-docs.json`: Swagger JSON specification

## Quan trọng

### Middleware Validation
- Tất cả routes đã được áp dụng validation middleware để kiểm tra dữ liệu đầu vào
- Sử dụng Joi schema validation cho:
  - Params: validateParams() - kiểm tra tham số trên URL (ID, etc)
  - Query: validateQuery() - kiểm tra tham số query (filters, pagination, etc)
  - Body: validateBody() - kiểm tra dữ liệu gửi lên từ client (POST, PUT, etc)
- Mỗi schema validation đều có thông báo lỗi chi tiết bằng tiếng Việt

### Bảo mật
- Tất cả các routes protected yêu cầu JWT hợp lệ
- Áp dụng CSRF protection qua CORS
- Rate limiting để ngăn chặn tấn công brute force
- Áp dụng helmet để bảo vệ các HTTP headers

### Validation & Error Handling
- Tất cả dữ liệu đầu vào đều được kiểm tra chặt chẽ qua Joi schemas
- Các thông báo lỗi được trả về dưới dạng chuẩn hóa:
  ```json
  {
    "success": false,
    "message": "Dữ liệu không hợp lệ",
    "errors": [{"field": "email", "message": "Email không đúng định dạng"}]
  }
  ```
- Global error handling để bắt tất cả các lỗi và trả về định dạng nhất quán

### Real-time Data
- Socket.io cho cập nhật real-time
- Thông báo tức thì khi có thay đổi dữ liệu
- Cấu trúc event chuẩn hóa

### Lưu ý
- Thứ tự routes trong Express.js rất quan trọng, đặc biệt khi có routes chung pattern
- Sử dụng Socket.io đòi hỏi đảm bảo dữ liệu được validate trước khi gửi
- Tất cả dữ liệu đầu vào PHẢI được validation trước khi xử lý 