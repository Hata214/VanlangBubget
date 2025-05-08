# Stock API Service

API trung gian sử dụng FastAPI để lấy thông tin giá cổ phiếu từ vnstock và cung cấp cho ứng dụng Next.js.

## Cài đặt

```bash
# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Cài đặt các thư viện
pip install -r requirements.txt
```

## Chạy API

```bash
uvicorn main:app --reload
```

API sẽ chạy tại địa chỉ: http://localhost:8000

## Các endpoint

### 1. Lấy giá cổ phiếu

```
GET /api/price?symbol=VNM
```

Tham số:
- `symbol`: Mã cổ phiếu (mặc định: VNM)

Kết quả trả về:
```json
{
  "symbol": "VNM",
  "price": 58200.0
}
```

## Sử dụng trong Next.js

```javascript
const fetchStockPrice = async (symbol = 'VNM') => {
  const res = await fetch(`http://localhost:8000/api/price?symbol=${symbol}`);
  const data = await res.json();
  return data;
};
``` 