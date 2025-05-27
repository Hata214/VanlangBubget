# 🤖 VanLang Agent - Hướng dẫn POST dữ liệu

## 📝 Tổng quan
Agent đã được nâng cấp để hỗ trợ người dùng **THÊM DỮ LIỆU** vào database thông qua chat tự nhiên.

## 💰 THÊM THU NHẬP (insert_income)

### ✅ Các cách nói được hỗ trợ:
```
"Tôi nhận lương 15 triệu"
"Tôi được trả 10 triệu"
"Tôi kiếm được 5 triệu"
"Tôi thu về 2 triệu"
"Nhận lương 20 triệu hôm nay"
"Được trả lương 12 triệu"
"Thu về 3 triệu từ freelance"
"Kiếm được 1 triệu"
"Lương tôi 15 triệu"
"Tiền lương 18 triệu"
"Thưởng 2 triệu"
"Bonus 1 triệu"
"Được thưởng 500k"
"Nhận thưởng 3 triệu"
```

### 📊 Kết quả mong đợi:
- ✅ Lưu vào database collection `incomes`
- ✅ Hiển thị thông tin chi tiết với emoji 💰
- ✅ Đưa ra gợi ý tiếp theo

## 💸 THÊM CHI TIÊU (insert_expense)

### ✅ Các cách nói được hỗ trợ:
```
"Tôi mua cà phê 50k"
"Tôi chi 200k ăn uống"
"Tôi trả 100k taxi"
"Tôi tiêu 300k mua sắm"
"Mua quần áo 500k"
"Chi tiêu ăn uống 150k"
"Trả tiền điện 200k"
"Tiêu 80k mua bánh"
"Thanh toán 1 triệu"
"Tốn 50k"
"Hết 200k mua đồ"
"Chi phí 300k"
```

### 📊 Kết quả mong đợi:
- ✅ Lưu vào database collection `expenses`
- ✅ Hiển thị thông tin chi tiết với emoji 💸
- ✅ Tự động phân loại danh mục

## 🏦 THÊM KHOẢN VAY (insert_loan)

### ✅ Các cách nói được hỗ trợ:
```
"Tôi vay ngân hàng 5 triệu"
"Tôi mượn bạn 500k"
"Vay 2 triệu"
"Mượn 1 triệu"
"Nợ 3 triệu"
"Cho vay 1 triệu"
```

### 📊 Kết quả mong đợi:
- ✅ Lưu vào database collection `loans`
- ✅ Hiển thị thông tin chi tiết với emoji 🏦

## 🔢 Xử lý số tiền thông minh

### ✅ Các định dạng được hỗ trợ:
```
"50k" = 50,000 VND
"50 nghìn" = 50,000 VND
"1 triệu" = 1,000,000 VND
"1tr" = 1,000,000 VND
"1m" = 1,000,000 VND
"2.5 triệu" = 2,500,000 VND
"15 triệu" = 15,000,000 VND
"100 đồng" = 100 VND
"50000 vnd" = 50,000 VND
```

## 📋 Danh mục tự động

### 💰 Thu nhập:
- Lương, Thưởng, Tiền tiết kiệm, Thu nhập khác, Freelance, Bán hàng

### 💸 Chi tiêu:
- Ăn uống, Di chuyển, Giải trí, Mua sắm, Học tập, Y tế, Hóa đơn, Khác

### 🏦 Khoản vay:
- Ngân hàng, Bạn bè, Gia đình, Công ty, Khác

## 🎯 Ví dụ test hoàn chỉnh

### Test 1: Thu nhập
```
Input: "Tôi nhận lương 15 triệu hôm nay"
Expected Output:
✅ **Đã lưu thu nhập thành công!**

💰 **Thông tin giao dịch:**
• Loại: Thu nhập
• Số tiền: 15,000,000 VND
• Danh mục: Lương
• Ngày: 15/01/2024
• Ghi chú: Nhận lương

💡 **Gợi ý:** Bạn có thể:
• Hỏi "thu nhập của tôi" để xem tổng quan
• Nói "thêm thu nhập khác" để tiếp tục
• Hỏi "số dư của tôi" để xem tình hình tài chính
```

### Test 2: Chi tiêu
```
Input: "Tôi mua cà phê 50k"
Expected Output:
✅ **Đã lưu chi tiêu thành công!**

💸 **Thông tin giao dịch:**
• Loại: Chi tiêu
• Số tiền: 50,000 VND
• Danh mục: Ăn uống
• Ngày: 15/01/2024
• Ghi chú: Mua cà phê
```

### Test 3: Khoản vay
```
Input: "Tôi vay ngân hàng 5 triệu"
Expected Output:
✅ **Đã lưu khoản vay thành công!**

🏦 **Thông tin giao dịch:**
• Loại: Khoản vay
• Số tiền: 5,000,000 VND
• Danh mục: Ngân hàng
• Ngày: 15/01/2024
• Ghi chú: Vay ngân hàng
```

## 🚀 Cải tiến đã thực hiện

### 1. **Intent Recognition nâng cao:**
- ✅ Nhận diện trực tiếp các câu lệnh POST
- ✅ Ưu tiên cao cho câu có số tiền + động từ hành động
- ✅ Hỗ trợ nhiều cách diễn đạt tự nhiên

### 2. **Data Extraction thông minh:**
- ✅ Xử lý số tiền đa dạng (k, triệu, tr, m...)
- ✅ Tự động phân loại danh mục
- ✅ Tạo ghi chú từ ngữ cảnh

### 3. **Response cải tiến:**
- ✅ Hiển thị thông tin chi tiết với emoji
- ✅ Đưa ra gợi ý hành động tiếp theo
- ✅ Error handling với hướng dẫn cụ thể

### 4. **Database Integration:**
- ✅ Lưu trực tiếp vào MongoDB
- ✅ Validation dữ liệu
- ✅ Format số tiền chuẩn

## 🧪 Cách test

1. **Mở chatbot** trên frontend
2. **Đăng nhập** với tài khoản hợp lệ
3. **Gửi tin nhắn** theo các mẫu trên
4. **Kiểm tra database** để xác nhận dữ liệu đã được lưu
5. **Test các trường hợp edge case**

Agent đã sẵn sàng để hỗ trợ người dùng POST dữ liệu một cách tự nhiên và thông minh! 🎉
