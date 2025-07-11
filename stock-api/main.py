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
        "message": "Stock API Service - Vietnam Stock Market",
        "total_stocks": "100+ Vietnamese stocks",
        "industries": [
            "Ngân hàng (15 mã)",
            "Bất động sản (13 mã)",
            "Sản xuất & Tiêu dùng (13 mã)",
            "Thép & Khai khoáng (10 mã)",
            "Dầu khí (10 mã)",
            "Công nghệ (10 mã)",
            "Bán lẻ (10 mã)",
            "Hàng không & Logistics (10 mã)",
            "Điện & Tiện ích (10 mã)",
            "Thực phẩm & Nông nghiệp (10 mã)"
        ],
        "endpoints": [
            "/api/price?symbol=CODE&source=TCBS",
            "/api/stocks?limit=50&source=TCBS",
            "/api/stocks/by-industry?industry=banking&limit=20",
            "/api/stocks/all-exchanges?exchange=HOSE&limit=100",
            "/api/stocks/statistics",
            "/api/stock/history?symbol=VNM&source=TCBS&start_date=2024-01-01&end_date=2024-05-01&interval=1D",
            "/api/stock/realtime?symbols=VNM,VCB,HPG&source=TCBS",
        ],
        "available_sources": ["VCI", "TCBS", "SSI", "DNSE"],
        "cors_origins": allowed_origins,
        "version": "3.1.0",
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
                    # Debug: In ra cấu trúc dữ liệu price
                    print(f"Price Trading.price_board columns: {price_data.columns.tolist()}")
                    print(f"Price Trading.price_board shape: {price_data.shape}")
                    print(f"Price sample data: {price_data.iloc[0].to_dict()}")

                    latest_data = price_data.iloc[0]
                    print(f"Price latest_data: {latest_data.to_dict()}")

                    # vnstock 3.x sử dụng MultiIndex columns với format (category, field)
                    price_val = (latest_data.get(('match', 'match_price')) or
                                latest_data.get(('match', 'avg_match_price')) or
                                latest_data.get('close') or latest_data.get('price') or 0)

                    # Tính change từ match_price và ref_price
                    match_price = latest_data.get(('match', 'match_price'), 0)
                    ref_price = latest_data.get(('listing', 'ref_price'), 0)
                    change_val = float(match_price - ref_price) if match_price and ref_price else 0

                    volume_val = (latest_data.get(('match', 'accumulated_volume')) or
                                 latest_data.get(('match', 'match_vol')) or
                                 latest_data.get('volume') or 0)

                    return {
                        "symbol": symbol.upper(),
                        "price": float(price_val) if price_val else 0,
                        "change": float(change_val) if change_val else 0,
                        "volume": int(volume_val) if volume_val else 0,
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
        # Danh sách cổ phiếu Việt Nam theo ngành (đã bổ sung thêm các mã phổ biến)
        banking_stocks = ["VCB", "BID", "CTG", "TCB", "MBB", "VPB", "ACB", "HDB", "STB", "TPB", "EIB", "SHB", "MSB", "OCB", "LPB", "NAB", "BAB", "ABB", "VBB"]
        real_estate_stocks = ["VIC", "VHM", "NVL", "VRE", "KDH", "DXG", "PDR", "BCM", "DIG", "HDG", "IJC", "KBC", "SCR", "CEO", "HDC", "NLG", "IDC", "CRE", "TDH"]
        manufacturing_stocks = ["VNM", "SAB", "MSN", "MML", "VIS", "CII", "DHG", "TRA", "BHN", "KDC", "MCH", "ANV", "SBT", "VCF", "BBC", "TAC", "DPM", "BMP", "VHG"]
        steel_mining_stocks = ["HPG", "HSG", "NKG", "TLH", "SMC", "VGS", "TVN", "KSB", "POM", "TIS", "DTL", "VCA", "TNA", "VNS", "CSM", "VCS", "SHI", "VGC"]
        oil_gas_stocks = ["GAS", "PLX", "PVS", "PVD", "PVC", "PVB", "BSR", "OIL", "PVT", "CNG", "PVG", "PSH", "PVX", "PGS", "PGD", "PGC", "PSW", "PGV"]
        technology_stocks = ["FPT", "CMG", "ELC", "ITD", "SAM", "VGI", "VTC", "VNG", "SFI", "VCS", "CMT", "CMX", "ICT", "TNG", "VTI", "VTS", "VDS", "VGT"]
        retail_stocks = ["MWG", "PNJ", "DGW", "FRT", "VGR", "AST", "SCS", "VDS", "TNG", "HAG", "FRT", "VRE", "VGC", "VGS", "VGI", "VGT", "VGV", "VGX"]
        aviation_logistics_stocks = ["VJC", "HVN", "ACV", "VTP", "GMD", "VSC", "TCO", "STG", "TMS", "HAH", "VOS", "VTO", "VTG", "VTS", "VTV", "VTX", "VTY", "VTZ"]
        utilities_stocks = ["POW", "GEG", "PC1", "NT2", "SBA", "REE", "EVE", "VSH", "BWE", "TBC", "EVG", "EVS", "EVF", "GEX", "HND", "SJD", "QTP", "VSI"]
        food_agriculture_stocks = ["VHC", "BAF", "LAF", "HNG", "SLS", "FMC", "CAP", "LSS", "ASM", "HAP", "VNF", "VIF", "VCG", "VTF", "VFF", "VGF", "VHF", "VKF"]

        # Kết hợp tất cả các mã cổ phiếu
        all_symbols = (banking_stocks + real_estate_stocks + manufacturing_stocks +
                      steel_mining_stocks + oil_gas_stocks + technology_stocks +
                      retail_stocks + aviation_logistics_stocks + utilities_stocks +
                      food_agriculture_stocks)

        # Loại bỏ trùng lặp và sắp xếp
        popular_symbols = sorted(list(set(all_symbols)))

        symbols_to_query = popular_symbols[:limit]

        stocks = []

        # Thử sử dụng Trading class để lấy price_board cho nhiều mã
        if hasattr(vnstock, 'Trading'):
            try:
                trading = vnstock.Trading()
                price_data = trading.price_board(symbols_to_query)

                if not price_data.empty:
                    # Debug: In ra cấu trúc dữ liệu
                    print(f"Trading.price_board columns: {price_data.columns.tolist()}")
                    print(f"Trading.price_board shape: {price_data.shape}")
                    if len(price_data) > 0:
                        print(f"Sample row data: {price_data.iloc[0].to_dict()}")

                    for idx, row in price_data.iterrows():
                        # Debug: In ra dữ liệu từng row
                        print(f"Row {idx}: {row.to_dict()}")

                        # vnstock 3.x sử dụng MultiIndex columns với format (category, field)
                        symbol_val = (row.get(('listing', 'symbol')) or row.get('symbol') or
                                     symbols_to_query[idx] if idx < len(symbols_to_query) else 'N/A')

                        price_val = (row.get(('match', 'match_price')) or
                                    row.get(('match', 'avg_match_price')) or
                                    row.get('close') or row.get('price') or 0)

                        # Tính change từ match_price và ref_price
                        match_price = row.get(('match', 'match_price'), 0)
                        ref_price = row.get(('listing', 'ref_price'), 0)
                        change_val = float(match_price - ref_price) if match_price and ref_price else 0

                        volume_val = (row.get(('match', 'accumulated_volume')) or
                                     row.get(('match', 'match_vol')) or
                                     row.get('volume') or 0)

                        # Tính phần trăm thay đổi
                        pct_change = 0
                        if ref_price and ref_price > 0 and change_val != 0:
                            pct_change = round((change_val / ref_price) * 100, 2)

                        # Xác định ngành dựa trên symbol (case-insensitive)
                        def get_industry(symbol):
                            symbol_upper = str(symbol).upper().strip()
                            print(f"Checking industry for symbol: '{symbol_upper}'")  # Debug log

                            if symbol_upper in banking_stocks:
                                return "Ngân hàng"
                            elif symbol_upper in real_estate_stocks:
                                return "Bất động sản"
                            elif symbol_upper in manufacturing_stocks:
                                return "Sản xuất & Tiêu dùng"
                            elif symbol_upper in steel_mining_stocks:
                                return "Thép & Khai khoáng"
                            elif symbol_upper in oil_gas_stocks:
                                return "Dầu khí"
                            elif symbol_upper in technology_stocks:
                                return "Công nghệ"
                            elif symbol_upper in retail_stocks:
                                return "Bán lẻ"
                            elif symbol_upper in aviation_logistics_stocks:
                                return "Hàng không & Logistics"
                            elif symbol_upper in utilities_stocks:
                                return "Điện & Tiện ích"
                            elif symbol_upper in food_agriculture_stocks:
                                return "Thực phẩm & Nông nghiệp"
                            else:
                                print(f"Symbol '{symbol_upper}' not found in any industry list")  # Debug log
                                return "Chưa phân loại"

                        # Tạo dữ liệu cổ phiếu từ price_board
                        stock_info = {
                            "symbol": str(symbol_val),
                            "name": str(symbol_val),
                            "price": float(price_val) if price_val else 0,
                            "change": float(change_val) if change_val else 0,
                            "pct_change": pct_change,
                            "volume": int(volume_val) if volume_val else 0,
                            "industry": get_industry(str(symbol_val)),
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

@app.get("/api/stocks/all-exchanges")
def get_all_exchange_stocks(exchange: str = Query("all", description="Sàn giao dịch: HOSE, HNX, UPCOM, all"),
                           limit: int = Query(1000, description="Số lượng cổ phiếu muốn lấy"),
                           source: str = Query("TCBS", description="Nguồn dữ liệu")):
    """
    API lấy tất cả mã cổ phiếu từ các sàn HOSE, HNX, UPCOM.

    Args:
        exchange: Sàn giao dịch (HOSE, HNX, UPCOM, all)
        limit: Số lượng cổ phiếu muốn lấy
        source: Nguồn dữ liệu

    Returns:
        Danh sách tất cả mã cổ phiếu từ sàn được chọn
    """
    try:
        all_stocks = []

        # Thử sử dụng vnstock để lấy danh sách công ty niêm yết
        if hasattr(vnstock, 'listing_companies'):
            try:
                # Lấy danh sách công ty niêm yết
                companies_df = vnstock.listing_companies()

                if not companies_df.empty:
                    print(f"Found {len(companies_df)} companies from listing_companies()")
                    print(f"Columns: {companies_df.columns.tolist()}")

                    # Lọc theo sàn giao dịch
                    if exchange.upper() != "ALL":
                        if 'exchange' in companies_df.columns:
                            companies_df = companies_df[companies_df['exchange'].str.upper() == exchange.upper()]
                        elif 'Exchange' in companies_df.columns:
                            companies_df = companies_df[companies_df['Exchange'].str.upper() == exchange.upper()]
                        elif 'EXCHANGE' in companies_df.columns:
                            companies_df = companies_df[companies_df['EXCHANGE'].str.upper() == exchange.upper()]

                    # Lấy danh sách symbol
                    symbols = []
                    if 'symbol' in companies_df.columns:
                        symbols = companies_df['symbol'].tolist()
                    elif 'Symbol' in companies_df.columns:
                        symbols = companies_df['Symbol'].tolist()
                    elif 'SYMBOL' in companies_df.columns:
                        symbols = companies_df['SYMBOL'].tolist()
                    elif 'ticker' in companies_df.columns:
                        symbols = companies_df['ticker'].tolist()
                    elif 'code' in companies_df.columns:
                        symbols = companies_df['code'].tolist()

                    # Giới hạn số lượng
                    symbols = symbols[:limit]

                    print(f"Extracted {len(symbols)} symbols: {symbols[:10]}...")

                    # Lấy dữ liệu giá cho từng nhóm nhỏ (để tránh timeout)
                    batch_size = 20
                    for i in range(0, len(symbols), batch_size):
                        batch_symbols = symbols[i:i+batch_size]

                        try:
                            if hasattr(vnstock, 'Trading'):
                                trading = vnstock.Trading()
                                price_data = trading.price_board(batch_symbols)

                                if not price_data.empty:
                                    for idx, row in price_data.iterrows():
                                        symbol_val = row.get(('listing', 'symbol')) or batch_symbols[idx] if idx < len(batch_symbols) else 'N/A'
                                        exchange_val = row.get(('listing', 'exchange')) or 'UNKNOWN'

                                        price_val = row.get(('match', 'match_price')) or 0
                                        match_price = row.get(('match', 'match_price'), 0)
                                        ref_price = row.get(('listing', 'ref_price'), 0)
                                        change_val = float(match_price - ref_price) if match_price and ref_price else 0
                                        volume_val = row.get(('match', 'accumulated_volume')) or 0

                                        pct_change = 0
                                        if ref_price and ref_price > 0 and change_val != 0:
                                            pct_change = round((change_val / ref_price) * 100, 2)

                                        stock_info = {
                                            "symbol": str(symbol_val),
                                            "name": str(symbol_val),
                                            "price": float(price_val) if price_val else 0,
                                            "change": float(change_val) if change_val else 0,
                                            "pct_change": pct_change,
                                            "volume": int(volume_val) if volume_val else 0,
                                            "exchange": str(exchange_val),
                                            "industry": "Chưa phân loại"
                                        }
                                        all_stocks.append(stock_info)

                        except Exception as batch_e:
                            print(f"Error processing batch {i}-{i+batch_size}: {batch_e}")
                            # Thêm dữ liệu trống cho batch này
                            for symbol in batch_symbols:
                                all_stocks.append({
                                    "symbol": symbol,
                                    "name": symbol,
                                    "price": 0,
                                    "change": 0,
                                    "pct_change": 0,
                                    "volume": 0,
                                    "exchange": exchange.upper() if exchange.upper() != "ALL" else "UNKNOWN",
                                    "industry": "Chưa phân loại"
                                })

            except Exception as listing_e:
                print(f"listing_companies() failed: {listing_e}")

        # Fallback: Sử dụng danh sách cố định nếu vnstock không hoạt động
        if not all_stocks:
            print("Fallback to predefined stock lists...")

            # Danh sách cổ phiếu HOSE phổ biến
            hose_stocks = [
                "VCB", "BID", "CTG", "TCB", "MBB", "VPB", "ACB", "HDB", "STB", "TPB",
                "VIC", "VHM", "NVL", "VRE", "KDH", "DXG", "PDR", "BCM", "DIG", "HDG",
                "VNM", "SAB", "MSN", "MML", "VIS", "CII", "DHG", "TRA", "BHN", "KDC",
                "HPG", "HSG", "NKG", "TLH", "SMC", "VGS", "TVN", "KSB", "POM", "TIS",
                "GAS", "PLX", "PVS", "PVD", "PVC", "PVB", "BSR", "OIL", "PVT", "CNG",
                "FPT", "CMG", "ELC", "ITD", "SAM", "VGI", "VTC", "VNG", "SFI", "VCS",
                "MWG", "PNJ", "DGW", "FRT", "VGR", "AST", "SCS", "VDS", "TNG", "HAG",
                "VJC", "HVN", "ACV", "VTP", "GMD", "VSC", "TCO", "STG", "TMS", "HAH",
                "POW", "GEG", "PC1", "NT2", "SBA", "REE", "EVE", "VSH", "BWE", "TBC"
            ]

            # Danh sách cổ phiếu HNX phổ biến
            hnx_stocks = [
                "SHB", "MSB", "OCB", "LPB", "EIB", "NAB", "BAB", "ABB", "VBB",
                "CEO", "HDC", "NLG", "IDC", "CRE", "TDH", "IJC", "KBC", "SCR",
                "VHC", "BAF", "LAF", "HNG", "SLS", "FMC", "CAP", "LSS", "ASM", "HAP",
                "DTL", "VCA", "TNA", "VNS", "CSM", "VCS", "SHI", "VGC",
                "PVG", "PSH", "PVX", "PGS", "PGD", "PGC", "PSW", "PGV",
                "CMT", "CMX", "ICT", "VTI", "VTS", "VDS", "VGT"
            ]

            # Chọn danh sách theo sàn
            if exchange.upper() == "HOSE":
                symbols_to_use = hose_stocks
            elif exchange.upper() == "HNX":
                symbols_to_use = hnx_stocks
            else:  # ALL
                symbols_to_use = hose_stocks + hnx_stocks

            symbols_to_use = symbols_to_use[:limit]

            # Tạo dữ liệu fallback
            for symbol in symbols_to_use:
                exchange_name = "HOSE" if symbol in hose_stocks else "HNX"
                all_stocks.append({
                    "symbol": symbol,
                    "name": symbol,
                    "price": 0,
                    "change": 0,
                    "pct_change": 0,
                    "volume": 0,
                    "exchange": exchange_name,
                    "industry": "Chưa phân loại"
                })

        # Sắp xếp theo symbol
        all_stocks.sort(key=lambda x: x["symbol"])

        return {
            "exchange": exchange.upper(),
            "stocks": all_stocks,
            "count": len(all_stocks),
            "timestamp": datetime.now().isoformat(),
            "source": source,
            "method": "listing_companies" if hasattr(vnstock, 'listing_companies') else "fallback"
        }

    except Exception as e:
        print(f"Error getting all exchange stocks: {e}")
        return {
            "exchange": exchange.upper(),
            "stocks": [],
            "count": 0,
            "error": f"Lỗi khi lấy danh sách cổ phiếu: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/stocks/by-industry")
def get_stocks_by_industry(industry: str = Query("all", description="Ngành cần lọc"),
                          limit: int = Query(50, description="Số lượng cổ phiếu muốn lấy"),
                          source: str = Query("TCBS", description="Nguồn dữ liệu")):
    """
    API lấy danh sách cổ phiếu theo ngành.

    Args:
        industry: Tên ngành (banking, real_estate, manufacturing, steel_mining, oil_gas, technology, retail, aviation_logistics, utilities, food_agriculture, all)
        limit: Số lượng cổ phiếu muốn lấy
        source: Nguồn dữ liệu

    Returns:
        Danh sách các mã cổ phiếu theo ngành
    """
    try:
        # Định nghĩa các ngành
        industry_mapping = {
            "banking": ["VCB", "BID", "CTG", "TCB", "MBB", "VPB", "ACB", "HDB", "STB", "TPB", "EIB", "SHB", "MSB", "OCB", "LPB"],
            "real_estate": ["VIC", "VHM", "NVL", "VRE", "KDH", "DXG", "PDR", "BCM", "DIG", "HDG", "IJC", "KBC", "SCR"],
            "manufacturing": ["VNM", "SAB", "MSN", "MML", "VIS", "CII", "DHG", "TRA", "BHN", "KDC", "MCH", "ANV", "SBT"],
            "steel_mining": ["HPG", "HSG", "NKG", "TLH", "SMC", "VGS", "TVN", "KSB", "POM", "TIS"],
            "oil_gas": ["GAS", "PLX", "PVS", "PVD", "PVC", "PVB", "BSR", "OIL", "PVT", "CNG"],
            "technology": ["FPT", "CMG", "ELC", "ITD", "SAM", "VGI", "VTC", "VNG", "SFI", "VCS"],
            "retail": ["MWG", "PNJ", "DGW", "FRT", "VGR", "AST", "SCS", "VDS", "TNG", "HAG"],
            "aviation_logistics": ["VJC", "HVN", "ACV", "VTP", "GMD", "VSC", "TCO", "STG", "TMS", "HAH"],
            "utilities": ["POW", "GEG", "PC1", "NT2", "SBA", "REE", "EVE", "VSH", "BWE", "TBC"],
            "food_agriculture": ["VHC", "BAF", "LAF", "HNG", "SLS", "FMC", "CAP", "LSS", "ASM", "HAP"]
        }

        # Chọn symbols theo ngành
        if industry == "all":
            symbols_to_query = []
            for industry_symbols in industry_mapping.values():
                symbols_to_query.extend(industry_symbols)
            symbols_to_query = sorted(list(set(symbols_to_query)))[:limit]
        elif industry in industry_mapping:
            symbols_to_query = industry_mapping[industry][:limit]
        else:
            return {
                "error": f"Ngành '{industry}' không hợp lệ",
                "available_industries": list(industry_mapping.keys()) + ["all"],
                "timestamp": datetime.now().isoformat()
            }

        # Lấy dữ liệu giống như endpoint /api/stocks
        stocks = []
        if hasattr(vnstock, 'Trading'):
            try:
                trading = vnstock.Trading()
                price_data = trading.price_board(symbols_to_query)

                if not price_data.empty:
                    for idx, row in price_data.iterrows():
                        symbol_val = row.get(('listing', 'symbol')) or symbols_to_query[idx] if idx < len(symbols_to_query) else 'N/A'
                        price_val = row.get(('match', 'match_price')) or 0
                        match_price = row.get(('match', 'match_price'), 0)
                        ref_price = row.get(('listing', 'ref_price'), 0)
                        change_val = float(match_price - ref_price) if match_price and ref_price else 0
                        volume_val = row.get(('match', 'accumulated_volume')) or 0

                        pct_change = 0
                        if ref_price and ref_price > 0 and change_val != 0:
                            pct_change = round((change_val / ref_price) * 100, 2)

                        # Xác định ngành (case-insensitive)
                        stock_industry = "Chưa phân loại"
                        symbol_upper = str(symbol_val).upper().strip()
                        print(f"By-industry - Checking industry for symbol: '{symbol_upper}'")  # Debug log

                        for ind_name, ind_symbols in industry_mapping.items():
                            if symbol_upper in ind_symbols:
                                industry_names = {
                                    "banking": "Ngân hàng",
                                    "real_estate": "Bất động sản",
                                    "manufacturing": "Sản xuất & Tiêu dùng",
                                    "steel_mining": "Thép & Khai khoáng",
                                    "oil_gas": "Dầu khí",
                                    "technology": "Công nghệ",
                                    "retail": "Bán lẻ",
                                    "aviation_logistics": "Hàng không & Logistics",
                                    "utilities": "Điện & Tiện ích",
                                    "food_agriculture": "Thực phẩm & Nông nghiệp"
                                }
                                stock_industry = industry_names.get(ind_name, "Chưa phân loại")
                                print(f"By-industry - Found industry '{stock_industry}' for symbol '{symbol_upper}'")  # Debug log
                                break

                        if stock_industry == "Chưa phân loại":
                            print(f"By-industry - Symbol '{symbol_upper}' not found in any industry list")  # Debug log

                        stock_info = {
                            "symbol": str(symbol_val),
                            "name": str(symbol_val),
                            "price": float(price_val) if price_val else 0,
                            "change": float(change_val) if change_val else 0,
                            "pct_change": pct_change,
                            "volume": int(volume_val) if volume_val else 0,
                            "industry": stock_industry,
                            "exchange": "HOSE"
                        }
                        stocks.append(stock_info)

            except Exception as e:
                print(f"Error getting industry stocks: {e}")

        return {
            "industry": industry,
            "stocks": stocks,
            "count": len(stocks),
            "available_industries": list(industry_mapping.keys()) + ["all"],
            "timestamp": datetime.now().isoformat(),
            "source": source
        }

    except Exception as e:
        return {
            "industry": industry,
            "error": f"Lỗi khi lấy dữ liệu ngành: {str(e)}",
            "available_industries": ["banking", "real_estate", "manufacturing", "steel_mining", "oil_gas", "technology", "retail", "aviation_logistics", "utilities", "food_agriculture", "all"],
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/stocks/statistics")
def get_market_statistics(source: str = Query("TCBS", description="Nguồn dữ liệu")):
    """
    API lấy thống kê tổng quan thị trường chứng khoán Việt Nam.

    Returns:
        Thống kê về số lượng cổ phiếu, sàn giao dịch, ngành
    """
    try:
        stats = {
            "total_stocks": 0,
            "exchanges": {
                "HOSE": 0,
                "HNX": 0,
                "UPCOM": 0
            },
            "industries": {
                "Ngân hàng": 0,
                "Bất động sản": 0,
                "Sản xuất & Tiêu dùng": 0,
                "Thép & Khai khoáng": 0,
                "Dầu khí": 0,
                "Công nghệ": 0,
                "Bán lẻ": 0,
                "Hàng không & Logistics": 0,
                "Điện & Tiện ích": 0,
                "Thực phẩm & Nông nghiệp": 0,
                "Chưa phân loại": 0
            },
            "sample_stocks": [],
            "timestamp": datetime.now().isoformat(),
            "source": source
        }

        # Thử lấy danh sách từ vnstock
        if hasattr(vnstock, 'listing_companies'):
            try:
                companies_df = vnstock.listing_companies()

                if not companies_df.empty:
                    stats["total_stocks"] = len(companies_df)

                    # Đếm theo sàn giao dịch
                    if 'exchange' in companies_df.columns:
                        exchange_counts = companies_df['exchange'].value_counts()
                        for exchange, count in exchange_counts.items():
                            if exchange.upper() in stats["exchanges"]:
                                stats["exchanges"][exchange.upper()] = int(count)

                    # Lấy mẫu 20 cổ phiếu đầu tiên
                    sample_symbols = []
                    if 'symbol' in companies_df.columns:
                        sample_symbols = companies_df['symbol'].head(20).tolist()
                    elif 'Symbol' in companies_df.columns:
                        sample_symbols = companies_df['Symbol'].head(20).tolist()

                    stats["sample_stocks"] = sample_symbols

            except Exception as e:
                print(f"Error getting statistics from listing_companies: {e}")

        # Fallback: Đếm từ danh sách cố định
        if stats["total_stocks"] == 0:
            banking_stocks = ["VCB", "BID", "CTG", "TCB", "MBB", "VPB", "ACB", "HDB", "STB", "TPB", "EIB", "SHB", "MSB", "OCB", "LPB", "NAB", "BAB", "ABB", "VBB"]
            real_estate_stocks = ["VIC", "VHM", "NVL", "VRE", "KDH", "DXG", "PDR", "BCM", "DIG", "HDG", "IJC", "KBC", "SCR", "CEO", "HDC", "NLG", "IDC", "CRE", "TDH"]
            manufacturing_stocks = ["VNM", "SAB", "MSN", "MML", "VIS", "CII", "DHG", "TRA", "BHN", "KDC", "MCH", "ANV", "SBT", "VCF", "BBC", "TAC", "DPM", "BMP", "VHG"]
            steel_mining_stocks = ["HPG", "HSG", "NKG", "TLH", "SMC", "VGS", "TVN", "KSB", "POM", "TIS", "DTL", "VCA", "TNA", "VNS", "CSM", "VCS", "SHI", "VGC"]
            oil_gas_stocks = ["GAS", "PLX", "PVS", "PVD", "PVC", "PVB", "BSR", "OIL", "PVT", "CNG", "PVG", "PSH", "PVX", "PGS", "PGD", "PGC", "PSW", "PGV"]
            technology_stocks = ["FPT", "CMG", "ELC", "ITD", "SAM", "VGI", "VTC", "VNG", "SFI", "VCS", "CMT", "CMX", "ICT", "TNG", "VTI", "VTS", "VDS", "VGT"]
            retail_stocks = ["MWG", "PNJ", "DGW", "FRT", "VGR", "AST", "SCS", "VDS", "TNG", "HAG", "FRT", "VRE", "VGC", "VGS", "VGI", "VGT", "VGV", "VGX"]
            aviation_logistics_stocks = ["VJC", "HVN", "ACV", "VTP", "GMD", "VSC", "TCO", "STG", "TMS", "HAH", "VOS", "VTO", "VTG", "VTS", "VTV", "VTX", "VTY", "VTZ"]
            utilities_stocks = ["POW", "GEG", "PC1", "NT2", "SBA", "REE", "EVE", "VSH", "BWE", "TBC", "EVG", "EVS", "EVF", "GEX", "HND", "SJD", "QTP", "VSI"]
            food_agriculture_stocks = ["VHC", "BAF", "LAF", "HNG", "SLS", "FMC", "CAP", "LSS", "ASM", "HAP", "VNF", "VIF", "VCG", "VTF", "VFF", "VGF", "VHF", "VKF"]

            all_stocks = (banking_stocks + real_estate_stocks + manufacturing_stocks +
                         steel_mining_stocks + oil_gas_stocks + technology_stocks +
                         retail_stocks + aviation_logistics_stocks + utilities_stocks +
                         food_agriculture_stocks)

            stats["total_stocks"] = len(set(all_stocks))
            stats["industries"]["Ngân hàng"] = len(banking_stocks)
            stats["industries"]["Bất động sản"] = len(real_estate_stocks)
            stats["industries"]["Sản xuất & Tiêu dùng"] = len(manufacturing_stocks)
            stats["industries"]["Thép & Khai khoáng"] = len(steel_mining_stocks)
            stats["industries"]["Dầu khí"] = len(oil_gas_stocks)
            stats["industries"]["Công nghệ"] = len(technology_stocks)
            stats["industries"]["Bán lẻ"] = len(retail_stocks)
            stats["industries"]["Hàng không & Logistics"] = len(aviation_logistics_stocks)
            stats["industries"]["Điện & Tiện ích"] = len(utilities_stocks)
            stats["industries"]["Thực phẩm & Nông nghiệp"] = len(food_agriculture_stocks)

            # Ước tính số lượng theo sàn (dựa trên thực tế)
            stats["exchanges"]["HOSE"] = 400  # Ước tính
            stats["exchanges"]["HNX"] = 350   # Ước tính
            stats["exchanges"]["UPCOM"] = 800 # Ước tính

            stats["sample_stocks"] = sorted(list(set(all_stocks)))[:20]

        return stats

    except Exception as e:
        print(f"Error getting market statistics: {e}")
        return {
            "error": f"Lỗi khi lấy thống kê thị trường: {str(e)}",
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
                    # Debug: In ra cấu trúc dữ liệu realtime
                    print(f"Realtime Trading.price_board columns: {price_data.columns.tolist()}")
                    print(f"Realtime Trading.price_board shape: {price_data.shape}")
                    if len(price_data) > 0:
                        print(f"Realtime sample row: {price_data.iloc[0].to_dict()}")

                    for idx, row in price_data.iterrows():
                        # Debug: In ra dữ liệu từng row
                        print(f"Realtime Row {idx}: {row.to_dict()}")

                        # vnstock 3.x sử dụng MultiIndex columns với format (category, field)
                        symbol_val = (row.get(('listing', 'symbol')) or row.get('symbol') or
                                     symbol_list[idx] if idx < len(symbol_list) else 'N/A')

                        price_val = (row.get(('match', 'match_price')) or
                                    row.get(('match', 'avg_match_price')) or
                                    row.get('close') or row.get('price') or 0)

                        # Tính change từ match_price và ref_price
                        match_price = row.get(('match', 'match_price'), 0)
                        ref_price = row.get(('listing', 'ref_price'), 0)
                        change_val = float(match_price - ref_price) if match_price and ref_price else 0

                        volume_val = (row.get(('match', 'accumulated_volume')) or
                                     row.get(('match', 'match_vol')) or
                                     row.get('volume') or 0)

                        # Tính phần trăm thay đổi
                        pct_change = 0
                        if ref_price and ref_price > 0 and change_val != 0:
                            pct_change = round((change_val / ref_price) * 100, 2)

                        # Xác định ngành dựa trên symbol (case-insensitive)
                        def get_industry_realtime(symbol):
                            symbol_upper = str(symbol).upper().strip()
                            print(f"Realtime - Checking industry for symbol: '{symbol_upper}'")  # Debug log

                            banking_stocks = ["VCB", "BID", "CTG", "TCB", "MBB", "VPB", "ACB", "HDB", "STB", "TPB", "EIB", "SHB", "MSB", "OCB", "LPB"]
                            real_estate_stocks = ["VIC", "VHM", "NVL", "VRE", "KDH", "DXG", "PDR", "BCM", "DIG", "HDG", "IJC", "KBC", "SCR"]
                            manufacturing_stocks = ["VNM", "SAB", "MSN", "MML", "VIS", "CII", "DHG", "TRA", "BHN", "KDC", "MCH", "ANV", "SBT"]
                            steel_mining_stocks = ["HPG", "HSG", "NKG", "TLH", "SMC", "VGS", "TVN", "KSB", "POM", "TIS"]
                            oil_gas_stocks = ["GAS", "PLX", "PVS", "PVD", "PVC", "PVB", "BSR", "OIL", "PVT", "CNG"]
                            technology_stocks = ["FPT", "CMG", "ELC", "ITD", "SAM", "VGI", "VTC", "VNG", "SFI", "VCS"]
                            retail_stocks = ["MWG", "PNJ", "DGW", "FRT", "VGR", "AST", "SCS", "VDS", "TNG", "HAG"]
                            aviation_logistics_stocks = ["VJC", "HVN", "ACV", "VTP", "GMD", "VSC", "TCO", "STG", "TMS", "HAH"]
                            utilities_stocks = ["POW", "GEG", "PC1", "NT2", "SBA", "REE", "EVE", "VSH", "BWE", "TBC"]
                            food_agriculture_stocks = ["VHC", "BAF", "LAF", "HNG", "SLS", "FMC", "CAP", "LSS", "ASM", "HAP"]

                            if symbol_upper in banking_stocks:
                                return "Ngân hàng"
                            elif symbol_upper in real_estate_stocks:
                                return "Bất động sản"
                            elif symbol_upper in manufacturing_stocks:
                                return "Sản xuất & Tiêu dùng"
                            elif symbol_upper in steel_mining_stocks:
                                return "Thép & Khai khoáng"
                            elif symbol_upper in oil_gas_stocks:
                                return "Dầu khí"
                            elif symbol_upper in technology_stocks:
                                return "Công nghệ"
                            elif symbol_upper in retail_stocks:
                                return "Bán lẻ"
                            elif symbol_upper in aviation_logistics_stocks:
                                return "Hàng không & Logistics"
                            elif symbol_upper in utilities_stocks:
                                return "Điện & Tiện ích"
                            elif symbol_upper in food_agriculture_stocks:
                                return "Thực phẩm & Nông nghiệp"
                            else:
                                print(f"Realtime - Symbol '{symbol_upper}' not found in any industry list")  # Debug log
                                return "Chưa phân loại"

                        # Tạo dữ liệu realtime từ price_board
                        stock_info = {
                            "symbol": str(symbol_val),
                            "name": str(symbol_val),
                            "price": float(price_val) if price_val else 0,
                            "change": float(change_val) if change_val else 0,
                            "pct_change": pct_change,
                            "volume": int(volume_val) if volume_val else 0,
                            "industry": get_industry_realtime(str(symbol_val))
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
