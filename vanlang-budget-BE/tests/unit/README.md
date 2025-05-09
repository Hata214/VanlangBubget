# Unit Testing trong ES Modules

## Vấn đề hiện tại

Khi thực hiện unit testing với Jest trong dự án sử dụng ES Modules (import/export), chúng ta gặp một số thách thức:

1. Biến toàn cục `jest` không khả dụng trong file ES Module
2. Phương thức `jest.mock()` không hoạt động như mong đợi
3. Cú pháp mocking phức tạp hơn so với CommonJS

## Giải pháp

### Sử dụng các bài test đơn giản

Sử dụng các bài test đơn giản không cần mocking phức tạp, như đã thấy trong `budgetService.simple.test.js`.

### Chuyển đổi sang CommonJS cho testing

Một giải pháp khác là tạo các file test riêng sử dụng cú pháp CommonJS, nhưng điều này có thể không phải lúc nào cũng khả thi.

### Sử dụng thư viện mocking thay thế

Có thể sử dụng thư viện như `mock-import` hoặc `babel-plugin-rewire-exports` để hỗ trợ mocking trong ES Modules.

## Khuyến nghị

1. Sử dụng kết hợp giữa testing với minimal mocking và integration testing
2. Tập trung vào kiểm thử API endpoints và kết quả cuối cùng
3. Xem xét sử dụng Jest cùng với Babel để có thể hỗ trợ mocking tốt hơn

## Cách thực hiện hiện tại

Hiện tại, cách tiếp cận tốt nhất là:

1. Viết các test đơn giản kiểm tra cấu trúc, định nghĩa hàm
2. Sử dụng integration test thay vì unit test để kiểm tra các tính năng của service
3. Khi cần unit test chi tiết, có thể sửa các file service sang dạng "export thường" thay vì "export default"

## Tài liệu tham khảo

- [Jest ESM Support](https://jestjs.io/docs/ecmascript-modules)
- [Testing Node.js with ES Modules](https://dev.to/tiramerisu/using-jest-with-node-es-modules-2486) 