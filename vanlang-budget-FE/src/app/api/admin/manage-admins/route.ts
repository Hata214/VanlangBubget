import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để lấy danh sách admin
 * @route GET /api/admin/manage-admins
 */
export async function GET(request: NextRequest) {
    try {
        // Lấy dữ liệu từ query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        console.log(`Lấy danh sách admin - trang ${page}, tìm kiếm: ${search}`);

        // Gọi API backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/list`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('Authorization') || '',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Lỗi khi lấy danh sách admin:', error);
            return NextResponse.json({ success: false, message: error.message || 'Không thể lấy danh sách admin' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu:', error);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

/**
 * API endpoint để thêm mới admin
 * @route POST /api/admin/manage-admins
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Gọi API backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('Authorization') || '',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Lỗi khi thêm admin mới:', error);
            return NextResponse.json({ success: false, message: error.message || 'Không thể thêm admin mới' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu:', error);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

/**
 * API endpoint để cập nhật thông tin admin
 * @route PUT /api/admin/manage-admins
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // Gọi API backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('Authorization') || '',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Lỗi khi cập nhật admin:', error);
            return NextResponse.json({ success: false, message: error.message || 'Không thể cập nhật admin' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu:', error);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
}

/**
 * API endpoint để xóa admin
 * @route DELETE /api/admin/manage-admins
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const adminId = searchParams.get('id');

        if (!adminId) {
            return NextResponse.json({ success: false, message: 'ID admin là bắt buộc' }, { status: 400 });
        }

        // Gọi API backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/delete/${adminId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('Authorization') || '',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Lỗi khi xóa admin:', error);
            return NextResponse.json({ success: false, message: error.message || 'Không thể xóa admin' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu:', error);
        return NextResponse.json({ success: false, message: 'Lỗi máy chủ nội bộ' }, { status: 500 });
    }
} 