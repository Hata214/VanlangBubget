from fastapi import FastAPI, Query
from vnstock import Vnstock, Listing, Quote, Trading, Company
from fastapi.middleware.cors import CORSMiddleware
import os # Quan trọng: import os để truy cập biến môi trường
from datetime import datetime, timedelta
import pandas as pd

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
def get_stock_price(symbol: str = "VNM", source: str = "VCI"):
    """
    Lấy giá hiện tại của một mã chứng khoán.
    
    Args:
        symbol: Mã chứng khoán (mặc định là VNM)
        source: Nguồn dữ liệu (mặc định là VCI)
        
    Returns:
        Giá đóng cửa mới nhất của mã chứng khoán
    """
    try:
        # Sử dụng vnstock mới để lấy dữ liệu
        stock = Vnstock().stock(symbol=symbol, source=source)
        # Lấy dữ liệu giá gần nhất
        today = datetime.now()
        # Lấy dữ liệu trong 7 ngày gần nhất để đảm bảo có dữ liệu (trường hợp ngày nghỉ)
        seven_days_ago = today - timedelta(days=7)
        
        df = stock.quote.history(
            start=seven_days_ago.strftime('%Y-%m-%d'),
            end=today.strftime('%Y-%m-%d'),
            interval='1D'
        )
        
        if not df.empty:
            # Lấy dữ liệu ngày gần nhất
            latest_data = df.iloc[-1]
            return {
                "symbol": symbol,
                "price": float(latest_data['close']),
                "change": float(latest_data.get('change', 0)),
                "pct_change": float(latest_data.get('pct_change', 0)),
                "date": latest_data.name.strftime('%Y-%m-%d') if hasattr(latest_data.name, 'strftime') else str(latest_data.name),
                "source": source
            }
        else:
            return {"symbol": symbol, "price": None, "error": "Không tìm thấy dữ liệu cho mã này"}
    except Exception as e:
        return {"symbol": symbol, "price": None, "error": f"Lỗi khi lấy dữ liệu: {str(e)}"}

@app.get("/api/stocks")
def get_all_stocks(limit: int = Query(20, description="Số lượng cổ phiếu muốn lấy"), 
                  source: str = Query("VCI", description="Nguồn dữ liệu")):
    """
    API lấy danh sách các mã cổ phiếu.
    
    Returns:
        Danh sách các mã cổ phiếu và thông tin cơ bản
    """
    try:
        # Lấy danh sách công ty niêm yết từ vnstock
        listing = Listing()
        df_listing = listing.all_symbols()
        
        # Lấy bảng giá cho nhiều mã cổ phiếu
        trading = Trading(source=source)
        
        # Chọn các cổ phiếu phổ biến hoặc có thể lấy tất cả và giới hạn bằng limit
        popular_symbols = ["VCB", "BID", "CTG", "TCB", "MBB", "VIC", "NVL", 
                          "VNM", "SAB", "MSN", "HPG", "GAS", "PLX", "FPT", "MWG", "PNJ"]
        
        # Nếu limit lớn hơn số lượng mã phổ biến, lấy thêm từ danh sách đầy đủ
        if limit > len(popular_symbols):
            additional_symbols = df_listing['ticker'].tolist()[:limit - len(popular_symbols)]
            symbols_to_query = popular_symbols + additional_symbols
        else:
            symbols_to_query = popular_symbols[:limit]
        
        # Lấy bảng giá cho các mã đã chọn
        df_price = trading.price_board(symbols_to_query)
        
        stocks = []
        for _, row in df_price.iterrows():
            symbol = row.get('symbol')
            if symbol:
                # Tìm thông tin công ty từ danh sách
                company_info = df_listing[df_listing['ticker'] == symbol]
                
                stock_data = {
                    "symbol": symbol,
                    "price": float(row.get('price', 0)),
                    "change": float(row.get('change', 0)),
                    "pct_change": float(row.get('pct_change', 0)) if 'pct_change' in row else 0,
                    "volume": int(row.get('volume', 0)) if 'volume' in row else 0,
                }
                
                # Thêm thông tin công ty nếu có
                if not company_info.empty:
                    stock_data.update({
                        "name": company_info.iloc[0].get('organName', symbol),
                        "exchange": company_info.iloc[0].get('exchange', ''),
                        "industry": company_info.iloc[0].get('industryName', 'Chưa phân loại')
                    })
                else:
                    stock_data.update({
                        "name": symbol,
                        "exchange": "",
                        "industry": "Chưa phân loại"
                    })
                
                stocks.append(stock_data)
        
        # Sắp xếp theo mã chứng khoán
        stocks.sort(key=lambda x: x["symbol"])
        
        return {
            "stocks": stocks,
            "count": len(stocks),
            "timestamp": datetime.now().isoformat(),
            "source": source
        }
    except Exception as e:
        return {
            "stocks": [],
            "count": 0,
            "error": f"Lỗi khi lấy danh sách cổ phiếu: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/stock/history")
