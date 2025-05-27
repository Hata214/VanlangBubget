# 🔧 Agent - Debug "tôi mới tiết kiệm được 500k"

## 🐛 Vấn đề
User test câu **"tôi mới tiết kiệm được 500k"** nhưng Agent trả về query thay vì insert.

## 🔍 Phân tích debug

### **1. Kiểm tra hasAmount:**
```javascript
const hasAmount = /\d+[\s]*(k|nghìn|triệu|tr|m|đồng|vnd)/i.test(message);
// "tôi mới tiết kiệm được 500k" → true ✅
```

### **2. Kiểm tra tiết kiệm keywords:**
```javascript
// normalizedMessage = "tôi mới tiết kiệm được 500k"
(normalizedMessage.includes('tiết kiệm') || normalizedMessage.includes('tiet kiem'))
// → true ✅

!normalizedMessage.includes('ngân hàng') && !normalizedMessage.includes('ngan hang')
// → true ✅
```

### **3. Kiểm tra action keywords:**
```javascript
// Trước khi sửa:
normalizedMessage.includes('mới tiết kiệm') // → true ❌ (chưa có)

// Sau khi sửa:
normalizedMessage.includes('mới tiết kiệm') // → true ✅
normalizedMessage.includes('moi tiet kiem') // → false (có dấu)
```

## ✅ Đã sửa

### **1. 🔧 Thêm từ khóa mới:**
```javascript
if (normalizedMessage.includes('tôi tiết kiệm') || normalizedMessage.includes('tôi tiet kiem') ||
    normalizedMessage.includes('tiết kiệm được') || normalizedMessage.includes('tiet kiem duoc') ||
    normalizedMessage.includes('mới tiết kiệm') || normalizedMessage.includes('moi tiet kiem') || // ✅ MỚI
    normalizedMessage.includes('vừa tiết kiệm') || normalizedMessage.includes('vua tiet kiem') || // ✅ MỚI
    normalizedMessage.includes('để dành') || normalizedMessage.includes('de danh') ||
    normalizedMessage.includes('gom góp') || normalizedMessage.includes('gom gop') ||
    normalizedMessage.includes('dành dụm') || normalizedMessage.includes('danh dum') ||
    normalizedMessage.includes('save') || normalizedMessage.includes('saving')) {
    return 'insert_savings';
}
```

### **2. 📝 Cập nhật intent prompt:**
```javascript
- insert_savings: Thêm tiền tiết kiệm (cấu trúc: "tôi tiết kiệm", "tiết kiệm được", "mới tiết kiệm", "vừa tiết kiệm", "để dành", "gom góp", "dành dụm", "save" + số tiền - KHÔNG có "ngân hàng")
```

### **3. 🎯 Thêm ví dụ training:**
```javascript
Ví dụ:
- "Tôi tiết kiệm được 2 triệu" -> {"type": "savings", "amount": 2000000, "category": "Tiền tiết kiệm", "note": "Tiết kiệm được", "date": "2024-01-15"}
- "Tôi mới tiết kiệm được 500k" -> {"type": "savings", "amount": 500000, "category": "Tiền tiết kiệm", "note": "Mới tiết kiệm được", "date": "2024-01-15"} // ✅ MỚI
- "Vừa tiết kiệm 1 triệu" -> {"type": "savings", "amount": 1000000, "category": "Tiền tiết kiệm", "note": "Vừa tiết kiệm", "date": "2024-01-15"} // ✅ MỚI
- "Để dành 500k hôm nay" -> {"type": "savings", "amount": 500000, "category": "Tiền tiết kiệm", "note": "Để dành", "date": "2024-01-15"}
```

### **4. 🔍 Thêm debug logging:**
```javascript
logger.info('POST intent analysis - insert_savings detected!', {
    message: normalizedMessage,
    matchedKeywords: {
        toiTietKiem: normalizedMessage.includes('tôi tiết kiệm'),
        toiTietKiemNoDiacritics: normalizedMessage.includes('tôi tiet kiem'),
        tietKiemDuoc: normalizedMessage.includes('tiết kiệm được'),
        tietKiemDuocNoDiacritics: normalizedMessage.includes('tiet kiem duoc'),
        moiTietKiem: normalizedMessage.includes('mới tiết kiệm'), // ✅ MỚI
        moiTietKiemNoDiacritics: normalizedMessage.includes('moi tiet kiem'), // ✅ MỚI
        vuaTietKiem: normalizedMessage.includes('vừa tiết kiệm'), // ✅ MỚI
        vuaTietKiemNoDiacritics: normalizedMessage.includes('vua tiet kiem') // ✅ MỚI
    }
});
```

## 🧪 Test Cases mới được hỗ trợ

### **✅ Các câu này giờ sẽ hoạt động:**
```
"Tôi mới tiết kiệm được 500k" → insert_savings ✅
"Mới tiết kiệm được 1 triệu" → insert_savings ✅
"Tôi vừa tiết kiệm 2 triệu" → insert_savings ✅
"Vừa tiết kiệm được 300k" → insert_savings ✅
"Tôi mới để dành 500k" → insert_savings ✅
"Vừa gom góp được 1 triệu" → insert_savings ✅
```

