import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint để test activity logs
 * @route GET /api/admin/test-logs
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🔄 Testing activity logs...');

        // Gọi API backend
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/test-logs`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': request.headers.get('Authorization') || '',
                },
            }
        );

        console.log('📡 Backend response status:', response.status);

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Backend error:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: error.message || 'Không thể test activity logs'
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('✅ Test logs result:', data);
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('❌ Test logs error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi máy chủ nội bộ'
            },
            { status: 500 }
        );
    }
}