def get_stock_history(symbol: str = "VNM", 
                     source: str = "VCI",
                     start_date: str = None,
                     end_date: str = None,
                     interval: str = "1D"):
    """
    Lấy dữ liệu lịch sử giá của một mã chứng khoán.
    
    Args:
        symbol: Mã chứng khoán
        source: Nguồn dữ liệu
        start_date: Ngày bắt đầu (định dạng YYYY-MM-DD)
        end_date: Ngày kết thúc (định dạng YYYY-MM-DD)
        interval: Khoảng thời gian (1D, 1W, 1M)
        
    Returns:
        Dữ liệu lịch sử giá của mã chứng khoán
    """
    try:
        # Xử lý ngày mặc định nếu không được cung cấp
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        if not start_date:
            # Mặc định lấy dữ liệu 3 tháng gần nhất
            start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
        
        stock = Vnstock().stock(symbol=symbol, source=source)
        df = stock.quote.history(start=start_date, end=end_date, interval=interval)
        
        if not df.empty:
            # Chuyển DataFrame thành danh sách các dict
            result = []
            for idx, row in df.iterrows():
                data_point = {
                    "date": idx.strftime('%Y-%m-%d') if hasattr(idx, 'strftime') else str(idx),
                    "open": float(row.get('open', 0)),
                    "high": float(row.get('high', 0)),
                    "low": float(row.get('low', 0)),
                    "close": float(row.get('close', 0)),
                    "volume": int(row.get('volume', 0)) if 'volume' in row else 0
                }
                # Thêm các trường khác nếu có
                if 'change' in row:
                    data_point["change"] = float(row['change'])
                if 'pct_change' in row:
                    data_point["pct_change"] = float(row['pct_change'])
                
                result.append(data_point)
            
            return {
                "symbol": symbol,
                "source": source,
                "interval": interval,
                "start_date": start_date,
                "end_date": end_date,
                "data": result
            }
        else:
            return {
                "symbol": symbol, 
                "error": "Không tìm thấy dữ liệu lịch sử cho mã này",
                "start_date": start_date,
                "end_date": end_date
            }
    except Exception as e:
        return {
            "symbol": symbol, 
            "error": f"Lỗi khi lấy dữ liệu lịch sử: {str(e)}",
            "start_date": start_date,
            "end_date": end_date
        }

