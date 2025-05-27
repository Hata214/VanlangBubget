# VanLang Agent v2 - Trợ lý tài chính AI thông minh

## 🚀 Tổng quan

VanLang Agent v2 là một chatbot AI tiên tiến được xây dựng để hỗ trợ người dùng quản lý tài chính cá nhân thông qua ngôn ngữ tự nhiên. Agent sử dụng Google Gemini AI để hiểu và xử lý các yêu cầu của người dùng một cách thông minh.

## ✨ Tính năng chính

### 💰 Quản lý giao dịch
- **Thêm giao dịch bằng ngôn ngữ tự nhiên**: "Tôi vừa mua cà phê 50000"
- **Tự động phân loại**: Thu nhập hoặc chi tiêu
- **Trích xuất thông tin**: Số tiền, danh mục, ghi chú, ngày tháng
- **Đồng bộ với hệ thống**: Tự động lưu vào database và liên kết với models hiện tại

### 📊 Phân tích tài chính
- **Phân tích tổng quan**: Tình hình thu chi, số dư hiện tại
- **Báo cáo chi tiết**: Theo danh mục, thời gian
- **Xu hướng chi tiêu**: Phát hiện pattern và đưa ra cảnh báo
- **So sánh thời kỳ**: Tháng này vs tháng trước

### 🔍 Truy vấn thông tin
- **Số dư hiện tại**: "Số dư của tôi là bao nhiêu?"
- **Lịch sử giao dịch**: "Chi tiêu tháng này như thế nào?"
- **Thống kê nhanh**: Tổng thu nhập, chi tiêu, đầu tư

### 💡 Lời khuyên tài chính
- **Tư vấn cá nhân hóa**: Dựa trên dữ liệu thực tế của người dùng
- **Gợi ý tiết kiệm**: Phát hiện khoản chi không cần thiết
- **Kế hoạch đầu tư**: Đưa ra lời khuyên phù hợp với tình hình tài chính

## 🏗️ Kiến trúc hệ thống

### Backend Structure
```
/agent
├── vanlangAgent.js          # Logic chính AI Agent
├── README.md               # Tài liệu này

/models
├── transactionModel.js     # Schema MongoDB cho transactions

/services
├── agentService.js         # Service layer cho agent

/controllers
├── agentController.js      # Controller xử lý API requests

/routes
├── agent.js               # API routes cho agent
```

### Frontend Structure
```
/components/agent
├── AgentChatPopup.tsx     # UI component cho chat interface

/app/api/agent
├── route.ts               # API proxy routes
├── ask/route.ts          # Endpoint chính cho chat
```

## 🔧 Cấu hình

