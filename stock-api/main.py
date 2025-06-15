from fastapi import FastAPI
from vnstock import stock_intraday_data
from fastapi.middleware.cors import CORSMiddleware
import os # Quan trọng: import os để truy cập biến môi trường
import random
from datetime import datetime

app = FastAPI()

# Lấy FRONTEND_URL từ biến môi trường.
# Nếu không có, có thể đặt một giá trị mặc định cho local development
# hoặc một danh sách rỗng nếu bạn muốn bắt buộc phải có FRONTEND_URL trong production.
frontend_url_env = os.getenv("FRONTEND_URL")

# Mặc định cho local development nếu FRONTEND_URL không được set
default_local_origins = [
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://vlb-vanlang-budget.vercel.app"  # Thêm frontend Vercel
]

allowed_origins = []
if frontend_url_env:
    # Giả sử FRONTEND_URL có thể chứa nhiều URL cách nhau bởi dấu phẩy
    allowed_origins.extend([origin.strip() for origin in frontend_url_env.split(',')])
    # Luôn thêm Vercel URL để đảm bảo
    if "https://vlb-vanlang-budget.vercel.app" not in allowed_origins:
        allowed_origins.append("https://vlb-vanlang-budget.vercel.app")
else:
    # Chỉ sử dụng default_local_origins nếu không có FRONTEND_URL (ví dụ: khi chạy local)
    # Trong môi trường production trên Render, FRONTEND_URL NÊN được đặt.
    allowed_origins.extend(default_local_origins)
    print("Cảnh báo: Biến môi trường FRONTEND_URL không được đặt. Sử dụng origin mặc định cho local development.")


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, # Sử dụng danh sách đã xử lý
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"], # Hoặc ["*"]
    allow_headers=["*"], # Hoặc chỉ định cụ thể
)

# Dữ liệu giả lập cho các mã chứng khoán Việt Nam
MOCK_STOCKS = {
    "VCB": {"name": "Vietcombank", "base_price": 85000, "industry": "Ngân hàng"},
    "BID": {"name": "BIDV", "base_price": 45000, "industry": "Ngân hàng"},
    "CTG": {"name": "VietinBank", "base_price": 30000, "industry": "Ngân hàng"},
    "TCB": {"name": "Techcombank", "base_price": 45000, "industry": "Ngân hàng"},
    "MBB": {"name": "MB Bank", "base_price": 25000, "industry": "Ngân hàng"},
    "VIC": {"name": "Vingroup", "base_price": 60000, "industry": "Bất động sản"},
    "NVL": {"name": "Novaland", "base_price": 15000, "industry": "Bất động sản"},
    "VNM": {"name": "Vinamilk", "base_price": 80000, "industry": "Thực phẩm & Đồ uống"},
    "SAB": {"name": "Sabeco", "base_price": 155000, "industry": "Đồ uống"},
    "MSN": {"name": "Masan Group", "base_price": 92000, "industry": "Thực phẩm & Hàng tiêu dùng"},
    "HPG": {"name": "Hòa Phát Group", "base_price": 25000, "industry": "Thép & Kim loại"},
    "GAS": {"name": "PV Gas", "base_price": 95000, "industry": "Năng lượng"},
    "PLX": {"name": "Petrolimex", "base_price": 50000, "industry": "Năng lượng"},
    "FPT": {"name": "FPT Corporation", "base_price": 90000, "industry": "Công nghệ thông tin"},
    "MWG": {"name": "Mobile World", "base_price": 45000, "industry": "Bán lẻ"},
    "PNJ": {"name": "Phú Nhuận Jewelry", "base_price": 110000, "industry": "Bán lẻ"}
}

@app.get("/api/price")
def get_stock_price(symbol: str = "VNM"):
    """
    Lấy giá hiện tại của một mã chứng khoán.
    
    Args:
        symbol: Mã chứng khoán (mặc định là VNM)
        
    Returns:
        Giá đóng cửa mới nhất của mã chứng khoán
    """
    try:
        # Thử lấy dữ liệu thật từ vnstock
        df = stock_intraday_data(symbol=symbol, page_size=1)
        if not df.empty:
            return {"symbol": symbol, "price": float(df.iloc[-1]['close'])}
        
        # Nếu không có dữ liệu thật, dùng mock data
        symbol_upper = symbol.upper()
        if symbol_upper in MOCK_STOCKS:
            variation = random.uniform(-0.05, 0.05)
            base_price = MOCK_STOCKS[symbol_upper]["base_price"]
            current_price = base_price * (1 + variation)
            return {"symbol": symbol_upper, "price": round(current_price, 2)}
        
        return {"symbol": symbol, "price": None, "error": "Không tìm thấy dữ liệu"}
    except Exception as e:
        # Fallback to mock data nếu có lỗi
        symbol_upper = symbol.upper()
        if symbol_upper in MOCK_STOCKS:
            variation = random.uniform(-0.05, 0.05)
            base_price = MOCK_STOCKS[symbol_upper]["base_price"]
            current_price = base_price * (1 + variation)
            return {"symbol": symbol_upper, "price": round(current_price, 2)}
        return {"symbol": symbol, "price": None, "error": str(e)}

@app.get("/api/stocks")
def get_all_stocks():
    """
    API lấy danh sách tất cả các mã cổ phiếu.
    
    Returns:
        Danh sách các mã cổ phiếu và thông tin cơ bản
    """
    stocks = []
    for symbol, data in MOCK_STOCKS.items():
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
        "message": "Stock API Service", 
        "endpoints": ["/api/price?symbol=CODE", "/api/stocks"],
        "available_symbols": list(MOCK_STOCKS.keys()),
        "cors_origins": allowed_origins
    }

if __name__ == "__main__":
    import uvicorn
    # Khi chạy local, uvicorn sẽ không tự động load biến môi trường từ .env như Render
    # Bạn có thể cần python-dotenv nếu muốn load .env khi chạy local
    print(f"Stock API đang chạy với allowed_origins: {allowed_origins}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
