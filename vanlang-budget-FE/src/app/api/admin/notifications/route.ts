import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import api from '@/services/api'

/**
 * API lấy danh sách thông báo
 */
export async function GET(req: NextRequest) {
    try {
        // Lấy token từ cookie
        const cookieStore = cookies()
        const tokenCookie = cookieStore.get('token')

        if (!tokenCookie) {
            return NextResponse.json(
                { error: 'Chưa đăng nhập' },
                { status: 401 }
            )
        }

        // Lấy tham số tìm kiếm
        const { searchParams } = req.nextUrl
        const page = searchParams.get('page') || 1
        const limit = searchParams.get('limit') || 10
        const search = searchParams.get('search') || ''

        // Parse token để lấy accessToken
        let accessToken;
        try {
            const tokenData = JSON.parse(tokenCookie.value);
            accessToken = tokenData.accessToken;
        } catch (parseError) {
            console.error('Token parse error:', parseError);
            accessToken = tokenCookie.value;
        }

        // Gọi API backend trực tiếp
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://vanlangbubget.onrender.com'
        const backendUrl = `${apiUrl}/api/admin/notifications`;
        console.log('[NextJS API] Calling backend:', backendUrl);
        console.log('[NextJS API] Params:', { page, limit, search });

        const response = await fetch(`${backendUrl}?page=${page}&limit=${limit}&search=${search}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('[NextJS API] Backend response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[NextJS API] Backend error:', errorText);

            return NextResponse.json(
                {
                    error: 'Không thể lấy danh sách thông báo',
                    details: errorText
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[NextJS API] Backend response data:', data);
        console.log('[NextJS API] Data structure:', {
            hasNotifications: !!data.notifications,
            notificationsLength: data.notifications?.length,
            hasTotalPages: !!data.totalPages,
            totalPages: data.totalPages,
            dataKeys: Object.keys(data)
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý API GET notifications:', error)
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
            { status: 500 }
        )
    }
}

/**
 * API tạo thông báo mới
 */
export async function POST(req: NextRequest) {
    try {
        // Lấy token từ cookie
        const cookieStore = cookies()
        const tokenCookie = cookieStore.get('token')

        if (!tokenCookie) {
            return NextResponse.json(
                { error: 'Chưa đăng nhập' },
                { status: 401 }
            )
        }

        // Lấy dữ liệu từ request
        const notificationData = await req.json()

        // Validate dữ liệu
        if (!notificationData.title || !notificationData.message) {
            return NextResponse.json(
                { error: 'Tiêu đề và nội dung là bắt buộc' },
                { status: 400 }
            )
        }

        // Gọi API backend
        try {
            const response = await api.post('/api/admin/notifications', notificationData, {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(tokenCookie.value).accessToken}`
                }
            })

            return NextResponse.json(response.data)
        } catch (error: any) {
            console.error('Lỗi khi tạo thông báo:', error)

            // Trả về lỗi từ backend nếu có
            const errorMessage = error.response?.data?.error || 'Không thể tạo thông báo'

            return NextResponse.json(
                { error: errorMessage },
                { status: error.response?.status || 500 }
            )
        }
    } catch (error) {
        console.error('Lỗi khi xử lý API POST notifications:', error)
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
            { status: 500 }
        )
    }
} 