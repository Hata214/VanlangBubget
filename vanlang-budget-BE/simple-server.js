const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));

// Body parser
app.use(express.json());

// Simple routes
app.get('/', (req, res) => {
    res.json({ message: 'VanLang Budget API Server - Simple Mode' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple chatbot endpoint
app.post('/api/chatbot/enhanced', (req, res) => {
    const { message } = req.body;

    // Simple responses
    const responses = {
        'chào': 'Xin chào! Tôi là VanLangBot. Tôi có thể giúp bạn quản lý tài chính.',
        'bạn là ai': 'Tôi là VanLangBot, trợ lý tài chính thông minh của ứng dụng VanLang Budget.',
        'mấy giờ': `Hiện tại là ${new Date().toLocaleString('vi-VN')}`,
        'cảm ơn': 'Không có gì! Tôi luôn sẵn sàng giúp đỡ bạn.'
    };

    const lowerMessage = message?.toLowerCase() || '';
    let response = '🤖 Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về tài chính cá nhân không?';

    for (const [key, value] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            response = value;
            break;
        }
    }

    res.json({
        success: true,
        response,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Simple server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 Chatbot: POST http://localhost:${PORT}/api/chatbot/enhanced`);
});
