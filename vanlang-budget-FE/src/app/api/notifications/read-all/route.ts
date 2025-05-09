import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH() {
    try {
        // Lấy token từ cookie
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            console.error('No token found in cookies');
            return NextResponse.json(
                { error: 'Không tìm thấy token xác thực' },
                { status: 401 }
            );
        }

        // Gọi API backend với headers thích hợp
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('Calling API:', `${apiUrl}/api/notifications/read-all`);

        const response = await fetch(`${apiUrl}/api/notifications/read-all`, {
            method: 'PATCH',
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
                    { error: errorData.message || 'Lỗi khi đánh dấu tất cả thông báo đã đọc' },
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
        console.error('Unexpected error in notifications/read-all API route:', error);
        return NextResponse.json(
            { error: 'Lỗi server không xác định' },
            { status: 500 }
        );
    }
} 