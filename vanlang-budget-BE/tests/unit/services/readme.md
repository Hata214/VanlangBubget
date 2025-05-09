# Kiểm thử Budget Service

## Tổng quan

Đây là bộ test cho Budget Service trong hệ thống quản lý tài chính cá nhân. Các test được thiết kế để kiểm tra chức năng cơ bản và cấu trúc của Budget Service.

## File Tests

1. **budget.service.test.js**
   - File kiểm thử đầy đủ các phương thức của Budget Service 
   - Sử dụng mock để giả lập tương tác với database

2. **budgetService.basic.test.js**
   - File kiểm thử đơn giản, tập trung vào cấu trúc cơ bản
   - Kiểm tra sự tồn tại của các API và cấu trúc model

3. **budgetService.simple.test.js**
   - File kiểm thử ban đầu với nhiều test hơn
   - Gặp một số vấn đề về timeout và mocking

## Các chức năng đã kiểm thử

- `getBudgets`: Lấy tất cả ngân sách của người dùng
- `getBudgetById`: Lấy ngân sách theo ID
- `createBudget`: Tạo ngân sách mới
- `updateBudget`: Cập nhật ngân sách
- `deleteBudget`: Xóa ngân sách

## Hướng dẫn chạy test

Chạy tất cả các test:
```bash
npm test -- tests/unit/services/
```

Chạy test cơ bản:
```bash
npm test -- tests/unit/services/budgetService.basic.test.js
```

## Vấn đề đã gặp và giải pháp

1. **Vấn đề về mock trong môi trường ES module**
   - Đã giải quyết bằng cách import `{ jest }` từ `@jest/globals`

2. **Vấn đề timeout khi test các phương thức async**
   - Đã giải quyết bằng cách sử dụng test đơn giản hơn
   - Thêm timeout cho các test lâu hơn

3. **Vấn đề về ObjectId**
   - Mongoose yêu cầu userId phải là ObjectId
   - Đã giải quyết bằng cách sử dụng `new mongoose.Types.ObjectId()` thay vì chuỗi

## Kết luận

Bộ test hiện tại đã kiểm tra được cấu trúc cơ bản của Budget Service. Tuy nhiên, cần tiếp tục phát triển để kiểm tra đầy đủ hơn các trường hợp biên và xử lý lỗi. 