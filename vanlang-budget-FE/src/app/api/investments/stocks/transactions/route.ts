import { NextResponse } from 'next/server';
// z is not directly used here anymore if schema is imported, but POST still uses it for result.error.format()
// However, stockTransactionSchema itself is imported, which is fine.
// Let's keep z import for now as POST handler might still need it for error formatting,
// or remove it if stockTransactionSchema is the only thing needed from zod's context here.
// For now, assuming the schema validation result might need z's types for error formatting.
import { z } from 'zod';
import { stockTransactionSchema, stockTransactions } from '../data';

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
            ...result.data,
            fee: result.data.fee ?? 0, // Nếu fee là undefined, dùng 0
            broker: result.data.broker ?? '', // Nếu broker là undefined, dùng chuỗi rỗng
            notes: result.data.notes ?? '', // Nếu notes là undefined, dùng chuỗi rỗng
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
