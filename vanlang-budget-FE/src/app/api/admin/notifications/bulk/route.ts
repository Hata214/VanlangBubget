import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API endpoint để xóa nhiều thông báo cùng lúc
 * @route DELETE /api/admin/notifications/bulk
 */
export async function DELETE(request: NextRequest) {
    try {
        console.log('[API] Đang xóa nhiều thông báo');

        // Lấy token từ cookie
        const cookieStore = cookies();
        const tokenCookie = cookieStore.get('token');

        if (!tokenCookie) {
            return NextResponse.json(
                { error: 'Chưa đăng nhập' },
                { status: 401 }
            );
        }

        // Lấy danh sách ID từ request body
        const { notificationIds } = await request.json();

        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return NextResponse.json(
                { error: 'Danh sách ID thông báo không hợp lệ' },
                { status: 400 }
            );
        }

        console.log(`[API] Đang xóa ${notificationIds.length} thông báo`);

        // Gọi API backend
        const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/notifications/bulk`;
        const requestBody = { notificationIds };

        console.log('[DEBUG] API URL:', apiUrl);
        console.log('[DEBUG] Request body:', requestBody);

        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenCookie.value}`,
            },
            body: JSON.stringify(requestBody),
        });

        console.log('[DEBUG] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API] Lỗi khi xóa nhiều thông báo:`, {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText
            });

            let errorMessage = 'Không thể xóa thông báo';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }

            return NextResponse.json(
                {
                    success: false,
                    message: errorMessage
                },
                { status: response.status }
            );
        }

        const result = await response.json();
        console.log(`[API] Đã xóa ${result.deletedCount || notificationIds.length} thông báo thành công`);

        return NextResponse.json({
            success: true,
            message: result.message || 'Đã xóa thông báo thành công',
            deletedCount: result.deletedCount || notificationIds.length
        });
    } catch (error) {
        console.error('[API] Lỗi khi xử lý yêu cầu xóa nhiều thông báo:', error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
}
