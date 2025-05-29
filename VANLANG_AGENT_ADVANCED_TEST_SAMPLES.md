# 🧪 **VANLANG AGENT - TEST SAMPLES CHO TÍNH NĂNG NÂNG CAO**

## 🎯 **TỔNG QUAN**

File này chứa test cases cho **2 tính năng nâng cao mới** của VanLang Agent:
- **🔍 TÍNH NĂNG 4: Advanced Filtering (Tìm kiếm nâng cao)**
- **⏰ TÍNH NĂNG 6: Time-based Queries (Truy vấn theo thời gian)**

---

## 🔍 **TÍNH NĂNG 4: ADVANCED FILTERING**

### **📊 Lọc theo toán tử so sánh:**

#### **✅ Test Cases - Lớn hơn/Trên:**
```
1. "Chi tiêu trên 1 triệu"
2. "Thu nhập lớn hơn 2 triệu"
3. "Khoản vay above 500k"
4. "Chi tiêu greater than 100k"
5. "Thu nhập higher than 1tr"
```

#### **✅ Test Cases - Nhỏ hơn/Dưới:**
```
6. "Chi tiêu dưới 500k"
7. "Thu nhập nhỏ hơn 1 triệu"
8. "Khoản vay below 200k"
9. "Chi tiêu less than 50k"
10. "Thu nhập lower than 800k"
```

#### **✅ Test Cases - Cực trị (Max/Min):**
```
11. "Chi tiêu cao nhất"
12. "Thu nhập thấp nhất"
13. "Khoản vay lớn nhất"
14. "Chi tiêu nhỏ nhất"
15. "Thu nhập highest"
16. "Chi tiêu minimum"
17. "Khoản vay max"
18. "Thu nhập lowest"
```

### **🔍 Kết quả mong đợi cho Advanced Filtering:**
```
🔍 **Chi tiêu trên 1,000,000**

✅ **Tìm thấy 3 kết quả:**

**1.** 1,500,000 VND
   📅 15/01/2025 | 📂 Mua sắm
   📝 Mua laptop mới

**2.** 1,200,000 VND
   📅 10/01/2025 | 📂 Ăn uống
   📝 Tiệc sinh nhật

**3.** 1,100,000 VND
   📅 05/01/2025 | 📂 Di chuyển
   📝 Đổ xăng tháng

📊 **Tổng kết:**
• Số lượng: 3 giao dịch
• Tổng tiền: 3,800,000 VND
```

---

## ⏰ **TÍNH NĂNG 6: TIME-BASED QUERIES**

### **📅 Truy vấn theo thời gian cụ thể:**

#### **✅ Test Cases - Thời gian gần:**
```
19. "Thu nhập tuần này"
20. "Chi tiêu hôm nay"
21. "Khoản vay tháng này"
22. "Thu nhập this week"
23. "Chi tiêu today"
24. "Khoản vay this month"
```

#### **✅ Test Cases - Thời gian quá khứ:**
```
25. "Chi tiêu tháng trước"
26. "Thu nhập hôm qua"
27. "Khoản vay last month"
28. "Chi tiêu yesterday"
```

#### **✅ Test Cases - Tổng quan theo thời gian:**
```
29. "Tổng quan tài chính tháng này"
30. "Tổng quan tuần này"
31. "Tình hình tài chính hôm nay"
32. "Overview tháng trước"
```

### **⏰ Kết quả mong đợi cho Time-based Queries:**

#### **📊 Truy vấn cụ thể:**
```
⏰ **Dữ liệu tài chính tuần này**
📅 *Từ 20/01/2025 đến 26/01/2025*

📊 **Thu nhập tuần này:**

💰 **Tổng cộng:** 5,000,000 VND
📈 **Số lượng:** 2 giao dịch

📋 **Chi tiết:**
**1.** 3,000,000 VND
   📅 22/01/2025 | 📂 Lương
   📝 Lương tháng 1

**2.** 2,000,000 VND
   📅 24/01/2025 | 📂 Thưởng
   📝 Thưởng dự án
```

