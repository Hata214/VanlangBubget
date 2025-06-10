import { z } from 'zod';

// Schema xác thực dữ liệu cho giao dịch cổ phiếu (được chuyển từ transactions/route.ts)
export const stockTransactionSchema = z.object({
    symbol: z.string().min(1, "Mã cổ phiếu là bắt buộc"),
    price: z.number().positive("Giá mua phải lớn hơn 0"),
    quantity: z.number().int().positive("Số lượng phải là số nguyên dương"),
    purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Định dạng ngày không hợp lệ"),
    fee: z.number().min(0, "Phí giao dịch không được âm").optional(),
    broker: z.string().optional(),
    notes: z.string().optional(),
});

// Định nghĩa kiểu dữ liệu từ schema
export type StockTransaction = z.infer<typeof stockTransactionSchema> & { id: string };

// Mảng lưu trữ tạm thời các giao dịch cổ phiếu (được chuyển từ transactions/route.ts)
export const stockTransactions: StockTransaction[] = [
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
