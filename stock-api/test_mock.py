import requests
import json
from datetime import datetime

def test_mock_api():
    """Kiểm tra API mock"""
    print(f"Bắt đầu kiểm tra API mock lúc {datetime.now().strftime('%H:%M:%S')}")
    
    # Danh sách cổ phiếu cần kiểm tra
    symbols = "VCB,BID,CTG,TCB,MBB,VIC,NVL,PDR,VNM,SAB,MSN,HPG"
    
    try:
        # Gọi API mock
        url = f"http://localhost:8000/api/stock/mock?symbols={symbols}"
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

if __name__ == "__main__":
    test_mock_api() 