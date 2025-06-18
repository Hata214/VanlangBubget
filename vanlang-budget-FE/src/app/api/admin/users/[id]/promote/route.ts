import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để thăng cấp người dùng thành Admin
 * @route POST /api/admin/users/[id]/promote
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        console.log(`[API] Đang gửi yêu cầu thăng cấp user ${userId} lên admin`);

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/promote`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
            }
        );

        const responseData = await response.json();
        console.log(`[API] Kết quả từ backend:`, responseData);

        if (!response.ok) {
            console.error(`[API] Lỗi khi thăng cấp user: ${responseData.message || 'Unknown error'}`);
            return NextResponse.json(
                {
                    success: false,
                    message: responseData.message || 'Không thể thăng cấp người dùng thành Admin'
                },
                { status: response.status }
            );
        }

        console.log(`[API] Thăng cấp user ${userId} thành công`);
        return NextResponse.json(responseData);
    } catch (error) {
        console.error('[API] Lỗi khi xử lý yêu cầu thăng cấp:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
} 