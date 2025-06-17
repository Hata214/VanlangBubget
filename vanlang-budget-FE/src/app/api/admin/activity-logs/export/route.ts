import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để xuất lịch sử hoạt động admin ra CSV
 * @route GET /api/admin/activity-logs/export
 */
export async function GET(request: NextRequest) {
    try {
        // Lấy thông tin từ query params
        const searchParams = request.nextUrl.searchParams;
        const adminId = searchParams.get('adminId') || '';
        const actionType = searchParams.get('actionType') || '';
        const targetType = searchParams.get('targetType') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';
        const search = searchParams.get('search') || '';

        console.log('🔄 Xuất activity logs CSV - Filters:', {
            adminId,
            actionType,
            targetType,
            startDate,
            endDate,
            search
        });

        // Xây dựng query params cho backend
        const backendParams = new URLSearchParams();

        if (adminId && adminId !== 'all') {
            backendParams.append('adminId', adminId);
        }

        if (actionType && actionType !== 'all') {
            backendParams.append('actionType', actionType);
        }

        if (targetType) {
            backendParams.append('targetType', targetType);
        }

        if (startDate) {
            backendParams.append('startDate', startDate);
        }

        if (endDate) {
            backendParams.append('endDate', endDate);
        }

        if (search) {
            backendParams.append('search', search);
        }

        console.log('🔄 Calling backend export API:', `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activity-logs/export?${backendParams.toString()}`);

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activity-logs/export?${backendParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': request.headers.get('Authorization') || '',
                },
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('Lỗi khi xuất activity logs:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Không thể xuất dữ liệu activity logs'
                },
                { status: response.status }
            );
        }

        // Lấy CSV content
        const csvContent = await response.text();
        const contentDisposition = response.headers.get('content-disposition') ||
            `attachment; filename="activity-logs-${new Date().toISOString().slice(0, 10)}.csv"`;

        // Trả về CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': contentDisposition,
            },
        });

    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu xuất CSV:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
} 