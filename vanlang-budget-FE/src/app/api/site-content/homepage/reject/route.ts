import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getTranslations } from 'next-intl/server';

/**
 * @route POST /api/site-content/homepage/reject
 * @desc Từ chối nội dung trang chủ (chỉ dành cho SuperAdmin)
 * @access Private (SuperAdmin)
 */
export async function POST(request: NextRequest) {
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

        // Kiểm tra vai trò (role) - chỉ SuperAdmin
        const userRole = (session.user as any).role;
        if (!userRole || userRole !== 'superadmin') {
            return NextResponse.json(
                { success: false, message: t('notAuthorized') },
                { status: 403 }
            );
        }

        // Đọc dữ liệu từ request
        const { reason } = await request.json();

        // Lấy token từ cookie hoặc từ session
        const token = (session as any).accessToken ||
            request.cookies.get('access_token')?.value ||
            '';

        // Gọi API backend
        const response = await fetch(`${process.env.BACKEND_URL}/api/site-content/homepage/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi từ chối nội dung trang chủ' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi từ chối nội dung trang chủ:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi từ chối nội dung trang chủ' },
            { status: 500 }
        );
    }
} 