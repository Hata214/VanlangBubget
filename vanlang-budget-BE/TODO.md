# VanLang Budget Backend - TODO

## Công việc đã hoàn thành

- [x] Thiết lập cấu trúc dự án và các file cấu hình cơ bản
- [x] Định nghĩa các models trong MongoDB
- [x] Xây dựng controllers và routes cho các đối tượng
- [x] Tạo schema validation với Joi
- [x] Áp dụng validation middleware cho tất cả các routes
- [x] Tạo SocketManager để quản lý WebSocket
- [x] Cập nhật tài liệu API routes trong api-routes.md
- [x] Tích hợp Socket.io vào các controllers để gửi thông báo realtime
- [x] Hoàn thiện middleware JWT authentication
- [x] Cải thiện tài liệu Swagger và giao diện Swagger UI

## Công việc cần làm tiếp theo

- [ ] Viết test cho API endpoints và models

## Lưu ý quan trọng

- Đã hoàn thành việc áp dụng validation middleware cho tất cả các routes
- Đã tích hợp Socket.io vào các controllers chính (expense, income, budget, loan)
- Đã cải thiện JWT authentication với:
  * Access token và refresh token
  * Blacklist token để vô hiệu hóa token khi đăng xuất
  * Xử lý token hết hạn và token không hợp lệ
  * Middleware tùy chọn để kiểm tra xác thực
- Đã cải thiện tài liệu Swagger với:
  * Tạo cấu trúc tài liệu API rõ ràng và dễ hiểu
  * Tách biệt cấu hình Swagger thành các file riêng
  * Định nghĩa các model response chi tiết
  * Cập nhật giao diện Swagger UI hiện đại hơn
  * Thêm chế độ tối (dark mode) cho Swagger UI
  * Tạo hướng dẫn chi tiết cho việc viết tài liệu API
- Cần kiểm tra thứ tự routes trong Express.js để đảm bảo hoạt động đúng
- Hệ thống cần được cấu hình và test kỹ lưỡng trước khi triển khai production

## Ưu tiên công việc

1. Viết test (cao)

## Cập nhật gần đây (30/03/2024)

- Đã cải thiện tài liệu Swagger và giao diện Swagger UI
- Đã tạo cấu trúc mới cho Swagger với các file riêng biệt:
  * `src/swagger/swaggerConfig.js`: Cấu hình chính của Swagger
  * `src/swagger/responseModels.js`: Định nghĩa các model response
  * `src/swagger/routeDocTemplate.js`: Template JSDoc cho API routes
  * `src/swagger/swagger-guide.md`: Hướng dẫn viết tài liệu API
- Đã cập nhật tài liệu JSDoc cho route xác thực người dùng
- Đã tạo giao diện Swagger UI tùy chỉnh với chế độ tối (dark mode)
- Đã chuyển port mặc định của ứng dụng thành 1000 