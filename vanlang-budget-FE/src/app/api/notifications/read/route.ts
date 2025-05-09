import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE() {
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
        console.log('Calling DELETE read API:', `${apiUrl}/api/notifications/read`);

        const response = await fetch(`${apiUrl}/api/notifications/read`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        // Ghi log response để debug
        console.log('API Response Status:', response.status);

        if (!response.ok) {
            let errorMessage = 'Lỗi khi xóa tất cả thông báo đã đọc';

            try {
                const errorText = await response.text();
                console.error('Error response text:', errorText);

                // Thử phân tích JSON nếu response là JSON
                if (errorText && errorText.trim().startsWith('{')) {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                }
            } catch (e) {
                console.error('Error parsing response:', e);
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: response.status }
            );
        }

        // Trả về thành công nếu không có lỗi
        return NextResponse.json({
            status: 'success',
            message: 'Đã xóa tất cả thông báo đã đọc'
        });
    } catch (error) {
        console.error('Unexpected error in notifications/read DELETE API route:', error);
        return NextResponse.json(
            { error: 'Lỗi server không xác định' },
            { status: 500 }
        );
    }
} 