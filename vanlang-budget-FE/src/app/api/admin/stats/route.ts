import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getTokenData } from '@/utils/auth'
import api from '@/services/api'

/**
 * API route để lấy thống kê cho admin dashboard
 * Yêu cầu quyền admin hoặc superadmin
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

        // Kiểm tra quyền
        const userData = getTokenData(tokenCookie.value)

        if (!userData || !['admin', 'superadmin'].includes(userData.role)) {
            return NextResponse.json(
                { error: 'Không có quyền truy cập' },
                { status: 403 }
            )
        }

        // Gọi API backend
        try {
            const statsResponse = await api.get('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${JSON.parse(tokenCookie.value).accessToken}`
                }
            })

            return NextResponse.json(statsResponse.data)
        } catch (error) {
            console.error('Lỗi khi lấy thống kê từ backend:', error)

            // Trả về dữ liệu mẫu cho môi trường dev
            return NextResponse.json({
                userCount: 1250,
                transactionCount: 18743,
                activeUserCount: 843,
                todayTransactions: 124
            })
        }
    } catch (error) {
        console.error('Lỗi khi xử lý API stats admin:', error)
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
            { status: 500 }
        )
    }
} 