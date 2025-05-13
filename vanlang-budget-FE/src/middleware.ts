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
        // Lấy token từ cookie hoặc header - kiểm tra cả hai tên cookie có thể được sử dụng
        const tokenFromCookie = request.cookies.get('token')?.value;
        const authTokenFromCookie = request.cookies.get('auth_token')?.value;
        const tokenFromHeader = request.headers.get('authorization')?.split(' ')[1] || '';

        // Sử dụng token từ bất kỳ nguồn nào có sẵn
        const token = tokenFromCookie || authTokenFromCookie || tokenFromHeader || '';

        console.log('Admin token check:', {
            tokenCookie: tokenFromCookie ? 'Có' : 'Không',
            authTokenCookie: authTokenFromCookie ? 'Có' : 'Không',
            headerToken: tokenFromHeader ? 'Có' : 'Không',
            finalToken: token ? 'Có' : 'Không'
        });

        if (!token) {
            console.log('No "token" cookie found, redirecting to login page');
            // Chuyển hướng đến trang đăng nhập nếu không có token
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        try {
            // Xác thực giả lập cho token demo nếu token bắt đầu bằng "mock_"
            // This mock logic might need adjustment if 'auth_token' was specifically for mocks
            if (token.startsWith('mock_')) {
                console.log('Mock token detected, checking role in mock token');

                // Kiểm tra xem token có chứa admin hoặc superadmin không
                if (token.includes('admin') || token.includes('superadmin')) {
                    console.log('Valid admin role in mock token, access granted');
                    // Cho phép truy cập với token giả lập
                    return NextResponse.next();
                } else {
                    console.log('Invalid role in mock token, access denied');
                    const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
                    redirectResponse.cookies.delete('token'); // Changed 'auth_token' to 'token'
                    return redirectResponse;
                }
            }

            // Xác thực token thật với API admin
            console.log('Verifying "token" cookie with API');
            // Sử dụng endpoint xác thực mới
            const apiUrl = new URL('/api/admin/auth/verify', request.nextUrl.origin).toString();
            console.log('API verification URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}` // This token is the value of the "token" cookie
                }
            });

            if (!response.ok) {
                console.log('"token" cookie verification failed, status:', response.status);

                // Xóa cookie nếu token không hợp lệ
                const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
                redirectResponse.cookies.delete('token'); // Changed 'auth_token' to 'token'
                return redirectResponse;
            }

            try {
                // Kiểm tra quyền từ response
                const userData = await response.json();
                console.log('"token" cookie verification response:', userData);

                if (!userData.success || !userData.user || !['admin', 'superadmin'].includes(userData.user.role)) {
                    console.log('User does not have admin privileges (from "token" cookie):', userData.user?.role);
                    const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
                    redirectResponse.cookies.delete('token'); // Changed 'auth_token' to 'token'
                    return redirectResponse;
                }

                console.log('"token" cookie verified successfully with role:', userData.user.role);
                // Token hợp lệ và có quyền admin/superadmin, cho phép tiếp tục
                return NextResponse.next();
            } catch (parseError) {
                console.error('Error parsing "token" cookie verification response:', parseError);
                const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
                redirectResponse.cookies.delete('token'); // Changed 'auth_token' to 'token'
                return redirectResponse;
            }
        } catch (error) {
            console.error('Middleware authentication error (with "token" cookie):', error);

            // Xóa cookie nếu có lỗi
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('token'); // Changed 'auth_token' to 'token'
            return response;
        }
    }

    // Kiểm tra nếu người dùng đã đăng nhập và cố gắng truy cập trang login
    if (pathname === '/admin/login') {
        // Kiểm tra cả hai tên cookie có thể được sử dụng
        const tokenFromCookie = request.cookies.get('token')?.value;
        const authTokenFromCookie = request.cookies.get('auth_token')?.value;
        const token = tokenFromCookie || authTokenFromCookie || '';

        console.log('Login page - token check:', {
            tokenCookie: tokenFromCookie ? 'Có' : 'Không',
            authTokenCookie: authTokenFromCookie ? 'Có' : 'Không',
            finalToken: token ? 'Có' : 'Không'
        });

        if (token) {
            try {
                // Kiểm tra token giả lập
                if (token.startsWith('mock_') && (token.includes('admin') || token.includes('superadmin'))) {
                    console.log('Mock admin "token" cookie detected on login page, redirecting to dashboard');
                    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                }

                // Xác thực token với API admin
                const apiUrl = new URL('/api/admin/auth/verify', request.nextUrl.origin).toString();
                console.log('Verifying token on login page:', apiUrl);

                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    try {
                        // Kiểm tra quyền từ response
                        const userData = await response.json();

                        if (userData.success && userData.user && ['admin', 'superadmin'].includes(userData.user.role)) {
                            console.log('User already logged in with role:', userData.user.role);
                            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                        }
                    } catch (parseError) {
                        console.error('Error parsing login page verification response:', parseError);
                        // Nếu có lỗi parsing, cho phép tiếp tục đến trang đăng nhập
                    }
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
