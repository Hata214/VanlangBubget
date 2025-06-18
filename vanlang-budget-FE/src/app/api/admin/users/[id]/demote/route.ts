import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để hạ cấp Admin xuống người dùng thường
 * @route POST /api/admin/users/[id]/demote
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        console.log(`[API] Đang gửi yêu cầu hạ cấp admin ${userId} xuống user`);

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/demote`,
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
            console.error(`[API] Lỗi khi hạ cấp admin: ${responseData.message || 'Unknown error'}`);
            return NextResponse.json(
                {
                    success: false,
                    message: responseData.message || 'Không thể hạ cấp Admin xuống người dùng thường'
                },
                { status: response.status }
            );
        }

        console.log(`[API] Hạ cấp admin ${userId} thành công`);
        return NextResponse.json(responseData);
    } catch (error) {
        console.error('[API] Lỗi khi xử lý yêu cầu hạ cấp:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
} 