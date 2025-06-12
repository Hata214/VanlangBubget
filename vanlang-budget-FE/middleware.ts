// Middleware tích hợp cho admin authentication và i18n routing

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n';

// Tạo middleware cho next-intl
const intlMiddleware = createIntlMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always' // Thay đổi từ 'never' thành 'always'
});

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
 * Middleware NextJS tích hợp
 */
export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Xử lý admin routes trước
    if (path.startsWith('/admin')) {
        return handleAdminRoutes(request);
    }

    // Xử lý i18n cho các routes khác
    return intlMiddleware(request);
}

/**
 * Xử lý routes admin
 */
function handleAdminRoutes(request: NextRequest) {
    const path = request.nextUrl.pathname;

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
        // Admin routes
        '/admin/:path*',
        // I18n routes (exclude admin, api, static files)
        '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
};
