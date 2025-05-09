import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { hasAdminAccess } from '@/utils/auth'
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

        // Kiểm tra quyền admin
        if (!hasAdminAccess(tokenCookie.value)) {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            )
        }

        // Lấy tham số tìm kiếm
        const { searchParams } = req.nextUrl
        const page = searchParams.get('page') || 1
        const limit = searchParams.get('limit') || 10
        const search = searchParams.get('search') || ''

        // Gọi API backend
        try {
            const response = await api.get('/api/admin/notifications', {
                params: { page, limit, search },
                headers: {
                    'Authorization': `Bearer ${JSON.parse(tokenCookie.value).accessToken}`
                }
            })

            return NextResponse.json(response.data)
        } catch (error) {
            console.error('Lỗi khi lấy thông báo từ backend:', error)

            // Dữ liệu mẫu cho môi trường dev
            const mockData = {
                notifications: Array.from({ length: Number(limit) }, (_, i) => ({
                    _id: `notif_${i + 1}`,
                    title: `Thông báo quan trọng ${i + 1}`,
                    message: `Đây là nội dung thông báo ${i + 1} được tạo để thử nghiệm.`,
                    type: ['info', 'warning', 'success', 'error'][Math.floor(Math.random() * 4)],
                    sentTo: ['all', 'user', 'admin'][Math.floor(Math.random() * 3)],
                    isRead: Math.random() > 0.5,
                    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
                    sentCount: Math.floor(Math.random() * 100)
                })),
                totalPages: 5
            }

            return NextResponse.json(mockData)
        }
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

        // Kiểm tra quyền admin
        if (!hasAdminAccess(tokenCookie.value)) {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
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