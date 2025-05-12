// Middleware frontend đã bị vô hiệu hóa.
// Việc bảo vệ route admin sẽ được xử lý ở cấp layout/page component và middleware backend cho API routes.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Danh sách các đường dẫn trong khu vực admin cần bảo vệ
 */
const protectedAdminPaths = [
    '/admin/dashboard',
    '/admin/users',
    '/admin/site-content',
    '/admin/notifications',
    '/admin/transactions',
];

/**
 * Danh sách các đường dẫn không cần xác thực trong khu vực admin
 */
const publicAdminPaths = [
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
];

/**
 * Kiểm tra nếu đường dẫn bắt đầu bằng một giá trị trong danh sách
 */
const pathStartsWith = (path: string, pathList: string[]): boolean => {
    return pathList.some(prefix => path.startsWith(prefix));
};

/**
 * Middleware NextJS
 */
export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Bỏ qua nếu không phải đường dẫn admin
    if (!path.startsWith('/admin')) {
        return NextResponse.next();
    }

    console.log('Admin middleware running for path:', path);

    // Cho phép truy cập các đường dẫn công khai trong khu vực admin
    if (pathStartsWith(path, publicAdminPaths)) {
        console.log('Public admin path, allowing access:', path);
        return NextResponse.next();
    }

    // Nếu người dùng truy cập /admin, chuyển hướng đến dashboard
    if (path === '/admin') {
        console.log('Redirecting from /admin to /admin/dashboard');
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Kiểm tra token trong cookie hoặc localStorage (thông qua header)
    const token = request.cookies.get('auth_token')?.value ||
        request.headers.get('x-auth-token');

    if (!token) {
        console.log('No auth token found, redirecting to login');
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Token được tìm thấy, nhưng không xác thực chi tiết ở đây
    // Xác thực chi tiết sẽ được thực hiện ở admin layout component
    console.log('Found auth token, allowing conditional access');
    return NextResponse.next();
}

/**
 * Cấu hình đường dẫn tác động của middleware
 */
export const config = {
    matcher: [
        '/admin/:path*',
    ],
};
