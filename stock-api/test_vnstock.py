import vnstock
import pandas as pd
import json

def test_price_board():
    """Kiểm tra hàm price_board của vnstock"""
    print("Kiểm tra hàm price_board của vnstock")
    
    # Danh sách cổ phiếu cần kiểm tra
    symbols = ["VCB", "BID", "CTG", "TCB", "MBB"]
    
    try:
        # Lấy bảng giá
        df = vnstock.price_board(symbols)
        
        print(f"Kết quả: {df.shape[0]} dòng, {df.shape[1]} cột")
        print(f"Các cột: {df.columns.tolist()}")
        
        # Kiểm tra dữ liệu
        print("\nDữ liệu gốc:")
        print(df.head().to_string())
        
        # Kiểm tra giá trị của cột Mã CP
        if 'Mã CP' in df.columns:
            print("\nGiá trị của cột 'Mã CP':")
            for i, val in enumerate(df['Mã CP'].values):
                print(f"  {i}: '{val}' (type: {type(val)})")
        
        # Thử chuyển đổi dữ liệu
        print("\nThử chuyển đổi dữ liệu:")
        result = []
        for i, (_, row) in enumerate(df.iterrows()):
            symbol_value = None
            if 'Mã CP' in df.columns:
                symbol_raw = row.get('Mã CP', '')
                print(f"  Mã cổ phiếu gốc: '{symbol_raw}' (type: {type(symbol_raw)})")
                
                # Thử các cách khác nhau để làm sạch mã cổ phiếu
                if isinstance(symbol_raw, str):
                    # Cách 1: Loại bỏ các ký tự đặc biệt
                    symbol_clean1 = symbol_raw.replace("['", "").replace("']", "").replace("'", "").strip()
                    print(f"    Cách 1: '{symbol_clean1}'")
                    
                    # Cách 2: Sử dụng regex
                    import re
                    symbol_clean2 = re.sub(r'[\[\]\'"]', '', symbol_raw).strip()
                    print(f"    Cách 2: '{symbol_clean2}'")
                    
                    # Cách 3: Sử dụng eval nếu nó là một list dạng chuỗi
                    try:
                        if symbol_raw.startswith('[') and symbol_raw.endswith(']'):
                            symbol_list = eval(symbol_raw)
                            symbol_clean3 = symbol_list[0] if symbol_list else ""
                            print(f"    Cách 3: '{symbol_clean3}'")
                        else:
                            print("    Cách 3: Không áp dụng được")
                    except Exception as e:
                        print(f"    Cách 3: Lỗi - {str(e)}")
                    
                    symbol_value = symbol_clean1
                else:
                    print("    Không phải chuỗi, không thể làm sạch")
            
            # Nếu không tìm thấy mã hoặc mã không hợp lệ, sử dụng mã từ danh sách ban đầu
            if not symbol_value and i < len(symbols):
                symbol_value = symbols[i]
                print(f"    Sử dụng mã từ danh sách ban đầu: '{symbol_value}'")
            
            # Thử lấy giá
            price_value = None
            if 'Giá' in df.columns:
                price_raw = row.get('Giá')
                print(f"  Giá gốc: {price_raw} (type: {type(price_raw)})")
                
                # Thử chuyển đổi giá
                if price_raw is not None and not pd.isna(price_raw):
                    try:
                        price_value = float(price_raw)
                        print(f"    Giá sau khi chuyển đổi: {price_value}")
                    except (ValueError, TypeError) as e:
                        print(f"    Lỗi chuyển đổi giá: {str(e)}")
                        price_value = 0
                else:
                    print("    Giá là None hoặc NaN")
                    price_value = 0
            
            result.append({
                "symbol": symbol_value,
                "price": price_value
            })
        
        # In kết quả
        print("\nKết quả cuối cùng:")
        for item in result:
            print(f"  {item['symbol']}: {item['price']}")
        
    except Exception as e:
        print(f"Lỗi: {str(e)}")

def test_mock_data():
    """Tạo dữ liệu giả để kiểm tra"""
    print("\nTạo dữ liệu giả để kiểm tra:")
    
    # Tạo dữ liệu giả
    data = []
    symbols = ["VCB", "BID", "CTG", "TCB", "MBB"]
    for symbol in symbols:
        data.append({
            "symbol": symbol,
            "price": 50000 + (hash(symbol) % 10000),  # Giá ngẫu nhiên
            "change": (hash(symbol) % 2000) - 1000,   # Thay đổi ngẫu nhiên
            "pct_change": ((hash(symbol) % 2000) - 1000) / 100,  # Phần trăm thay đổi ngẫu nhiên
            "volume": hash(symbol) % 1000000          # Khối lượng ngẫu nhiên
        })
    
    # In dữ liệu giả
    print(json.dumps(data, indent=2))
    
    # Trả về dữ liệu giả
    return {
        "symbols": symbols,
        "source": "MOCK",
        "count": len(data),
        "timestamp": pd.Timestamp.now().isoformat(),
        "data": data
    }

if __name__ == "__main__":
    test_price_board()
    mock_data = test_mock_data()
    print(f"\nDữ liệu giả có thể sử dụng: {len(mock_data['data'])} mã") 