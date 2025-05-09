import logger from './logger.js';

/**
 * Class quản lý WebSocket, lưu trữ đối tượng io và các phương thức phổ biến
 */
class SocketManager {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // Map userId -> socketId
        logger.info('Socket Manager khởi tạo');
    }

    /**
     * Khởi tạo với đối tượng Socket.io
     * @param {Object} io - Đối tượng Socket.io server
     */
    init(io) {
        this.io = io;
        logger.info('Socket Manager đã được khởi tạo với io server');

        // Thiết lập sự kiện kết nối
        this.io.on('connection', (socket) => {
            logger.info(`New socket connected: ${socket.id}`);

            // Xử lý sự kiện đăng nhập
            socket.on('login', (userId) => {
                if (userId) {
                    // Lưu mapping từ userId tới socketId
                    this.connectedUsers.set(userId, socket.id);
                    // Join phòng riêng của user
                    socket.join(userId);
                    logger.info(`User ${userId} logged in and joined room ${userId}`);
                }
            });

            // Xử lý sự kiện đăng xuất
            socket.on('logout', (userId) => {
                if (userId) {
                    this.connectedUsers.delete(userId);
                    socket.leave(userId);
                    logger.info(`User ${userId} logged out`);
                }
            });

            // Xử lý sự kiện ngắt kết nối
            socket.on('disconnect', () => {
                // Tìm userId dựa trên socketId
                for (const [userId, socketId] of this.connectedUsers.entries()) {
                    if (socketId === socket.id) {
                        this.connectedUsers.delete(userId);
                        logger.info(`User ${userId} disconnected`);
                        break;
                    }
                }
                logger.info(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    /**
     * Gửi thông báo đến một user cụ thể
     * @param {string} userId - ID của user nhận thông báo
     * @param {string} event - Tên sự kiện
     * @param {Object} data - Dữ liệu gửi đi
     */
    sendToUser(userId, event, data) {
        if (!this.io) {
            logger.error('Socket.io chưa được khởi tạo');
            return;
        }

        this.io.to(userId).emit(event, data);
        logger.info(`Sent ${event} to user ${userId}`);
    }

    /**
     * Gửi thông báo đến tất cả user đang kết nối
     * @param {string} event - Tên sự kiện
     * @param {Object} data - Dữ liệu gửi đi
     */
    sendToAll(event, data) {
        if (!this.io) {
            logger.error('Socket.io chưa được khởi tạo');
            return;
        }

        this.io.emit(event, data);
        logger.info(`Sent ${event} to all connected users`);
    }

    /**
     * Kiểm tra xem một user có đang kết nối hay không
     * @param {string} userId - ID của user cần kiểm tra
     * @returns {boolean} - true nếu user đang kết nối
     */
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }

    /**
     * Access to rooms for chaining syntax
     * @param {string} room - Room name
     */
    to(room) {
        if (!this.io) {
            logger.error('Socket.io chưa được khởi tạo');
            return {
                emit: () => { } // No-op function
            };
        }
        return this.io.to(room);
    }

    /**
     * Gửi thông báo đến user
     * @param {string} userId - ID của user nhận thông báo 
     * @param {Object} notification - Thông báo
     */
    sendNotification(userId, notification) {
        this.sendToUser(userId, 'notification', notification);
    }

    // ===== BUDGET EVENTS =====

    /**
     * Emit khi tạo mới budget
     * @param {string} userId - ID của user
     * @param {Object} budget - Budget object
     */
    emitBudgetCreate(userId, budget) {
        this.sendToUser(userId, 'budget:create', budget);
    }

    /**
     * Emit khi cập nhật budget
     * @param {string} userId - ID của user
     * @param {Object} budget - Budget object
     */
    emitBudgetUpdate(userId, budget) {
        this.sendToUser(userId, 'budget:update', budget);
    }

    /**
     * Emit khi xóa budget
     * @param {string} userId - ID của user
     * @param {string} budgetId - ID của budget
     */
    emitBudgetDelete(userId, budgetId) {
        this.sendToUser(userId, 'budget:delete', { id: budgetId });
    }

    // ===== EXPENSE EVENTS =====

    /**
     * Emit khi tạo mới expense
     * @param {string} userId - ID của user
     * @param {Object} expense - Expense object
     */
    emitExpenseCreate(userId, expense) {
        this.sendToUser(userId, 'expense:create', expense);
    }

    /**
     * Emit khi cập nhật expense
     * @param {string} userId - ID của user
     * @param {Object} expense - Expense object
     */
    emitExpenseUpdate(userId, expense) {
        this.sendToUser(userId, 'expense:update', expense);
    }

    /**
     * Emit khi xóa expense
     * @param {string} userId - ID của user
     * @param {string} expenseId - ID của expense
     */
    emitExpenseDelete(userId, expenseId) {
        this.sendToUser(userId, 'expense:delete', { id: expenseId });
    }

    // ===== INCOME EVENTS =====

    /**
     * Emit khi tạo mới income
     * @param {string} userId - ID của user
     * @param {Object} income - Income object
     */
    emitIncomeCreate(userId, income) {
        this.sendToUser(userId, 'income:create', income);
    }

    /**
     * Emit khi cập nhật income
     * @param {string} userId - ID của user
     * @param {Object} income - Income object
     */
    emitIncomeUpdate(userId, income) {
        this.sendToUser(userId, 'income:update', income);
    }

    /**
     * Emit khi xóa income
     * @param {string} userId - ID của user
     * @param {string} incomeId - ID của income
     */
    emitIncomeDelete(userId, incomeId) {
        this.sendToUser(userId, 'income:delete', { id: incomeId });
    }

    // ===== LOAN EVENTS =====

    /**
     * Emit khi tạo mới loan
     * @param {string} userId - ID của user
     * @param {Object} loan - Loan object
     */
    emitLoanCreate(userId, loan) {
        this.sendToUser(userId, 'loan:create', loan);
    }

    /**
     * Emit khi cập nhật loan
     * @param {string} userId - ID của user
     * @param {Object} loan - Loan object
     */
    emitLoanUpdate(userId, loan) {
        this.sendToUser(userId, 'loan:update', loan);
    }

    /**
     * Emit khi xóa loan
     * @param {string} userId - ID của user
     * @param {string} loanId - ID của loan
     */
    emitLoanDelete(userId, loanId) {
        this.sendToUser(userId, 'loan:delete', { id: loanId });
    }

    /**
     * Emit khi xóa một khoản thanh toán loan
     * @param {string} userId - ID của user
     * @param {string} paymentId - ID của payment
     * @param {Object} loan - Loan sau khi đã cập nhật
     */
    emitLoanPaymentDelete(userId, paymentId, loan) {
        this.sendToUser(userId, 'loan:payment:delete', {
            paymentId: paymentId,
            loan: loan
        });
    }
}

// Export singleton instance
const socketManager = new SocketManager();
export default socketManager; 