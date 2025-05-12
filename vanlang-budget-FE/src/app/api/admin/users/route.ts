import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để lấy danh sách người dùng
 * @route GET /api/admin/users
 */
export async function GET(request: NextRequest) {
    try {
        // Lấy thông tin từ query params
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const status = searchParams.get('status') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortDirection = searchParams.get('sortDirection') || 'desc';

        console.log(`Lấy danh sách người dùng - Trang ${page}, Tìm kiếm: ${search}, Vai trò: ${role}, Trạng thái: ${status}`);

        // Xây dựng query params cho backend
        const backendParams = new URLSearchParams();
        backendParams.append('page', page.toString());
        backendParams.append('limit', limit.toString());

        if (search) {
            backendParams.append('search', search);
        }

        if (role) {
            backendParams.append('role', role);
        }

        if (status) {
            backendParams.append('status', status);
        }

        backendParams.append('sortBy', sortBy);
        backendParams.append('sortDirection', sortDirection);

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${backendParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Lỗi khi lấy danh sách người dùng:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể lấy danh sách người dùng'
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
}

/**
 * API endpoint để tạo người dùng mới
 * @route POST /api/admin/users
 */
export async function POST(request: NextRequest) {
    try {
        const userData = await request.json();

        // Kiểm tra dữ liệu đầu vào
        if (!userData.email || !userData.firstName || !userData.lastName || !userData.password) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Thiếu thông tin bắt buộc'
                },
                { status: 400 }
            );
        }

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
                body: JSON.stringify(userData),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Lỗi khi tạo người dùng:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể tạo người dùng mới'
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
} 