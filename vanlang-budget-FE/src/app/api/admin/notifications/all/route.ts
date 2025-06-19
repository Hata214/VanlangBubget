import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để xóa tất cả thông báo
 * @route DELETE /api/admin/notifications/all
 */
export async function DELETE(request: NextRequest) {
    try {
        console.log('[API] Đang xóa tất cả thông báo');

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/all`,
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
            console.error(`[API] Lỗi khi xóa tất cả thông báo: ${error.message || 'Unknown error'}`);
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể xóa tất cả thông báo'
                },
                { status: response.status }
            );
        }

        console.log('[API] Đã xóa tất cả thông báo thành công');
        return NextResponse.json({
            success: true,
            message: 'Đã xóa tất cả thông báo thành công'
        });
    } catch (error) {
        console.error('[API] Lỗi khi xử lý yêu cầu xóa tất cả thông báo:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
} 