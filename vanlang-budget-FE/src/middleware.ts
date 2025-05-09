import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các đường dẫn yêu cầu xác thực Admin
const ADMIN_PATHS = ['/admin', '/admin/dashboard', '/admin/users', '/admin/site-content', '/admin/notifications', '/admin/transactions'];

// Không yêu cầu xác thực
const PUBLIC_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    console.log('Middleware running for path:', pathname);

    // Kiểm tra nếu đường dẫn là trang admin (ngoại trừ trang đăng nhập)
    if (pathname.startsWith('/admin') && !PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        // Lấy token từ cookie hoặc header
        const token = request.cookies.get('auth_token')?.value ||
            request.headers.get('authorization')?.split(' ')[1] || '';

        console.log('Admin token found:', token ? 'Yes' : 'No');

        if (!token) {
            console.log('No token found, redirecting to login page');
            // Chuyển hướng đến trang đăng nhập nếu không có token
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        try {
            // Xác thực giả lập cho token demo nếu token bắt đầu bằng "mock_"
            if (token.startsWith('mock_') && (token.includes('admin') || token.includes('superadmin'))) {
                console.log('Mock token detected, bypassing verification');
                // Cho phép truy cập với token giả lập
                return NextResponse.next();
            }

            // Xác thực token thật với API admin
            console.log('Verifying token with API');
            const apiUrl = new URL('/api/admin/auth', request.nextUrl.origin).toString();
            console.log('API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.log('Token verification failed, status:', response.status);

                // Xóa cookie nếu token không hợp lệ
                const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
                redirectResponse.cookies.delete('auth_token');
                return redirectResponse;
            }

            console.log('Token verified successfully');
            // Token hợp lệ và có quyền admin, cho phép tiếp tục
            return NextResponse.next();
        } catch (error) {
            console.error('Middleware authentication error:', error);

            // Xóa cookie nếu có lỗi
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('auth_token');
            return response;
        }
    }

    // Kiểm tra nếu người dùng đã đăng nhập và cố gắng truy cập trang login
    if (pathname === '/admin/login') {
        const token = request.cookies.get('auth_token')?.value || '';
        console.log('Login page - Token found:', token ? 'Yes' : 'No');

        if (token) {
            try {
                // Kiểm tra token giả lập
                if (token.startsWith('mock_') && (token.includes('admin') || token.includes('superadmin'))) {
                    console.log('Mock admin token detected on login page, redirecting to dashboard');
                    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                }

                // Xác thực token với API admin
                const apiUrl = new URL('/api/admin/auth', request.nextUrl.origin).toString();
                console.log('Verifying token on login page:', apiUrl);

                const response = await fetch(apiUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    console.log('User already logged in, redirecting to dashboard');
                    // Nếu token hợp lệ và đã đăng nhập, chuyển hướng đến trang dashboard
                    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                }
            } catch (error) {
                console.error('Middleware login check error:', error);
                // Nếu có lỗi, cho phép tiếp tục đến trang đăng nhập
            }
        }
    }

    console.log('Middleware completed for path:', pathname);
    return NextResponse.next();
}

// Xác định các đường dẫn cần áp dụng middleware
export const config = {
    matcher: ['/admin/:path*'],
}; 