# VanLangBot - Chatbot Tài Chính Chi Tiết

## Tổng quan
VanLangBot là chatbot AI tích hợp trong hệ thống VanLang Budget, sử dụng Gemini AI để tư vấn tài chính cá nhân. Chatbot chỉ hiển thị cho người dùng đã đăng nhập và có giao diện popup hiện đại.

## 1. Kiến trúc hệ thống

### Frontend Components
```
src/components/chatbot/
├── ChatbotSimple.tsx          # Component chính
└── (có thể mở rộng thêm)
```

### Backend API
```
Backend: http://localhost:4000/api/chatbot
Method: POST
Authentication: Bearer Token
```

### Dependencies
```json
{
  "next-auth": "^4.x.x",
  "@reduxjs/toolkit": "^1.x.x", 
  "react-redux": "^8.x.x"
}
```

## 2. Cơ chế Authentication (4 tầng)

### Thứ tự ưu tiên:
1. **Redux Auth** (Cao nhất - User thường)
2. **AuthContext** (NextAuth)  
3. **LocalStorage Admin** (Admin login)
4. **NextAuth Session** (Thấp nhất)

### Code Implementation:
```typescript
// Redux Auth (Ưu tiên 1)
const reduxAuth = useAppSelector((state) => state.auth)

// AuthContext (Ưu tiên 2)
const { isAuthenticated, user, token } = useAuth()

// NextAuth Session (Ưu tiên 3)
const { data: session, status } = useSession()

// LocalStorage Admin (Ưu tiên 4)
const adminAuth = {
  email: localStorage.getItem('user_email'),
  token: localStorage.getItem('token'),
  role: localStorage.getItem('user_role')
}

// Logic tổng hợp
const finalAuth = reduxAuth.isAuthenticated || isAuthenticated || 
                  localStorageAuth.isAuthenticated || status === 'authenticated'
```

## 3. Giao diện và UX

### Vị trí hiển thị:
- **Chat Button**: `position: fixed, bottom: 24px, right: 24px`
- **Chat Popup**: `position: fixed, bottom: 100px, right: 24px`
- **Debug Info**: `position: fixed, top: 20px, right: 20px`

### Thiết kế:
```css
/* Chat Button */
width: 60px, height: 60px
border-radius: 50%
background: #3b82f6
z-index: 999999

/* Chat Popup */  
width: 380px, height: 500px
border-radius: 16px
box-shadow: 0 20px 60px rgba(0,0,0,0.2)
```

### Icons và Animation:
- **Đóng**: 💬 icon
- **Mở**: ✕ icon  
- **Loading**: 💭 với pulse animation
- **Bot Avatar**: "VL" trong circle xanh

## 4. Tính năng hiện tại

### A. Tin nhắn chào mừng tự động:
```
Xin chào [Tên]! Tôi là VanLangBot, trợ lý tài chính của bạn. 🤖

Tôi có thể giúp bạn:
• Phân tích tình hình tài chính hiện tại
• Đưa ra gợi ý về ngân sách và tiết kiệm  
• Tư vấn về các khoản đầu tư
• Trả lời câu hỏi về thu chi

Hãy hỏi tôi bất cứ điều gì về tài chính nhé!
```

### B. Chat Interface:
- **User messages**: Bên phải, background xanh
- **Bot messages**: Bên trái, background trắng với avatar
- **Timestamps**: Hiển thị thời gian mỗi tin nhắn
- **Auto-scroll**: Tự động cuộn xuống tin nhắn mới

### C. Error Handling:
- Network errors: "Không thể kết nối đến server"
- API errors: Hiển thị message từ backend
- Input validation: Không gửi tin nhắn rỗng

## 5. Backend Integration

### API Endpoint:
```javascript
POST http://localhost:4000/api/chatbot
Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ${token}'
}
Body: {
  message: "Câu hỏi của user"
}
```

### Response Format:
```json
{
  "success": true,
  "response": "Câu trả lời từ Gemini AI"
}
```

