import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getTranslations } from 'next-intl/server';

/**
 * @route GET /api/site-content/[type]/history
 * @desc Lấy lịch sử chỉnh sửa nội dung trang web
 * @access Private (Admin/SuperAdmin)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { type: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const t = await getTranslations('common');

        // Kiểm tra quyền truy cập
        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: t('notAuthenticated') },
                { status: 401 }
            );
        }

        // Kiểm tra vai trò (role)
        const userRole = (session.user as any).role;
        if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
            return NextResponse.json(
                { success: false, message: t('notAuthorized') },
                { status: 403 }
            );
        }

        const { type } = params;

        // Lấy token từ cookie hoặc từ session
        const token = (session as any).accessToken ||
            request.cookies.get('access_token')?.value ||
            '';

        // Gọi API backend
        const response = await fetch(`${process.env.BACKEND_URL}/api/site-content/${type}/history`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi lấy lịch sử chỉnh sửa' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Lỗi khi lấy lịch sử chỉnh sửa ${params.type}:`, error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi lấy lịch sử chỉnh sửa' },
            { status: 500 }
        );
    }
} 