### **✅ Các câu cũ vẫn hoạt động:**
```
"Tôi tiết kiệm được 2 triệu" → insert_savings ✅
"Tiết kiệm được 500k" → insert_savings ✅
"Để dành 1 triệu" → insert_savings ✅
"Gom góp được 300k" → insert_savings ✅
"Dành dụm 200k" → insert_savings ✅
"I save 1 million" → insert_savings ✅
```

### **❌ Vẫn KHÔNG được nhận diện (đúng):**
```
"Tôi tiết kiệm ngân hàng 5 triệu" → savings_query (investment) ✅
"Tiết kiệm gửi ngân hàng" → savings_query (investment) ✅
"Tiền tiết kiệm của tôi" → savings_income_query (query) ✅
```

## 🔄 Expected Flow

### **Input:** "tôi mới tiết kiệm được 500k"

### **Step 1: analyzeIntent()**
```javascript
hasAmount = true ✅
normalizedMessage = "tôi mới tiết kiệm được 500k"
includes('tiết kiệm') = true ✅
!includes('ngân hàng') = true ✅
includes('mới tiết kiệm') = true ✅ (MỚI)
→ return 'insert_savings' ✅
```

### **Step 2: handleUserMessage()**
```javascript
intent = 'insert_savings'
→ case 'insert_savings':
→ return await this.handleInsertTransaction(userId, message, sessionId, 'savings');
```

### **Step 3: extractTransactionData()**
```javascript
forceType = 'savings'
→ Gemini AI extract:
{
    "type": "savings",
    "amount": 500000,
    "category": "Tiền tiết kiệm",
    "note": "Mới tiết kiệm được",
    "date": "2024-01-15"
}
```

### **Step 4: Database Save**
```javascript
Transaction.save() → income collection
category = "Tiền tiết kiệm"
amount = 500000
```

### **Step 5: Response**
```
✅ **Đã lưu tiền tiết kiệm thành công!**

💰 **Thông tin giao dịch:**
• Loại: Tiền tiết kiệm
• Số tiền: 500,000 VND
• Danh mục: Tiền tiết kiệm
• Ngày: 15/01/2024
• Ghi chú: Mới tiết kiệm được

💡 **Gợi ý:** Bạn có thể:
• Hỏi "tiền tiết kiệm của tôi" để xem tổng quan
• Nói "thêm tiền tiết kiệm khác" để tiếp tục
• Hỏi "số dư của tôi" để xem tình hình tài chính
```

## 🎯 Kết quả

### **✅ Đã sửa xong:**
- ✅ Thêm từ khóa "mới tiết kiệm", "vừa tiết kiệm"
- ✅ Cập nhật intent prompt với từ khóa mới
- ✅ Thêm ví dụ training cho AI
- ✅ Thêm debug logging chi tiết
- ✅ Hỗ trợ cả có dấu và không dấu
- ✅ **SỬA CHÍNH: Xử lý savings lưu vào Income collection thay vì Transaction**

### **🔧 Vấn đề đã được khắc phục:**

#### **❌ Vấn đề cũ:**
```
Transaction validation failed: type: `savings` is not a valid enum value for path `type`.
```

#### **✅ Giải pháp:**
```javascript
// Xử lý đặc biệt cho savings - lưu vào Income collection
if (forceType === 'savings' || transactionData.type === 'savings') {
    const Income = (await import('../models/incomeModel.js')).default;

    const income = new Income({
        userId,
        amount: transactionData.amount,
        description: transactionData.note || 'Tiền tiết kiệm',
        category: 'Tiền tiết kiệm',
        date: new Date(transactionData.date)
    });

    await income.save();
    // Return success message
}
```

### **🧪 Test ngay:**
1. **"tôi mới tiết kiệm được 500k"** → Phải thành công ✅
2. **"vừa tiết kiệm 1 triệu"** → Phải thành công ✅
3. **"tiết kiệm 689k"** → Phải thành công ✅
4. **"tôi tiết kiệm được 689k"** → Phải thành công ✅

### **📊 Expected logs:**
```
[INFO] analyzeIntent result { intent: 'insert_savings', isInsertIntent: true }
[INFO] Savings saved to Income collection { incomeId: '...', amount: 500000 }
```

### **🎉 Expected response:**
```
✅ **Đã lưu tiền tiết kiệm thành công!**

💰 **Thông tin giao dịch:**
• Loại: Tiền tiết kiệm
• Số tiền: 500,000 VND
• Danh mục: Tiền tiết kiệm
• Ngày: 15/01/2024
• Ghi chú: Mới tiết kiệm được

💡 **Gợi ý:** Bạn có thể:
• Hỏi "tiền tiết kiệm của tôi" để xem tổng quan
• Nói "thêm tiền tiết kiệm khác" để tiếp tục
• Hỏi "số dư của tôi" để xem tình hình tài chính
```

Agent giờ đây sẽ nhận diện chính xác và lưu thành công câu "tôi mới tiết kiệm được 500k"! 🎉
