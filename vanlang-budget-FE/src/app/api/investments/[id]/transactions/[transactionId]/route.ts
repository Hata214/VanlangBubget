import { NextResponse } from 'next/server';
import { z } from 'zod';

// Import từ file types/investment.ts thay vì từ route
import { Investment, InvestmentTransaction } from '@/types/investment';

// Schema validation cho cập nhật giao dịch
const updateTransactionSchema = z.object({
    price: z.number().min(0, 'Giá phải lớn hơn hoặc bằng 0').optional(),
    quantity: z.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0').optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Ngày giao dịch không hợp lệ',
    }).optional(),
    fee: z.number().min(0).optional(),
    notes: z.string().optional(),
});

// Mock data tạm thời cho API này
const mockInvestments: Investment[] = [];

export async function GET(
    request: Request,
    { params }: { params: { id: string, transactionId: string } }
) {
    try {
        const { id, transactionId } = params;

        // Tìm đầu tư trong mock data
        const investment = mockInvestments.find((inv) => inv.id === id);

        if (!investment) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy khoản đầu tư' },
                { status: 404 }
            );
        }

        // Kiểm tra xem có mảng giao dịch không
        if (!investment.transactions) {
            return NextResponse.json(
                { success: false, message: 'Không có giao dịch nào' },
                { status: 404 }
            );
        }

        // Tìm giao dịch
        const transaction = investment.transactions.find((t) => t.id === transactionId);

        if (!transaction) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy giao dịch' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết giao dịch:', error);
        return NextResponse.json(
            { success: false, message: 'Không thể lấy chi tiết giao dịch' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string, transactionId: string } }
) {
    try {
        const { id, transactionId } = params;

        // Tìm đầu tư trong mock data
        const investment = mockInvestments.find((inv) => inv.id === id);

        if (!investment) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy khoản đầu tư' },
                { status: 404 }
            );
        }

        // Kiểm tra xem có mảng giao dịch không
        if (!investment.transactions || investment.transactions.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Không có giao dịch nào' },
                { status: 404 }
            );
        }

        // Tìm vị trí của giao dịch
        const transactionIndex = investment.transactions.findIndex((t) => t.id === transactionId);

        if (transactionIndex === -1) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy giao dịch' },
                { status: 404 }
            );
        }

        // Lưu thông tin giao dịch trước khi xóa để làm ngược lại các ảnh hưởng của nó
        const deletedTransaction = investment.transactions[transactionIndex];

        // Xóa giao dịch
        investment.transactions.splice(transactionIndex, 1);

        // Cập nhật lại đầu tư sau khi xóa giao dịch
        if (deletedTransaction) {
            updateInvestmentAfterDeleteTransaction(investment, deletedTransaction);
        }

        return NextResponse.json({
            success: true,
            message: 'Xóa giao dịch thành công',
            data: { id: transactionId }
        });
    } catch (error) {
        console.error('Lỗi khi xóa giao dịch:', error);
        return NextResponse.json(
            { success: false, message: 'Không thể xóa giao dịch' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string, transactionId: string } }
) {
    try {
        const { id, transactionId } = params;
        const data = await request.json();

        // Validate dữ liệu
        const validationResult = updateTransactionSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { success: false, message: 'Dữ liệu không hợp lệ', errors: validationResult.error.format() },
                { status: 400 }
            );
        }

        const validatedData = validationResult.data;

        // Tìm đầu tư trong mock data
        const investment = mockInvestments.find((inv) => inv.id === id);

        if (!investment) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy khoản đầu tư' },
                { status: 404 }
            );
        }

        // Kiểm tra xem có mảng giao dịch không
        if (!investment.transactions) {
            return NextResponse.json(
                { success: false, message: 'Không có giao dịch nào' },
                { status: 404 }
            );
        }

        // Tìm giao dịch
        const transaction = investment.transactions.find((t) => t.id === transactionId);

        if (!transaction) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy giao dịch' },
                { status: 404 }
            );
        }

        // Lưu trạng thái trước khi cập nhật
        const oldTransaction = { ...transaction };

        // Cập nhật giao dịch
        Object.assign(transaction, validatedData);

        // Cập nhật đầu tư sau khi sửa giao dịch
        updateInvestmentAfterEditTransaction(investment, oldTransaction, transaction);

        return NextResponse.json({
            success: true,
            message: 'Cập nhật giao dịch thành công',
            data: transaction
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật giao dịch:', error);
        return NextResponse.json(
            { success: false, message: 'Không thể cập nhật giao dịch' },
            { status: 500 }
        );
    }
}

// Hàm cập nhật đầu tư sau khi xóa giao dịch
function updateInvestmentAfterDeleteTransaction(investment: Investment, transaction: InvestmentTransaction): void {
    // Kiểm tra xem transaction và transaction.type có tồn tại không
    if (!transaction || typeof transaction.type === 'undefined') {
        console.error('Giao dịch không hợp lệ:', transaction);
        return;
    }

    // Đảo ngược ảnh hưởng của giao dịch
    if (transaction.type === 'buy') {
        // Nếu đã mua, xóa sẽ giảm số lượng
        investment.totalQuantity = Math.max(0, investment.totalQuantity - (transaction.quantity || 0));
    } else if (transaction.type === 'sell') {
        // Nếu đã bán, xóa sẽ tăng số lượng
        investment.totalQuantity += (transaction.quantity || 0);
    }

    // Cập nhật giá trị hiện tại
    investment.currentValue = investment.totalQuantity * investment.currentPrice;

    // Cập nhật lợi nhuận
    investment.profitLoss = investment.currentValue - investment.initialInvestment;

    // Cập nhật ROI
    investment.roi = investment.initialInvestment > 0
        ? (investment.profitLoss / investment.initialInvestment) * 100
        : 0;

    // Cập nhật thời gian
    investment.updatedAt = new Date().toISOString();
}

// Hàm cập nhật đầu tư sau khi sửa giao dịch
function updateInvestmentAfterEditTransaction(investment: Investment, oldTransaction: InvestmentTransaction, newTransaction: InvestmentTransaction): void {
    // Kiểm tra xem các đối tượng giao dịch có hợp lệ không
    if (!oldTransaction || !newTransaction || typeof newTransaction.type === 'undefined') {
        console.error('Giao dịch không hợp lệ:', { oldTransaction, newTransaction });
        return;
    }

    // Nếu số lượng thay đổi
    if (oldTransaction.quantity !== newTransaction.quantity) {
        const quantityDiff = (newTransaction.quantity || 0) - (oldTransaction.quantity || 0);

        if (newTransaction.type === 'buy') {
            // Nếu là mua, tăng hoặc giảm số lượng theo sự thay đổi
            investment.totalQuantity += quantityDiff;
        } else if (newTransaction.type === 'sell') {
            // Nếu là bán, giảm hoặc tăng số lượng (ngược lại so với mua)
            investment.totalQuantity -= quantityDiff;
        }
    }

    // Cập nhật giá trị hiện tại
    investment.currentValue = investment.totalQuantity * investment.currentPrice;

    // Cập nhật lợi nhuận
    investment.profitLoss = investment.currentValue - investment.initialInvestment;

    // Cập nhật ROI
    investment.roi = investment.initialInvestment > 0
        ? (investment.profitLoss / investment.initialInvestment) * 100
        : 0;

    // Cập nhật thời gian
    investment.updatedAt = new Date().toISOString();
} 