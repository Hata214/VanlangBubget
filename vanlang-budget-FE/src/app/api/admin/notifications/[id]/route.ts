import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để xóa một thông báo
 * @route DELETE /api/admin/notifications/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const notificationId = params.id;
        console.log(`[API] Đang xóa thông báo với ID: ${notificationId}`);

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/${notificationId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error(`[API] Lỗi khi xóa thông báo: ${error.message || 'Unknown error'}`);
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể xóa thông báo'
                },
                { status: response.status }
            );
        }

        console.log(`[API] Đã xóa thông báo ${notificationId} thành công`);
        return NextResponse.json({
            success: true,
            message: 'Đã xóa thông báo thành công'
        });
    } catch (error) {
        console.error('[API] Lỗi khi xử lý yêu cầu xóa thông báo:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
} 