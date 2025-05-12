import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để kích hoạt tài khoản người dùng
 * @route POST /api/admin/users/[id]/activate
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/activate`,
            {
                method: 'POST',
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
                    message: error.message || 'Không thể kích hoạt tài khoản người dùng'
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