import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để lấy thống kê lịch sử hoạt động admin
 * @route GET /api/admin/activity-logs/stats
 */
export async function GET(request: NextRequest) {
    try {
        // Lấy thông tin từ query params
        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '30');
        const adminId = searchParams.get('adminId') || '';

        console.log('🔄 Lấy thống kê activity logs - Days:', days, 'AdminId:', adminId);

        // Xây dựng query params cho backend
        const backendParams = new URLSearchParams();
        backendParams.append('days', days.toString());

        if (adminId && adminId !== 'all') {
            backendParams.append('adminId', adminId);
        }

        console.log('🔄 Calling backend stats API:', `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activity-logs/stats?${backendParams.toString()}`);

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activity-logs/stats?${backendParams.toString()}`,
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
            console.error('Lỗi khi lấy thống kê activity logs:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể lấy thống kê activity logs'
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('📊 Stats data received:', data);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu thống kê:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
} 