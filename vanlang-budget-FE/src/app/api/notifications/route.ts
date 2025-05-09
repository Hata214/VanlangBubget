import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE_NAME } from '@/services/api';

export async function GET() {
    try {
        // Lấy token từ cookie
        const cookieStore = cookies();
        const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

        if (!token) {
            console.error('No token found in cookies');
            return NextResponse.json(
                { error: 'Không tìm thấy token xác thực' },
                { status: 401 }
            );
        }

        // Gọi API backend với headers thích hợp
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('Calling API:', `${apiUrl}/api/notifications`);
        console.log('With token:', token.substring(0, 15) + '...');

        const response = await fetch(`${apiUrl}/api/notifications`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        // Ghi log response để debug
        console.log('API Response Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                return NextResponse.json(
                    { error: errorData.message || 'Lỗi khi lấy thông báo' },
                    { status: response.status }
                );
            } catch (e) {
                return NextResponse.json(
                    { error: 'Lỗi khi xử lý phản hồi từ server' },
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        console.log('API Response Data structure:', Object.keys(data));

        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error in notifications API route:', error);
        return NextResponse.json(
            { error: 'Lỗi server không xác định' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        // Kiểm tra route là /check-balance
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const isCheckBalance = pathParts[pathParts.length - 1] === 'check-balance';

        // Lấy token từ header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Không tìm thấy token xác thực' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 401 });
        }

        const apiUrl = process.env.API_URL || 'http://localhost:3001';
        let endpoint = '/api/notifications';

        // Nếu là route check-balance, chuyển hướng đúng endpoint
        if (isCheckBalance) {
            endpoint = '/api/notifications/check-balance';
        }

        console.log('Gọi API tới endpoint:', endpoint);

        // Forward request đến backend API
        const response = await fetch(`${apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: isCheckBalance ? null : await request.text()
        });

        console.log('Backend API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend API detailed error:', response.status, errorText);

            try {
                const errorData = JSON.parse(errorText);
                console.error('Detailed error:', errorData);
                return NextResponse.json(
                    { error: errorData.message || 'Lỗi khi tạo thông báo mới' },
                    { status: response.status }
                );
            } catch (e) {
                console.error('Failed to parse error response:', e);
                return NextResponse.json(
                    { error: 'Lỗi khi xử lý phản hồi từ server: ' + errorText },
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error in POST /api/notifications:', error);
        return NextResponse.json(
            { error: 'Lỗi server không xác định: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        // Lấy token từ cookie
        const cookieStore = cookies();
        const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Không tìm thấy token xác thực' },
                { status: 401 }
            );
        }

        // Lấy dữ liệu từ request
        const requestData = await request.json();

        // Gọi API backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData),
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                return NextResponse.json(
                    { error: errorData.message || 'Lỗi khi cập nhật thông báo' },
                    { status: response.status }
                );
            } catch (e) {
                return NextResponse.json(
                    { error: 'Lỗi khi xử lý phản hồi từ server' },
                    { status: response.status }
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Unexpected error in PUT /api/notifications:', error);
        return NextResponse.json(
            { error: 'Lỗi server không xác định' },
            { status: 500 }
        );
    }
} 