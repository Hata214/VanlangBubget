# Cải tiến JWT Authentication cho VanLang Budget Backend

## Tóm tắt các cải tiến

1. **Tách biệt logic JWT**
   - Tạo module riêng `jwtUtils.js` để quản lý tất cả các chức năng liên quan đến JWT
   - Tách biệt logic tạo, xác minh và quản lý token

2. **Cơ chế Access Token và Refresh Token**
   - Triển khai mô hình bảo mật hai lớp với access token (ngắn hạn) và refresh token (dài hạn)
   - Access token được sử dụng để xác thực các yêu cầu API
   - Refresh token được lưu trong cookie HTTP-only và dùng để tạo token mới khi access token hết hạn

3. **Token Blacklist**
   - Triển khai hệ thống blacklist token để vô hiệu hóa token sau khi đăng xuất
   - Thêm token vào blacklist khi đăng xuất hoặc đổi mật khẩu
   - Tự động xóa token khỏi blacklist sau một khoảng thời gian để tránh rò rỉ bộ nhớ

4. **Xử lý lỗi JWT cải tiến**
   - Cung cấp thông báo lỗi cụ thể cho các lỗi JWT phổ biến (token không hợp lệ, hết hạn, etc.)
   - Sử dụng promisify để xử lý JWT với Promises thay vì callbacks

5. **Cookie bảo mật**
   - Lưu refresh token trong cookie HTTP-only để bảo vệ khỏi tấn công XSS
   - Cấu hình secure và sameSite để bảo vệ khỏi tấn công CSRF
   - Tự động xóa cookie khi đăng xuất

6. **Middleware Tùy chọn**
   - Thêm middleware `optionalAuth` cho các routes không bắt buộc xác thực nhưng vẫn có thể sử dụng thông tin người dùng nếu có
   - Middleware này không trả về lỗi nếu không có token hoặc token không hợp lệ

## API Endpoints Authentication

Các endpoint liên quan đến xác thực:

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| /api/auth/register | POST | Đăng ký người dùng mới | Public |
| /api/auth/login | POST | Đăng nhập và nhận tokens | Public |
| /api/auth/logout | POST | Đăng xuất và vô hiệu hóa token | Private |
| /api/auth/refresh-token | POST | Làm mới access token bằng refresh token | Public (với refresh token) |
| /api/auth/me | GET | Lấy thông tin người dùng hiện tại | Private |
| /api/auth/update-me | PATCH | Cập nhật thông tin người dùng | Private |
| /api/auth/update-password | PATCH | Cập nhật mật khẩu | Private |
| /api/auth/forgot-password | POST | Yêu cầu token đặt lại mật khẩu | Public |
| /api/auth/reset-password | PATCH | Đặt lại mật khẩu với token | Public |
| /api/auth/verify-email | GET | Xác minh email | Public (với token) |

## Hướng dẫn sử dụng

### Đăng ký và Đăng nhập
```javascript
// Đăng ký
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email, password, passwordConfirm, 
    firstName, lastName, phoneNumber 
  })
});

// Đăng nhập
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Lưu tokens từ response
const { token, refreshToken } = await loginResponse.json();
localStorage.setItem('token', token);
// refreshToken được tự động lưu trong cookie HTTP-only
```

### Gọi API đã được xác thực
```javascript
// Thêm token vào header Authorization
const response = await fetch('/api/expenses', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

// Kiểm tra nếu token hết hạn
if (response.status === 401) {
  // Làm mới token
  await refreshAccessToken();
  // Thử lại request
}
```

### Làm mới Token
```javascript
async function refreshAccessToken() {
  try {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
      // Hoặc không cần gửi refreshToken nếu đã lưu trong cookie
    });
    
    if (response.ok) {
      const { token } = await response.json();
      localStorage.setItem('token', token);
      return true;
    } else {
      // Refresh token không hợp lệ hoặc hết hạn, đăng xuất người dùng
      logout();
      return false;
    }
  } catch (error) {
    console.error('Lỗi khi làm mới token:', error);
    return false;
  }
}
```

### Đăng xuất
```javascript
async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  // Xóa token từ localStorage
  localStorage.removeItem('token');
  // Cookie refresh token sẽ được xóa bởi server
} 