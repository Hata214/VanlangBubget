from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime, timedelta
import os
import json
import random

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
    return {
        "message": "Stock API Service", 
        "endpoints": [
            "/api/price?symbol=CODE&source=TCBS",
            "/api/stocks?limit=20&source=TCBS",
            "/api/stock/history?symbol=VNM&source=TCBS&start_date=2024-01-01&end_date=2024-05-01&interval=1D",
            "/api/stock/realtime?symbols=VNM,VCB,HPG&source=TCBS",
        ],
        "available_sources": ["VCI", "TCBS", "SSI", "DNSE"],
        "cors_origins": allowed_origins
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
        # Sử dụng price_board để lấy giá hiện tại
        price_data = vnstock.price_board([symbol.upper()])
        
        if not price_data.empty:
            result = price_data.iloc[0].to_dict()
            return {
                "symbol": symbol.upper(),
                "price": result.get('Giá', 0),
                "change": result.get('% thay đổi giá 1D', 0),
                "volume": result.get('Khối lượng', 0),
                "source": source,
                "timestamp": datetime.now().isoformat(),
                "raw_data": result
            }
        else:
            return {"symbol": symbol.upper(), "error": "Không tìm thấy dữ liệu cho mã chứng khoán này."}
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
        # Lấy danh sách công ty niêm yết từ vnstock
        df_listing = vnstock.listing_companies()
        
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
        df_price = vnstock.price_board(symbols_to_query)
        print(f"Kết quả truy vấn price_board: {df_price.shape[0]} dòng")
        
        stocks = []
        for i, (_, row) in enumerate(df_price.iterrows()):
            # Xác định mã cổ phiếu từ các cột có thể có
            symbol_value = None
            if 'symbol' in df_price.columns:
                symbol_value = clean_symbol(row.get('symbol', ''))
            elif 'Mã CP' in df_price.columns:
                symbol_value = clean_symbol(row.get('Mã CP', ''))
            
            # Nếu không tìm thấy mã hoặc mã không hợp lệ, sử dụng mã từ danh sách ban đầu
            if not symbol_value and i < len(symbols_to_query):
                symbol_value = symbols_to_query[i]
            
            if symbol_value:
                # Tìm thông tin công ty từ danh sách
                company_info = df_listing[df_listing['ticker'] == symbol_value]
                
                # Khởi tạo dữ liệu cổ phiếu
                stock_data = {"symbol": symbol_value}
                
                # Thêm giá
                price_value = None
                if 'price' in df_price.columns:
                    price_value = row.get('price')
                elif 'Giá' in df_price.columns:
                    price_value = row.get('Giá')
                
                # Kiểm tra và chuyển đổi giá
                if price_value is not None and not pd.isna(price_value):
                    try:
                        # Xử lý các trường hợp giá có thể là chuỗi với dấu phẩy
                        if isinstance(price_value, str):
                            # Thay thế dấu phẩy bằng dấu chấm nếu là định dạng số Việt Nam/Châu Âu
                            price_value = price_value.replace('.', '').replace(',', '.')
                        
                        # Chuyển đổi sang float
                        price_float = float(price_value)
                        
                        # Đảm bảo giá được hiển thị đúng định dạng như trên giao diện
                        if price_float < 1000:
                            stock_data["price"] = price_float * 1000
                        else:
                            stock_data["price"] = price_float
                        
                        # Đảm bảo giá được làm tròn đến 2 chữ số thập phân
                        stock_data["price"] = round(stock_data["price"], 2)
                    except (ValueError, TypeError):
                        stock_data["price"] = 0
                else:
                    stock_data["price"] = 0
                
                # Thêm thay đổi giá
                change_value = None
                if 'change' in df_price.columns:
                    change_value = row.get('change', 0)
                elif '% thay đổi giá 1D' in df_price.columns:
                    change_value = row.get('% thay đổi giá 1D', 0)
                
                if change_value is not None and not pd.isna(change_value):
                    try:
                        if isinstance(change_value, str):
                            change_value = change_value.replace('.', '').replace(',', '.')
                        stock_data["change"] = float(change_value)
                    except (ValueError, TypeError):
                        stock_data["change"] = 0
                else:
                    stock_data["change"] = 0
                
                # Thêm phần trăm thay đổi
                stock_data["pct_change"] = stock_data.get("change", 0)  # Sử dụng lại giá trị change
                
                # Thêm khối lượng
                volume_value = None
                if 'volume' in df_price.columns:
                    volume_value = row.get('volume', 0)
                elif 'Khối lượng' in df_price.columns:
                    volume_value = row.get('Khối lượng', 0)
                
                if volume_value is not None and not pd.isna(volume_value):
                    try:
                        if isinstance(volume_value, str):
                            volume_value = volume_value.replace('.', '').replace(',', '.')
                        stock_data["volume"] = float(volume_value)
                    except (ValueError, TypeError):
                        stock_data["volume"] = 0
                else:
                    stock_data["volume"] = 0
                
                # Thêm thông tin công ty nếu có
                if not company_info.empty:
                    stock_data.update({
                        "name": company_info.iloc[0].get('organName', symbol_value),
                        "exchange": company_info.iloc[0].get('exchange', ''),
                        "industry": company_info.iloc[0].get('industryName', 'Chưa phân loại')
                    })
                else:
                    stock_data.update({
                        "name": symbol_value,
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
        
        # Lấy dữ liệu lịch sử
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
        
        # Lấy bảng giá cho các mã cổ phiếu
        try:
            df_price = vnstock.price_board(symbol_list)
            print(f"Kết quả truy vấn price_board: {df_price.shape[0]} dòng")
            print(f"Cấu trúc dữ liệu: {df_price.columns.tolist()}")
        except Exception as inner_e:
            print(f"Lỗi khi gọi price_board: {str(inner_e)}")
            return {
                "symbols": symbol_list,
                "source": source,
                "count": 0,
                "timestamp": datetime.now().isoformat(),
                "error": f"Không thể lấy dữ liệu: {str(inner_e)}",
                "data": []
            }
        
        result = []
        if not df_price.empty:
            # In ra thông tin chi tiết để debug
            print("Dữ liệu mẫu đầu tiên:")
            if len(df_price) > 0:
                first_row = df_price.iloc[0].to_dict()
                print(f"Dòng đầu tiên: {first_row}")
            
            # Chuyển DataFrame thành danh sách các dict
            for i, (_, row) in enumerate(df_price.iterrows()):
                stock_data = {}
                
                # Xử lý mã cổ phiếu đặc biệt
                symbol_value = None
                if 'symbol' in df_price.columns:
                    symbol_value = clean_symbol(row.get('symbol', ''))
                elif 'Mã CP' in df_price.columns:
                    symbol_value = clean_symbol(row.get('Mã CP', ''))
                
                # Nếu không tìm thấy mã hoặc mã không hợp lệ, sử dụng mã từ danh sách ban đầu
                if not symbol_value and i < len(symbol_list):
                    symbol_value = symbol_list[i]
                
                stock_data["symbol"] = symbol_value
                
                # Giá
                price_value = None
                if 'price' in df_price.columns:
                    price_value = row.get('price')
                elif 'Giá' in df_price.columns:
                    price_value = row.get('Giá')
                
                # Kiểm tra và chuyển đổi giá
                if price_value is not None and not pd.isna(price_value):
                    try:
                        # Xử lý các trường hợp giá có thể là chuỗi với dấu phẩy
                        if isinstance(price_value, str):
                            # Thay thế dấu phẩy bằng dấu chấm nếu là định dạng số Việt Nam/Châu Âu
                            price_value = price_value.replace('.', '').replace(',', '.')
                        
                        # Chuyển đổi sang float
                        price_float = float(price_value)
                        
                        # Đảm bảo giá được hiển thị đúng định dạng như trên giao diện
                        # Nếu giá < 1000, nhân với 1000 để hiển thị đúng định dạng
                        if price_float < 1000:
                            stock_data["price"] = price_float * 1000
                        else:
                            stock_data["price"] = price_float
                        
                        # Đảm bảo giá được làm tròn đến 2 chữ số thập phân
                        stock_data["price"] = round(stock_data["price"], 2)
                        
                        # Nếu giá vẫn nhỏ, có thể cần nhân thêm
                        if stock_data["price"] < 100:
                            stock_data["price"] = stock_data["price"] * 1000
                    except (ValueError, TypeError):
                        print(f"Lỗi chuyển đổi giá: {price_value} (type: {type(price_value)})")
                        stock_data["price"] = 0
                else:
                    stock_data["price"] = 0
                
                # Thay đổi giá
                change_value = None
                if 'change' in df_price.columns:
                    change_value = row.get('change', 0)
                elif '% thay đổi giá 1D' in df_price.columns:
                    change_value = row.get('% thay đổi giá 1D', 0)
                
                if change_value is not None and not pd.isna(change_value):
                    try:
                        if isinstance(change_value, str):
                            change_value = change_value.replace('.', '').replace(',', '.')
                        stock_data["change"] = float(change_value)
                    except (ValueError, TypeError):
                        stock_data["change"] = 0
                else:
                    stock_data["change"] = 0
                
                # Phần trăm thay đổi
                stock_data["pct_change"] = stock_data.get("change", 0)  # Sử dụng lại giá trị change
                
                # Khối lượng
                volume_value = None
                if 'volume' in df_price.columns:
                    volume_value = row.get('volume', 0)
                elif 'Khối lượng' in df_price.columns:
                    volume_value = row.get('Khối lượng', 0)
                
                if volume_value is not None and not pd.isna(volume_value):
                    try:
                        if isinstance(volume_value, str):
                            volume_value = volume_value.replace('.', '').replace(',', '.')
                        stock_data["volume"] = float(volume_value)
                    except (ValueError, TypeError):
                        stock_data["volume"] = 0
                else:
                    stock_data["volume"] = 0
                
                # Thêm thông tin công ty nếu có
                try:
                    company_info = vnstock.listing_companies()
                    company_row = company_info[company_info['ticker'] == symbol_value]
                    if not company_row.empty:
                        stock_data["name"] = company_row.iloc[0].get('organName', symbol_value)
                        stock_data["industry"] = company_row.iloc[0].get('industryName', '')
                except Exception as company_e:
                    print(f"Lỗi khi lấy thông tin công ty: {str(company_e)}")
                
                # Kiểm tra một lần nữa để đảm bảo giá hiển thị đúng
                if "price" in stock_data and stock_data["price"] > 0:
                    # Nếu giá < 100, có thể là đang hiển thị sai định dạng
                    if stock_data["price"] < 100:
                        stock_data["price"] = stock_data["price"] * 1000
                    # Nếu giá > 1,000,000, có thể đã nhân quá nhiều
                    elif stock_data["price"] > 1000000:
                        stock_data["price"] = stock_data["price"] / 1000
                
                result.append(stock_data)
        
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
