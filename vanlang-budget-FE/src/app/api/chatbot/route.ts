import { NextResponse } from 'next/server';

// Backend URL từ environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

export async function POST(request: Request) {
    console.log('--- FE API Route /api/chatbot HIT ---');
    try {
        const body = await request.json();
        const { message, language = 'vi', useEnhanced = true } = body;
        console.log('FE API Route: Received body:', body);

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ success: false, error: 'Invalid message.' }, { status: 400 });
        }

        const authorizationHeader = request.headers.get('Authorization');
        // QUAN TRỌNG: Next.js API routes chạy ở server-side, nó có thể không tự động có auth header
        // của người dùng trừ khi bạn lấy nó từ session (ví dụ NextAuth.js) hoặc client gửi lên.
        // Nếu client (EnhancedChatPopup) KHÔNG gửi Auth header đến API route này,
        // thì `authorizationHeader` ở đây sẽ là null.

        console.log(`FE API Route: Auth header received by Next.js API route: ${authorizationHeader ? 'Present' : 'Missing or Null'}`);

        const endpoint = useEnhanced ? '/api/chatbot/enhanced' : '/api/chatbot/chatbot';
        const backendUrl = `${BACKEND_API_URL}${endpoint}`;

        console.log(`FE API Route: Forwarding to Backend URL: ${backendUrl}, Message: "${message}", Lang: ${language}, Enhanced: ${useEnhanced}, Auth Header to send: ${authorizationHeader ? 'Present' : 'Missing or Null'}`);

        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authorizationHeader && { 'Authorization': authorizationHeader }),
                'User-Agent': 'VanLangBot-Frontend/1.0',
            },
            body: JSON.stringify({
                message: message.trim(),
                language
            }),
            signal: AbortSignal.timeout(30000)
        });

        console.log(`FE API Route: Backend response status: ${backendResponse.status}`);
        const responseData = await backendResponse.json();

        if (!backendResponse.ok) {
            console.error(`FE API Route: Backend error - Status: ${backendResponse.status}, Body:`, responseData);
            // Trả về lỗi từ backend để client có thể thấy
            return NextResponse.json(responseData, { status: backendResponse.status });
        }

        console.log('FE API Route: Successfully forwarded and got response from backend.', responseData);
        return NextResponse.json(responseData, {
            status: backendResponse.status,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error: any) {
        console.error('FE API Route /api/chatbot - Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error in Next.js API route.',
            detail: error.message
        }, { status: 500 });
    }
}

// Health check endpoint
export async function GET() {
    try {
        const healthResponse = await fetch(`${BACKEND_API_URL}/api/chatbot/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });

        const healthData = await healthResponse.json();

        return NextResponse.json({
            status: 'healthy',
            frontend: {
                timestamp: new Date().toISOString(),
                version: '2.0'
            },
            backend: healthData
        });
    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            frontend: {
                timestamp: new Date().toISOString(),
                version: '2.0'
            },
            backend: {
                status: 'unreachable',
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }, { status: 503 });
    }
}
