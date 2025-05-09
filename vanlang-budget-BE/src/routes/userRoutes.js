import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import User from '../models/userModel.js';
import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Loan from '../models/loanModel.js';
import LoanPayment from '../models/loanPaymentModel.js';
import Budget from '../models/budgetModel.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import {
    getMe,
    updateMe,
    deleteMe,
    resetUserData,
    updateUserRole,
    getAllUsers
} from '../controllers/userController.js';

const router = express.Router();

console.log('UserRoutes được tạo ✅');

// Tất cả các routes đều yêu cầu xác thực
router.use(protect);
console.log('UserRoutes: Middleware protect được áp dụng ✅');

// Routes cho người dùng hiện tại
router.get('/me', getMe);
router.patch('/me', updateMe);
router.delete('/me', deleteMe);

// Route xóa toàn bộ dữ liệu người dùng
router.post('/reset-data', resetUserData);

// Route lấy tất cả người dùng (chỉ Superadmin)
router.get('/', restrictTo('superadmin'), getAllUsers);

// Route cập nhật vai trò người dùng (chỉ Superadmin)
router.patch(
    '/:id/role',
    restrictTo('superadmin'),
    updateUserRole
);

console.log('❗ userRoutes được đăng ký với route /reset-data ✅');
console.log('❗ userRoutes được đăng ký với route / (GET - Superadmin) ✅');
console.log('❗ userRoutes được đăng ký với route /:id/role (Superadmin) ✅');

export default router; 