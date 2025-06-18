import requests
import json
from datetime import datetime
import pandas as pd

def test_realtime_api():
    """Kiểm tra API realtime"""
    print(f"Bắt đầu kiểm tra API realtime lúc {datetime.now().strftime('%H:%M:%S')}")
    
    # Danh sách cổ phiếu cần kiểm tra
    symbols = "VCB,BID,CTG,TCB,MBB,VIC,NVL,PDR,VNM,SAB,MSN,HPG,GEX,GAS,POW,PLX,FPT,CMG,MWG,PNJ"
    
    try:
        # Gọi API realtime
        url = f"http://localhost:8000/api/stock/realtime?symbols={symbols}&source=TCBS"
        print(f"Gọi API: {url}")
        
        response = requests.get(url)
        response.raise_for_status()  # Kiểm tra lỗi HTTP
        
        data = response.json()
        
        # Hiển thị thông tin
        print(f"Trạng thái: {response.status_code}")
        print(f"Thời gian phản hồi: {response.elapsed.total_seconds():.2f} giây")
        print(f"Số lượng cổ phiếu nhận được: {data.get('count', 0)}")
        print(f"Timestamp: {data.get('timestamp', '')}")
        
        # Hiển thị dữ liệu cổ phiếu
        if 'data' in data and len(data['data']) > 0:
            print("\nDữ liệu cổ phiếu:")
            for stock in data['data'][:5]:  # Chỉ hiển thị 5 cổ phiếu đầu tiên
                print(f"  {stock.get('symbol', '')}: {stock.get('price', 0)} ({stock.get('change', 0)})")
            
            print(f"  ... và {len(data['data']) - 5} cổ phiếu khác")
            
            # Kiểm tra cấu trúc dữ liệu
            first_stock = data['data'][0]
            print("\nCấu trúc dữ liệu của cổ phiếu đầu tiên:")
            for key, value in first_stock.items():
                print(f"  {key}: {value}")
                
            # Tạo DataFrame từ dữ liệu để kiểm tra
            print("\nTạo DataFrame từ dữ liệu:")
            df = pd.DataFrame(data['data'])
            print(df.head())
            
            # Kiểm tra xem có lỗi nào trong dữ liệu không
            print("\nKiểm tra dữ liệu:")
            for i, stock in enumerate(data['data']):
                if 'symbol' not in stock or not stock['symbol']:
                    print(f"  Cổ phiếu thứ {i+1} không có mã")
                if 'price' not in stock or stock['price'] == 0:
                    print(f"  Cổ phiếu {stock.get('symbol', f'thứ {i+1}')} không có giá")
        else:
            print("Không có dữ liệu cổ phiếu hoặc có lỗi")
            if 'error' in data:
                print(f"Lỗi: {data['error']}")
    
    except requests.exceptions.RequestException as e:
        print(f"Lỗi kết nối: {str(e)}")
    except json.JSONDecodeError:
        print("Lỗi khi phân tích dữ liệu JSON")
    except Exception as e:
        print(f"Lỗi không xác định: {str(e)}")
    
    print("\nKết thúc kiểm tra")

def test_vnstock_direct():
    """Kiểm tra trực tiếp thư viện vnstock"""
    print("\nKiểm tra trực tiếp thư viện vnstock:")
    try:
        import vnstock
        
        # Danh sách cổ phiếu cần kiểm tra
        symbols = ["VCB", "BID", "CTG", "TCB", "MBB"]
        
        print(f"Lấy dữ liệu cho: {symbols}")
        
        # Lấy bảng giá
        df = vnstock.price_board(symbols)
        
        print(f"Kết quả: {df.shape[0]} dòng, {df.shape[1]} cột")
        print(f"Các cột: {df.columns.tolist()}")
        print("\nDữ liệu:")
        print(df.head())
        
    except Exception as e:
        print(f"Lỗi: {str(e)}")

if __name__ == "__main__":
    test_realtime_api()
    test_vnstock_direct() 