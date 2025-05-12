import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getTranslations } from 'next-intl/server';

/**
 * @route GET /api/site-content/homepage/[section]
 * @desc Lấy nội dung của một section cụ thể trong trang chủ
 * @access Public
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { section: string } }
) {
    try {
        const { section } = params;
        const language = request.nextUrl.searchParams.get('language') || 'vi';

        // Gọi API backend
        const response = await fetch(`${process.env.BACKEND_URL}/api/site-content/homepage/${section}?language=${language}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi lấy nội dung section' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Lỗi khi lấy nội dung section ${params.section}:`, error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi lấy nội dung section' },
            { status: 500 }
        );
    }
}

/**
 * @route PUT /api/site-content/homepage/[section]
 * @desc Cập nhật nội dung của một section cụ thể trong trang chủ
 * @access Private (Admin/SuperAdmin)
 */
export async function PUT(
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
        const { content, language } = await request.json();

        // Lấy token từ cookie hoặc từ session
        const token = (session as any).accessToken ||
            request.cookies.get('access_token')?.value ||
            '';

        // Gọi API backend
        const response = await fetch(`${process.env.BACKEND_URL}/api/site-content/homepage/${section}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ content, language }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi cập nhật nội dung section' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Lỗi khi cập nhật nội dung section ${params.section}:`, error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi cập nhật nội dung section' },
            { status: 500 }
        );
    }
} 