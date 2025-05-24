import { NextResponse } from 'next/server';

// Backend URL từ environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, language = 'vi', useEnhanced = true } = body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: language === 'vi' ?
                    'Tin nhắn không hợp lệ.' :
                    'Invalid message.'
            }, { status: 400 });
        }

        // Lấy token xác thực từ header
        const authorizationHeader = request.headers.get('Authorization');
        if (!authorizationHeader) {
            return NextResponse.json({
                success: false,
                error: language === 'vi' ?
                    'Thiếu thông tin xác thực.' :
                    'Authorization header is missing.'
            }, { status: 401 });
        }

        // Chọn endpoint phù hợp
        const endpoint = useEnhanced ? '/api/chatbot/enhanced' : '/api/chatbot/chatbot';
        const backendUrl = `${BACKEND_API_URL}${endpoint}`;

        console.log(`Chatbot API: Forwarding request to ${backendUrl}`);

        // Gọi đến enhanced chatbot API
        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorizationHeader,
                'User-Agent': 'VanLangBot-Frontend/1.0',
            },
            body: JSON.stringify({
                message: message.trim(),
                language
            }),
            // Timeout 30 seconds
            signal: AbortSignal.timeout(30000)
        });

        // Kiểm tra response status
        if (!backendResponse.ok) {
            console.error(`Backend responded with status ${backendResponse.status}`);

            let errorMessage = language === 'vi' ?
                'Dịch vụ chatbot tạm thời không khả dụng.' :
                'Chatbot service is temporarily unavailable.';

            if (backendResponse.status === 429) {
                errorMessage = language === 'vi' ?
                    'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ một chút.' :
                    'Too many requests. Please wait a moment.';
            } else if (backendResponse.status === 503) {
                errorMessage = language === 'vi' ?
                    'Hệ thống đang bảo trì. Vui lòng thử lại sau.' :
                    'System is under maintenance. Please try again later.';
            }

            return NextResponse.json({
                success: false,
                error: errorMessage
            }, { status: backendResponse.status });
        }

        // Parse JSON response
        const backendData = await backendResponse.json();

        // Log cho debugging (chỉ trong development)
        if (process.env.NODE_ENV === 'development') {
            console.log('Chatbot API Response:', {
                success: backendData.success,
                hasResponse: !!backendData.response,
                hasMetadata: !!backendData.metadata,
                responseLength: backendData.response?.length || 0
            });
        }

        // Enhance response với additional metadata từ frontend
        const enhancedResponse = {
            ...backendData,
            metadata: {
                ...backendData.metadata,
                processedAt: new Date().toISOString(),
                version: '2.0',
                enhanced: useEnhanced,
                language
            }
        };

        return NextResponse.json(enhancedResponse, {
            status: backendResponse.status,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error: any) {
        console.error('Chatbot API (Next.js) error:', error);

        let errorMessage = 'Có lỗi xảy ra khi xử lý yêu cầu.';
        let statusCode = 500;

        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            errorMessage = 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.';
            statusCode = 408;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = `Không thể kết nối đến dịch vụ backend tại ${BACKEND_API_URL}. Vui lòng đảm bảo backend đang chạy.`;
            statusCode = 503;
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'Không tìm thấy dịch vụ backend. Vui lòng kiểm tra cấu hình.';
            statusCode = 503;
        } else if (error instanceof SyntaxError) {
            errorMessage = 'Nhận được phản hồi không hợp lệ từ dịch vụ backend.';
            statusCode = 502;
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            metadata: {
                timestamp: new Date().toISOString(),
                errorType: error.name || 'UnknownError',
                ...(process.env.NODE_ENV === 'development' && {
                    detail: error.message,
                    stack: error.stack
                })
            }
        }, { status: statusCode });
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
