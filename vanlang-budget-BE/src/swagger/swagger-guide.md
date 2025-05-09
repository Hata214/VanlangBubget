# Hướng dẫn viết tài liệu API với JSDoc và Swagger

## Giới thiệu

Tài liệu này cung cấp hướng dẫn chi tiết về cách viết tài liệu API cho VanLang Budget Backend sử dụng JSDoc và Swagger. Việc viết tài liệu API rõ ràng và đầy đủ giúp các nhà phát triển dễ dàng hiểu và sử dụng API của dự án.

## Cấu trúc Swagger trong Dự án

Swagger được cấu hình trong dự án thông qua các file sau:

- `src/swagger/swaggerConfig.js`: Chứa cấu hình chính của Swagger
- `src/swagger/responseModels.js`: Định nghĩa các model response được sử dụng trong Swagger
- `src/swagger/routeDocTemplate.js`: Template JSDoc cho các API route
- `src/routes/*.js`: Các file routes chứa JSDoc comments cho từng endpoint

## Cách Viết JSDoc cho Routes

### 1. Định nghĩa Tag

Mỗi nhóm API nên có một tag riêng. Đặt tag này ở đầu file route:

```javascript
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API quản lý xác thực và người dùng
 */
```

### 2. Định nghĩa Route

Mỗi endpoint cần được định nghĩa với format sau:

```javascript
/**
 * @swagger
 * /api/resource:
 *   method:
 *     summary: Tóm tắt ngắn gọn chức năng
 *     description: Mô tả chi tiết chức năng của endpoint
 *     tags: [TagName]
 *     parameters: // cho GET, DELETE, etc.
 *     requestBody: // cho POST, PUT, PATCH
 *     security:
 *     responses:
 */
```

Trong đó:
- `method` là phương thức HTTP (get, post, put, delete, patch)
- `summary` là mô tả ngắn gọn về endpoint
- `description` là mô tả chi tiết về chức năng của endpoint
- `tags` là nhóm mà endpoint thuộc về
- `parameters` định nghĩa các tham số đường dẫn hoặc query
- `requestBody` định nghĩa body của request (cho POST, PUT, PATCH)
- `security` định nghĩa phương thức xác thực
- `responses` định nghĩa các response có thể có của endpoint

### 3. Định nghĩa Parameters

Parameters có thể là path params, query params, hoặc headers:

```javascript
/**
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     schema:
 *       type: string
 *     description: ID của resource
 *     example: 5f8d0d55b54764421b7156c5
 *   - in: query
 *     name: page
 *     schema:
 *       type: integer
 *       default: 1
 *     description: Số trang
 */
```

### 4. Định nghĩa Request Body

Đối với các phương thức POST, PUT, PATCH:

```javascript
/**
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - name
 *         properties:
 *           name:
 *             type: string
 *             description: Tên của resource
 *             example: Example name
 */
```

### 5. Định nghĩa Responses

Mỗi endpoint cần định nghĩa các response có thể có:

```javascript
/**
 * responses:
 *   200:
 *     description: Thành công
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: success
 *             data:
 *               $ref: '#/components/schemas/ResourceModel'
 *   400:
 *     $ref: '#/components/responses/ValidationError'
 *   401:
 *     $ref: '#/components/responses/UnauthorizedError'
 *   404:
 *     $ref: '#/components/responses/NotFoundError'
 *   500:
 *     $ref: '#/components/responses/ServerError'
 */
```

### 6. Sử dụng References

Để tránh lặp lại code, sử dụng references đến các schema và responses đã định nghĩa:

- Schema: `$ref: '#/components/schemas/ModelName'`
- Response: `$ref: '#/components/responses/ResponseName'`

## Các Model Có Sẵn

Các model sau đã được định nghĩa trong `responseModels.js` và có thể được sử dụng:

- `User`: Model người dùng
- `AuthResponse`: Response khi đăng nhập
- `Budget`: Model ngân sách
- `Expense`: Model chi tiêu
- `Income`: Model thu nhập
- `Category`: Model danh mục
- `Loan`: Model khoản vay
- `LoanPayment`: Model thanh toán khoản vay
- `Notification`: Model thông báo
- `PaginationResponse`: Model phân trang
- `ErrorResponse`: Model lỗi
- `SuccessResponse`: Model thành công

## Các Response Có Sẵn

Các response sau đã được định nghĩa và có thể được sử dụng:

- `UnauthorizedError`: Lỗi không được xác thực (401)
- `ValidationError`: Lỗi dữ liệu không hợp lệ (400)
- `NotFoundError`: Lỗi không tìm thấy dữ liệu (404)
- `ForbiddenError`: Lỗi không có quyền truy cập (403)
- `ServerError`: Lỗi máy chủ (500)

## Ví dụ Hoàn chỉnh

```javascript
/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Lấy danh sách chi tiêu
 *     description: Trả về danh sách chi tiêu của người dùng hiện tại với phân trang và lọc
 *     tags: [Expense]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng kết quả trên mỗi trang
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Tháng (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         description: Năm
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID danh mục chi tiêu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách chi tiêu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
```

## Kiểm tra Swagger UI

Sau khi viết tài liệu API, bạn có thể kiểm tra kết quả trong Swagger UI:

1. Chạy server với lệnh `npm start`
2. Truy cập Swagger UI tại `http://localhost:1000/api-docs` hoặc `http://localhost:1000/swagger`

## Lưu ý

- Luôn cung cấp mô tả chi tiết cho mỗi endpoint.
- Đảm bảo định nghĩa đầy đủ các tham số, request body, và responses.
- Sử dụng ví dụ cụ thể để người dùng dễ hiểu.
- Giữ nhất quán trong cách sử dụng tags và definitions.
- Cập nhật tài liệu API khi có thay đổi về endpoint hoặc model. 