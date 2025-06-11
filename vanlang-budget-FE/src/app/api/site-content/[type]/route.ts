import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getTranslations } from 'next-intl/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * @route GET /api/site-content/[type]
 * @desc Lấy nội dung trang web theo loại
 * @access Public
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { type: string } }
) {
    try {
        const { type } = params;
        const language = request.nextUrl.searchParams.get('language') || 'vi';

        // Gọi API backend
        const response = await fetch(`${API_BASE}/api/site-content/${type}?language=${language}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi lấy nội dung' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi lấy nội dung:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi lấy nội dung' },
            { status: 500 }
        );
    }
}

/**
 * @route PUT /api/site-content/[type]
 * @desc Cập nhật nội dung trang web theo loại
 * @access Private (Admin/SuperAdmin)
 */
export async function PUT(
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
        const { content, status, language } = await request.json();

        // Lấy token từ cookie hoặc từ session - kiểm tra cả hai tên cookie có thể được sử dụng
        const tokenFromSession = (session as any).accessToken;
        const tokenFromCookie = request.cookies.get('token')?.value ||
            request.cookies.get('auth_token')?.value ||
            request.cookies.get('access_token')?.value;

        // Sử dụng token từ bất kỳ nguồn nào có sẵn
        const token = tokenFromSession || tokenFromCookie || '';

        console.log('API site-content PUT - token check:', {
            sessionToken: tokenFromSession ? 'Có' : 'Không',
            cookieToken: tokenFromCookie ? 'Có' : 'Không',
            finalToken: token ? 'Có' : 'Không'
        });

        // Gọi API backend
        const response = await fetch(`${API_BASE}/api/site-content/${type}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ content, status, language }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi cập nhật nội dung' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi cập nhật nội dung:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi cập nhật nội dung' },
            { status: 500 }
        );
    }
}