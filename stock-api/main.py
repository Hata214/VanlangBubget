from fastapi import FastAPI
from vnstock import stock_intraday_data, listing_companies
from fastapi.middleware.cors import CORSMiddleware
import os # Quan trọng: import os để truy cập biến môi trường
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
        # Lấy dữ liệu thực từ vnstock
        df = stock_intraday_data(symbol=symbol, page_size=1)
        if not df.empty:
            return {"symbol": symbol, "price": float(df.iloc[-1]['close'])}
        else:
            return {"symbol": symbol, "price": None, "error": "Không tìm thấy dữ liệu cho mã này"}
    except Exception as e:
        return {"symbol": symbol, "price": None, "error": f"Lỗi khi lấy dữ liệu: {str(e)}"}

@app.get("/api/stocks")
def get_all_stocks():
    """
    API lấy danh sách tất cả các mã cổ phiếu.
    
    Returns:
        Danh sách các mã cổ phiếu và thông tin cơ bản
    """
    try:
        # Lấy danh sách công ty niêm yết từ vnstock
        df = listing_companies()
        
        stocks = []
        # Chỉ lấy một số cổ phiếu phổ biến để tránh quá tải
        popular_symbols = ["VCB", "BID", "CTG", "TCB", "MBB", "VIC", "NVL", 
                          "VNM", "SAB", "MSN", "HPG", "GAS", "PLX", "FPT", "MWG", "PNJ"]
        
        for symbol in popular_symbols:
            try:
                price_data = stock_intraday_data(symbol=symbol, page_size=1)
                if not price_data.empty:
                    price = float(price_data.iloc[-1]['close'])
                    
                    # Tìm thông tin công ty từ danh sách
                    company_info = df[df['ticker'] == symbol]
                    if not company_info.empty:
                        name = company_info.iloc[0]['organName']
                        industry = company_info.iloc[0]['industryName']
                    else:
                        name = symbol
                        industry = "Chưa phân loại"
                    
                    stocks.append({
                        "symbol": symbol,
                        "name": name,
                        "price": price,
                        "industry": industry
                    })
            except Exception as e:
                print(f"Lỗi khi lấy dữ liệu cho {symbol}: {str(e)}")
                continue
        
        # Sắp xếp theo mã chứng khoán
        stocks.sort(key=lambda x: x["symbol"])
        
        return {
            "stocks": stocks,
            "count": len(stocks),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "stocks": [],
            "count": 0,
            "error": f"Lỗi khi lấy danh sách cổ phiếu: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/")
def read_root():
    return {
        "message": "Stock API Service", 
        "endpoints": ["/api/price?symbol=CODE", "/api/stocks"],
        "available_symbols": ["VCB", "BID", "CTG", "TCB", "MBB", "VIC", "NVL", 
                             "VNM", "SAB", "MSN", "HPG", "GAS", "PLX", "FPT", "MWG", "PNJ"],
        "cors_origins": allowed_origins
    }

if __name__ == "__main__":
    import uvicorn
    # Khi chạy local, uvicorn sẽ không tự động load biến môi trường từ .env như Render
    # Bạn có thể cần python-dotenv nếu muốn load .env khi chạy local
    print(f"Stock API đang chạy với allowed_origins: {allowed_origins}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