#### **📊 Tổng quan tài chính:**
```
⏰ **Dữ liệu tài chính tháng này**
📅 *Từ 01/01/2025 đến 31/01/2025*

📊 **Tổng quan tài chính:**

💰 **Thu nhập:** 15,000,000 VND (5 giao dịch)
💸 **Chi tiêu:** 8,500,000 VND (12 giao dịch)
🏦 **Khoản vay:** 2,000,000 VND (1 khoản)

💹 **Số dư:** 6,500,000 VND

📋 **Giao dịch gần nhất:**
💰 3,000,000 VND - Lương tháng 1 (25/01/2025)
💸 500,000 VND - Mua sắm (24/01/2025)
💰 2,000,000 VND - Thưởng dự án (22/01/2025)
💸 200,000 VND - Ăn uống (20/01/2025)
💸 150,000 VND - Đổ xăng (18/01/2025)
```

---

## 🧪 **HƯỚNG DẪN TEST CHI TIẾT**

### **📋 Bước 1: Chuẩn bị**
1. **Đảm bảo AI Mode toggle = OFF** (Normal Mode)
2. **Đăng nhập** với tài khoản có dữ liệu
3. **Mở VanLang Agent chat**

### **📋 Bước 2: Test Advanced Filtering**
1. Test từng câu từ **Test Cases 1-18**
2. Kiểm tra **intent detection** = `filter_query`
3. Kiểm tra **response format** đúng như mẫu
4. Kiểm tra **logic filter** hoạt động chính xác

### **📋 Bước 3: Test Time-based Queries**
1. Test từng câu từ **Test Cases 19-32**
2. Kiểm tra **intent detection** = `time_query`
3. Kiểm tra **time range calculation** chính xác
4. Kiểm tra **data filtering** theo thời gian

### **📋 Bước 4: Ghi nhận kết quả**
- **✅ Hoạt động đúng**
- **❌ Lỗi/Không hoạt động**
- **⚠️ Hoạt động nhưng không đúng format**

---

## 📊 **BẢNG THEO DÕI KẾT QUẢ**

| STT | Test Case | Intent Mong Đợi | Kết Quả | Ghi Chú |
|-----|-----------|----------------|---------|---------|
| 1   | "Chi tiêu trên 1 triệu" | filter_query | | |
| 6   | "Chi tiêu dưới 500k" | filter_query | | |
| 11  | "Chi tiêu cao nhất" | filter_query | | |
| 12  | "Thu nhập thấp nhất" | filter_query | | |
| 19  | "Thu nhập tuần này" | time_query | | |
| 25  | "Chi tiêu tháng trước" | time_query | | |
| 29  | "Tổng quan tài chính tháng này" | time_query | | |

---

## 🎯 **TIÊU CHÍ ĐÁNH GIÁ**

### **✅ Thành công khi:**
- Intent detection chính xác (filter_query/time_query)
- Response format đúng với emoji và cấu trúc
- Logic filter/time hoạt động chính xác
- Hiển thị đúng số lượng và tổng tiền
- Hỗ trợ cả tiếng Việt có/không dấu

### **❌ Thất bại khi:**
- Intent detection sai (fallback về other)
- Response format không đúng
- Logic filter/time sai
- Lỗi database hoặc parsing
- Không hỗ trợ các biến thể ngôn ngữ

---

## 🚀 **BẮT ĐẦU TEST NGAY!**

**Hãy copy từng test case và gửi vào VanLang Agent để kiểm tra!**

**Báo cáo kết quả để tôi có thể debug và cải thiện!** 🎉

---

## 🔧 **EDGE CASES & TROUBLESHOOTING**

### **🧪 Test Cases đặc biệt:**

