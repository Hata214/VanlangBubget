# 🧪 Agent - Test Logic phân biệt "tiền tiết kiệm"

## 🎯 Mục tiêu
Kiểm tra Agent có phân biệt đúng giữa:
- **Tiền tiết kiệm thông thường** → `income` collection
- **Tiền tiết kiệm ngân hàng** → `investment` collection

## 📋 Test Cases

### **✅ Test 1: Tiền tiết kiệm thông thường (→ income)**
```
Input: "tiền tiết kiệm"
Expected Category: savings_income
Expected Collection: incomes
Expected Response: Hiển thị các khoản thu nhập có category "Tiền tiết kiệm"
```

```
Input: "tiết kiệm của tôi"
Expected Category: savings_income
Expected Collection: incomes
Expected Response: Hiển thị các khoản thu nhập có category "Tiền tiết kiệm"
```

```
Input: "tổng tiết kiệm"
Expected Category: savings_income
Expected Collection: incomes
Expected Response: Hiển thị các khoản thu nhập có category "Tiền tiết kiệm"
```

### **✅ Test 2: Tiền tiết kiệm ngân hàng (→ investment)**
```
Input: "tiền tiết kiệm từ ngân hàng của tôi"
Expected Category: savings
Expected Collection: investments
Expected Response: Hiển thị các khoản đầu tư type "savings"
```

```
Input: "tiền tiết kiệm ngân hàng"
Expected Category: savings
Expected Collection: investments
Expected Response: Hiển thị các khoản đầu tư type "savings"
```

```
Input: "tiết kiệm gửi ngân hàng"
Expected Category: savings
Expected Collection: investments
Expected Response: Hiển thị các khoản đầu tư type "savings"
```

```
Input: "tiền gửi ngân hàng"
Expected Category: savings
Expected Collection: investments
Expected Response: Hiển thị các khoản đầu tư type "savings"
```

```
Input: "gửi tiết kiệm"
Expected Category: savings
Expected Collection: investments
Expected Response: Hiển thị các khoản đầu tư type "savings"
```

### **✅ Test 3: Thu nhập tổng quát (→ income)**
```
Input: "thu nhập của tôi"
Expected Category: income
Expected Collection: incomes
Expected Response: Hiển thị TẤT CẢ thu nhập (bao gồm cả tiết kiệm)
```

```
Input: "lương của tôi"
Expected Category: income
Expected Collection: incomes
Expected Response: Hiển thị TẤT CẢ thu nhập
```

## 🔍 Logic phân tích từ khóa

### **🏦 Ưu tiên 1: Tiết kiệm ngân hàng (savings)**
```javascript
// Kiểm tra TRƯỚC - ưu tiên cao nhất
if (
    (message.includes('tiết kiệm') && message.includes('ngân hàng')) ||
    message.includes('tiết kiệm gửi ngân hàng') ||
    message.includes('tiền gửi ngân hàng') ||
    message.includes('gửi tiết kiệm') ||
    message.includes('tiết kiệm từ ngân hàng') ||
    message.includes('tiền tiết kiệm ngân hàng') ||
    message.includes('bank savings')
) {
    category = 'savings'; // → investment collection
}
```

### **💰 Ưu tiên 2: Tiết kiệm thông thường (savings_income)**
```javascript
// Kiểm tra SAU - chỉ khi KHÔNG có "ngân hàng"
else if (
    message === 'tiền tiết kiệm' ||
    message.includes('tiết kiệm') ||
    message.includes('saving') ||
    message.includes('tổng tiết kiệm')
) {
    category = 'savings_income'; // → income collection
}
```

### **📊 Ưu tiên 3: Thu nhập tổng quát (income)**
```javascript
// Kiểm tra CUỐI
else if (
    message.includes('thu nhập') ||
    message.includes('lương') ||
    message.includes('income')
) {
    category = 'income'; // → income collection (tất cả)
}
```

## 🎨 Expected Responses

### **💰 Tiền tiết kiệm thông thường:**
```
💰 **Tổng tiền tiết kiệm tổng cộng:** 5,000,000 VND

📊 **Chi tiết tiền tiết kiệm:**
1. Tiết kiệm tháng 5: 3,000,000 VND - Tiền tiết kiệm (15/5/2025)
2. Tiết kiệm cuối năm: 2,000,000 VND - Tiền tiết kiệm (20/5/2025)
```

### **🏦 Tiền tiết kiệm ngân hàng:**
```
🏦 **Tổng tiết kiệm ngân hàng tổng cộng:** 50,000,000 VND

📊 **Chi tiết tiết kiệm ngân hàng:**
1. Vietcombank: 30,000,000 VND - Lãi suất 6.5%/năm (01/01/2025)
2. BIDV: 20,000,000 VND - Lãi suất 6.2%/năm (15/02/2025)

💰 **Tổng lãi dự kiến:** 3,250,000 VND
```

### **📊 Thu nhập tổng quát:**
```
💰 **Tổng thu nhập tổng cộng:** 245,380,000 VND

📊 **Chi tiết thu nhập:**
1. Lương: 180,000,000 VND
2. Thưởng: 60,000,000 VND  
3. Tiền tiết kiệm: 5,000,000 VND
4. Freelance: 380,000 VND
```

## 🔧 Debug Information

### **Logging sẽ hiển thị:**
```javascript
// Cho "tiền tiết kiệm"
logger.info('Keyword analysis: detected general savings in income category', { 
    message: 'tiền tiết kiệm' 
});

// Cho "tiền tiết kiệm từ ngân hàng"
logger.info('Keyword analysis: detected bank savings in investment category', { 
    message: 'tiền tiết kiệm từ ngân hàng của tôi' 
});
```

## 🎯 Kết quả mong đợi

### **✅ Trước khi sửa:**
```
"tiền tiết kiệm từ ngân hàng" → Hiển thị income (SAI)
```

### **✅ Sau khi sửa:**
```
"tiền tiết kiệm từ ngân hàng" → Hiển thị investment savings (ĐÚNG)
"tiền tiết kiệm" → Hiển thị income savings (ĐÚNG)
```

## 📱 Cách test thực tế

### **Bước 1:** Mở chatbot
### **Bước 2:** Test các câu sau:
1. `"tiền tiết kiệm"` → Phải hiển thị income
2. `"tiền tiết kiệm từ ngân hàng của tôi"` → Phải hiển thị investment
3. `"tiết kiệm ngân hàng"` → Phải hiển thị investment
4. `"thu nhập của tôi"` → Phải hiển thị tất cả income

### **Bước 3:** Kiểm tra response
- Đúng collection được query
- Đúng dữ liệu được hiển thị
- Đúng format response

### **Bước 4:** Kiểm tra logs
- Category được phân loại đúng
- Intent được nhận diện đúng
- Query được thực hiện đúng

## 🚀 Kết luận

Agent giờ đây sẽ:
- ✅ **Phân biệt chính xác** giữa tiết kiệm thông thường và tiết kiệm ngân hàng
- ✅ **Query đúng collection** dựa trên từ khóa
- ✅ **Hiển thị đúng dữ liệu** theo yêu cầu người dùng
- ✅ **Logging chi tiết** để debug và monitor

Không còn nhầm lẫn giữa các loại tiết kiệm! 🎉
