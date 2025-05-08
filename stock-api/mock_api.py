from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
from datetime import datetime

app = FastAPI()

# Thêm CORS middleware để cho phép Next.js gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Dữ liệu giả lập cho các mã chứng khoán Việt Nam
MOCK_DATA = {
    # Ngân hàng
    "VCB": {
        "name": "Vietcombank", 
        "base_price": 85000,
        "description": "Ngân hàng TMCP Ngoại thương Việt Nam, một trong những ngân hàng lớn nhất Việt Nam",
        "industry": "Ngân hàng",
        "founded": 1963
    },
    "BID": {
        "name": "BIDV", 
        "base_price": 45000,
        "description": "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam, tập trung vào lĩnh vực đầu tư và phát triển",
        "industry": "Ngân hàng",
        "founded": 1957
    },
    "CTG": {
        "name": "VietinBank", 
        "base_price": 30000,
        "description": "Ngân hàng TMCP Công Thương Việt Nam, một trong bốn ngân hàng thương mại quốc doanh lớn nhất",
        "industry": "Ngân hàng",
        "founded": 1988
    },
    "TCB": {
        "name": "Techcombank", 
        "base_price": 45000,
        "description": "Ngân hàng TMCP Kỹ Thương Việt Nam, ngân hàng tư nhân hàng đầu Việt Nam",
        "industry": "Ngân hàng",
        "founded": 1993
    },
    "MBB": {
        "name": "MB Bank", 
        "base_price": 25000,
        "description": "Ngân hàng TMCP Quân Đội, thành lập bởi Quân đội Nhân dân Việt Nam",
        "industry": "Ngân hàng",
        "founded": 1994
    },
    
    # Bất động sản
    "VIC": {
        "name": "Vingroup", 
        "base_price": 60000,
        "description": "Tập đoàn Vingroup, tập đoàn đa ngành lớn nhất Việt Nam với hoạt động chính trong lĩnh vực bất động sản",
        "industry": "Bất động sản",
        "founded": 1993
    },
    "NVL": {
        "name": "Novaland", 
        "base_price": 15000,
        "description": "Tập đoàn Novaland, một trong những nhà phát triển bất động sản lớn nhất Việt Nam",
        "industry": "Bất động sản",
        "founded": 1992
    },
    "PDR": {
        "name": "Phát Đạt", 
        "base_price": 18000,
        "description": "Công ty Cổ phần Phát triển Bất động sản Phát Đạt, chuyên về phát triển bất động sản đô thị",
        "industry": "Bất động sản",
        "founded": 2004
    },
    
    # Thực phẩm và đồ uống
    "VNM": {
        "name": "Vinamilk", 
        "base_price": 80000,
        "description": "Công ty Cổ phần Sữa Việt Nam, doanh nghiệp sản xuất sữa và các sản phẩm từ sữa hàng đầu Việt Nam",
        "industry": "Thực phẩm & Đồ uống",
        "founded": 1976
    },
    "SAB": {
        "name": "Sabeco", 
        "base_price": 155000,
        "description": "Tổng Công ty Cổ phần Bia - Rượu - Nước giải khát Sài Gòn, nhà sản xuất bia lớn nhất Việt Nam",
        "industry": "Đồ uống",
        "founded": 1977
    },
    "MSN": {
        "name": "Masan Group", 
        "base_price": 92000,
        "description": "Tập đoàn Masan, tập đoàn tư nhân hàng đầu với các lĩnh vực thực phẩm, đồ uống và tài nguyên",
        "industry": "Thực phẩm & Hàng tiêu dùng",
        "founded": 1996
    },
    
    # Sản xuất
    "HPG": {
        "name": "Hòa Phát Group", 
        "base_price": 25000,
        "description": "Tập đoàn Hòa Phát, tập đoàn sản xuất thép và các sản phẩm thép lớn nhất Việt Nam",
        "industry": "Thép & Kim loại",
        "founded": 1992
    },
    "GEX": {
        "name": "GELEX Group", 
        "base_price": 24000,
        "description": "Tổng Công ty Cổ phần Thiết bị Điện Việt Nam, sản xuất thiết bị điện và đầu tư hạ tầng",
        "industry": "Điện & Điện tử",
        "founded": 1990
    },
    
    # Dầu khí và năng lượng
    "GAS": {
        "name": "PV Gas", 
        "base_price": 95000,
        "description": "Tổng Công ty Khí Việt Nam, đơn vị kinh doanh khí đốt lớn nhất Việt Nam",
        "industry": "Năng lượng",
        "founded": 1990
    },
    "POW": {
        "name": "PetroVietnam Power", 
        "base_price": 13000,
        "description": "Tổng Công ty Điện lực Dầu khí Việt Nam, nhà sản xuất và cung cấp điện năng lớn thứ hai Việt Nam",
        "industry": "Năng lượng",
        "founded": 2007
    },
    "PLX": {
        "name": "Petrolimex", 
        "base_price": 50000,
        "description": "Tập đoàn Xăng dầu Việt Nam, doanh nghiệp kinh doanh xăng dầu lớn nhất Việt Nam",
        "industry": "Năng lượng",
        "founded": 1956
    },
    
    # Công nghệ
    "FPT": {
        "name": "FPT Corporation", 
        "base_price": 90000,
        "description": "Tập đoàn FPT, tập đoàn công nghệ lớn nhất Việt Nam chuyên về phần mềm, viễn thông và giáo dục",
        "industry": "Công nghệ thông tin",
        "founded": 1988
    },
    "CMG": {
        "name": "CMC Group", 
        "base_price": 48000,
        "description": "Công ty Cổ phần Tập đoàn Công nghệ CMC, cung cấp dịch vụ CNTT và viễn thông",
        "industry": "Công nghệ thông tin",
        "founded": 1993
    },
    "VNG": {
        "name": "VNG Corporation", 
        "base_price": 120000,
        "description": "Công ty Cổ phần VNG, công ty công nghệ internet lớn nhất Việt Nam với các sản phẩm: Zalo, ZaloPay",
        "industry": "Công nghệ thông tin",
        "founded": 2004
    },
    
    # Bán lẻ
    "MWG": {
        "name": "Mobile World", 
        "base_price": 45000,
        "description": "Công ty Cổ phần Đầu tư Thế Giới Di Động, chuỗi bán lẻ điện thoại, điện máy lớn nhất Việt Nam",
        "industry": "Bán lẻ",
        "founded": 2004
    },
    "PNJ": {
        "name": "Phú Nhuận Jewelry", 
        "base_price": 110000,
        "description": "Công ty Cổ phần Vàng bạc Đá quý Phú Nhuận, nhà sản xuất và bán lẻ trang sức lớn nhất Việt Nam",
        "industry": "Bán lẻ",
        "founded": 1988
    }
}

