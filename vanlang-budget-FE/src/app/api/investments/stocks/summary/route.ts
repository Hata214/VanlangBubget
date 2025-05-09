import { NextResponse } from 'next/server';
import { stockTransactions } from "../transactions/route";

// Định nghĩa kiểu dữ liệu cho giao dịch cổ phiếu
type StockTransaction = {
    id: string;
    symbol: string;
    price: number;
    quantity: number;
    purchaseDate: string;
    fee: number;
    broker?: string;
    notes?: string;
};

// Định nghĩa cấu trúc dữ liệu cho các ngành nghề
type Industry = {
    name: string;
    value: number;
    percentage: number;
};

// Định nghĩa cấu trúc dữ liệu cho biểu đồ hiệu suất
type PerformancePoint = {
    date: string;
    value: number;
};

// Định nghĩa cấu trúc dữ liệu cho cổ phiếu tốt nhất
type TopStock = {
    symbol: string;
    purchasePrice: number;
    currentPrice: number;
    quantity: number;
    investment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
};

// Định nghĩa dữ liệu tổng hợp đầu tư
type StockSummary = {
    totalInvestment: number;
    currentValue: number;
    profitLoss: number;
    roi: number;
    industries: Industry[];
    performanceHistory: PerformancePoint[];
    topStocks: TopStock[];
};

// Map cổ phiếu với ngành nghề
const stockIndustryMap: Record<string, string> = {
    "VCB": "Ngân hàng",
    "TCB": "Ngân hàng",
    "BID": "Ngân hàng",
    "MBB": "Ngân hàng",
    "FPT": "Công nghệ",
    "VNG": "Công nghệ",
    "CMG": "Công nghệ",
    "VHM": "Bất động sản",
    "VIC": "Bất động sản",
    "NVL": "Bất động sản",
    "KDH": "Bất động sản",
    "HPG": "Thép",
    "HSG": "Thép",
    "MWG": "Bán lẻ",
    "PNJ": "Bán lẻ",
    "VRE": "Bán lẻ",
    "VJC": "Hàng không",
    "HVN": "Hàng không",
    "MSN": "Hàng tiêu dùng",
    "VNM": "Hàng tiêu dùng",
    "SAB": "Đồ uống"
};

// Hàm tạo giá hiện tại giả lập (-15% đến +20% so với giá gốc)
function simulateCurrentPrice(originalPrice: number): number {
    const randomFactor = 0.85 + (Math.random() * 0.35); // Từ 0.85 đến 1.2
    return Math.round(originalPrice * randomFactor);
}

// Hàm tạo lịch sử hiệu suất giả lập cho 12 tháng gần nhất
function generatePerformanceHistory(initialValue: number): PerformancePoint[] {
    const performanceHistory: PerformancePoint[] = [];
    const now = new Date();
    let simulatedValue = initialValue;

    for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthString = monthDate.toISOString().substring(0, 7);

        // Mô phỏng biến động giá trị danh mục qua các tháng
        const monthlyChange = 0.97 + (Math.random() * 0.08); // 97% to 105%
        simulatedValue = simulatedValue * monthlyChange;

        performanceHistory.push({
            date: monthString,
            value: Math.round(simulatedValue)
        });
    }

    return performanceHistory;
}

export async function GET() {
    try {
        // Nếu không có giao dịch, trả về tổng hợp trống
        if (stockTransactions.length === 0) {
            return NextResponse.json({
                success: true,
                summary: {
                    totalInvestment: 0,
                    currentValue: 0,
                    profitLoss: 0,
                    roi: 0,
                    industries: [],
                    performanceHistory: [],
                    topStocks: []
                }
            });
        }

        // Nhóm các giao dịch theo mã cổ phiếu
        const stockGroups = stockTransactions.reduce((acc, transaction) => {
            const { symbol, price, quantity, fee = 0 } = transaction;

            if (!acc[symbol]) {
                acc[symbol] = {
                    symbol,
                    totalQuantity: 0,
                    totalInvestment: 0,
                    transactions: []
                };
            }

            acc[symbol].totalQuantity += quantity;
            acc[symbol].totalInvestment += (price * quantity) + fee;
            acc[symbol].transactions.push(transaction);

            return acc;
        }, {} as Record<string, any>);

        // Tạo dữ liệu tổng hợp cho từng cổ phiếu
        const stockSummaries = Object.values(stockGroups).map((group: any) => {
            const { symbol, totalQuantity, totalInvestment, transactions } = group;

            // Mô phỏng giá hiện tại
            const avgPurchasePrice = totalInvestment / totalQuantity;
            const currentPrice = simulateCurrentPrice(avgPurchasePrice);

            const currentValue = totalQuantity * currentPrice;
            const profitLoss = currentValue - totalInvestment;
            const roi = profitLoss / totalInvestment * 100;

            // Xác định ngành nghề
            const industry = stockIndustryMap[symbol] || "Khác";

            return {
                symbol,
                industry,
                totalQuantity,
                purchasePrice: avgPurchasePrice,
                currentPrice,
                totalInvestment,
                currentValue,
                profitLoss,
                roi
            };
        });

        // Tổng hợp theo ngành nghề
        const industryData: Record<string, number> = {};
        let totalCurrentValue = 0;

        stockSummaries.forEach(stock => {
            if (!industryData[stock.industry]) {
                industryData[stock.industry] = 0;
            }
            industryData[stock.industry] += stock.currentValue;
            totalCurrentValue += stock.currentValue;
        });

        // Chuyển đổi thành định dạng mảng các ngành nghề
        const industries: Industry[] = Object.entries(industryData)
            .filter(([_, value]) => value > 0) // Loại bỏ ngành có giá trị 0
            .map(([name, value]) => ({
                name,
                value,
                percentage: (value / totalCurrentValue) * 100
            }))
            .sort((a, b) => b.value - a.value);

        // Tính tổng đầu tư, giá trị hiện tại và lợi nhuận
        const totalInvestment = stockSummaries.reduce((sum, stock) => sum + stock.totalInvestment, 0);
        const currentValue = stockSummaries.reduce((sum, stock) => sum + stock.currentValue, 0);
        const profitLoss = currentValue - totalInvestment;
        const roi = totalInvestment > 0 ? (profitLoss / totalInvestment) * 100 : 0;

        // Tạo lịch sử hiệu suất đầu tư
        const performanceHistory = generatePerformanceHistory(totalInvestment);

        // Lấy 5 cổ phiếu có ROI cao nhất
        const topStocks = stockSummaries
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 5)
            .map(stock => ({
                symbol: stock.symbol,
                purchasePrice: Math.round(stock.purchasePrice),
                currentPrice: stock.currentPrice,
                quantity: stock.totalQuantity,
                investment: Math.round(stock.totalInvestment),
                currentValue: Math.round(stock.currentValue),
                profitLoss: Math.round(stock.profitLoss),
                roi: Math.round(stock.roi * 100) / 100
            }));

        // Tạo đối tượng tổng hợp
        const summary: StockSummary = {
            totalInvestment: Math.round(totalInvestment),
            currentValue: Math.round(currentValue),
            profitLoss: Math.round(profitLoss),
            roi: Math.round(roi * 100) / 100,
            industries,
            performanceHistory,
            topStocks
        };

        // Trả về kết quả
        return NextResponse.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error("Lỗi khi tạo tổng hợp đầu tư cổ phiếu:", error);
        return NextResponse.json(
            { success: false, error: "Không thể tạo tổng hợp đầu tư cổ phiếu" },
            { status: 500 }
        );
    }
} 