### Gemini AI Configuration:
- **API Key**: `AIzaSyCgyvcGoItpgZMF9HDlScSwmY1PqO4aGlg`
- **Model**: Gemini Pro
- **Rules**: Chỉ trả lời câu hỏi tài chính
- **Config File**: `@.cursor/rules/chatbot.cursorrules`

## 6. Hướng dẫn phát triển từ đầu

### Bước 1: Tạo Component cơ bản
```bash
# Tạo file component
touch src/components/chatbot/ChatbotSimple.tsx
```

```typescript
'use client'
import React, { useState, useEffect, useRef } from 'react'

interface Message {
    id: string
    text: string
    isUser: boolean
    timestamp: Date
}

export function ChatbotSimple() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    
    return (
        <>
            {/* Chat Button */}
            <button onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '✕' : '💬'}
            </button>
            
            {/* Chat Popup */}
            {isOpen && (
                <div className="chat-popup">
                    {/* Header */}
                    <div className="chat-header">
                        <h3>VanLangBot</h3>
                    </div>
                    
                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.map(message => (
                            <div key={message.id}>
                                {message.text}
                            </div>
                        ))}
                    </div>
                    
                    {/* Input */}
                    <div className="chat-input">
                        <input 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Nhập câu hỏi..."
                        />
                        <button onClick={sendMessage}>➤</button>
                    </div>
                </div>
            )}
        </>
    )
}
```

### Bước 2: Thêm Authentication
```typescript
import { useAuth } from '@/contexts/AuthContext'
import { useSession } from 'next-auth/react'
import { useAppSelector } from '@/redux/hooks'

export function ChatbotSimple() {
    // Authentication hooks
    const { isAuthenticated, user, token } = useAuth()
    const { data: session, status } = useSession()
    const reduxAuth = useAppSelector((state) => state.auth)
    
    // LocalStorage check
    const [localStorageAuth, setLocalStorageAuth] = useState({
        isAuthenticated: false,
        user: null,
        token: null
    })
    
    useEffect(() => {
        // Check localStorage for admin auth
        const userEmail = localStorage.getItem('user_email')
        const authToken = localStorage.getItem('token')
        
        // Check Redux auth_state for regular users
        const authState = localStorage.getItem('auth_state')
        let reduxAuthState = null
        try {
            if (authState) reduxAuthState = JSON.parse(authState)
        } catch (error) {
            console.error('Error parsing auth_state:', error)
        }
        
        if (reduxAuthState?.isAuthenticated) {
            setLocalStorageAuth({
                isAuthenticated: true,
                user: reduxAuthState.user,
                token: reduxAuthState.token.accessToken
            })
        } else if (userEmail && authToken) {
            setLocalStorageAuth({
                isAuthenticated: true,
                user: { email: userEmail },
                token: authToken
            })
        }
    }, [])
    
    // Final auth decision
    const finalAuth = reduxAuth.isAuthenticated || isAuthenticated || 
                      localStorageAuth.isAuthenticated || status === 'authenticated'
    
    if (!finalAuth) {
        return <div>Please login to use chatbot</div>
    }
    
    // ... rest of component
}
```

### Bước 3: Thêm API Integration
```typescript
const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return
    
    const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    
    try {
        const response = await fetch('http://localhost:4000/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${finalToken}`
            },
            body: JSON.stringify({
                message: userMessage.text
            })
        })
        
        const data = await response.json()
        
        if (data.success) {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response,
                isUser: false,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, botMessage])
        } else {
            // Handle error
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.',
                isUser: false,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        }
    } catch (error) {
        console.error('Chatbot error:', error)
        // Handle network error
    } finally {
        setIsLoading(false)
    }
}
```

### Bước 4: Styling với CSS-in-JS
```typescript
const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    zIndex: 999999,
    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    transition: 'all 0.3s ease'
}

const popupStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '100px',
    right: '24px',
    width: '380px',
    height: '500px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    border: '1px solid #e5e7eb',
    zIndex: 999998,
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    overflow: 'hidden'
}
```

### Bước 5: Tích hợp vào Layout
```typescript
// src/app/layout.tsx hoặc component cha
import { ChatbotSimple } from '@/components/chatbot/ChatbotSimple'

export default function Layout({ children }) {
    return (
        <div>
            {children}
            <ChatbotSimple />
        </div>
    )
}
```

## 7. Backend Setup (Node.js/Express)

### Cài đặt dependencies:
```bash
npm install @google/generative-ai
```

### API Route:
```javascript
// routes/chatbot.js
const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI('AIzaSyCgyvcGoItpgZMF9HDlScSwmY1PqO4aGlg')

app.post('/api/chatbot', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            })
        }
        
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

        
        const prompt = `
        Bạn là VanLangBot, trợ lý tài chính thông minh. 
        Chỉ trả lời câu hỏi về tài chính cá nhân, ngân sách, đầu tư, tiết kiệm.
        Từ chối trả lời các chủ đề khác.
        
        Câu hỏi: ${message}
        `
        
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        res.json({
            success: true,
            response: text
        })
        
    } catch (error) {
        console.error('Chatbot error:', error)
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        })
    }
})
```

## 8. Troubleshooting

### Vấn đề thường gặp:

**1. Authentication không hoạt động:**
- Kiểm tra Redux store có dữ liệu không
- Verify localStorage có auth_state không  
- Check token có hợp lệ không

**2. API call thất bại:**
- Verify backend đang chạy port 4000
- Check CORS configuration
- Verify Gemini API key

**3. UI không hiển thị:**
- Check z-index conflicts
- Verify CSS positioning
- Check component mounting

### Debug Commands:
```bash
# Check Redux state
console.log(store.getState().auth)

# Check localStorage
console.log(localStorage.getItem('auth_state'))

