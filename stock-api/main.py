from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime, timedelta
import os
import json
import random

# Import vnstock
import vnstock
from vnstock import Vnstock

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

@app.get("/api/price")
def get_stock_price(symbol: str = "VNM", source: str = "TCBS"):
    """
    Lấy giá hiện tại của một mã chứng khoán.
    
    Args:
        symbol: Mã chứng khoán (mặc định là VNM)
        source: Nguồn dữ liệu (mặc định là TCBS)
        
    Returns:
        Giá đóng cửa mới nhất của mã chứng khoán
    """
    try:
        # Lấy dữ liệu lịch sử gần nhất
        today = datetime.now()
        # Lấy dữ liệu trong 7 ngày gần nhất để đảm bảo có dữ liệu (trường hợp ngày nghỉ)
        seven_days_ago = today - timedelta(days=7)
        
        df = vnstock.stock_historical_data(
            symbol=symbol,
            start_date=seven_days_ago.strftime('%Y-%m-%d'),
            end_date=today.strftime('%Y-%m-%d')
        )
        
        if not df.empty:
            # Lấy dữ liệu ngày gần nhất
            latest_data = df.iloc[-1]
            
            # Lấy thêm thông tin công ty nếu có thể
            company_info = None
            try:
                company_info = vnstock.company_overview(symbol)
            except Exception as e:
                print(f"Không thể lấy thông tin công ty: {str(e)}")
                
            result = {
                "symbol": symbol,
                "price": float(latest_data['close']),
                "date": latest_data['time'].strftime('%Y-%m-%d') if hasattr(latest_data['time'], 'strftime') else str(latest_data['time']),
                "source": source
            }
            
            # Thêm thông tin công ty nếu có
            if company_info is not None and not company_info.empty:
                company_row = company_info.iloc[0]
                result["name"] = company_row.get('companyName', symbol)
                result["industry"] = company_row.get('industryName', '')
                result["description"] = company_row.get('businessSector', '')
            
            return result
        else:
            return {"symbol": symbol, "price": None, "error": "Không tìm thấy dữ liệu cho mã này"}
    except Exception as e:
        return {"symbol": symbol, "price": None, "error": f"Lỗi khi lấy dữ liệu: {str(e)}"}

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
        print(f"Cấu trúc dữ liệu: {df_price.columns.tolist()}")
        
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
                if 'price' in df_price.columns:
                    stock_data["price"] = float(row.get('price', 0)) if not pd.isna(row.get('price', 0)) else 0
                elif 'Giá' in df_price.columns:
                    stock_data["price"] = float(row.get('Giá', 0)) if not pd.isna(row.get('Giá', 0)) else 0
                else:
                    stock_data["price"] = 0
                
                # Thêm thay đổi giá
                if 'change' in df_price.columns:
                    stock_data["change"] = float(row.get('change', 0)) if not pd.isna(row.get('change', 0)) else 0
                elif '% thay đổi giá 1D' in df_price.columns:
                    stock_data["change"] = float(row.get('% thay đổi giá 1D', 0)) if not pd.isna(row.get('% thay đổi giá 1D', 0)) else 0
                else:
                    stock_data["change"] = 0
                
                # Thêm phần trăm thay đổi
                if 'pct_change' in df_price.columns:
                    stock_data["pct_change"] = float(row.get('pct_change', 0)) if not pd.isna(row.get('pct_change', 0)) else 0
                elif '% thay đổi giá 1D' in df_price.columns:
                    stock_data["pct_change"] = float(row.get('% thay đổi giá 1D', 0)) if not pd.isna(row.get('% thay đổi giá 1D', 0)) else 0
                else:
                    stock_data["pct_change"] = 0
                
                # Thêm khối lượng
                if 'volume' in df_price.columns:
                    stock_data["volume"] = int(row.get('volume', 0)) if not pd.isna(row.get('volume', 0)) else 0
                elif 'Khối lượng' in df_price.columns:
                    stock_data["volume"] = int(row.get('Khối lượng', 0)) if not pd.isna(row.get('Khối lượng', 0)) else 0
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
        
        # Khởi tạo vnstock
        stock = Vnstock().stock(symbol=symbol, source=source)
        
        # Lấy dữ liệu lịch sử
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
        stock = vnstock.Vnstock().stock(symbol=symbol, source=source)
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
        print(f"Đang lấy dữ liệu realtime cho: {symbol_list} từ nguồn {source}")
        
        # Khởi tạo vnstock
        stock = Vnstock().stock(symbol=symbol_list[0], source=source)
        
        # Lấy bảng giá cho các mã cổ phiếu
        try:
            df_price = stock.trading.price_board(symbol_list)
            print(f"Kết quả truy vấn price_board: {df_price.shape[0]} dòng")
            print(f"Cấu trúc dữ liệu: {df_price.columns.tolist()}")
            print(f"Dữ liệu mẫu: {df_price.head().to_dict('records')}")
            
            # Thử lấy dữ liệu từ nguồn khác nếu không có dữ liệu
            if df_price.empty and source == "TCBS":
                print("Không có dữ liệu từ TCBS, thử lấy từ VCI")
                stock = Vnstock().stock(symbol=symbol_list[0], source="VCI")
                df_price = stock.trading.price_board(symbol_list)
                print(f"Kết quả truy vấn price_board từ VCI: {df_price.shape[0]} dòng")
        except Exception as inner_e:
            print(f"Lỗi khi gọi price_board: {str(inner_e)}")
            try:
                # Thử lại với nguồn VCI nếu TCBS không hoạt động
                if source == "TCBS":
                    print("Thử lại với nguồn VCI")
                    stock = Vnstock().stock(symbol=symbol_list[0], source="VCI")
                    df_price = stock.trading.price_board(symbol_list)
                    print(f"Kết quả truy vấn price_board từ VCI: {df_price.shape[0]} dòng")
                else:
                    raise inner_e
            except Exception as retry_e:
                print(f"Lỗi khi thử lại: {str(retry_e)}")
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
                for col in df_price.columns:
                    val = first_row.get(col)
                    print(f"  {col}: {val} (type: {type(val)})")
            
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
                
                # Thêm các trường khác nếu có
                # Giá cao
                high_value = None
                if 'high' in df_price.columns:
                    high_value = row.get('high')
                elif 'Cao' in df_price.columns:
                    high_value = row.get('Cao')
                
                if high_value is not None and not pd.isna(high_value):
                    try:
                        if isinstance(high_value, str):
                            high_value = high_value.replace('.', '').replace(',', '.')
                        high_float = float(high_value)
                        stock_data["high"] = high_float * 1000 if high_float < 1000 else high_float
                        stock_data["high"] = round(stock_data["high"], 2)
                    except (ValueError, TypeError):
                        pass
                
                # Giá thấp
                low_value = None
                if 'low' in df_price.columns:
                    low_value = row.get('low')
                elif 'Thấp' in df_price.columns:
                    low_value = row.get('Thấp')
                
                if low_value is not None and not pd.isna(low_value):
                    try:
                        if isinstance(low_value, str):
                            low_value = low_value.replace('.', '').replace(',', '.')
                        low_float = float(low_value)
                        stock_data["low"] = low_float * 1000 if low_float < 1000 else low_float
                        stock_data["low"] = round(stock_data["low"], 2)
                    except (ValueError, TypeError):
                        pass
                
                # Giá mở cửa
                open_value = None
                if 'open' in df_price.columns:
                    open_value = row.get('open')
                elif 'Mở cửa' in df_price.columns:
                    open_value = row.get('Mở cửa')
                
                if open_value is not None and not pd.isna(open_value):
                    try:
                        if isinstance(open_value, str):
                            open_value = open_value.replace('.', '').replace(',', '.')
                        open_float = float(open_value)
                        stock_data["open"] = open_float * 1000 if open_float < 1000 else open_float
                        stock_data["open"] = round(stock_data["open"], 2)
                    except (ValueError, TypeError):
                        pass
                
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

