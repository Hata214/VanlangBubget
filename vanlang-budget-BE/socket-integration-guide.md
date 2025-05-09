# Hướng dẫn tích hợp Socket.io vào Controllers

Tài liệu này giải thích cách tích hợp `socketManager` vào các controllers để gửi thông báo realtime trong ứng dụng VanLang Budget.

## 1. Cấu trúc thiết kế

Chúng ta đã cấu hình Socket.io và thiết kế một lớp `SocketManager` (trong `src/socket/socketManager.js`) để quản lý tất cả các sự kiện Socket.io. Trong file `server.js`, chúng ta đã thêm `socketManager` vào request object để có thể truy cập từ controllers:

```javascript
// Make socketManager available in request object
app.use((req, res, next) => {
    req.socketManager = socketManager;
    next();
});
```

## 2. Sử dụng socketManager trong Controllers

### 2.1. Ví dụ khi tạo một chi tiêu mới

```javascript
// Trong expenseController.js
export const createExpense = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const expense = await Expense.create({
            ...req.body,
            user: userId
        });

        // Gửi thông báo realtime
        req.socketManager.emitExpenseCreate(userId, expense);
        
        // Tạo thông báo trong database
        const notification = await Notification.create({
            user: userId,
            title: 'Chi tiêu mới',
            message: `Bạn đã tạo một khoản chi tiêu mới: ${req.body.description}`,
            type: 'expense',
            referenceId: expense._id
        });
        
        // Gửi thông báo đến client
        req.socketManager.sendNotification(userId, notification);

        res.status(201).json({
            status: 'success',
            data: {
                expense
            }
        });
    } catch (error) {
        next(error);
    }
};
```

### 2.2. Ví dụ khi cập nhật ngân sách

```javascript
// Trong budgetController.js
export const updateBudget = async (req, res, next) => {
    try {
        const budget = await Budget.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!budget) {
            return next(new AppError('Không tìm thấy ngân sách', 404));
        }

        // Gửi thông báo realtime về cập nhật ngân sách
        req.socketManager.emitBudgetUpdate(req.user.id, budget);

        res.status(200).json({
            status: 'success',
            data: {
                budget
            }
        });
    } catch (error) {
        next(error);
    }
};
```

## 3. Các sự kiện Socket.io có sẵn

Socket Manager cung cấp các phương thức sau để gửi thông báo:

| Phương thức | Sự kiện | Mô tả |
|-------------|---------|-------|
| `sendNotification(userId, notification)` | `notification:new` | Gửi thông báo mới |
| `emitBudgetUpdate(userId, budget)` | `budget:update` | Thông báo cập nhật ngân sách |
| `emitExpenseCreate(userId, expense)` | `expense:create` | Thông báo tạo chi tiêu mới |
| `emitExpenseUpdate(userId, expense)` | `expense:update` | Thông báo cập nhật chi tiêu |
| `emitExpenseDelete(userId, expenseId)` | `expense:delete` | Thông báo xóa chi tiêu |
| `emitIncomeCreate(userId, income)` | `income:create` | Thông báo tạo thu nhập mới |
| `emitIncomeUpdate(userId, income)` | `income:update` | Thông báo cập nhật thu nhập |
| `emitIncomeDelete(userId, incomeId)` | `income:delete` | Thông báo xóa thu nhập |
| `emitLoanCreate(userId, loan)` | `loan:create` | Thông báo tạo khoản vay mới |
| `emitLoanUpdate(userId, loan)` | `loan:update` | Thông báo cập nhật khoản vay |
| `emitLoanDelete(userId, loanId)` | `loan:delete` | Thông báo xóa khoản vay |
| `emitLoanPayment(userId, payment, loan)` | `loan:payment` | Thông báo thanh toán khoản vay |
| `emitLoanPaymentDelete(userId, paymentId, loan)` | `loan:payment:delete` | Thông báo xóa thanh toán khoản vay |

## 4. Client-side Integration

Để xử lý các sự kiện Socket.io ở phía client, bạn cần thiết lập kết nối và lắng nghe các sự kiện:

```javascript
import { io } from 'socket.io-client';

// Thiết lập kết nối
const socket = io('http://your-api-url', {
    auth: {
        token: 'your-jwt-token'
    }
});

// Tham gia room bằng userId
socket.emit('join', userId);

// Lắng nghe thông báo mới
socket.on('notification:new', (notification) => {
    console.log('New notification:', notification);
    // Hiển thị thông báo, cập nhật UI, vv.
});

// Lắng nghe cập nhật ngân sách
socket.on('budget:update', (budget) => {
    console.log('Budget updated:', budget);
    // Cập nhật UI
});

// Lắng nghe khi disconnect
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
```

## 5. Bảo mật

- Luôn đảm bảo xác thực JWT trước khi cho phép kết nối Socket.io
- Kiểm tra quyền sở hữu dữ liệu trước khi gửi thông báo
- Đảm bảo rằng các sự kiện chỉ được gửi đến đúng người dùng thông qua room dựa trên userId

## 6. Hiệu suất

- Không gửi quá nhiều dữ liệu thông qua Socket.io
- Chỉ gửi dữ liệu cần thiết để cập nhật UI
- Đối với các thay đổi lớn, chỉ gửi ID và client sẽ lấy dữ liệu thông qua API 