# Check API endpoint
curl -X POST http://localhost:4000/api/chatbot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message":"test"}'
```

## 9. Roadmap phát triển

### Phase 1 (Hiện tại):
- ✅ Basic chat interface
- ✅ Authentication integration  
- ✅ Gemini AI integration
- ✅ Error handling

### Phase 2 (Tương lai):
- [ ] Personal finance data integration
- [ ] Conversation memory
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Voice input/output

### Phase 3 (Nâng cao):
- [ ] Machine learning recommendations
- [ ] Integration with banking APIs
- [ ] Advanced financial planning
- [ ] Mobile app support

---

## Kết luận

VanLangBot là một chatbot tài chính cơ bản nhưng có tiềm năng phát triển mạnh. Với kiến trúc modular và authentication đa tầng, hệ thống có thể dễ dàng mở rộng và tích hợp thêm nhiều tính năng trong tương lai.

**Liên hệ phát triển:**
- Frontend: React/NextJS + Redux
- Backend: Node.js/Express + MongoDB  
- AI: Google Gemini Pro
- Authentication: Multi-layer (Redux/NextAuth/LocalStorage)

# Kế hoạch Phát triển Tính năng VanLangBot

## Mục tiêu:

Nâng cao trải nghiệm người dùng và mở rộng khả năng của VanLangBot trong hệ thống VanLang Budget bằng cách tích hợp dữ liệu tài chính cá nhân, lưu trữ lịch sử hội thoại, cải thiện giao diện người dùng, hỗ trợ đa ngôn ngữ và tối ưu hóa cơ chế xác thực.

## Các tính năng cần phát triển:

### 1. Tích hợp Dữ liệu Tài chính Cá nhân

*   **Mô tả:** Cho phép chatbot truy cập (một cách an toàn và có kiểm soát) vào dữ liệu tài chính của người dùng (thu nhập, chi tiêu, các khoản đầu tư) để đưa ra các phân tích và tư vấn cá nhân hóa.
*   **Các bước thực hiện:**
    1.  **Backend (API /api/chatbot):**
        *   Sau khi xác thực người dùng, bổ sung logic để truy vấn cơ sở dữ liệu (CSDL) và lấy các thông tin tài chính cần thiết của người dùng. Các thông tin này có thể bao gồm:
            *   Tổng thu nhập (tháng hiện tại, tháng trước, trung bình).
            *   Tổng chi tiêu (tháng hiện tại, tháng trước, theo danh mục).
            *   Chi tiết các giao dịch gần đây.
            *   Thông tin về các khoản đầu tư (loại, số lượng, giá trị hiện tại).
            *   Thông tin về ngân sách đã đặt ra.
        *   Thiết kế cẩn thận cấu trúc dữ liệu được truyền vào prompt của Gemini để đảm bảo tính ngắn gọn, dễ hiểu và bảo mật. Tránh truyền toàn bộ dữ liệu thô.
        *   Cập nhật `System Prompt` cho Gemini để hướng dẫn cách sử dụng dữ liệu này một cách hiệu quả và có trách nhiệm. Nhấn mạnh việc không được tự ý suy diễn hoặc đưa ra lời khuyên tài chính chuyên sâu vượt quá khả năng.
    2.  **Frontend (`ChatPopup.tsx`):**
        *   Không cần thay đổi lớn ở frontend cho bước này, vì dữ liệu sẽ được xử lý và tích hợp vào câu trả lời ở backend.
    3.  **Prompt Engineering (Backend):**
        *   Xây dựng các mẫu prompt động, trong đó dữ liệu tài chính của người dùng được chèn vào một cách có cấu trúc. Ví dụ:
            ```
            Dữ liệu tài chính của bạn:
            - Tổng thu nhập tháng này: [số tiền]
            - Tổng chi tiêu tháng này: [số tiền]
            - Các khoản chi tiêu lớn nhất: [danh mục 1]: [số tiền], [danh mục 2]: [số tiền]
            Câu hỏi của bạn: [câu hỏi người dùng]

            Dựa vào thông tin trên, hãy trả lời câu hỏi và đưa ra phân tích/gợi ý.
            ```
*   **Tài liệu tham khảo:**
    *   `detail_chatbot.md` (để hiểu cách chatbot hiện tại lấy dữ liệu nếu có).
    *   Mục 5.2 và 5.4 trong `.cursor/rules/chatbot.cursorrules` (về truy xuất dữ liệu và chuẩn bị prompt).

### 2. Lưu trữ Lịch sử Hội thoại (Conversation Memory)

*   **Mô tả:** Giúp chatbot "nhớ" được các trao đổi trước đó trong cùng một phiên chat, cho phép các câu trả lời sau mạch lạc và liên quan hơn.
*   **Các bước thực hiện:**
    1.  **Frontend (`ChatPopup.tsx`):**
        *   Mỗi khi gửi câu hỏi mới đến backend, gửi kèm theo một phần lịch sử hội thoại gần đây (ví dụ: 3-5 cặp câu hỏi/trả lời gần nhất).
        *   Cần quyết định định dạng gửi lịch sử hội thoại (ví dụ: mảng các đối tượng `{"role": "user", "content": "..."}` và `{"role": "assistant", "content": "..."}`).
    2.  **Backend (API /api/chatbot):**
        *   Tiếp nhận lịch sử hội thoại từ frontend.
        *   Điều chỉnh cách xây dựng `contents` cho API Gemini để bao gồm cả lịch sử hội thoại này, theo đúng định dạng mà Gemini yêu cầu (thường là một chuỗi các tin nhắn xen kẽ giữa `user` và `model`).
        *   Ví dụ cấu trúc `contents` cho Gemini:
            ```json
            {
              "contents": [
                {"role": "user", "parts": [{"text": "Câu hỏi cũ 1"}]},
                {"role": "model", "parts": [{"text": "Trả lời cũ 1"}]},
                {"role": "user", "parts": [{"text": "Câu hỏi cũ 2"}]},
                {"role": "model", "parts": [{"text": "Trả lời cũ 2"}]},
                {"role": "user", "parts": [{"text": "Câu hỏi mới của người dùng (kèm dữ liệu nếu có)"}]}
              ],
              "system_instruction": { ... }
            }
            ```
        *   Cần nhắc giới hạn số lượng tin nhắn trong lịch sử để tránh prompt quá dài và tăng chi phí API.
    3.  **System Prompt (Backend):**
        *   Có thể không cần thay đổi nhiều ở system prompt, nhưng cần đảm bảo Gemini hiểu rằng nó đang tiếp tục một cuộc hội thoại.

*   **Lưu ý:**
    *   Việc này sẽ làm tăng kích thước payload gửi đến Gemini, cần theo dõi chi phí.
    *   Quyết định xem lịch sử hội thoại có nên được lưu trữ phía server (ví dụ: trong Redis hoặc CSDL) cho các phiên dài hơn hay chỉ lưu tạm thời ở client và gửi lên mỗi request. Ban đầu, có thể bắt đầu với việc lưu trữ ở client.

### 3. Cải thiện Giao diện Người dùng (Tùy chỉnh Chatbot)

*   **Mô tả:** Cho phép người dùng tùy chỉnh một số khía cạnh của giao diện chatbot như vị trí, kích thước (trong một giới hạn cho phép) và có thể là màu sắc chủ đạo của popup chat.
*   **Các bước thực hiện:**
    1.  **Frontend (`ChatPopup.tsx` và component quản lý cài đặt nếu có):**
        *   **Vị trí:**
            *   Thêm một tùy chọn trong cài đặt của người dùng (hoặc một menu nhỏ trên header của chatbot) để chọn vị trí (ví dụ: góc dưới phải, góc dưới trái).
            *   Sử dụng state trong React để quản lý vị trí và áp dụng CSS tương ứng.
        *   **Kích thước:**
            *   Cung cấp một vài tùy chọn kích thước cố định (Nhỏ, Vừa, Lớn) thay vì cho phép kéo thả tự do để tránh làm vỡ layout.
            *   Hoặc, nếu cho phép kéo thả, cần giới hạn kích thước tối thiểu và tối đa.
            *   Lưu lựa chọn kích thước vào `localStorage` hoặc CSDL (nếu muốn đồng bộ giữa các thiết bị).
        *   **Màu sắc:**
            *   Cung cấp một bảng màu nhỏ hoặc một vài theme màu định sẵn.
            *   Thay đổi các biến CSS (CSS Variables) hoặc áp dụng class CSS động để thay đổi màu nền header, màu nút gửi, màu bong bóng chat.
            *   Lưu lựa chọn màu sắc.
    2.  **Lưu trữ cài đặt:**
        *   Sử dụng `localStorage` để lưu các tùy chọn này phía client cho nhanh và đơn giản.
        *   Nếu cần đồng bộ hóa cài đặt này giữa các thiết bị, cần lưu vào CSDL phía backend thông qua một API riêng.

### 4. Hỗ trợ Đa ngôn ngữ (Tiếng Việt và Tiếng Anh)

*   **Mô tả:** Chatbot có thể hiểu và phản hồi bằng cả tiếng Việt và tiếng Anh, dựa trên cài đặt ngôn ngữ hiện tại của người dùng trong hệ thống VanLang Budget.
*   **Các bước thực hiện:**
    1.  **Frontend (`ChatPopup.tsx`):**
        *   Xác định ngôn ngữ hiện tại của người dùng từ context hoặc state quản lý ngôn ngữ của ứng dụng (ví dụ: `i18n` library).
        *   Gửi thông tin ngôn ngữ này (`'vi'` hoặc `'en'`) đến backend cùng với mỗi yêu cầu.
    2.  **Backend (API /api/chatbot):**
        *   Nhận tham số ngôn ngữ từ frontend.
        *   **System Prompt Đa Ngôn Ngữ:** Chuẩn bị hai phiên bản của `System Prompt`: một cho tiếng Việt và một cho tiếng Anh. Hoặc, thiết kế một system prompt có khả năng xử lý cả hai, và chỉ định ngôn ngữ phản hồi mong muốn.
            *   Ví dụ, thêm vào System Prompt: `"Hãy trả lời bằng ngôn ngữ [ngôn ngữ người dùng chỉ định: tiếng Việt hoặc tiếng Anh]."`
        *   **Prompt người dùng:** Câu hỏi của người dùng sẽ tự nhiên bằng ngôn ngữ họ đang sử dụng.
        *   **Xử lý câu trả lời từ Gemini:** Gemini thường sẽ cố gắng trả lời bằng ngôn ngữ của câu hỏi cuối cùng trong prompt, nhưng việc chỉ định rõ ràng trong system prompt sẽ đáng tin cậy hơn.
        *   **Thông báo lỗi/Từ chối:** Chuẩn bị các thông báo lỗi và từ chối (mục 6.2, 6.3 trong `.cursor/rules/chatbot.cursorrules`) bằng cả hai ngôn ngữ. Chọn thông báo phù hợp dựa trên ngôn ngữ người dùng.
    3.  **Gemini API:**
        *   Kiểm tra xem API Gemini có hỗ trợ tham số nào để ưu tiên ngôn ngữ đầu ra không. Nếu không, việc điều khiển qua System Prompt là chủ yếu.

### 5. Tối ưu hóa Cơ chế Xác thực

*   **Mô tả:** Đánh giá lại logic xác thực hiện tại cho API chatbot (`/api/chatbot`) để đảm bảo nó đơn giản, hiệu quả và vẫn an toàn.
*   **Các bước thực hiện:**
    1.  **Review Code Backend (API /api/chatbot):**
        *   Xem lại cách middleware xác thực (JWT hoặc session) đang được triển khai cho route này.
        *   Đảm bảo nó nhất quán với cách xác thực các API khác trong hệ thống VanLang Budget.
        *   Kiểm tra việc xử lý lỗi khi token không hợp lệ, thiếu hoặc hết hạn (trả về 401 Unauthorized).
    2.  **Đơn giản hóa (Nếu cần):**
        *   Nếu logic hiện tại quá phức tạp hoặc có những bước thừa, xem xét việc tái cấu trúc để nó gọn gàng hơn. Ví dụ, nếu có nhiều lớp kiểm tra token không cần thiết.
        *   Quan trọng là không hy sinh tính bảo mật. Đơn giản hóa không có nghĩa là làm lỏng lẻo việc kiểm tra.
    3.  **Tài liệu tham khảo:**
        *   Mục 5.2 trong `.cursor/rules/chatbot.cursorrules` (về xác thực người dùng).
        *   Cách các route khác trong `vanlang-budget-BE` xử lý xác thực.

## Tài liệu tham khảo chung:

*   `detail_chatbot.md`: Để hiểu cấu trúc và luồng hoạt động hiện tại của chatbot.
*   `.cursor/rules/chatbot.cursorrules`: Chứa các quy tắc và hướng dẫn quan trọng cần tuân thủ.

## Thứ tự ưu tiên (Gợi ý):

1.  **Tích hợp Dữ liệu Tài chính Cá nhân** (Tính năng cốt lõi mang lại giá trị cao nhất).
2.  **Lưu trữ Lịch sử Hội thoại** (Cải thiện đáng kể trải nghiệm tương tác).
3.  **Hỗ trợ Đa ngôn ngữ** (Mở rộng đối tượng người dùng).
4.  **Tối ưu hóa Cơ chế Xác thực** (Đảm bảo nền tảng vững chắc).
5.  **Cải thiện Giao diện Người dùng** (Nâng cao tính thẩm mỹ và tiện dụng).

## Các Bước Tiếp Theo:

*   Thảo luận và xác nhận kế hoạch này.
*   Bắt đầu triển khai từng tính năng theo thứ tự ưu tiên.
*   Kiểm thử kỹ lưỡng sau mỗi tính năng được hoàn thành.
