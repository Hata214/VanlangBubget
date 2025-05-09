/**
 * Tiện ích xử lý xác thực và token
 */

interface TokenData {
    accessToken: string
    refreshToken?: string
}

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authService } from '../services/authService'; // Import authService

/**
 * Bảo vệ route, chỉ cho phép các role được chỉ định truy cập
 * @param allowedRoles Mảng các role được phép truy cập (ví dụ: ['admin', 'superadmin'])
 */
export async function protectRoute(allowedRoles: string[]): Promise<void> {
    const tokenString = cookies().get('token')?.value; // Giả định token được lưu trong cookie tên 'token'

    if (!tokenString) {
        // Nếu không có token, redirect về trang login
        redirect('/login');
    }

    const userData = getTokenData(tokenString);

    if (!userData || !allowedRoles.includes(userData.role)) {
        // Nếu token không hợp lệ hoặc role không được phép, redirect về trang không có quyền
        // Cần tạo trang /unauthorized hoặc redirect về trang chủ
        redirect('/'); // Redirect về trang chủ tạm thời
    }

    // Nếu có quyền, không làm gì cả, cho phép truy cập route
}

interface UserData {
    id?: string
    _id?: string
    email: string
    role: string
    firstName?: string
    lastName?: string
    isEmailVerified?: boolean
}

/**
 * Lấy thông tin người dùng từ token
 * @param tokenString Chuỗi token từ cookie
 * @returns Thông tin người dùng hoặc null nếu không hợp lệ
 */
export function getTokenData(tokenString: string): UserData | null {
    try {
        // Parse chuỗi token thành đối tượng
        const tokenData: TokenData = JSON.parse(tokenString)

        if (!tokenData.accessToken) {
            return null
        }

        // Lấy phần payload của JWT
        const parts = tokenData.accessToken.split('.')
        if (parts.length !== 3) {
            return null
        }

        // Giải mã base64 phần payload
        const payload = Buffer.from(parts[1], 'base64').toString()
        const userData: UserData = JSON.parse(payload)

        return userData
    } catch (error) {
        console.error('Lỗi khi phân tích token:', error)
        return null
    }
}

/**
 * Kiểm tra người dùng có quyền admin không
 * @param tokenString Chuỗi token từ cookie
 * @returns true nếu có quyền admin, ngược lại false
 */
export function hasAdminAccess(tokenString: string): boolean {
    const userData = getTokenData(tokenString)
    return !!userData && ['admin', 'superadmin'].includes(userData.role)
}

/**
 * Kiểm tra token có hợp lệ không
 * @param tokenString Chuỗi token từ cookie
 * @returns true nếu token hợp lệ, ngược lại false
 */
export function isValidToken(tokenString: string): boolean {
    try {
        const tokenData: TokenData = JSON.parse(tokenString)

        if (!tokenData.accessToken) {
            return false
        }

        // Kiểm tra cấu trúc JWT
        const parts = tokenData.accessToken.split('.')
        if (parts.length !== 3) {
            return false
        }

        // Kiểm tra token hết hạn
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

        if (!payload.exp) {
            return false
        }

        const now = Math.floor(Date.now() / 1000)
        return payload.exp > now
    } catch (error) {
        return false
    }
}

// Export hàm isAuthenticated từ authService
export const isAuthenticated = () => authService.isAuthenticated();
