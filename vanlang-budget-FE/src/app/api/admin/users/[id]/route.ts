import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để lấy thông tin chi tiết người dùng
 * @route GET /api/admin/users/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`,
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
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể lấy thông tin người dùng'
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
 * API endpoint để cập nhật thông tin người dùng
 * @route PUT /api/admin/users/[id]
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        const userData = await request.json();

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
                body: JSON.stringify(userData),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể cập nhật người dùng'
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
 * API endpoint để xóa người dùng
 * @route DELETE /api/admin/users/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể xóa người dùng'
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