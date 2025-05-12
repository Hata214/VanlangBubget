import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Kiểm tra thông tin đăng nhập của admin
 * @route POST /api/admin/auth
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({
                success: false,
                message: 'Email và mật khẩu là bắt buộc',
            }, { status: 400 });
        }

        console.log(`Đang cố gắng đăng nhập admin với email: ${email}`);

        // Xử lý đăng nhập mẫu khi backend chưa sẵn sàng hoặc trong môi trường phát triển
        if (email === 'superadmin@control.vn' && password === 'Admin123!') {
            console.log('Sử dụng thông tin đăng nhập mẫu với tài khoản superadmin');

            // Tạo token giả lập
            const mockToken = `mock_${Date.now()}_superadmin_token`;

            return NextResponse.json({
                success: true,
                token: mockToken,
                refreshToken: `refresh_${mockToken}`,
                user: {
                    _id: '1',
                    email: 'superadmin@control.vn',
                    firstName: 'Super',
                    lastName: 'Admin',
                    role: 'superadmin',
                },
            });
        }

        // Kiểm tra nếu là tài khoản admin mẫu
        if (email === 'admin@example.com' && password === 'Admin123!') {
            console.log('Sử dụng thông tin đăng nhập mẫu với tài khoản admin');

            // Tạo token giả lập
            const mockToken = `mock_${Date.now()}_admin_token`;

            return NextResponse.json({
                success: true,
                token: mockToken,
                refreshToken: `refresh_${mockToken}`,
                user: {
                    _id: '2',
                    email: 'admin@example.com',
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin',
                },
            });
        }

        // Nếu không phải tài khoản mẫu, thử gọi backend thực
        try {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/login`;
            console.log('Login API URL:', apiUrl);

            // Chuyển tiếp yêu cầu đến API backend
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('Backend response status:', response.status);

            // Kiểm tra quyền admin hoặc superadmin
            if (response.ok && data.user && (data.user.role === 'admin' || data.user.role === 'superadmin')) {
                console.log('Đăng nhập admin thành công:', data.user.email, 'Role:', data.user.role);

                return NextResponse.json({
                    success: true,
                    token: data.token,
                    refreshToken: data.refreshToken,
                    user: {
                        id: data.user._id,
                        email: data.user.email,
                        name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
                        role: data.user.role,
                    },
                });
            } else if (response.ok && data.user && data.user.role === 'user') {
                console.log('Đăng nhập thất bại - không có quyền admin:', data.user.email);

                return NextResponse.json({
                    success: false,
                    message: 'Tài khoản của bạn không có quyền truy cập vào trang quản trị.',
                }, { status: 403 });
            }
        } catch (error) {
            console.error('Lỗi kết nối đến API backend:', error);
            // Tiếp tục với phản hồi lỗi bên dưới
        }

        return NextResponse.json({
            success: false,
            message: 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.',
        }, { status: 401 });
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json({
            success: false,
            message: 'Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.',
        }, { status: 500 });
    }
}

/**
 * Xác thực token admin hiện tại
 * @route GET /api/admin/auth
 */
export async function GET(request: NextRequest) {
    try {
        console.log('Admin token verification API called');

        // Lấy token từ header Authorization
        const headersList = headers();
        const authHeader = headersList.get('Authorization');

        console.log('Auth header received:', authHeader ? 'Yes' : 'No');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Invalid authorization header format');
            return NextResponse.json({ success: false, error: 'Token không hợp lệ' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token extracted:', token ? `${token.substring(0, 15)}...` : 'invalid');

        // Xử lý token giả lập
        if (token.startsWith('mock_')) {
            console.log('Xác thực token giả lập:', token);

            // Kiểm tra token giả lập có hợp lệ không
            if (token.includes('superadmin')) {
                console.log('Verified mock token: superadmin role');
                return NextResponse.json({
                    success: true,
                    user: {
                        id: '1',
                        email: 'superadmin@control.vn',
                        name: 'Super Admin',
                        role: 'superadmin'
                    }
                });
            } else if (token.includes('admin')) {
                console.log('Verified mock token: admin role');
                return NextResponse.json({
                    success: true,
                    user: {
                        id: '2',
                        email: 'admin@example.com',
                        name: 'Admin User',
                        role: 'admin'
                    }
                });
            } else {
                console.log('Invalid mock token role');
                return NextResponse.json({ success: false, error: 'Token không hợp lệ' }, { status: 401 });
            }
        }

        // Gọi API backend để xác thực token thật
        try {
            console.log('Verifying real token with backend API');
            const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const verifyEndpoint = `${backendUrl}/api/auth/verify-token`;
            console.log('Verification endpoint:', verifyEndpoint);

            const response = await fetch(verifyEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Backend verification response status:', response.status);

            // Nếu backend API trả về thành công
            if (response.ok) {
                const userData = await response.json();
                console.log('Backend verification success, user role:', userData.user?.role);

                // Kiểm tra xem user có quyền admin hoặc superadmin không
                if (userData.user && (userData.user.role === 'admin' || userData.user.role === 'superadmin')) {
                    return NextResponse.json({
                        success: true,
                        user: {
                            id: userData.user._id || userData.user.id,
                            email: userData.user.email,
                            name: userData.user.name || `${userData.user.firstName || ''} ${userData.user.lastName || ''}`.trim(),
                            role: userData.user.role
                        }
                    });
                } else {
                    console.log('User không có quyền admin:', userData.user?.role);
                    return NextResponse.json({
                        success: false,
                        error: 'Không có quyền truy cập trang quản trị'
                    }, { status: 403 });
                }
            } else {
                console.log('Backend xác thực không thành công:', response.status);
                return NextResponse.json({
                    success: false,
                    error: 'Token không hợp lệ hoặc hết hạn'
                }, { status: 401 });
            }
        } catch (error) {
            console.error('Lỗi khi xác thực với backend:', error);
            return NextResponse.json({
                success: false,
                error: 'Lỗi kết nối đến máy chủ xác thực'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Lỗi xác thực admin:', error);
        return NextResponse.json({
            success: false,
            error: 'Lỗi xác thực'
        }, { status: 500 });
    }
} 