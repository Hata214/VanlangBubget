import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

export async function POST(request: NextRequest) {
  try {
    // Lấy token từ cookie
    const token = getToken();

    // Lấy dữ liệu từ request
    const data = await request.json();

    // Gửi yêu cầu đến backend
    const response = await fetch(`${API_URL}/api/investments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });

    // Kiểm tra response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      return NextResponse.json(
        { error: errorData.message || 'Lỗi khi thêm khoản đầu tư' },
        { status: response.status }
      );
    }

    // Trả về kết quả
    const responseData = await response.json();
    return NextResponse.json(responseData, { status: response.status });
  } catch (error: any) {
    console.error('Lỗi khi xử lý yêu cầu investments:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Lấy token từ cookie
    const token = getToken();

    // Lấy URL params
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Gửi yêu cầu đến backend
    const response = await fetch(`${API_URL}/api/investments${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    // Kiểm tra response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      return NextResponse.json(
        { error: errorData.message || 'Lỗi khi lấy danh sách đầu tư' },
        { status: response.status }
      );
    }

    // Trả về kết quả
    const responseData = await response.json();
    return NextResponse.json(responseData, { status: response.status });
  } catch (error: any) {
    console.error('Lỗi khi xử lý yêu cầu GET investments:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi server' },
      { status: 500 }
    );
  }
}
