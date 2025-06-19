from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime, timedelta
import os
import sys

# Import vnstock
import vnstock

app = FastAPI(
    title="Stock API",
    description="API cung cấp thông tin về thị trường chứng khoán Việt Nam",
    version="1.0.0"
)

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

def clean_symbol(symbol_str):
    """
    Làm sạch mã cổ phiếu từ chuỗi có thể chứa các ký tự đặc biệt
    
    Args:
        symbol_str: Chuỗi mã cổ phiếu cần làm sạch
        
    Returns:
        Chuỗi mã cổ phiếu đã được làm sạch
    """
    if not symbol_str:
        return ""
    
    # Xử lý trường hợp đặc biệt khi mã cổ phiếu là một list dạng chuỗi
    if isinstance(symbol_str, str):
        if symbol_str.startswith('[') and symbol_str.endswith(']'):
            # Trích xuất phần tử đầu tiên của list
            parts = symbol_str.strip('[]').split(',')
            if parts:
                symbol_str = parts[0].strip()
        
        # Loại bỏ các ký tự đặc biệt
        cleaned = symbol_str.replace("['", "").replace("']", "").replace("'", "").strip()
        return cleaned
    
    return str(symbol_str)

@app.get("/")
def read_root():
    # Thêm thông tin debug về vnstock
    try:
        vnstock_version = vnstock.__version__ if hasattr(vnstock, '__version__') else "unknown"
        vnstock_methods = [method for method in dir(vnstock) if not method.startswith('_')]
        has_price_board = hasattr(vnstock, 'price_board')
        has_listing_companies = hasattr(vnstock, 'listing_companies')

        # Test các method khác có thể có trong vnstock 3.x
        available_methods = {
            'stock_historical_data': hasattr(vnstock, 'stock_historical_data'),
            'stock_intraday_data': hasattr(vnstock, 'stock_intraday_data'),
            'price_depth': hasattr(vnstock, 'price_depth'),
            'price_board': has_price_board,
            'listing_companies': has_listing_companies,
            'company_overview': hasattr(vnstock, 'company_overview'),
            'stock_prices': hasattr(vnstock, 'stock_prices'),
            'get_stock_prices': hasattr(vnstock, 'get_stock_prices'),
        }

    except Exception as e:
        vnstock_version = f"error: {str(e)}"
        vnstock_methods = []
        available_methods = {}

    return {
        "message": "Stock API Service",
        "endpoints": [
            "/api/price?symbol=CODE&source=TCBS",
            "/api/stocks?limit=20&source=TCBS",
            "/api/stock/history?symbol=VNM&source=TCBS&start_date=2024-01-01&end_date=2024-05-01&interval=1D",
            "/api/stock/realtime?symbols=VNM,VCB,HPG&source=TCBS",
        ],
        "available_sources": ["VCI", "TCBS", "SSI", "DNSE"],
        "cors_origins": allowed_origins,
        "debug_info": {
            "vnstock_version": vnstock_version,
            "vnstock_methods_count": len(vnstock_methods),
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            "available_methods": available_methods,
            "all_methods": vnstock_methods[:20]  # Chỉ hiển thị 20 method đầu tiên
        }
    }