@app.get("/api/stock/company")
def get_company_info(symbol: str = "VNM", source: str = "TCBS"):
    """
    Lấy thông tin công ty của một mã chứng khoán.
    
    Args:
        symbol: Mã chứng khoán
        source: Nguồn dữ liệu
        
    Returns:
        Thông tin công ty của mã chứng khoán
    """
    try:
        # Khởi tạo vnstock
        company = Vnstock().company(symbol=symbol.upper(), source=source)
        
        # Lấy thông tin tổng quan
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
                "symbol": symbol.upper(),
                "source": source,
                "company_info": result
            }
        else:
            return {"symbol": symbol.upper(), "error": "Không tìm thấy thông tin công ty cho mã này"}
    except Exception as e:
        return {"symbol": symbol.upper(), "error": f"Lỗi khi lấy thông tin công ty: {str(e)}"}

@app.get("/api/market/indices")
def get_market_indices(source: str = "TCBS"):
    """
    Lấy thông tin các chỉ số thị trường.
    
    Args:
        source: Nguồn dữ liệu
        
    Returns:
        Thông tin các chỉ số thị trường
    """
    try:
        # Khởi tạo vnstock
        stock = Vnstock().stock(symbol="VNINDEX", source=source)
        
        # Danh sách các chỉ số thị trường phổ biến
        indices = ["VNINDEX", "VN30", "HNX", "UPCOM"]
        
        # Lấy bảng giá cho các chỉ số
        df_indices = stock.trading.price_board(indices)
        
        if not df_indices.empty:
            # Chuyển DataFrame thành danh sách các dict
            result = []
            for _, row in df_indices.iterrows():
                symbol_value = None
                if 'symbol' in df_indices.columns:
                    symbol_value = clean_symbol(row.get('symbol', ''))
                elif 'Mã CP' in df_indices.columns:
                    symbol_value = clean_symbol(row.get('Mã CP', ''))
                
                if not symbol_value:
                    continue
                
                index_data = {
                    "symbol": symbol_value,
                    "price": float(row.get('Giá', 0)) if not pd.isna(row.get('Giá', 0)) else 0,
                    "change": float(row.get('% thay đổi giá 1D', 0)) if not pd.isna(row.get('% thay đổi giá 1D', 0)) else 0,
                    "volume": float(row.get('Khối lượng', 0)) if not pd.isna(row.get('Khối lượng', 0)) else 0
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
            "/api/price?symbol=CODE&source=TCBS",
            "/api/stocks?limit=20&source=TCBS",
            "/api/stock/history?symbol=VNM&source=TCBS&start_date=2024-01-01&end_date=2024-05-01&interval=1D",
            "/api/stock/realtime?symbols=VNM,VCB,HPG&source=TCBS",
            "/api/stock/company?symbol=VNM&source=TCBS",
            "/api/market/indices?source=TCBS"
        ],
        "available_sources": ["VCI", "TCBS", "SSI", "DNSE"],
        "cors_origins": allowed_origins
    }

