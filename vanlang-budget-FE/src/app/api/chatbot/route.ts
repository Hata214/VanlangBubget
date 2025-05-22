import { NextResponse } from 'next/server';

// Định nghĩa URL của backend API.
// Trong thực tế, bạn nên sử dụng biến môi trường, ví dụ: process.env.NEXT_PUBLIC_BACKEND_URL
const BACKEND_API_URL = 'http://localhost:4000'; // Backend của bạn chạy trên port 4000

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message } = body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ success: false, error: 'Message is required.' }, { status: 400 });
        }

        // Lấy token xác thực từ header của yêu cầu gốc (từ ChatPopupVanLangBot.tsx)
        const authorizationHeader = request.headers.get('Authorization');

        if (!authorizationHeader) {
            return NextResponse.json({ success: false, error: 'Authorization header is missing.' }, { status: 401 });
        }

        // Gọi đến API backend ExpressJS
        // Endpoint là /api/chatbot/chatbot vì trong app.js (BE) có app.use('/api/chatbot', chatbotRoutes)
        // và trong chatbot.js (BE) có router.post('/chatbot', ...)
        const backendResponse = await fetch(`${BACKEND_API_URL}/api/chatbot/chatbot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationHeader, // Chuyển tiếp token xác thực
            },
            body: JSON.stringify({ message }),
        });

        // Lấy dữ liệu JSON từ phản hồi của backend
        const backendData = await backendResponse.json();

        // Trả về phản hồi từ backend cho client (ChatPopupVanLangBot.tsx)
        // Giữ nguyên cấu trúc { success: boolean, response?: string, error?: string }
        // và status code từ backend
        return NextResponse.json(backendData, { status: backendResponse.status });

    } catch (error: any) {
        console.error('Chatbot API (Next.js) error:', error);
        // Xử lý các lỗi mạng hoặc lỗi không mong muốn khi gọi backend
        let errorMessage = 'Error processing chatbot request in Next.js API route.';
        if (error.code === 'ECONNREFUSED') {
            errorMessage = `Could not connect to backend service at ${BACKEND_API_URL}. Please ensure the backend is running.`;
        } else if (error instanceof SyntaxError) {
            // Lỗi này có thể xảy ra nếu backendResponse.json() thất bại (ví dụ: backend trả về HTML lỗi thay vì JSON)
            errorMessage = 'Received an invalid response from the backend service.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
