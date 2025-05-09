import { NextResponse } from "next/server";

// Định nghĩa kiểu dữ liệu cho giá vàng
interface GoldPrice {
    type: string;
    brand: string;
    buy: number;
    sell: number;
    updated_at: string;
    price_change?: number;
}

// API endpoint lấy giá vàng mới nhất - hiện đã bị vô hiệu hóa
export async function GET() {
    try {
        // Trả về một thông báo tính năng tạm thời bị vô hiệu hóa
        return NextResponse.json(
            {
                message: "Tính năng xem giá vàng hiện đã bị vô hiệu hóa. Vui lòng tự nhập thông tin vàng của bạn.",
                disabled: true
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    } catch (error) {
        console.error("Lỗi khi xử lý yêu cầu:", error);

        // Trả về thông báo lỗi
        return NextResponse.json(
            { message: "Tính năng xem giá vàng hiện đã bị vô hiệu hóa", disabled: true },
            {
                status: 200,  // Vẫn trả về 200 để tránh lỗi ở client
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    }
} 