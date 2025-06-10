import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Mark the route as dynamic

/**
 * API endpoint để lấy thống kê người dùng
 * @route GET /api/admin/users/stats
 */
export async function GET(request: NextRequest) {
    try {
        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/stats`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể lấy thống kê người dùng'
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
}