@app.get("/api/price")
def get_stock_price(symbol: str = "VNM"):
    """
    API giả lập lấy giá cổ phiếu.
    
    Args:
        symbol: Mã cổ phiếu (mặc định: VNM)
        
    Returns:
        Giá cổ phiếu giả lập với biến động ngẫu nhiên
    """
    symbol = symbol.upper()
    
    if symbol in MOCK_DATA:
        # Tạo biến động giá ngẫu nhiên ±5%
        variation = random.uniform(-0.05, 0.05)
        base_price = MOCK_DATA[symbol]["base_price"]
        current_price = base_price * (1 + variation)
        
        return {
            "symbol": symbol,
            "price": round(current_price, 2),
            "name": MOCK_DATA[symbol]["name"],
            "description": MOCK_DATA[symbol]["description"],
            "industry": MOCK_DATA[symbol]["industry"],
            "founded": MOCK_DATA[symbol]["founded"],
            "timestamp": datetime.now().isoformat()
        }
    else:
        return {
            "symbol": symbol,
            "price": None,
            "error": f"Không tìm thấy dữ liệu cho mã {symbol}"
        }

@app.get("/api/stocks")
def get_all_stocks():
    """
    API lấy danh sách tất cả các mã cổ phiếu.
    
    Returns:
        Danh sách các mã cổ phiếu và thông tin cơ bản
    """
    stocks = []
    for symbol, data in MOCK_DATA.items():
        # Tạo biến động giá ngẫu nhiên ±5%
        variation = random.uniform(-0.05, 0.05)
        base_price = data["base_price"]
        current_price = base_price * (1 + variation)
        
        stocks.append({
            "symbol": symbol,
            "name": data["name"],
            "price": round(current_price, 2),
            "industry": data["industry"]
        })
    
    # Sắp xếp theo mã chứng khoán
    stocks.sort(key=lambda x: x["symbol"])
    
    return {
        "stocks": stocks,
        "count": len(stocks),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/")
def read_root():
    return {
        "message": "Mock Stock API Service",
        "endpoints": [
            "/api/price?symbol=CODE",
            "/api/stocks"
        ],
        "available_symbols": list(MOCK_DATA.keys()),
        "industries": list(set(data["industry"] for data in MOCK_DATA.values()))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 