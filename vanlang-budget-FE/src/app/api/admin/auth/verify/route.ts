import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'; // Mark the route as dynamic

/**
 * Xác thực token admin
 * @route GET /api/admin/auth/verify
 */
export async function GET(request: NextRequest) {
    try {
        console.log('==== Admin token verification endpoint called (/verify) ====');

        // Lấy token từ header Authorization
        const headersList = headers();
        const authHeader = headersList.get('Authorization');

        console.log('Auth header received:', authHeader ? 'Yes' : 'No');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('ERROR: Invalid authorization header format');
            return NextResponse.json({
                success: false,
                error: 'Token không hợp lệ'
            }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token extracted:', token ? `${token.substring(0, 15)}...` : 'invalid');

        // Thêm log để debug
        console.log('Đang xác thực token admin trong /verify endpoint:', {
            tokenLength: token?.length,
            tokenStart: token?.substring(0, 15),
            isMockToken: token?.startsWith('mock_')
        });

        // Xử lý token giả lập
        if (token.startsWith('mock_')) {
            // Kiểm tra token giả lập có hợp lệ không
            if (token.includes('superadmin')) {
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
                return NextResponse.json({
                    success: false,
                    error: 'Token không hợp lệ'
                }, { status: 401 });
            }
        }

        // Gọi API backend để xác thực token thật
        try {
            console.log('Verifying real token with backend API');
            const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';
            const verifyEndpoint = `${backendUrl}/api/auth/verify-token`;
            console.log('Verification endpoint:', verifyEndpoint);

            const response = await fetch(verifyEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Backend verification response status:', response.status);

            if (!response.ok) {
                console.log('ERROR: Backend verification failed with status:', response.status);
                return NextResponse.json({
                    success: false,
                    error: 'Token không hợp lệ hoặc hết hạn'
                }, { status: 401 });
            }

            // Nếu backend API trả về thành công
            const userData = await response.json();
            console.log('Backend verification response data:', JSON.stringify(userData));
            console.log('User role from response:', userData?.user?.role);

            // Kiểm tra xem user có quyền admin hoặc superadmin không
            if (userData.success && userData.user &&
                (userData.user.role === 'admin' || userData.user.role === 'superadmin')) {
                console.log('SUCCESS: User has admin privileges, role:', userData.user.role);

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
                console.log('ERROR: User does not have admin privileges:', userData.user?.role);
                return NextResponse.json({
                    success: false,
                    error: 'Không có quyền truy cập trang quản trị'
                }, { status: 403 });
            }
        } catch (error) {
            console.error('ERROR: Failed to verify token with backend:', error);
            return NextResponse.json({
                success: false,
                error: 'Lỗi kết nối đến máy chủ xác thực'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('CRITICAL ERROR in admin verification endpoint:', error);
        return NextResponse.json({
            success: false,
            error: 'Lỗi xác thực'
        }, { status: 500 });
    }
}
