# 🧮 Enhanced Calculation Engine - Hướng dẫn sử dụng

## 📋 Tổng quan

VanLang Agent đã được nâng cấp với **Enhanced Calculation Engine** hỗ trợ 2 loại tính toán chính:

### 1. 🧮 **General Calculation (Tính toán thông thường)**
- Thực hiện các phép tính cơ bản: cộng, trừ, nhân, chia
- Xử lý các biểu thức toán học phức tạp
- Hỗ trợ tính phần trăm, lãi suất đơn giản
- **Engine:** `GeneralCalculationEngine`

### 2. 💰 **Financial Calculation (Tính toán tài chính hiện tại)**
- Tính số dư hiện tại dựa trên dữ liệu thực trong database
- Phân tích khả năng chi tiêu
- Dự đoán số dư sau giao dịch
- Kiểm tra đủ tiền và tính toán thiếu hụt
- **Engine:** `FinancialCalculationEngine`

## 🎯 Intent Detection

Agent sử dụng **CalculationCoordinator** để phân biệt chính xác 2 loại tính toán:

```javascript
// Intent mapping
'general_calculation'    -> GeneralCalculationEngine
'financial_calculation'  -> FinancialCalculationEngine
'calculation_query'      -> Legacy support
```

## 📝 Ví dụ sử dụng

### 🧮 General Calculation Examples

```
✅ "2 + 3 = ?"
✅ "15% của 1 triệu"
✅ "1000 * 12 tháng"
✅ "lãi suất 5% của 10 triệu trong 12 tháng"
✅ "20 phần trăm của 500k"
✅ "100 chia 4"
✅ "2 cộng 3 nhân 4"
✅ "tính 15% của 2 triệu"
```

### 💰 Financial Calculation Examples

```
✅ "Tôi có thể chi 4tr được không?"
✅ "Nếu tôi chi 2 triệu thì còn bao nhiêu?"
✅ "Tôi có đủ tiền chi 500k không?"
✅ "Sau khi chi 1 triệu thì thiếu bao nhiêu?"
✅ "Số dư của tôi"
✅ "Tôi có thể mua xe 50 triệu được không?"
✅ "Nếu tôi lấy tiền tiết kiệm để mua xe đạp giá 4tr thì tôi sẽ còn bao nhiều tiền?"
```

## 🏗️ Kiến trúc hệ thống

```
VanLangAgent
    ↓
CalculationCoordinator
    ↓
┌─────────────────────┬─────────────────────┐
│ GeneralCalculation  │ FinancialCalculation│
│ Engine              │ Engine              │
└─────────────────────┴─────────────────────┘
```

### 📁 File Structure

```
vanlang-budget-BE/src/agent/
├── calculationCoordinator.js      # Main coordinator
├── generalCalculationEngine.js    # General math engine
├── financialCalculationEngine.js  # Financial calculation engine
├── vanlangAgent.js                # Updated main agent
└── test-enhanced-calculation.js   # Test suite
```

## 🔧 API Usage

### Basic Usage

```javascript
import VanLangAgent from './vanlangAgent.js';

const agent = new VanLangAgent(GEMINI_API_KEY);

// General calculation
const generalResult = await agent.handleGeneralCalculation(userId, "2 + 3 = ?");

// Financial calculation
const financialResult = await agent.handleFinancialCalculation(userId, "Tôi có thể chi 4tr không?");
```

### Advanced Usage with Coordinator

```javascript
// Direct coordinator usage
const result = await agent.calculationCoordinator.detectAndProcess(
    "Nếu tôi chi 2 triệu thì còn bao nhiêu?",
    financialData
);

console.log(result.isCalculation); // true
console.log(result.type);          // 'financial'
console.log(result.confidence);    // 0.85
console.log(result.response);      // Detailed response
```

## 🎯 Detection Logic

### General Calculation Patterns

