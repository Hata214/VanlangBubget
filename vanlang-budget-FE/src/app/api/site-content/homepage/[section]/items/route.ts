import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getTranslations } from 'next-intl/server';

/**
 * @route POST /api/site-content/homepage/[section]/items
 * @desc Thêm phần tử mới vào section trang chủ
 * @access Private (Admin/SuperAdmin)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { section: string } }
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

        const { section } = params;
        const { item } = await request.json();

        if (!item) {
            return NextResponse.json(
                { success: false, message: 'Dữ liệu phần tử không hợp lệ' },
                { status: 400 }
            );
        }

        // Lấy token từ cookie hoặc từ session
        const token = (session as any).accessToken ||
            request.cookies.get('access_token')?.value ||
            '';

        // Gọi API backend
        const response = await fetch(`${process.env.BACKEND_URL}/api/site-content/homepage/${section}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ item })
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi thêm phần tử mới' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Lỗi khi thêm phần tử mới vào section ${params.section}:`, error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi thêm phần tử mới' },
            { status: 500 }
        );
    }
} 