@app.get("/api/price")
def get_stock_price(symbol: str = "VNM", source: str = "TCBS"):
    """
    Lấy giá hiện tại của một mã chứng khoán.

    Args:
        symbol: Mã chứng khoán (ví dụ: "VNM").
        source: Nguồn dữ liệu (ví dụ: "TCBS" hoặc "VCI").

    Returns:
        Dữ liệu giá cổ phiếu hoặc thông báo lỗi.
    """
    try:
        # Sử dụng vnstock 3.x class-based API
        # Thử Quote class để lấy giá realtime
        if hasattr(vnstock, 'Quote'):
            try:
                quote = vnstock.Quote(symbol=symbol.upper(), source=source)
                price_data = quote.history(period='1D', interval='1D')

                if not price_data.empty:
                    latest_data = price_data.iloc[-1]
                    return {
                        "symbol": symbol.upper(),
                        "price": float(latest_data.get('close', 0)),
                        "change": float(latest_data.get('change', 0)) if 'change' in latest_data else 0,
                        "volume": int(latest_data.get('volume', 0)) if 'volume' in latest_data else 0,
                        "source": source,
                        "timestamp": datetime.now().isoformat(),
                        "method": "Quote.history"
                    }
            except Exception as e:
                print(f"Quote.history failed: {e}")

        # Thử Trading class
        if hasattr(vnstock, 'Trading'):
            try:
                trading = vnstock.Trading()
                price_data = trading.price_board([symbol.upper()])

                if not price_data.empty:
                    latest_data = price_data.iloc[0]
                    return {
                        "symbol": symbol.upper(),
                        "price": float(latest_data.get('close', 0)) if 'close' in latest_data else float(latest_data.get('price', 0)),
                        "change": float(latest_data.get('change', 0)) if 'change' in latest_data else 0,
                        "volume": int(latest_data.get('volume', 0)) if 'volume' in latest_data else 0,
                        "source": source,
                        "timestamp": datetime.now().isoformat(),
                        "method": "Trading.price_board"
                    }
            except Exception as e:
                print(f"Trading.price_board failed: {e}")

        # Fallback: Trả về lỗi với thông tin debug
        return {
            "symbol": symbol.upper(),
            "error": "Không thể lấy dữ liệu với các method hiện có",
            "available_methods": [method for method in dir(vnstock) if not method.startswith('_')][:10]
        }

    except Exception as e:
        print(f"Error fetching stock price for {symbol} from {source}: {e}")
        return {"error": f"Đã xảy ra lỗi khi lấy dữ liệu: {str(e)}"}

@app.get("/api/stocks")
def get_all_stocks(limit: int = Query(20, description="Số lượng cổ phiếu muốn lấy"),
                  source: str = Query("TCBS", description="Nguồn dữ liệu")):
    """
    API lấy danh sách các mã cổ phiếu.

    Returns:
        Danh sách các mã cổ phiếu và thông tin cơ bản
    """
    try:
        # Chọn các cổ phiếu phổ biến
        popular_symbols = ["VCB", "BID", "CTG", "TCB", "MBB", "VIC", "NVL",
                          "VNM", "SAB", "MSN", "HPG", "GAS", "PLX", "FPT", "MWG", "PNJ"]

        symbols_to_query = popular_symbols[:limit]

        stocks = []

        # Thử sử dụng Trading class để lấy price_board cho nhiều mã
        if hasattr(vnstock, 'Trading'):
            try:
                trading = vnstock.Trading()
                price_data = trading.price_board(symbols_to_query)

                if not price_data.empty:
                    for idx, row in price_data.iterrows():
                        # Tạo dữ liệu cổ phiếu từ price_board
                        stock_info = {
                            "symbol": row.get('symbol', symbols_to_query[idx] if idx < len(symbols_to_query) else 'N/A'),
                            "name": row.get('symbol', symbols_to_query[idx] if idx < len(symbols_to_query) else 'N/A'),
                            "price": float(row.get('close', 0)) if 'close' in row else float(row.get('price', 0)),
                            "change": float(row.get('change', 0)) if 'change' in row else 0,
                            "pct_change": float(row.get('pct_change', 0)) if 'pct_change' in row else 0,
                            "volume": int(row.get('volume', 0)) if 'volume' in row else 0,
                            "industry": "Chưa phân loại",
                            "exchange": "HOSE"
                        }
                        stocks.append(stock_info)

                    print(f"Đã lấy được dữ liệu từ Trading.price_board cho {len(stocks)} cổ phiếu")

            except Exception as trading_e:
                print(f"Trading.price_board failed: {trading_e}")

        # Nếu Trading không hoạt động, thử từng mã một với Quote class
        if not stocks:
            for symbol in symbols_to_query:
                try:
                    # Thử Quote class
                    if hasattr(vnstock, 'Quote'):
                        quote = vnstock.Quote(symbol=symbol, source=source)
                        stock_data = quote.history(period='1D', interval='1D')

                        if not stock_data.empty:
                            latest_data = stock_data.iloc[-1]

                            stock_info = {
                                "symbol": symbol,
                                "name": symbol,
                                "price": float(latest_data.get('close', 0)),
                                "change": float(latest_data.get('change', 0)) if 'change' in latest_data else 0,
                                "pct_change": 0,
                                "volume": int(latest_data.get('volume', 0)) if 'volume' in latest_data else 0,
                                "industry": "Chưa phân loại",
                                "exchange": "HOSE"
                            }

                            # Tính phần trăm thay đổi
                            if stock_info["price"] > 0 and stock_info["change"] != 0:
                                stock_info["pct_change"] = round((stock_info["change"] / (stock_info["price"] - stock_info["change"])) * 100, 2)

                            stocks.append(stock_info)

                except Exception as stock_e:
                    print(f"Lỗi khi lấy dữ liệu cho {symbol}: {str(stock_e)}")
                    # Thêm dữ liệu trống cho symbol này
                    stocks.append({
                        "symbol": symbol,
                        "name": symbol,
                        "price": 0,
                        "change": 0,
                        "pct_change": 0,
                        "volume": 0,
                        "industry": "Chưa phân loại",
                        "exchange": "HOSE"
                    })

        print(f"Tổng cộng đã lấy được dữ liệu cho {len(stocks)} cổ phiếu")

        # Sắp xếp theo mã chứng khoán
        stocks.sort(key=lambda x: x["symbol"])

        return {
            "stocks": stocks,
            "count": len(stocks),
            "timestamp": datetime.now().isoformat(),
            "source": source
        }
    except Exception as e:
        print(f"Lỗi khi lấy danh sách cổ phiếu: {str(e)}")
        return {
            "stocks": [],
            "count": 0,
            "error": f"Lỗi khi lấy danh sách cổ phiếu: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/stock/history")