```javascript
// Math expressions
/[\d\s+\-*/()%=?]+/

// Math keywords
'cộng', 'trừ', 'nhân', 'chia', 'phần trăm', 'lãi suất'

// Percentage calculations
/(\d+(?:\.\d+)?)\s*%?\s*(của|of)\s*(\d+(?:[k|nghìn|triệu|tr|m])?)/i

// Interest calculations
/(lãi suất|interest|lãi|lai)\s*(\d+(?:\.\d+)?)\s*%/i
```

### Financial Calculation Patterns

```javascript
// Balance keywords
'số dư', 'balance', 'còn lại'

// Spending ability
'có thể chi', 'đủ tiền', 'can afford'

// Conditional structure
/(nếu|neu|if).*(chi|spend|mua|buy).*(thì|thi|then)/i

// After spending
'sau khi chi', 'nếu chi'

// Shortage check
'thiếu', 'shortage', 'không đủ'
```

## 📊 Response Formats

### General Calculation Response

```markdown
🧮 **Phép tính:**

📝 **Biểu thức:** 2 + 3
💰 **Kết quả:** 5
```

### Financial Calculation Response

```markdown
💸 **Khả năng chi tiêu 4,000,000 VND:**

💰 **Số dư khả dụng:** 20,000,000 VND
💵 **Số tiền muốn chi:** 4,000,000 VND
📊 **Số dư sau khi chi:** 16,000,000 VND

✅ **Bạn có thể chi tiêu số tiền này!**
💡 **Còn lại:** 16,000,000 VND

💡 **Lời khuyên:** Khoản chi tiêu này nằm trong khả năng tài chính của bạn.
```

## 🧪 Testing

### Run Test Suite

```bash
cd vanlang-budget-BE/src/agent
node test-enhanced-calculation.js
```

### Test Categories

1. **General Calculation Tests** - 8 test cases
2. **Financial Calculation Tests** - 8 test cases  
3. **Intent Detection Tests** - 8 test cases
4. **Calculation Coordinator Tests** - 6 test cases
5. **Edge Case Tests** - 8 test cases

## 🔍 Troubleshooting

### Common Issues

1. **Intent Detection Conflicts**
   ```javascript
   // Solution: Check confidence scores and priority keywords
   const decision = this.makeCalculationDecision(generalResult, financialResult, message);
   ```

2. **Missing Financial Data**
   ```javascript
   // Solution: Provide helpful error message
   if (!financialData) {
       return this.getNoDataError();
   }
   ```

3. **Invalid Math Expressions**
   ```javascript
   // Solution: Safe expression evaluation
   if (!/^[\d+\-*/().\s]+$/.test(expression)) {
       throw new Error('Invalid expression');
   }
   ```

## 📈 Performance Considerations

### Optimization Tips

1. **Caching**: Financial data is cached in session
2. **Lazy Loading**: Engines are initialized only when needed
3. **Pattern Matching**: Optimized regex patterns for fast detection
4. **Error Handling**: Graceful fallbacks for edge cases

### Memory Usage

- **GeneralCalculationEngine**: ~50KB
- **FinancialCalculationEngine**: ~75KB  
- **CalculationCoordinator**: ~25KB
- **Total overhead**: ~150KB

## 🚀 Future Enhancements

### Planned Features

1. **Advanced Math**: Scientific calculations, complex expressions
2. **Investment Calculations**: ROI, compound interest, portfolio analysis
3. **Budget Projections**: Future spending predictions
4. **Currency Conversion**: Multi-currency support
5. **Voice Input**: Speech-to-calculation
6. **Export Features**: PDF reports, Excel exports

### API Extensions

```javascript
// Future API methods
await agent.calculateInvestmentROI(amount, rate, period);
await agent.projectBudget(timeframe, categories);
await agent.analyzeCashFlow(period);
await agent.optimizeSpending(goals);
```

## 📞 Support

Nếu gặp vấn đề với Enhanced Calculation Engine:

1. Kiểm tra logs trong console
2. Verify financial data availability
3. Test với simple expressions trước
4. Check intent detection confidence scores
5. Review error messages for specific guidance

---

**Phiên bản:** 2.0.0  
**Cập nhật:** 2024-12-19  
**Tác giả:** VanLang Agent Development Team
