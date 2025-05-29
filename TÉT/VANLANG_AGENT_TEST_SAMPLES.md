# 🧪 **DANH SÁCH MẪU TEST CHO VANLANG AGENT**

## 📋 **1. THÊM DỮ LIỆU (INSERT)**

### **💰 Tiết kiệm:**
```
1. "Tôi tiết kiệm được 2 triệu hôm nay"
2. "Để dành 500k"
3. "Vừa tiết kiệm 1tr"
4. "Gom góp được 300 nghìn"
```

### **💵 Thu nhập:**
```
5. "Tôi nhận lương 15 triệu"
6. "Được thưởng 2tr hôm nay"
7. "Kiếm được 800k freelance"
8. "Thu về 1.5 triệu bán hàng"
```

### **💸 Chi tiêu:**
```
9. "Tôi mua cà phê 50k"
10. "Chi tiêu ăn uống 200k"
11. "Mua quần áo 800 nghìn"
12. "Đổ xăng 150k"
```
<!-- 
### **🏦 Khoản vay:**
```
13. "Tôi vay ngân hàng 5 triệu"
14. "Mượn bạn 500k"
15. "Cho vay 2tr"
``` -->

---

## 🔍 **2. TRUY VẤN CƠ BẢN (QUERY)**

### **💰 Thu nhập & Tiết kiệm:**
```
16. "Thu nhập của tôi"
17. "Tiền tiết kiệm của tôi"
18. "Lương tháng này"
19. "Tổng thu nhập"
```

### **💸 Chi tiêu:**
```
20. "Chi tiêu của tôi"
21. "Chi tiêu tháng này"
22. "Tổng chi tiêu"
23. "Chi tiêu ăn uống"
```

### **🏦 Khoản vay:**
```
24. "Khoản vay của tôi"
25. "Nợ còn lại"
26. "Tổng khoản vay"
```

### **📈 Đầu tư:**
```
27. "Đầu tư của tôi"
28. "Gửi tiền ngân hàng"
29. "Cổ phiếu của tôi"
30. "Vàng của tôi"
```

---

## 📊 **3. TÍNH TOÁN & PHÂN TÍCH (CALCULATION)**

### **🧮 Tính toán thông minh:**
```
31. "Tôi có thể chi 4tr được không?"
32. "Nếu tôi chi 2 triệu thì còn bao nhiêu?"
33. "Tôi có đủ tiền chi 500k không?"
34. "Sau khi chi 1 triệu thì thiếu bao nhiêu?"
```

### **📊 Số dư & Tổng quan:**
```
35. "Số dư của tôi"
36. "Tình hình tài chính"
37. "Tổng quan tài chính"
38. "Phân tích tài chính"
```

---

## 🔍 **4. TÌM KIẾM NÂNG CAO (FILTER)**

### **🔍 Lọc theo điều kiện:**
```
39. "Chi tiêu trên 1 triệu"
40. "Thu nhập dưới 500k"
41. "Khoản vay cao nhất"
42. "Chi tiêu thấp nhất"
```

---

## 📈 **5. THỐNG KÊ NÂNG CAO (STATISTICS)**

### **📊 Thống kê:**
```
43. "Trung bình chi tiêu của tôi"
44. "So sánh thu chi"
45. "Thống kê tổng quan"
46. "Phân tích chi tiêu"
```

---

## ⏰ **6. TRUY VẤN THEO THỜI GIAN (TIME)**

### **📅 Theo thời gian:**
```
47. "Thu nhập tuần này"
48. "Chi tiêu tháng trước"
49. "Khoản vay hôm nay"
50. "Tổng quan tài chính tháng này"
```
*****************************************

*****************************************
## 🤖 **7. CHỨC NĂNG CƠ BẢN (BASIC)**

### **👋 Chào hỏi:**
```
51. "Xin chào"
52. "Bạn là ai?"
53. "Bạn làm được gì?"
54. "Giúp tôi gì được?"
```

---

## 📝 **HƯỚNG DẪN TEST:**

### **✅ Kết quả mong đợi:**
- **Thêm dữ liệu:** Hiển thị confirmation + lưu thành công
- **Truy vấn:** Hiển thị tổng số + chi tiết (tối đa 5 khoản)
- **Tính toán:** Hiển thị số dư hiện tại + kết quả tính toán
- **Lọc/Thống kê:** Hiển thị kết quả phù hợp với điều kiện
- **Thời gian:** Hiển thị dữ liệu theo khoảng thời gian

### **❌ Lỗi có thể gặp:**
- Intent recognition sai
- Không hiểu số tiền (4tr, 500k)
- Không tìm thấy dữ liệu
- Lỗi database connection
- Response format không đúng

---

## 🎯 **CÁCH TEST:**

1. **Chọn 10-15 câu từ danh sách trên**
2. **Test từng câu một cách tuần tự**
3. **Ghi lại kết quả:** ✅ Hoạt động / ❌ Lỗi / ⚠️ Không đúng
4. **Báo cáo chi tiết:** Intent detected + Response received

**Hãy bắt đầu test và cho tôi biết kết quả!** 🚀

---

## 📊 **BẢNG THEO DÕI KẾT QUẢ TEST:**

| STT | Câu Test | Intent Mong Đợi | Kết Quả | Ghi Chú |
|-----|----------|----------------|---------|---------|
| 1   | "Tôi tiết kiệm được 2 triệu hôm nay" | insert_savings | | |
| 2   | "Để dành 500k" | insert_savings | | |
| 3   | "Tôi nhận lương 15 triệu" | insert_income | | |
| 4   | "Chi tiêu ăn uống 200k" | insert_expense | | |
| 5   | "Vay ngân hàng 5 triệu" | insert_loan | | |
| 16  | "Thu nhập của tôi" | income_query | | |
| 17  | "Tiền tiết kiệm của tôi" | savings_income_query | | |
| 20  | "Chi tiêu của tôi" | expense_query | | |
| 24  | "Khoản vay của tôi" | loan_query | | |
| 31  | "Tôi có thể chi 4tr được không?" | calculation_query | | |
| 35  | "Số dư của tôi" | balance_query | | |
| 39  | "Chi tiêu trên 1 triệu" | filter_query | | |
| 43  | "Trung bình chi tiêu của tôi" | statistics_query | | |
| 47  | "Thu nhập tuần này" | time_query | | |
| 51  | "Xin chào" | greeting | | |

**Hãy điền kết quả test vào bảng này!** ✅❌⚠️