### Environment Variables
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string
```

### Dependencies
- **Backend**: Express.js, Mongoose, Axios
- **Frontend**: Next.js, React, TypeScript
- **AI**: Google Gemini Pro API

## 📡 API Endpoints

### POST /api/agent/ask
Endpoint chính để gửi tin nhắn cho agent.

**Request:**
```json
{
  "message": "Tôi vừa mua cà phê 50000",
  "language": "vi"
}
```

**Response:**
```json
{
  "success": true,
  "response": "✅ Đã lưu giao dịch thành công!\n📊 Loại: Chi tiêu\n💰 Số tiền: 50.000 ₫\n📝 Danh mục: Ăn uống\n📅 Ngày: 15/01/2024",
  "metadata": {
    "cached": false,
    "sessionId": "user123_1705123456_abc",
    "messageCount": 5,
    "responseTime": 1250,
    "language": "vi",
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

### GET /api/agent/capabilities
Lấy thông tin về khả năng của agent.

### GET /api/agent/session
Lấy thông tin session hiện tại của người dùng.

### POST /api/agent/session/reset
Reset session của người dùng.

### GET /api/agent/health
Health check cho agent service.

## 🎯 Cách sử dụng

### 1. Thêm giao dịch
```
User: "Tôi vừa mua cà phê 50000"
Agent: "✅ Đã lưu giao dịch chi tiêu 50.000 ₫ cho danh mục Ăn uống"

User: "Nhận lương 15 triệu hôm nay"
Agent: "✅ Đã lưu giao dịch thu nhập 15.000.000 ₫ cho danh mục Lương"
```

### 2. Phân tích tài chính
```
User: "Phân tích chi tiêu tháng này"
Agent: "📊 Phân tích tài chính tháng 1/2024:
- Tổng thu nhập: 20.000.000 ₫
- Tổng chi tiêu: 12.500.000 ₫
- Số dư: +7.500.000 ₫
- Chi tiêu nhiều nhất: Ăn uống (3.200.000 ₫)
💡 Gợi ý: Bạn đang tiết kiệm tốt với tỷ lệ 37.5%"
```

### 3. Truy vấn thông tin
```
User: "Số dư hiện tại của tôi là bao nhiêu?"
Agent: "💰 Số dư hiện tại của bạn là 7.500.000 ₫
📈 Tăng 15% so với tháng trước"

User: "Tôi đã chi bao nhiêu cho ăn uống?"
Agent: "🍽️ Chi tiêu ăn uống tháng này: 3.200.000 ₫
📊 Chiếm 25.6% tổng chi tiêu"
```

### 4. Lời khuyên tài chính
```
User: "Tôi có nên đầu tư vào cổ phiếu không?"
Agent: "💡 Dựa trên tình hình tài chính của bạn:
- Số dư khả dụng: 7.500.000 ₫
- Thu nhập ổn định: ✅
- Quỹ khẩn cấp: Đủ 6 tháng chi tiêu

🎯 Gợi ý: Bạn có thể đầu tư 20-30% số dư vào cổ phiếu blue-chip hoặc ETF để bắt đầu."
```

## 🔄 Workflow xử lý

1. **Nhận tin nhắn** từ người dùng
2. **Phân tích ý định** bằng Gemini AI
3. **Xử lý theo ý định**:
   - `insert`: Trích xuất dữ liệu và lưu giao dịch
   - `analyze`: Phân tích dữ liệu tài chính
   - `query`: Truy vấn thông tin
   - `advice`: Đưa ra lời khuyên
   - `greeting`: Chào hỏi
4. **Trả về kết quả** cho người dùng
5. **Cache response** để tối ưu hiệu suất

## 🚀 Triển khai

### Development
```bash
# Backend
cd vanlang-budget-BE
npm run dev

# Frontend
cd vanlang-budget-FE
npm run dev
```

### Production
```bash
# Build và start backend
cd vanlang-budget-BE
npm run build
npm start

# Build và start frontend
cd vanlang-budget-FE
npm run build
npm start
```

## 🔒 Bảo mật

- **Authentication**: Yêu cầu JWT token hợp lệ
- **Rate Limiting**: Giới hạn số request per IP
- **Input Validation**: Kiểm tra và làm sạch input
- **Error Handling**: Không expose sensitive information

## 📈 Monitoring

- **Logging**: Chi tiết các hoạt động và lỗi
- **Analytics**: Theo dõi usage patterns
- **Performance**: Monitoring response time và cache hit rate
- **Health Checks**: Endpoint để kiểm tra tình trạng service

## 🔮 Roadmap

- [ ] **Nhắc nhở thông minh**: Tự động nhắc thanh toán, mục tiêu tiết kiệm
- [ ] **Báo cáo định kỳ**: Gửi báo cáo tài chính hàng tuần/tháng
- [ ] **Tích hợp voice**: Hỗ trợ nhập liệu bằng giọng nói
- [ ] **Multi-language**: Hỗ trợ tiếng Anh và các ngôn ngữ khác
- [ ] **Advanced Analytics**: Machine learning cho dự đoán xu hướng
- [ ] **Integration**: Kết nối với ngân hàng, ví điện tử

## 🤝 Đóng góp

Để đóng góp vào dự án:
1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Hỗ trợ

Nếu gặp vấn đề hoặc có câu hỏi, vui lòng:
- Tạo issue trên GitHub
- Liên hệ team phát triển
- Kiểm tra logs để debug

---

**VanLang Agent v2** - Trợ lý tài chính AI thông minh cho mọi người! 🚀
