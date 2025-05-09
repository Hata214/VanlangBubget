import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
    getAdminUserList,
    getAdminUserDetail,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    promoteToAdmin,
    demoteFromAdmin,
    activateUser,
    deactivateUser,
    resetUserPassword,
    getUserStats
} from '../controllers/userController.js';
import logger from '../utils/logger.js';

const router = express.Router();

console.log('AdminRoutes được tạo ✅');

// Tất cả các routes đều yêu cầu xác thực và quyền admin
router.use(protect);
router.use(restrictTo('admin', 'superadmin'));
console.log('AdminRoutes: Middleware protect và restrictTo(admin, superadmin) được áp dụng ✅');

// === Routes quản lý người dùng ===
// Lấy thống kê người dùng
router.get('/users/stats', getUserStats);

// Lấy danh sách người dùng có phân trang và tìm kiếm
router.get('/users', getAdminUserList);

// Tạo người dùng mới
router.post('/users', createAdminUser);

// Lấy chi tiết người dùng
router.get('/users/:id', getAdminUserDetail);

// Cập nhật thông tin người dùng
router.put('/users/:id', updateAdminUser);

// Xóa người dùng
router.delete('/users/:id', deleteAdminUser);

// Thăng cấp người dùng lên admin (chỉ SuperAdmin)
router.post('/users/:id/promote', restrictTo('superadmin'), promoteToAdmin);

// Hạ cấp admin xuống người dùng thường (chỉ SuperAdmin)
router.post('/users/:id/demote', restrictTo('superadmin'), demoteFromAdmin);

// Kích hoạt tài khoản người dùng
router.post('/users/:id/activate', activateUser);

// Vô hiệu hóa tài khoản người dùng
router.post('/users/:id/deactivate', deactivateUser);

// Đặt lại mật khẩu người dùng
router.post('/users/:id/reset-password', resetUserPassword);

// === Các routes quản lý admin khác có thể thêm vào đây ===

console.log('❗ adminRoutes: Các routes quản lý người dùng đã được đăng ký ✅');

export default router; 