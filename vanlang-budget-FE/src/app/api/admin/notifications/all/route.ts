import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hasAdminAccess } from '@/utils/auth';

/**
 * API endpoint để xóa tất cả thông báo
 * @route DELETE /api/admin/notifications/all
 */
export async function DELETE(request: NextRequest) {
    try {
        console.log('[API] Đang xóa tất cả thông báo');

        // Lấy token từ cookie
        const cookieStore = cookies();
        const tokenCookie = cookieStore.get('token');

        if (!tokenCookie) {
            return NextResponse.json(
                { error: 'Chưa đăng nhập' },
                { status: 401 }
            );
        }

        // Kiểm tra quyền admin
        if (!hasAdminAccess(tokenCookie.value)) {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            );
        }

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/notifications/all`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenCookie.value}`,
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

        const result = await response.json();
        console.log(`[API] Đã xóa tất cả thông báo thành công: ${result.deletedCount || 0} thông báo`);

        return NextResponse.json({
            success: true,
            message: result.message || 'Đã xóa tất cả thông báo thành công',
            deletedCount: result.deletedCount || 0
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