#### **🔍 Advanced Filtering Edge Cases:**
```
33. "Chi tiêu trên 0 đồng" (Test boundary)
34. "Thu nhập dưới 999999999 triệu" (Test large number)
35. "Khoản vay cao nhất của tôi" (Test with possessive)
36. "Chi tiêu thấp nhất hôm nay" (Test combined filter + time)
```

#### **⏰ Time-based Edge Cases:**
```
37. "Thu nhập tuần này của tôi" (Test with possessive)
38. "Chi tiêu tháng trước và tháng này" (Test multiple time)
39. "Tổng quan tài chính hôm qua" (Test past overview)
40. "Khoản vay ngày mai" (Test future - should fail gracefully)
```

### **❌ Các lỗi có thể gặp:**

#### **🔍 Advanced Filtering:**
- **Intent detection sai:** Fallback về `expense_query` thay vì `filter_query`
- **Amount parsing lỗi:** Không hiểu "1tr", "500k"
- **Operator detection sai:** "trên" được hiểu thành "dưới"
- **Empty results:** Không có dữ liệu thỏa mãn điều kiện
- **Database error:** Lỗi MongoDB query

#### **⏰ Time-based Queries:**
- **Intent detection sai:** Fallback về `income_query` thay vì `time_query`
- **Time parsing lỗi:** Không hiểu "tuần này", "tháng trước"
- **Date calculation sai:** Sai khoảng thời gian
- **Empty results:** Không có dữ liệu trong khoảng thời gian
- **Timezone issues:** Sai múi giờ

### **🛠️ Debug Commands:**

#### **Kiểm tra Intent Detection:**
```
"Debug: Chi tiêu trên 1 triệu" → Phải return filter_query
"Debug: Thu nhập tuần này" → Phải return time_query
```

#### **Kiểm tra Database:**
```
"Thu nhập của tôi" → Kiểm tra có dữ liệu không
"Chi tiêu của tôi" → Kiểm tra có dữ liệu không
```

---

## 📝 **TEMPLATE BÁO CÁO KẾT QUẢ**

### **📊 Báo cáo cho Advanced Filtering:**
```
🔍 TEST: "Chi tiêu trên 1 triệu"
✅/❌ Intent Detection: filter_query
✅/❌ Response Format: Đúng cấu trúc
✅/❌ Logic Filter: Lọc chính xác
✅/❌ Data Display: Hiển thị đúng
📝 Ghi chú: [Mô tả chi tiết nếu có lỗi]
```

### **📊 Báo cáo cho Time-based Queries:**
```
⏰ TEST: "Thu nhập tuần này"
✅/❌ Intent Detection: time_query
✅/❌ Time Calculation: Đúng khoảng thời gian
✅/❌ Response Format: Đúng cấu trúc
✅/❌ Data Filter: Lọc theo thời gian chính xác
📝 Ghi chú: [Mô tả chi tiết nếu có lỗi]
```

---

## 🎯 **CHECKLIST HOÀN CHỈNH**

### **✅ Trước khi test:**
- [ ] Backend đang chạy trên port 4000
- [ ] Frontend đang chạy trên port 3000
- [ ] AI Mode toggle = OFF (Normal Mode)
- [ ] Đã đăng nhập với tài khoản có dữ liệu
- [ ] Database có ít nhất 5-10 giao dịch mỗi loại

### **✅ Trong quá trình test:**
- [ ] Test từng tính năng riêng biệt
- [ ] Ghi lại intent detection cho mỗi câu
- [ ] Kiểm tra response format
- [ ] Test cả tiếng Việt có/không dấu
- [ ] Test edge cases

### **✅ Sau khi test:**
- [ ] Tổng hợp kết quả vào bảng
- [ ] Báo cáo các lỗi chi tiết
- [ ] Đề xuất cải thiện nếu có
- [ ] Xác nhận tính năng hoạt động ổn định

---

## 🚀 **SẴN SÀNG TEST!**

**File này chứa đầy đủ 40 test cases cho 2 tính năng nâng cao mới!**

**Hãy bắt đầu test và báo cáo kết quả nhé!** 🎉✨
