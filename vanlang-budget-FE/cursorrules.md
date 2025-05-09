# Quy Tắc Phát Triển cho Vanlang-Budget Frontend

## Cấu Trúc Dự Án
- **Kiến trúc Next.js:** Tuân thủ cấu trúc App Router của Next.js 14
- **Thư mục:**
  - `/app`: Chứa các route và layout của ứng dụng
  - `/components`: Chứa các component tái sử dụng
  - `/redux`: Quản lý state với Redux Toolkit
  - `/services`: Gọi API và xử lý dữ liệu
  - `/hooks`: Custom hooks
  - `/utils`: Hàm tiện ích
  - `/types`: TypeScript interfaces và types
  - `/contexts`: React context providers

## Quy Tắc Coding

### Ngôn Ngữ & Framework
1. **TypeScript:** Luôn sử dụng TypeScript với định nghĩa kiểu dữ liệu đầy đủ
2. **Next.js:** Tuân thủ quy tắc và mô hình App Router của Next.js 14
3. **React Hooks:** Ưu tiên functional components và hooks thay vì class components

### State Management
1. **Redux Toolkit:** Sử dụng cho global state management
   - Tổ chức state theo các slice (features)
   - Sử dụng createAsyncThunk cho các thao tác bất đồng bộ
2. **React Context:** Chỉ sử dụng cho theme, localization hoặc các state đơn giản
3. **Local State:** Sử dụng useState và useReducer cho component state

### UI & Styling
1. **Tailwind CSS:** Ưu tiên sử dụng utility classes của Tailwind
   - Không viết CSS tùy chỉnh trừ khi thực sự cần thiết
   - Sử dụng các plugin như tailwindcss-animate
2. **Responsive Design:** Đảm bảo UI hoạt động tốt trên tất cả thiết bị (mobile, tablet, desktop)
3. **UI Components:** Ưu tiên sử dụng Radix UI và các component từ thư viện UI shadcn/ui
4. **Dark Mode:** Hỗ trợ cả light và dark mode với next-themes

### API & Data Fetching
1. **Axios:** Sử dụng cho tất cả các HTTP requests
   - Cấu hình interceptors cho authentication và error handling
2. **Error Handling:** Xử lý lỗi ở mọi API call
3. **Loading States:** Hiển thị trạng thái loading khi fetch data
4. **Caching:** Tận dụng caching của Next.js khi phù hợp

### Authentication
1. **NextAuth.js:** Sử dụng cho authentication flow
2. **Token Storage:** Lưu trữ JWT tokens an toàn
3. **Protected Routes:** Đảm bảo các route được bảo vệ đúng cách

### Performance
1. **Code Splitting:** Tận dụng tính năng dynamic import của Next.js
2. **Image Optimization:** Sử dụng Next.js Image component
3. **Bundle Size:** Giám sát và tối ưu kích thước bundle
4. **Lazy Loading:** Áp dụng cho components và routes không cần thiết ngay lập tức

### I18n & Localization
1. **next-intl:** Sử dụng cho đa ngôn ngữ (Tiếng Việt và Tiếng Anh)
2. **Message Files:** Tổ chức các file messages theo ngôn ngữ và module

### Best Practices
1. **Code Formatting:** Tuân thủ ESLint và Prettier
2. **Git Flow:** Sử dụng feature branches và PR reviews
3. **Commit Messages:** Tuân thủ conventional commits
4. **Documentation:** Comment code phức tạp và cập nhật README
5. **Accessibility:** Đảm bảo ứng dụng tuân thủ WCAG

## Feature-Specific Guidelines

### Tài chính cá nhân
1. **Thu nhập & Chi tiêu:** Sử dụng form validation với react-hook-form và zod
2. **Biểu đồ:** Sử dụng Chart.js và react-chartjs-2 cho data visualization
3. **Khoản vay:** Tính toán lãi suất và lịch trình thanh toán
4. **Ngân sách:** Theo dõi và so sánh với chi tiêu thực tế

### Đầu tư
1. **Chứng khoán:** Hiển thị dữ liệu thời gian thực và biểu đồ
2. **Vàng:** Theo dõi giá vàng và tính toán lợi nhuận
3. **Tiền điện tử:** Hiển thị tỷ giá và biến động thị trường

### Quản trị viên
1. **Quản lý người dùng:** Hiển thị danh sách và chi tiết người dùng
2. **Quản lý giao dịch:** Xem và xử lý các giao dịch

## Mobile & Responsive Guidelines
1. **Mobile First:** Thiết kế UI ưu tiên cho mobile trước
2. **Breakpoints:** Sử dụng breakpoints chuẩn của Tailwind CSS
3. **Touch Interaction:** Tối ưu cho màn hình cảm ứng

## Performance Benchmarks
1. **Lighthouse Score:** Duy trì điểm tối thiểu 90+
2. **First Contentful Paint:** Dưới 1.8s
3. **Time to Interactive:** Dưới 3.5s
4. **Bundle Size:** Main bundle dưới 200KB (gzipped)

## Deployment
1. **Vercel:** Triển khai với Vercel
2. **Preview Deployments:** Kiểm tra mọi PR với preview deployment
3. **Analytics:** Tích hợp Vercel Analytics để theo dõi hiệu suất

## Bảo Mật
1. **Input Validation:** Xác thực mọi input của người dùng
2. **XSS Protection:** Ngăn chặn Cross-Site Scripting
3. **CSRF Protection:** Bảo vệ khỏi Cross-Site Request Forgery
4. **Authentication:** Tuân thủ các best practices về xác thực

## Hướng Dẫn Đóng Góp
1. **Linting:** Chạy `npm run lint` trước khi commit
2. **PR Template:** Tuân thủ template khi tạo PR
3. **Code Review:** Mọi PR cần có ít nhất một review approval 