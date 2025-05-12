import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getTranslations } from 'next-intl/server';

/**
 * @route DELETE /api/site-content/homepage/[section]/items/[id]
 * @desc Xóa phần tử khỏi section trang chủ
 * @access Private (Admin/SuperAdmin)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { section: string; id: string } }
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

        const { section, id } = params;

        // Lấy token từ cookie hoặc từ session
        const token = (session as any).accessToken ||
            request.cookies.get('access_token')?.value ||
            '';

        // Gọi API backend
        const response = await fetch(`${process.env.BACKEND_URL}/api/site-content/homepage/${section}/items/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi xóa phần tử' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Lỗi khi xóa phần tử ${params.id} khỏi section ${params.section}:`, error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi xóa phần tử' },
            { status: 500 }
        );
    }
} 