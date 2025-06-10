import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để lấy lịch sử hoạt động admin
 * @route GET /api/admin/activity-logs
 */
export async function GET(request: NextRequest) {
    try {
        // Lấy thông tin từ query params
        const searchParams = request.nextUrl.searchParams;
        const adminId = searchParams.get('adminId') || 'all';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const action = searchParams.get('action') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';

        console.log(`Lấy lịch sử hoạt động admin - Id: ${adminId}, trang ${page}, tìm kiếm: ${search}, hành động: ${action}`);

        // Xây dựng query params cho backend
        const backendParams = new URLSearchParams();
        backendParams.append('page', page.toString());
        backendParams.append('limit', limit.toString());

        // Chỉ thêm adminId nếu không phải 'all'
        if (adminId && adminId !== 'all') {
            backendParams.append('adminId', adminId);
        }

        if (search) {
            backendParams.append('search', search);
        }

        if (action && action !== 'all') {
            backendParams.append('actionType', action); // Fix: backend expects 'actionType'
        }

        if (startDate) {
            backendParams.append('startDate', startDate);
        }

        if (endDate) {
            backendParams.append('endDate', endDate);
        }

        console.log('🔄 Calling backend API:', `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activity-logs?${backendParams.toString()}`);

        // Gọi API backend - Fix: gọi endpoint chính thay vì endpoint với adminId
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activity-logs?${backendParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Lỗi khi lấy lịch sử hoạt động:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể lấy lịch sử hoạt động admin'
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
}