def get_stock_history(symbol: str = "VNM", 
                     source: str = "TCBS",
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
        
        # Lấy dữ liệu lịch sử sử dụng Quote class
        df = None
        if hasattr(vnstock, 'Quote'):
            try:
                quote = vnstock.Quote(symbol=symbol, source=source)
                # Tính số ngày để xác định period
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                end_dt = datetime.strptime(end_date, '%Y-%m-%d')
                days_diff = (end_dt - start_dt).days

                # Xác định period phù hợp
                if days_diff <= 7:
                    period = '1wk'
                elif days_diff <= 30:
                    period = '1mo'
                elif days_diff <= 90:
                    period = '3mo'
                elif days_diff <= 180:
                    period = '6mo'
                elif days_diff <= 365:
                    period = '1y'
                else:
                    period = '2y'

                df = quote.history(period=period, interval=interval)

            except Exception as quote_e:
                print(f"Quote.history failed: {quote_e}")
                # Fallback: thử method cũ nếu có
                if hasattr(vnstock, 'stock_historical_data'):
                    df = vnstock.stock_historical_data(
                        symbol=symbol,
                        start_date=start_date,
                        end_date=end_date,
                        resolution=interval
                    )
        
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

@app.get("/api/stock/realtime")
def get_stock_realtime(symbols: str = Query("VNM,VCB,HPG", description="Danh sách mã chứng khoán, phân cách bằng dấu phẩy"),
                     source: str = Query("TCBS", description="Nguồn dữ liệu")):
    """
    Lấy thông tin giá theo thời gian thực của nhiều mã chứng khoán.

    Args:
        symbols: Danh sách mã chứng khoán, phân cách bằng dấu phẩy
        source: Nguồn dữ liệu (mặc định: TCBS vì thường cung cấp dữ liệu realtime tốt hơn)

    Returns:
        Thông tin giá theo thời gian thực của các mã chứng khoán
    """
    try:
        # Chuyển chuỗi symbols thành list
        symbol_list = [s.strip().upper() for s in symbols.split(',')]
        print(f"Đang lấy dữ liệu realtime cho: {symbol_list}")

        result = []

        # Thử sử dụng Trading class để lấy price_board cho nhiều mã
        if hasattr(vnstock, 'Trading'):
            try:
                trading = vnstock.Trading()
                price_data = trading.price_board(symbol_list)

                if not price_data.empty:
                    for idx, row in price_data.iterrows():
                        # Tạo dữ liệu realtime từ price_board
                        stock_info = {
                            "symbol": row.get('symbol', symbol_list[idx] if idx < len(symbol_list) else 'N/A'),
                            "name": row.get('symbol', symbol_list[idx] if idx < len(symbol_list) else 'N/A'),
                            "price": float(row.get('close', 0)) if 'close' in row else float(row.get('price', 0)),
                            "change": float(row.get('change', 0)) if 'change' in row else 0,
                            "pct_change": float(row.get('pct_change', 0)) if 'pct_change' in row else 0,
                            "volume": int(row.get('volume', 0)) if 'volume' in row else 0,
                            "industry": "Chưa phân loại"
                        }
                        result.append(stock_info)

                    print(f"Đã lấy được dữ liệu realtime từ Trading.price_board cho {len(result)} cổ phiếu")

            except Exception as trading_e:
                print(f"Trading.price_board failed: {trading_e}")

        # Nếu Trading không hoạt động, thử từng mã một với Quote class
        if not result:
            for symbol in symbol_list:
                try:
                    # Thử Quote class
                    if hasattr(vnstock, 'Quote'):
                        quote = vnstock.Quote(symbol=symbol, source=source)
                        stock_data = quote.history(period='1D', interval='1D')

                        if not stock_data.empty:
                            latest_data = stock_data.iloc[-1]

                            stock_info = {
                                "symbol": symbol,
                                "name": symbol,
                                "price": float(latest_data.get('close', 0)),
                                "change": float(latest_data.get('change', 0)) if 'change' in latest_data else 0,
                                "pct_change": 0,
                                "volume": int(latest_data.get('volume', 0)) if 'volume' in latest_data else 0,
                                "industry": "Chưa phân loại"
                            }

                            # Tính phần trăm thay đổi
                            if stock_info["price"] > 0 and stock_info["change"] != 0:
                                stock_info["pct_change"] = round((stock_info["change"] / (stock_info["price"] - stock_info["change"])) * 100, 2)

                            result.append(stock_info)
                        else:
                            # Thêm dữ liệu trống cho symbol này
                            result.append({
                                "symbol": symbol,
                                "name": symbol,
                                "price": 0,
                                "change": 0,
                                "pct_change": 0,
                                "volume": 0,
                                "industry": "Chưa phân loại",
                                "error": "Không có dữ liệu"
                            })

                except Exception as stock_e:
                    print(f"Lỗi khi lấy dữ liệu realtime cho {symbol}: {str(stock_e)}")
                    result.append({
                        "symbol": symbol,
                        "name": symbol,
                        "price": 0,
                        "change": 0,
                        "pct_change": 0,
                        "volume": 0,
                        "industry": "Chưa phân loại",
                        "error": f"Lỗi: {str(stock_e)}"
                    })

        print(f"Tổng cộng đã lấy được dữ liệu realtime cho {len(result)} cổ phiếu")

        return {
            "symbols": symbol_list,
            "source": source,
            "count": len(result),
            "timestamp": datetime.now().isoformat(),
            "data": result
        }
    except Exception as e:
        print(f"Lỗi tổng thể: {str(e)}")
        return {
            "symbols": symbols.split(','),
            "source": source,
            "error": f"Lỗi khi lấy dữ liệu thời gian thực: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "data": []
        }

if __name__ == "__main__":
    import uvicorn
    # Khi chạy local, uvicorn sẽ không tự động load biến môi trường từ .env như Render
    print(f"Stock API đang chạy với allowed_origins: {allowed_origins}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