def generate_mock_data(symbols):
    """
    Tạo dữ liệu giả cho các mã cổ phiếu
    
    Args:
        symbols: Danh sách mã cổ phiếu
        
    Returns:
        Danh sách dữ liệu giả
    """
    data = []
    for symbol in symbols:
        # Tạo giá ngẫu nhiên từ 10,000 đến 100,000
        price = random.randint(10000, 100000)
        
        # Tạo thay đổi giá ngẫu nhiên từ -1,000 đến 1,000
        change = random.randint(-1000, 1000)
        
        # Tính phần trăm thay đổi
        pct_change = change / price * 100
        
        # Tạo khối lượng ngẫu nhiên từ 10,000 đến 1,000,000
        volume = random.randint(10000, 1000000)
        
        # Tạo giá cao, thấp và mở cửa
        high = price + random.randint(0, 500)
        low = price - random.randint(0, 500)
        open_price = price - change
        
        data.append({
            "symbol": symbol,
            "price": price,
            "change": change,
            "pct_change": round(pct_change, 2),
            "volume": volume,
            "high": high,
            "low": low,
            "open": open_price
        })
    
    return data

@app.get("/api/stock/mock")
def get_stock_mock(symbols: str = Query("VNM,VCB,HPG", description="Danh sách mã chứng khoán, phân cách bằng dấu phẩy")):
    """
    API trả về dữ liệu giả cho các mã cổ phiếu.
    Sử dụng API này khi API realtime không hoạt động.
    
    Args:
        symbols: Danh sách mã chứng khoán, phân cách bằng dấu phẩy
        
    Returns:
        Dữ liệu giả cho các mã cổ phiếu
    """
    try:
        # Chuyển chuỗi symbols thành list
        symbol_list = [s.strip() for s in symbols.split(',')]
        
        # Tạo dữ liệu giả
        data = generate_mock_data(symbol_list)
        
        return {
            "symbols": symbol_list,
            "source": "MOCK",
            "count": len(data),
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
    except Exception as e:
        return {
            "symbols": symbols.split(','),
            "source": "MOCK",
            "error": f"Lỗi khi tạo dữ liệu giả: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "data": []
        }

if __name__ == "__main__":
    import uvicorn
    # Khi chạy local, uvicorn sẽ không tự động load biến môi trường từ .env như Render
    # Bạn có thể cần python-dotenv nếu muốn load .env khi chạy local
    print(f"Stock API đang chạy với allowed_origins: {allowed_origins}")
    uvicorn.run(app, host="0.0.0.0", port=8000)
