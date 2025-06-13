// Middleware tích hợp cho admin authentication và i18n routing

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n';

// Tạo middleware cho next-intl
const intlMiddleware = createIntlMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'never' // Không sử dụng prefix locale cho các trang protected
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
 * Danh sách các đường dẫn protected của user (sau khi đăng nhập)
 */
const protectedUserPaths = [
    '/dashboard',
    '/incomes',
    '/expenses',
    '/loans',
    '/investments',
    '/budgets',
    '/reports',
    '/profile',
    '/settings',
    '/notifications'
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

    // Xử lý protected user routes (không cần locale prefix)
    if (pathStartsWith(path, protectedUserPaths)) {
        return handleProtectedUserRoutes(request);
    }

    // Xử lý i18n cho các routes khác (public routes)
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
 * Xử lý protected user routes (dashboard, incomes, expenses, etc.)
 */
function handleProtectedUserRoutes(request: NextRequest) {
    const path = request.nextUrl.pathname;

    console.log('Protected user middleware running for path:', path);

    // Lấy locale từ cookie nếu có
    const localeFromCookie = request.cookies.get('NEXT_LOCALE')?.value;

    // Nếu có locale trong cookie và khác với locale hiện tại trong headers
    if (localeFromCookie && locales.includes(localeFromCookie as any)) {
        // Tạo response với locale header
        const response = NextResponse.next();
        response.headers.set('x-locale', localeFromCookie);
        return response;
    }

    // Cho phép truy cập trực tiếp mà không có locale prefix
    // Authentication sẽ được xử lý ở client-side
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