@app.get("/api/stock/intraday")
def get_stock_intraday(symbol: str = "VNM", 
                      source: str = "VCI", 
                      page_size: int = Query(1000, description="Số lượng giao dịch muốn lấy"),
                      page: int = Query(1, description="Số trang")):
    """
    Lấy dữ liệu giao dịch theo thời gian thực (intraday) của một mã chứng khoán.
    
    Args:
        symbol: Mã chứng khoán
        source: Nguồn dữ liệu
        page_size: Số lượng giao dịch muốn lấy
        page: Số trang
        
    Returns:
        Dữ liệu giao dịch theo thời gian thực của mã chứng khoán
    """
    try:
        stock = Vnstock().stock(symbol=symbol, source=source)
        df = stock.quote.intraday(page_size=page_size, page=page)
        
        if not df.empty:
            # Chuyển DataFrame thành danh sách các dict
            result = []
            for idx, row in df.iterrows():
                data_point = {
                    "time": row.get('time', '').strftime('%Y-%m-%d %H:%M:%S') if hasattr(row.get('time', ''), 'strftime') else str(row.get('time', '')),
                    "price": float(row.get('price', 0)),
                    "volume": int(row.get('volume', 0)),
                    "side": row.get('side', ''),
                }
                
                # Thêm các trường khác nếu có
                if 'change' in row:
                    data_point["change"] = float(row['change'])
                if 'pct_change' in row:
                    data_point["pct_change"] = float(row['pct_change'])
                
                result.append(data_point)
            
            return {
                "symbol": symbol,
                "source": source,
                "page": page,
                "page_size": page_size,
                "count": len(result),
                "timestamp": datetime.now().isoformat(),
                "data": result
            }
        else:
            return {
                "symbol": symbol, 
                "error": "Không tìm thấy dữ liệu giao dịch theo thời gian thực cho mã này",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {
            "symbol": symbol, 
            "error": f"Lỗi khi lấy dữ liệu giao dịch theo thời gian thực: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/stock/realtime")
def get_stock_realtime(symbols: str = Query("VNM,VCB,HPG", description="Danh sách mã chứng khoán, phân cách bằng dấu phẩy"),
                     source: str = Query("VCI", description="Nguồn dữ liệu")):
    """
    Lấy thông tin giá theo thời gian thực của nhiều mã chứng khoán.
    
    Args:
        symbols: Danh sách mã chứng khoán, phân cách bằng dấu phẩy
        source: Nguồn dữ liệu
        
    Returns:
        Thông tin giá theo thời gian thực của các mã chứng khoán
    """
    try:
        # Chuyển chuỗi symbols thành list
        symbol_list = [s.strip() for s in symbols.split(',')]
        
        # Lấy bảng giá cho nhiều mã cổ phiếu
        trading = Trading(source=source)
        df_price = trading.price_board(symbol_list)
        
        result = []
        if not df_price.empty:
            for _, row in df_price.iterrows():
                symbol = row.get('symbol')
                if symbol:
                    stock_data = {}
                    
                    # Chuyển đổi tất cả các cột trong DataFrame thành dict
                    for col in df_price.columns:
                        value = row.get(col)
                        
                        # Xử lý các kiểu dữ liệu khác nhau
                        if pd.isna(value):
                            stock_data[col] = None
                        elif isinstance(value, (int, float)):
                            stock_data[col] = float(value)
                        elif isinstance(value, (pd.Timestamp, datetime)):
                            stock_data[col] = value.strftime('%Y-%m-%d %H:%M:%S')
                        else:
                            stock_data[col] = str(value)
                    
                    result.append(stock_data)
        
        return {
            "symbols": symbol_list,
            "source": source,
            "count": len(result),
            "timestamp": datetime.now().isoformat(),
            "data": result
        }
    except Exception as e:
        return {
            "symbols": symbols.split(','),
            "error": f"Lỗi khi lấy dữ liệu thời gian thực: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/stock/company")
def get_company_info(symbol: str = "VNM", source: str = "VCI"):
    """
    Lấy thông tin công ty của một mã chứng khoán.
    
    Args:
        symbol: Mã chứng khoán
        source: Nguồn dữ liệu
        
    Returns:
        Thông tin công ty của mã chứng khoán
    """
    try:
        company = Company(symbol=symbol, source=source)
        info = company.overview()
        
        if isinstance(info, pd.DataFrame) and not info.empty:
            # Chuyển DataFrame thành dict
            result = info.to_dict(orient='records')[0]
            # Đảm bảo các giá trị số được chuyển đổi đúng
            for key, value in result.items():
                if pd.isna(value):
                    result[key] = None
                elif isinstance(value, (pd.Timestamp, pd.DatetimeTZDtype)):
                    result[key] = value.strftime('%Y-%m-%d')
            
            return {
                "symbol": symbol,
                "source": source,
                "company_info": result
            }
        else:
            return {"symbol": symbol, "error": "Không tìm thấy thông tin công ty cho mã này"}
    except Exception as e:
        return {"symbol": symbol, "error": f"Lỗi khi lấy thông tin công ty: {str(e)}"}

@app.get("/api/market/indices")
def get_market_indices(source: str = "VCI"):
    """
    Lấy thông tin các chỉ số thị trường.
    
    Args:
        source: Nguồn dữ liệu
        
    Returns:
        Thông tin các chỉ số thị trường
    """
    try:
        # Thử lấy chỉ số thị trường từ Trading
        trading = Trading(source=source)
        # Danh sách các chỉ số thị trường phổ biến
        indices = ["VNINDEX", "VN30", "HNX", "UPCOM"]
        
        df_indices = trading.price_board(indices)
        
        if not df_indices.empty:
            # Chuyển DataFrame thành danh sách các dict
            result = []
            for _, row in df_indices.iterrows():
                index_data = {
                    "symbol": row.get('symbol', ''),
                    "price": float(row.get('price', 0)),
                    "change": float(row.get('change', 0)),
                    "pct_change": float(row.get('pct_change', 0)) if 'pct_change' in row else 0,
                    "volume": int(row.get('volume', 0)) if 'volume' in row else 0,
                }
                result.append(index_data)
            
            return {
                "indices": result,
                "count": len(result),
                "timestamp": datetime.now().isoformat(),
                "source": source
            }
        else:
            return {"indices": [], "error": "Không tìm thấy dữ liệu chỉ số thị trường"}
    except Exception as e:
        return {"indices": [], "error": f"Lỗi khi lấy dữ liệu chỉ số thị trường: {str(e)}"}

@app.get("/")
def read_root():
    return {
        "message": "Stock API Service", 
        "endpoints": [
            "/api/price?symbol=CODE&source=VCI",
            "/api/stocks?limit=20&source=VCI",
            "/api/stock/history?symbol=VNM&source=VCI&start_date=2024-01-01&end_date=2024-05-01&interval=1D",
            "/api/stock/intraday?symbol=VNM&source=VCI&page_size=1000&page=1",
            "/api/stock/realtime?symbols=VNM,VCB,HPG&source=VCI",
            "/api/stock/company?symbol=VNM&source=VCI",
            "/api/market/indices?source=VCI"
        ],
        "available_sources": ["VCI", "TCBS", "SSI", "DNSE"],
        "cors_origins": allowed_origins
    }

if __name__ == "__main__":
    import uvicorn
    # Khi chạy local, uvicorn sẽ không tự động load biến môi trường từ .env như Render
    # Bạn có thể cần python-dotenv nếu muốn load .env khi chạy local
    print(f"Stock API đang chạy với allowed_origins: {allowed_origins}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
