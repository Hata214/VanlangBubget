import { NextResponse } from 'next/server';

// Backend URL từ environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
    console.log('--- FE API Route /api/agent/ask HIT ---');
    try {
        const body = await request.json();
        const { message, language = 'vi' } = body;
        console.log('FE API Route: Received body:', body);

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: language === 'vi' ? 'Tin nhắn không hợp lệ.' : 'Invalid message.' 
            }, { status: 400 });
        }

        // Get authorization header from the request
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ 
                success: false, 
                error: language === 'vi' ? 'Thiếu thông tin xác thực.' : 'Authorization header missing.' 
            }, { status: 401 });
        }

        console.log('FE API Route: Forwarding to backend agent/ask endpoint...');

        // Forward request to backend agent endpoint
        const backendResponse = await fetch(`${BACKEND_API_URL}/api/agent/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify({
                message,
                language
            }),
        });

        console.log('FE API Route: Backend response status:', backendResponse.status);

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({}));
            console.error('FE API Route: Backend error:', errorData);
            
            return NextResponse.json({
                success: false,
                error: errorData.error || (language === 'vi' ? 
                    `Lỗi từ server: ${backendResponse.status}` : 
                    `Backend error: ${backendResponse.status}`)
            }, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        console.log('FE API Route: Backend response success');

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('FE API Route: Error in agent/ask route:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error in agent route'
        }, { status: 500 });
    }
}
