import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getTranslations } from 'next-intl/server';

/**
 * @route POST /api/site-content/[type]/restore/[version]
 * @desc Khôi phục nội dung trang web từ phiên bản trước đó
 * @access Private (SuperAdmin)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { type: string; version: string } }
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

        // Kiểm tra vai trò (role) - chỉ SuperAdmin
        const userRole = (session.user as any).role;
        if (!userRole || userRole !== 'superadmin') {
            return NextResponse.json(
                { success: false, message: t('notAuthorized') },
                { status: 403 }
            );
        }

        const { type, version } = params;
        const versionNumber = parseInt(version, 10);

        if (isNaN(versionNumber)) {
            return NextResponse.json(
                { success: false, message: 'Phiên bản không hợp lệ' },
                { status: 400 }
            );
        }

        // Lấy token từ cookie hoặc từ session
        const token = (session as any).accessToken ||
            request.cookies.get('access_token')?.value ||
            '';

        // Gọi API backend
        const response = await fetch(`${process.env.BACKEND_URL}/api/site-content/${type}/restore/${versionNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: data.message || 'Lỗi khi khôi phục nội dung' },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error(`Lỗi khi khôi phục nội dung ${params.type} phiên bản ${params.version}:`, error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server khi khôi phục nội dung' },
            { status: 500 }
        );
    }
} 