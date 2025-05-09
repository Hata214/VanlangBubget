import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/options';

// Interface cho khoản đầu tư
export interface Investment {
    _id?: string | ObjectId;
    type: 'stock' | 'gold' | 'crypto' | string;
    assetName: string;
    symbol: string;
    currentPrice: number;
    quantity: number;
    initialInvestment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    transactions?: Transaction[];
    userId?: string;
}

// Định nghĩa kiểu Transaction
export interface Transaction {
    _id?: string | ObjectId;
    type: 'buy' | 'sell';
    price: number;
    quantity: number;
    date: string;
    fee?: number;
    notes?: string;
    investmentId?: string | ObjectId;
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Tạm thời không sử dụng xác thực
        // const session = await getServerSession(authOptions);
        // if (!session) {
        //     return NextResponse.json(
        //         { success: false, message: 'Không có quyền truy cập' },
        //         { status: 401 }
        //     );
        // }
        // const userId = session.user.id;

        // Tạm thời sử dụng user ID cố định cho mục đích demo
        const userId = "user-demo-123";

        const id = params.id;

        // Kết nối database
        const { db } = await connectToDatabase();
        const investmentsCollection = db.collection('investments');
        const transactionsCollection = db.collection('transactions');

        // Tìm đầu tư trong database
        const investment = await investmentsCollection.findOne({
            _id: new ObjectId(id),
            userId
        });

        if (!investment) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy khoản đầu tư' },
                { status: 404 }
            );
        }

        // Lấy các giao dịch liên quan
        const transactions = await transactionsCollection
            .find({
                investmentId: new ObjectId(id)
            })
            .toArray();

        // Định dạng ID về chuỗi
        const formattedInvestment = {
            ...investment,
            _id: investment._id.toString(),
            transactions: transactions.map(tx => ({
                ...tx,
                _id: tx._id.toString(),
                investmentId: tx.investmentId.toString()
            }))
        };

        return NextResponse.json({ success: true, data: formattedInvestment });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đầu tư:', error);
        return NextResponse.json(
            { success: false, message: 'Không thể lấy chi tiết đầu tư' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Tạm thời không sử dụng xác thực
        // const session = await getServerSession(authOptions);
        // if (!session) {
        //     return NextResponse.json(
        //         { success: false, message: 'Không có quyền truy cập' },
        //         { status: 401 }
        //     );
        // }
        // const userId = session.user.id;

        // Tạm thời sử dụng user ID cố định cho mục đích demo
        const userId = "user-demo-123";

        const id = params.id;

        // Kết nối database
        const { db } = await connectToDatabase();
        const investmentsCollection = db.collection('investments');
        const transactionsCollection = db.collection('transactions');

        // Kiểm tra xem đầu tư có tồn tại và thuộc về người dùng không
        const investment = await investmentsCollection.findOne({
            _id: new ObjectId(id),
            userId
        });

        if (!investment) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy khoản đầu tư' },
                { status: 404 }
            );
        }

        // Xóa tất cả giao dịch liên quan
        await transactionsCollection.deleteMany({
            investmentId: new ObjectId(id)
        });

        // Xóa đầu tư
        await investmentsCollection.deleteOne({
            _id: new ObjectId(id)
        });

        return NextResponse.json({
            success: true,
            message: 'Xóa khoản đầu tư thành công',
            data: { id }
        });
    } catch (error) {
        console.error('Lỗi khi xóa khoản đầu tư:', error);
        return NextResponse.json(
            { success: false, message: 'Không thể xóa khoản đầu tư' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // Tạm thời không sử dụng xác thực
        // const session = await getServerSession(authOptions);
        // if (!session) {
        //     return NextResponse.json(
        //         { success: false, message: 'Không có quyền truy cập' },
        //         { status: 401 }
        //     );
        // }
        // const userId = session.user.id;

        // Tạm thời sử dụng user ID cố định cho mục đích demo
        const userId = "user-demo-123";

        const id = params.id;
        const data = await request.json();

        // Kết nối database
        const { db } = await connectToDatabase();
        const investmentsCollection = db.collection('investments');

        // Kiểm tra xem đầu tư có tồn tại và thuộc về người dùng không
        const investment = await investmentsCollection.findOne({
            _id: new ObjectId(id),
            userId
        });

        if (!investment) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy khoản đầu tư' },
                { status: 404 }
            );
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = {
            ...data,
            updatedAt: new Date().toISOString()
        };

        // Nếu cập nhật giá hiện tại, tính lại giá trị và lợi nhuận
        if (data.currentPrice !== undefined) {
            updateData.currentValue = investment.quantity * data.currentPrice;
            updateData.profitLoss = updateData.currentValue - investment.initialInvestment;
            updateData.roi = investment.initialInvestment > 0
                ? (updateData.profitLoss / investment.initialInvestment) * 100
                : 0;
        }

        // Cập nhật trong database
        const result = await investmentsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Không thể cập nhật khoản đầu tư' },
                { status: 404 }
            );
        }

        // Lấy đầu tư đã cập nhật
        const updatedInvestment = await investmentsCollection.findOne({
            _id: new ObjectId(id)
        });

        if (!updatedInvestment) {
            return NextResponse.json(
                { success: false, message: 'Không thể lấy thông tin khoản đầu tư sau khi cập nhật' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Cập nhật khoản đầu tư thành công',
            data: {
                ...updatedInvestment,
                _id: updatedInvestment._id.toString()
            }
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật khoản đầu tư:', error);
        return NextResponse.json(
            { success: false, message: 'Không thể cập nhật khoản đầu tư' },
            { status: 500 }
        );
    }
} 