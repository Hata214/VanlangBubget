import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '../../auth/[...nextauth]/options';

// Schema xác thực cho dữ liệu đầu tư cổ phiếu
const stockInvestmentSchema = z.object({
    symbol: z.string().min(1, "Mã cổ phiếu là bắt buộc"),
    companyName: z.string().optional(),
    price: z.number().positive("Giá phải lớn hơn 0"),
    quantity: z.number().int().positive("Số lượng phải là số nguyên dương"),
    purchaseDate: z.string().or(z.date()),
    fee: z.number().min(0, "Phí không được âm").optional(),
    broker: z.string().optional(),
    notes: z.string().optional(),
    industry: z.string().optional(),
    currentPrice: z.number().positive().optional(),
});

// Định nghĩa kiểu dữ liệu
export interface StockInvestment {
    _id?: string | ObjectId;
    symbol: string;
    companyName?: string;
    price: number;
    quantity: number;
    purchaseDate: string;
    fee?: number;
    broker?: string;
    notes?: string;
    industry?: string;
    currentPrice?: number;
    userId: string;
    createdAt: string;
    updatedAt?: string;
}

export async function GET() {
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

        // Kết nối database
        const { db } = await connectToDatabase();
        const stocksCollection = db.collection('stockInvestments');

        // Lấy tất cả đầu tư cổ phiếu của người dùng
        const stocks = await stocksCollection
            .find({ userId })
            .toArray();

        // Định dạng ID về chuỗi
        const formattedStocks = stocks.map(stock => ({
            ...stock,
            _id: stock._id.toString()
        }));

        return NextResponse.json({
            success: true,
            investments: formattedStocks,
            count: formattedStocks.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu đầu tư cổ phiếu:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể lấy dữ liệu đầu tư cổ phiếu' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
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

        const data = await request.json();

        // Xác thực dữ liệu đầu vào
        const validationResult = stockInvestmentSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { success: false, message: "Dữ liệu không hợp lệ", errors: validationResult.error.format() },
                { status: 400 }
            );
        }

        const validatedData = validationResult.data;

        // Chuẩn bị dữ liệu để lưu vào database
        const newStockInvestment: StockInvestment = {
            ...validatedData,
            // Đảm bảo purchaseDate luôn là chuỗi
            purchaseDate: validatedData.purchaseDate instanceof Date
                ? validatedData.purchaseDate.toISOString()
                : validatedData.purchaseDate,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Kết nối database
        const { db } = await connectToDatabase();
        const stocksCollection = db.collection('stockInvestments');

        // Thêm vào collection stockInvestments
        const result = await stocksCollection.insertOne(newStockInvestment as any);

        // Thêm vào collection investments chung
        const investmentsCollection = db.collection('investments');
        const newInvestment = {
            type: 'stock',
            assetName: validatedData.companyName || validatedData.symbol,
            symbol: validatedData.symbol,
            currentPrice: validatedData.currentPrice || validatedData.price,
            totalQuantity: validatedData.quantity,
            initialInvestment: validatedData.price * validatedData.quantity + (validatedData.fee || 0),
            currentValue: (validatedData.currentPrice || validatedData.price) * validatedData.quantity,
            profitLoss: ((validatedData.currentPrice || validatedData.price) * validatedData.quantity) -
                (validatedData.price * validatedData.quantity + (validatedData.fee || 0)),
            roi: ((((validatedData.currentPrice || validatedData.price) * validatedData.quantity) -
                (validatedData.price * validatedData.quantity + (validatedData.fee || 0))) /
                (validatedData.price * validatedData.quantity + (validatedData.fee || 0))) * 100,
            userId,
            transactions: [],
            notes: validatedData.notes,
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await investmentsCollection.insertOne(newInvestment);

        // Định dạng ID về chuỗi
        return NextResponse.json(
            {
                success: true,
                message: 'Thêm đầu tư cổ phiếu thành công',
                data: {
                    ...newStockInvestment,
                    _id: result.insertedId.toString()
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Lỗi khi thêm đầu tư cổ phiếu:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể thêm đầu tư cổ phiếu' },
            { status: 500 }
        );
    }
} 