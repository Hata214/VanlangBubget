# Scripts đồng bộ dữ liệu

Các script trong thư mục này được sử dụng để đồng bộ dữ liệu từ frontend vào admin và sau đó lưu vào database.

## Mục đích

- Sao chép dữ liệu từ frontend hiện tại để đồng bộ vào giao diện chỉnh sửa nội dung của admin
- Đảm bảo dữ liệu hiển thị trong admin giống với dữ liệu hiển thị trong frontend
- Tạo dữ liệu mẫu cho các trang khác nhau (trang chủ, giới thiệu, tính năng, lộ trình, bảng giá, liên hệ)
- Hỗ trợ đa ngôn ngữ (tiếng Việt và tiếng Anh)
- Đồng bộ hình ảnh từ frontend vào backend và cập nhật URL hình ảnh trong dữ liệu nội dung

## Các script có sẵn

1. **syncImages.js**: Đồng bộ hình ảnh từ thư mục public/images vào backend
2. **syncContentToAdmin.js**: Đồng bộ dữ liệu cơ bản (trang chủ, giới thiệu, tính năng, liên hệ) từ các file fallback
3. **syncAdditionalContent.js**: Đồng bộ dữ liệu bổ sung (lộ trình, bảng giá) từ dữ liệu mẫu
4. **syncAll.js**: Chạy tất cả các script đồng bộ theo thứ tự
5. **syncFromFrontend.js**: Đọc dữ liệu trực tiếp từ các trang frontend đang chạy và đồng bộ vào admin

## Cách sử dụng

### Điều kiện tiên quyết

- Backend phải đang chạy trên cổng 4000
- Đã cài đặt các dependency cần thiết (axios, fs, path, form-data)
- Thư mục public/images phải tồn tại và có quyền truy cập
- Backend phải có API endpoint để tải lên hình ảnh

### Chạy script đồng bộ hình ảnh

```bash
cd src/scripts
node syncImages.js
```

### Chạy script đồng bộ dữ liệu cơ bản

```bash
cd src/scripts
node syncContentToAdmin.js
```

### Chạy script đồng bộ dữ liệu bổ sung

```bash
cd src/scripts
node syncAdditionalContent.js
```

### Chạy tất cả các script

```bash
cd src/scripts
node syncAll.js
```

Lưu ý: Script `syncAll.js` sẽ chạy tất cả các script theo thứ tự: đồng bộ hình ảnh trước, sau đó đồng bộ dữ liệu cơ bản và cuối cùng là đồng bộ dữ liệu bổ sung.

### Đồng bộ dữ liệu trực tiếp từ frontend

```bash
cd src/scripts
npm install puppeteer  # Cài đặt puppeteer nếu chưa có
node syncFromFrontend.js
```

Lưu ý: Script `syncFromFrontend.js` sẽ truy cập trực tiếp vào các trang frontend đang chạy, trích xuất dữ liệu hiển thị và đồng bộ vào admin. Đây là cách tốt nhất để đảm bảo dữ liệu trong admin giống hệt với dữ liệu hiển thị trên frontend.

## Cấu trúc dữ liệu

Mỗi loại nội dung được đồng bộ theo cấu trúc sau:

```javascript
{
  content: {
    // Dữ liệu nội dung tùy thuộc vào loại trang
    title: "Tiêu đề trang",
    subtitle: "Tiêu đề phụ",
    // Các trường khác...
  },
  language: "vi" // hoặc "en"
}
```

## Nguồn dữ liệu

- **Hình ảnh**: Tất cả hình ảnh từ thư mục `public/images` và các thư mục con
- **Trang chủ**: Dữ liệu từ `src/content/fallbacks/homepage-vi.ts` và `src/content/fallbacks/homepage-en.ts`
- **Giới thiệu**: Dữ liệu từ `src/app/about.json` và dữ liệu mẫu tiếng Anh
- **Tính năng**: Dữ liệu từ `src/content/fallbacks/index.ts` (phần features-vi và features-en)
- **Liên hệ**: Dữ liệu từ `src/app/contact.json` và dữ liệu mẫu tiếng Anh
- **Lộ trình**: Dữ liệu mẫu được tạo trong script
- **Bảng giá**: Dữ liệu mẫu được tạo trong script

## Xử lý hình ảnh

Script đồng bộ hình ảnh thực hiện các bước sau:

1. Quét tất cả các file hình ảnh trong thư mục `public/images` và các thư mục con
2. Tải lên từng hình ảnh lên backend thông qua API endpoint
3. Tạo file mapping `image-mapping.json` chứa ánh xạ từ đường dẫn cũ sang URL mới
4. Cập nhật URL hình ảnh trong dữ liệu nội dung trước khi gửi lên backend

Ví dụ về mapping hình ảnh:

```json
{
  "/images/logos/logo.png": "http://localhost:4000/uploads/images/logos/logo.png",
  "/images/homepage/hero.jpg": "http://localhost:4000/uploads/images/homepage/hero.jpg"
}
```

## Lưu ý

- Các script này chỉ nên chạy một lần để khởi tạo dữ liệu ban đầu
- Sau khi đồng bộ, bạn có thể chỉnh sửa nội dung thông qua giao diện admin
- Nếu bạn muốn cập nhật lại dữ liệu từ đầu, hãy xóa dữ liệu trong database trước khi chạy lại script

## Xử lý lỗi

Nếu gặp lỗi khi chạy script, hãy kiểm tra:

1. Backend đã được khởi động và đang chạy trên cổng 4000
2. Các API endpoint trong script phù hợp với cấu hình backend
3. Cấu trúc dữ liệu gửi đi phù hợp với schema trong backend

## Mở rộng

Để thêm loại nội dung mới cần đồng bộ:

1. Tạo hàm mới trong script hiện có hoặc tạo script mới
2. Định nghĩa cấu trúc dữ liệu cho loại nội dung mới
3. Sử dụng hàm `postToApi` để gửi dữ liệu lên API
4. Thêm hàm mới vào hàm chính (`syncAllContent` hoặc `syncAdditionalContent`)
