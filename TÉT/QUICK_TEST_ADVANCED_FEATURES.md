# ⚡ **QUICK TEST - TÍNH NĂNG NÂNG CAO VANLANG AGENT**

## 🎯 **TEST NHANH 10 PHÚT**

### **📋 Chuẩn bị:**
1. ✅ Backend chạy port 4000
2. ✅ Frontend chạy port 3000  
3. ✅ AI Mode toggle = **OFF** (Normal Mode)
4. ✅ Đăng nhập tài khoản có dữ liệu

---

## 🔍 **TEST 1: ADVANCED FILTERING (5 test cases)**

### **Copy và paste từng câu vào VanLang Agent:**

#### **Test 1.1: Lọc lớn hơn**
```
Chi tiêu trên 1 triệu
```
**Mong đợi:** Intent = `filter_query`, hiển thị chi tiêu > 1,000,000 VND

#### **Test 1.2: Lọc nhỏ hơn**
```
Thu nhập dưới 500k
```
**Mong đợi:** Intent = `filter_query`, hiển thị thu nhập < 500,000 VND

#### **Test 1.3: Tìm cực đại**
```
Khoản vay cao nhất
```
**Mong đợi:** Intent = `filter_query`, hiển thị khoản vay có amount lớn nhất

#### **Test 1.4: Tìm cực tiểu**
```
Chi tiêu thấp nhất
```
**Mong đợi:** Intent = `filter_query`, hiển thị chi tiêu có amount nhỏ nhất

#### **Test 1.5: Biến thể ngôn ngữ**
```
Thu nhập lớn hơn 2 triệu
```
**Mong đợi:** Intent = `filter_query`, hiển thị thu nhập > 2,000,000 VND

---
********************************************************************************* 
# TEST 2 xong gửi TEST 1 fail hết

## ⏰ **TEST 2: TIME-BASED QUERIES (5 test cases)**

### **Copy và paste từng câu vào VanLang Agent:**

#### **Test 2.1: Tuần này**
```
Thu nhập tuần này
```
**Mong đợi:** Intent = `time_query`, hiển thị thu nhập từ đầu tuần đến nay

#### **Test 2.2: Tháng trước**
```
Chi tiêu tháng trước
```
**Mong đợi:** Intent = `time_query`, hiển thị chi tiêu của tháng trước

#### **Test 2.3: Hôm nay**
```
Khoản vay hôm nay
```
**Mong đợi:** Intent = `time_query`, hiển thị khoản vay được tạo hôm nay

#### **Test 2.4: Tổng quan thời gian**
```
Tổng quan tài chính tháng này
```
**Mong đợi:** Intent = `time_query`, hiển thị tổng hợp income/expense/loan tháng này

#### **Test 2.5: Biến thể ngôn ngữ**
```
Chi tiêu this month
```
**Mong đợi:** Intent = `time_query`, hiển thị chi tiêu tháng này

---

## 📊 **BẢNG GHI KẾT QUẢ NHANH**

| Test | Câu Test | Intent Mong Đợi | Kết Quả | Ghi Chú |
|------|----------|----------------|---------|---------|
| 1.1  | Chi tiêu trên 1 triệu | filter_query | ⬜ | |
| 1.2  | Thu nhập dưới 500k | filter_query | ⬜ | |
| 1.3  | Khoản vay cao nhất | filter_query | ⬜ | |
| 1.4  | Chi tiêu thấp nhất | filter_query | ⬜ | |
| 1.5  | Thu nhập lớn hơn 2 triệu | filter_query | ⬜ | |
| 2.1  | Thu nhập tuần này | time_query | ⬜ | |
| 2.2  | Chi tiêu tháng trước | time_query | ⬜ | |
| 2.3  | Khoản vay hôm nay | time_query | ⬜ | |
| 2.4  | Tổng quan tài chính tháng này | time_query | ⬜ | |
| 2.5  | Chi tiêu this month | time_query | ⬜ | |

**Điền:** ✅ (Thành công) / ❌ (Thất bại) / ⚠️ (Có vấn đề)

---

## 🎯 **TIÊU CHÍ ĐÁNH GIÁ NHANH**

### **✅ THÀNH CÔNG khi:**
- Intent detection đúng (filter_query/time_query)
- Response có emoji và format đẹp
- Logic filter/time hoạt động
- Hiển thị được dữ liệu

### **❌ THẤT BẠI khi:**
- Intent detection sai (fallback về other)
- Response lỗi hoặc không có format
- Logic filter/time không hoạt động
- Không hiển thị được dữ liệu

---

## 🚨 **TROUBLESHOOTING NHANH**

### **Nếu gặp lỗi:**

#### **🔍 Advanced Filtering không hoạt động:**
1. Kiểm tra intent có phải `filter_query` không
2. Test câu đơn giản: "Chi tiêu của tôi" (phải hoạt động)
3. Kiểm tra có dữ liệu trong database không

#### **⏰ Time-based Queries không hoạt động:**
1. Kiểm tra intent có phải `time_query` không  
2. Test câu đơn giản: "Thu nhập của tôi" (phải hoạt động)
3. Kiểm tra múi giờ và date calculation

#### **🤖 Intent Detection sai:**
1. Đảm bảo AI Mode toggle = OFF
2. Restart backend nếu cần
3. Kiểm tra logs trong browser console

---

## 📝 **TEMPLATE BÁO CÁO NHANH**

### **Nếu tất cả test THÀNH CÔNG:**
```
🎉 **QUICK TEST HOÀN THÀNH!**

✅ Advanced Filtering: 5/5 test cases thành công
✅ Time-based Queries: 5/5 test cases thành công

🚀 **Hai tính năng nâng cao hoạt động hoàn hảo!**
```

### **Nếu có test THẤT BẠI:**
```
⚠️ **QUICK TEST KẾT QUẢ:**

🔍 Advanced Filtering: X/5 test cases thành công
⏰ Time-based Queries: Y/5 test cases thành công

❌ **Các test thất bại:**
- Test A.B: [Mô tả lỗi]
- Test C.D: [Mô tả lỗi]

🛠️ **Cần debug và sửa lỗi!**
```

---

## ⏱️ **THỜI GIAN DỰ KIẾN: 10 PHÚT**

1. **Chuẩn bị:** 2 phút
2. **Test Advanced Filtering:** 3 phút  
3. **Test Time-based Queries:** 3 phút
4. **Ghi kết quả:** 2 phút

---

## 🚀 **BẮT ĐẦU QUICK TEST NGAY!**

**Copy từng test case và paste vào VanLang Agent!**
**Ghi kết quả vào bảng và báo cáo!** ⚡✨
