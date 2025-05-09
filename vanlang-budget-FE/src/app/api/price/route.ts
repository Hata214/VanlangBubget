import { NextRequest, NextResponse } from 'next/server';

// Danh sách cổ phiếu mẫu
const stocks = [
    {
        symbol: 'VNM',
        name: 'Vinamilk',
        price: 81500,
        industry: 'Hàng tiêu dùng',
        description: 'Công ty Cổ phần Sữa Việt Nam, doanh nghiệp sản xuất sữa và các sản phẩm từ sữa hàng đầu Việt Nam',
        founded: 1976
    },
    {
        symbol: 'VIC',
        name: 'Vingroup',
        price: 43600,
        industry: 'Bất động sản',
        description: 'Tập đoàn đa ngành lớn nhất Việt Nam, hoạt động trong lĩnh vực bất động sản, bán lẻ, y tế, giáo dục, công nghệ...',
        founded: 1993
    },
    {
        symbol: 'VHM',
        name: 'Vinhomes',
        price: 38900,
        industry: 'Bất động sản',
        description: 'Công ty phát triển bất động sản nhà ở lớn nhất Việt Nam, thành viên của Tập đoàn Vingroup',
        founded: 2008
    },
    {
        symbol: 'FPT',
        name: 'FPT Corp',
        price: 120500,
        industry: 'Công nghệ',
        description: 'Tập đoàn công nghệ hàng đầu Việt Nam, hoạt động trong lĩnh vực công nghệ thông tin, viễn thông và giáo dục',
        founded: 1988
    },
    {
        symbol: 'MSN',
        name: 'Masan Group',
        price: 63800,
        industry: 'Đa ngành',
        description: 'Tập đoàn kinh tế tư nhân hàng đầu Việt Nam với các lĩnh vực hàng tiêu dùng, khoáng sản, tài chính và bán lẻ',
        founded: 1996
    },
    {
        symbol: 'VCB',
        name: 'Vietcombank',
        price: 91700,
        industry: 'Ngân hàng',
        description: 'Ngân hàng thương mại cổ phần Ngoại thương Việt Nam, một trong những ngân hàng lớn nhất Việt Nam',
        founded: 1963
    },
    {
        symbol: 'TCB',
        name: 'Techcombank',
        price: 34500,
        industry: 'Ngân hàng',
        description: 'Ngân hàng Thương mại Cổ phần Kỹ Thương Việt Nam, một trong những ngân hàng tư nhân hàng đầu Việt Nam',
        founded: 1993
    },
    {
        symbol: 'MWG',
        name: 'Thế Giới Di Động',
        price: 48200,
        industry: 'Bán lẻ',
        description: 'Công ty cổ phần Đầu tư Thế Giới Di Động, nhà bán lẻ điện thoại, điện tử và nhu yếu phẩm lớn nhất Việt Nam',
        founded: 2004
    }
];

export async function GET(request: NextRequest) {
    try {
        // Lấy mã cổ phiếu từ query params
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');

        if (!symbol) {
            return NextResponse.json(
                { error: 'Thiếu tham số symbol' },
                { status: 400 }
            );
        }

        // Tìm cổ phiếu theo mã
        const stock = stocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());

        if (!stock) {
            return NextResponse.json(
                {
                    symbol,
                    price: null,
                    error: 'Không tìm thấy cổ phiếu với mã này',
                    timestamp: new Date().toISOString()
                },
                { status: 404 }
            );
        }

        // Thêm biến động giá ngẫu nhiên (±5%)
        const randomFactor = (Math.random() * 0.1) - 0.05; // -5% to +5%
        const adjustedPrice = Math.round(stock.price * (1 + randomFactor));

        // Trả về thông tin cổ phiếu
        return NextResponse.json({
            symbol: stock.symbol,
            name: stock.name,
            price: adjustedPrice,
            industry: stock.industry,
            description: stock.description,
            founded: stock.founded,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Lỗi khi xử lý API price:', error);
        return NextResponse.json(
            { error: 'Đã xảy ra lỗi khi xử lý yêu cầu' },
            { status: 500 }
        );
    }
} 