# Stock API - Hệ thống API thông tin cổ phiếu Việt Nam

Hệ thống API cung cấp thông tin về thị trường chứng khoán Việt Nam, sử dụng thư viện [vnstock](https://github.com/thinh-vu/vnstock) để truy xuất dữ liệu.

## Tính năng chính

- Lấy giá hiện tại của cổ phiếu
- Xem danh sách cổ phiếu và thông tin cơ bản
- Truy xuất dữ liệu lịch sử giá
- Xem thông tin chi tiết về công ty
- Theo dõi chỉ số thị trường (VNIndex, VN30, HNX, UPCOM)
- **Cập nhật**: Lấy dữ liệu giao dịch theo thời gian thực (intraday)
- **Cập nhật**: Lấy thông tin giá theo thời gian thực (realtime) của nhiều mã cổ phiếu sử dụng cú pháp mới của vnstock 3.1.0+
- **Mới**: API dữ liệu giả (mock) cho các mã cổ phiếu khi API realtime không hoạt động

## Cài đặt và chạy

### Yêu cầu

- Python 3.8+
- FastAPI
- vnstock 3.0.9+

### Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd stock-api

# Cài đặt dependencies
pip install -r requirements.txt
```

### Chạy ứng dụng

```bash
# Chạy với uvicorn
uvicorn main:app --reload

# Hoặc sử dụng Docker
docker-compose up
```

## API Endpoints

### 1. Thông tin tổng quan

```
GET /
```

Trả về thông tin tổng quan về API và các endpoints có sẵn.

### 2. Lấy giá cổ phiếu

```
GET /api/price?symbol=<mã cổ phiếu>&source=<nguồn dữ liệu>
```

**Tham số:**
- `symbol` (mặc định: VNM): Mã cổ phiếu cần truy vấn
- `source` (mặc định: VCI): Nguồn dữ liệu (VCI, TCBS, SSI, DNSE)

**Kết quả:**
```json
{
  "symbol": "VNM",
  "price": 56.4,
  "change": 0.0,
  "pct_change": 0.0,
  "date": "2024-06-18",
  "source": "VCI"
}
```

### 3. Danh sách cổ phiếu

```
GET /api/stocks?limit=<số lượng>&source=<nguồn dữ liệu>
```

**Tham số:**
- `limit` (mặc định: 20): Số lượng cổ phiếu muốn lấy
- `source` (mặc định: VCI): Nguồn dữ liệu

**Kết quả:**
```json
{
  "stocks": [
    {
      "symbol": "VNM",
      "price": 56.4,
      "change": 0.0,
      "pct_change": 0.0,
      "volume": 2144983,
      "name": "CTCP Sữa Việt Nam",
      "exchange": "HOSE",
      "industry": "Thực phẩm"
    },
    // ...
  ],
  "count": 20,
  "timestamp": "2024-06-18T11:35:03.724762",
  "source": "VCI"
}
```

### 4. Dữ liệu lịch sử giá

```
GET /api/stock/history?symbol=<mã cổ phiếu>&source=<nguồn dữ liệu>&start_date=<ngày bắt đầu>&end_date=<ngày kết thúc>&interval=<khoảng thời gian>
```

**Tham số:**
- `symbol` (mặc định: VNM): Mã cổ phiếu
- `source` (mặc định: VCI): Nguồn dữ liệu
- `start_date`: Ngày bắt đầu (định dạng YYYY-MM-DD)
- `end_date`: Ngày kết thúc (định dạng YYYY-MM-DD)
- `interval` (mặc định: 1D): Khoảng thời gian (1D: ngày, 1W: tuần, 1M: tháng)

**Kết quả:**
```json
{
  "symbol": "VNM",
  "source": "VCI",
  "interval": "1D",
  "start_date": "2024-01-01",
  "end_date": "2024-01-10",
  "data": [
    {
      "date": "2024-01-02",
      "open": 62.35,
      "high": 62.62,
      "low": 62.08,
      "close": 62.44,
      "volume": 2144983
    },
    // ...
  ]
}
```

### 5. Dữ liệu giao dịch theo thời gian thực (Intraday)

```
GET /api/stock/intraday?symbol=<mã cổ phiếu>&source=<nguồn dữ liệu>&page_size=<số lượng>&page=<trang>
```

**Tham số:**
- `symbol` (mặc định: VNM): Mã cổ phiếu
- `source` (mặc định: VCI): Nguồn dữ liệu
- `page_size` (mặc định: 1000): Số lượng giao dịch muốn lấy
- `page` (mặc định: 1): Số trang

**Kết quả:**
```json
{
  "symbol": "VNM",
  "source": "VCI",
  "page": 1,
  "page_size": 1000,
  "count": 150,
  "timestamp": "2024-06-18T11:45:07.948866",
  "data": [
    {
      "time": "2024-06-18 14:30:05",
      "price": 56.4,
      "volume": 100,
      "side": "BUY"
    },
    // ...
  ]
}
```

### 6. Thông tin giá theo thời gian thực

```
GET /api/stock/realtime?symbols=<danh sách mã cổ phiếu>&source=<nguồn dữ liệu>
```

**Tham số:**
- `symbols` (mặc định: VNM,VCB,HPG): Danh sách mã cổ phiếu, phân cách bằng dấu phẩy
- `source` (mặc định: TCBS): Nguồn dữ liệu (khuyên dùng TCBS vì cung cấp dữ liệu realtime tốt nhất)

**Ví dụ:**
```
GET /api/stock/realtime?symbols=VCB,BID,CTG,TCB,MBB,VIC,NVL,PDR,VNM,SAB,MSN,HPG&source=TCBS
```

**Kết quả:**
```json
{
  "symbols": ["VNM", "VCB", "HPG"],
  "source": "TCBS",
  "count": 3,
  "timestamp": "2024-06-18T11:45:07.948866",
  "data": [
    {
      "symbol": "VNM",
      "price": 56.4,
      "change": 0.0,
      "pct_change": 0.0,
      "volume": 2144983,
      "high": 56.5,
      "low": 56.2,
      "open": 56.3
    },
    // ...
  ]
}
```

### 7. Thông tin công ty

```
GET /api/stock/company?symbol=<mã cổ phiếu>&source=<nguồn dữ liệu>
```

**Tham số:**
- `symbol` (mặc định: VNM): Mã cổ phiếu
- `source` (mặc định: VCI): Nguồn dữ liệu

**Kết quả:**
```json
{
  "symbol": "VNM",
  "source": "VCI",
  "company_info": {
    "symbol": "VNM",
    "id": "76529",
    "issue_share": 2089955445,
    "history": "...",
    // Các thông tin khác về công ty
  }
}
```

### 8. Chỉ số thị trường

```
GET /api/market/indices?source=<nguồn dữ liệu>
```

**Tham số:**
- `source` (mặc định: VCI): Nguồn dữ liệu

**Kết quả:**
```json
{
  "indices": [
    {
      "symbol": "VNINDEX",
      "price": 1200.5,
      "change": 5.2,
      "pct_change": 0.43,
      "volume": 543000000
    },
    // ...
  ],
  "count": 4,
  "timestamp": "2024-06-18T11:35:40.123456",
  "source": "VCI"
}
```

### 9. Dữ liệu giả cho các mã cổ phiếu

```
GET /api/stock/mock?symbols=<danh sách mã cổ phiếu>
```

**Tham số:**
- `symbols` (mặc định: VNM,VCB,HPG): Danh sách mã cổ phiếu, phân cách bằng dấu phẩy

**Ví dụ:**
```
GET /api/stock/mock?symbols=VCB,BID,CTG,TCB,MBB,VIC,NVL,PDR,VNM,SAB,MSN,HPG
```

**Kết quả:**
```json
{
  "symbols": ["VNM", "VCB", "HPG"],
  "source": "MOCK",
  "count": 3,
  "timestamp": "2024-06-18T11:45:07.948866",
  "data": [
    {
      "symbol": "VNM",
      "price": 56400,
      "change": 200,
      "pct_change": 0.35,
      "volume": 214498,
      "high": 56800,
      "low": 56100,
      "open": 56200
    },
    // ...
  ]
}
```

Sử dụng API này khi API realtime không hoạt động hoặc khi bạn cần dữ liệu giả để kiểm thử ứng dụng.

## Nguồn dữ liệu hỗ trợ

API hỗ trợ các nguồn dữ liệu sau:
- VCI (VietCapital)
- TCBS (Techcombank Securities)
- SSI (SSI Securities)
- DNSE (Dragon Capital)

## Tài liệu API

API có tài liệu tự động được tạo bởi Swagger UI. Bạn có thể truy cập tại:

```
http://localhost:8000/docs
```

## Giấy phép

Dự án này được phát hành dưới giấy phép MIT.

## Tài liệu tham khảo

- [Vnstock Documentation](https://vnstocks.com/docs/category/s%E1%BB%95-tay-h%C6%B0%E1%BB%9Bng-d%E1%BA%ABn)
- [FastAPI Documentation](https://fastapi.tiangolo.com/) 