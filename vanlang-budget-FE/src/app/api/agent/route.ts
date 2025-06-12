import { NextResponse } from 'next/server';

// Backend URL từ environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

export async function POST(request: Request) {
    console.log('--- FE API Route /api/agent HIT ---');
    try {
        const body = await request.json();
        const { message, language = 'vi' } = body;
        console.log('FE API Route: Received body:', body);

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ success: false, error: 'Invalid message.' }, { status: 400 });
        }

        // Get authorization header from the request
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, error: 'Authorization header missing.' }, { status: 401 });
        }

        console.log('FE API Route: Forwarding to backend agent endpoint...');

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
                error: errorData.error || `Backend error: ${backendResponse.status}`
            }, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        console.log('FE API Route: Backend response data:', responseData);

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('FE API Route: Error in agent route:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error in agent route'
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const endpoint = searchParams.get('endpoint') || 'capabilities';
        const language = searchParams.get('language') || 'vi';

        console.log(`--- FE API Route /api/agent GET ${endpoint} ---`);

        // Forward GET requests to backend
        const backendResponse = await fetch(`${BACKEND_API_URL}/api/agent/${endpoint}?language=${language}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('authorization') || '',
            },
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({}));
            return NextResponse.json({
                success: false,
                error: errorData.error || `Backend error: ${backendResponse.status}`
            }, { status: backendResponse.status });
        }

        const responseData = await backendResponse.json();
        return NextResponse.json(responseData);

    } catch (error) {
        console.error('FE API Route: Error in agent GET route:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error in agent GET route'
        }, { status: 500 });
    }
}
