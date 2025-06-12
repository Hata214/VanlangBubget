import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const token = getToken();

        const response = await fetch(`${API_URL}/api/investments/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
            return NextResponse.json(
                { error: errorData.message || `Lỗi khi lấy thông tin đầu tư ID: ${id}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error(`Lỗi khi xử lý yêu cầu GET investment/${params.id}:`, error);
        return NextResponse.json(
            { error: error.message || 'Lỗi server' },
            { status: 500 }
        );
    }
}

// Placeholder definitions - bạn cần thay thế bằng mock data và type thật của mình
export interface Transaction {
    id: string;
    type: 'buy' | 'sell'; // Thêm các type khác nếu cần
    quantity: number;
    price: number;
    date: string;
    // Thêm các thuộc tính khác cho Transaction nếu cần
}

export interface Investment {
    id: string;
    name: string;
    quantity: number;
    currentPrice: number;
    initialInvestment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    transactions?: Transaction[];
    updatedAt?: string;
    // Thêm các thuộc tính khác cho Investment nếu cần
}

export const mockInvestments: Investment[] = [
    // Ví dụ:
    // { 
    //   id: '1', name: 'Sample Stock', quantity: 10, currentPrice: 100, 
    //   initialInvestment: 900, currentValue: 1000, profitLoss: 100, roi: 11.11,
    //   transactions: [{ id: 't1', type: 'buy', quantity: 10, price: 90, date: new Date().toISOString() }]
    // }
];

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const token = getToken();

        const response = await fetch(`${API_URL}/api/investments/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
            return NextResponse.json(
                { error: errorData.message || `Lỗi khi xóa đầu tư ID: ${id}` },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true, message: 'Đã xóa đầu tư thành công' });
    } catch (error: any) {
        console.error(`Lỗi khi xử lý yêu cầu DELETE investment/${params.id}:`, error);
        return NextResponse.json(
            { error: error.message || 'Lỗi server' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const token = getToken();
        const data = await request.json();

        const response = await fetch(`${API_URL}/api/investments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
            return NextResponse.json(
                { error: errorData.message || `Lỗi khi cập nhật đầu tư ID: ${id}` },
                { status: response.status }
            );
        }

        const responseData = await response.json();
        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error(`Lỗi khi xử lý yêu cầu PATCH investment/${params.id}:`, error);
        return NextResponse.json(
            { error: error.message || 'Lỗi server' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const token = getToken();
        const data = await request.json();

        const response = await fetch(`${API_URL}/api/investments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
            return NextResponse.json(
                { error: errorData.message || `Lỗi khi cập nhật đầu tư ID: ${id}` },
                { status: response.status }
            );
        }

        const responseData = await response.json();
        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error(`Lỗi khi xử lý yêu cầu PUT investment/${params.id}:`, error);
        return NextResponse.json(
            { error: error.message || 'Lỗi server' },
            { status: 500 }
        );
    }
}
