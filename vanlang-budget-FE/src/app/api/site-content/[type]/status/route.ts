import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

/**
 * @route GET /api/site-content/[type]/status
 * @desc Kiểm tra trạng thái nội dung (đã đồng bộ hay chưa)
 * @access Public
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { type: string } }
) {
    try {
        const { type } = params;
        const language = request.nextUrl.searchParams.get('language') || 'vi';

        console.log(`API site-content status check for type: ${type}, language: ${language}`);

        // Lấy token từ session hoặc cookie
        const session = await getServerSession(authOptions);
        const tokenFromSession = (session as any)?.accessToken;
        const tokenFromCookie = request.cookies.get('token')?.value || 
                               request.cookies.get('auth_token')?.value || 
                               request.cookies.get('access_token')?.value;
        
        // Sử dụng token từ bất kỳ nguồn nào có sẵn
        const token = tokenFromSession || tokenFromCookie || '';
        
        console.log('API site-content status - token check:', { 
            sessionToken: tokenFromSession ? 'Có' : 'Không',
            cookieToken: tokenFromCookie ? 'Có' : 'Không',
            finalToken: token ? 'Có' : 'Không'
        });

        // Chuẩn bị headers
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Thêm token vào header nếu có
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Gọi API backend
        const response = await fetch(`${process.env.BACKEND_URL}/api/site-content/${type}/status?language=${language}`, {
            method: 'GET',
            headers,
        });

        console.log(`Backend status API response: ${response.status} ${response.statusText}`);

        const data = await response.json();

        if (!response.ok) {
            console.error(`Error from backend status API: ${response.status}`, data);
            return NextResponse.json(
                { 
                    success: false, 
                    message: data.message || 'Lỗi khi kiểm tra trạng thái nội dung',
                    error: data.error || 'Unknown error'
                },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Lỗi khi kiểm tra trạng thái nội dung ${params.type}:`, error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Lỗi server khi kiểm tra trạng thái nội dung',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
