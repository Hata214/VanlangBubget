import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema xác thực dữ liệu cho giao dịch cổ phiếu
const stockTransactionSchema = z.object({
    symbol: z.string().min(1, "Mã cổ phiếu là bắt buộc"),
    price: z.number().positive("Giá mua phải lớn hơn 0"),
    quantity: z.number().int().positive("Số lượng phải là số nguyên dương"),
    purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Định dạng ngày không hợp lệ"),
    fee: z.number().min(0, "Phí giao dịch không được âm").optional(),
    broker: z.string().optional(),
    notes: z.string().optional(),
});

// Mảng lưu trữ tạm thời các giao dịch cổ phiếu
export const stockTransactions = [
    {
        id: "1",
        symbol: "VCB",
        price: 85000,
        quantity: 100,
        purchaseDate: "2023-01-15",
        fee: 85000,
        broker: "SSI",
        notes: "Mua dài hạn"
    },
    {
        id: "2",
        symbol: "FPT",
        price: 110000,
        quantity: 50,
        purchaseDate: "2023-02-20",
        fee: 55000,
        broker: "VPS",
        notes: "Cổ phiếu công nghệ"
    },
    {
        id: "3",
        symbol: "MWG",
        price: 45000,
        quantity: 200,
        purchaseDate: "2023-03-10",
        fee: 90000,
        broker: "VCBS",
        notes: "Tích lũy dài hạn"
    }
];

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            transactions: stockTransactions
        });
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu giao dịch:", error);
        return NextResponse.json(
            { success: false, error: "Không thể lấy dữ liệu giao dịch" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Xác thực dữ liệu đầu vào
        const result = stockTransactionSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error.format() },
                { status: 400 }
            );
        }

        // Tạo giao dịch mới với ID
        const newTransaction = {
            id: Date.now().toString(),
            ...result.data
        };

        // Thêm vào mảng giao dịch
        stockTransactions.push(newTransaction);

        return NextResponse.json({
            success: true,
            message: "Đã thêm giao dịch mới thành công",
            transaction: newTransaction
        });
    } catch (error) {
        console.error("Lỗi khi thêm giao dịch:", error);
        return NextResponse.json(
            { success: false, error: "Không thể thêm giao dịch mới" },
            { status: 500 }
        );
    }
} 