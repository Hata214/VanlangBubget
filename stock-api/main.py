from fastapi import FastAPI
from vnstock import stock_intraday_data
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Thêm CORS middleware để cho phép Next.js gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Chỉ định cụ thể nguồn gốc
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
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
        df = stock_intraday_data(symbol=symbol, page_size=1)
        if not df.empty:
            return {"symbol": symbol, "price": float(df.iloc[-1]['close'])}
        return {"symbol": symbol, "price": None, "error": "Không tìm thấy dữ liệu"}
    except Exception as e:
        return {"symbol": symbol, "price": None, "error": str(e)}

@app.get("/")
def read_root():
    return {"message": "Stock API Service", "endpoints": ["/api/price?symbol=CODE"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 