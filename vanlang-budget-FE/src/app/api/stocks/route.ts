import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Danh sách cổ phiếu mẫu
        const stocks = [
            { symbol: 'VNM', name: 'Vinamilk', price: 81500, industry: 'Hàng tiêu dùng' },
            { symbol: 'VIC', name: 'Vingroup', price: 43600, industry: 'Bất động sản' },
            { symbol: 'VHM', name: 'Vinhomes', price: 38900, industry: 'Bất động sản' },
            { symbol: 'FPT', name: 'FPT Corp', price: 120500, industry: 'Công nghệ' },
            { symbol: 'MSN', name: 'Masan Group', price: 63800, industry: 'Đa ngành' },
            { symbol: 'VCB', name: 'Vietcombank', price: 91700, industry: 'Ngân hàng' },
            { symbol: 'TCB', name: 'Techcombank', price: 34500, industry: 'Ngân hàng' },
            { symbol: 'MWG', name: 'Thế Giới Di Động', price: 48200, industry: 'Bán lẻ' },
            { symbol: 'HPG', name: 'Hòa Phát Group', price: 21400, industry: 'Thép' },
            { symbol: 'PNJ', name: 'Phú Nhuận Jewelry', price: 98600, industry: 'Bán lẻ' },
            { symbol: 'REE', name: 'Cơ Điện Lạnh', price: 43700, industry: 'Công nghiệp' },
            { symbol: 'VRE', name: 'Vincom Retail', price: 23400, industry: 'Bất động sản' },
            { symbol: 'MBB', name: 'MB Bank', price: 22100, industry: 'Ngân hàng' },
            { symbol: 'VJC', name: 'Vietjet Air', price: 51700, industry: 'Hàng không' },
            { symbol: 'SAB', name: 'Sabeco', price: 143000, industry: 'Đồ uống' },
            { symbol: 'POW', name: 'PetroVietnam Power', price: 11500, industry: 'Năng lượng' },
            { symbol: 'GAS', name: 'PV Gas', price: 91200, industry: 'Dầu khí' },
            { symbol: 'NLG', name: 'Nam Long Group', price: 25400, industry: 'Bất động sản' },
            { symbol: 'SSI', name: 'SSI Securities', price: 24300, industry: 'Chứng khoán' },
            { symbol: 'VND', name: 'VNDirect Securities', price: 17200, industry: 'Chứng khoán' },
            { symbol: 'DXG', name: 'Đất Xanh Group', price: 10900, industry: 'Bất động sản' },
            { symbol: 'DHG', name: 'Dược Hậu Giang', price: 85500, industry: 'Dược phẩm' },
            { symbol: 'PDR', name: 'Phát Đạt Real Estate', price: 18600, industry: 'Bất động sản' },
            { symbol: 'DCM', name: 'Đạm Cà Mau', price: 19200, industry: 'Hóa chất' },
            { symbol: 'BMP', name: 'Nhựa Bình Minh', price: 65800, industry: 'Vật liệu xây dựng' },
            { symbol: 'KDH', name: 'Khang Điền House', price: 28500, industry: 'Bất động sản' },
            { symbol: 'BMI', name: 'Bảo Minh Insurance', price: 25300, industry: 'Bảo hiểm' },
            { symbol: 'VPB', name: 'VPBank', price: 19600, industry: 'Ngân hàng' },
        ];

        // Trả về dữ liệu dưới dạng JSON với định dạng giống API thật
        return NextResponse.json({
            stocks,
            count: stocks.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Lỗi khi xử lý API stocks:', error);
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
            { status: 500 }
        );
    }
} 