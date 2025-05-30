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
import { adminDashboard } from '../controllers/adminController.js';
import {
    getAdminList,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    toggleAdminStatus,
    getAdminActivityLogs
} from '../controllers/adminManagementController.js';
import {
    getActivityLogs,
    getActivityStats,
    getLogsByAction,
    getLogsByDateRange
} from '../controllers/activityLogController.js';

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

/**
 * Các routes dành riêng cho superadmin
 */
router.use('/manage', restrictTo('superadmin'));
router.get('/manage/list', getAdminList);
router.post('/manage/create', createAdmin);
router.put('/manage/update/:id', updateAdmin);
router.delete('/manage/delete/:id', deleteAdmin);
router.patch('/manage/toggle-status/:id', toggleAdminStatus);

// === Activity Logs Routes ===
/**
 * Lấy danh sách activity logs
 * - Admin chỉ có thể xem logs của chính mình
 * - SuperAdmin có thể xem tất cả logs
 */
router.get('/activity-logs', getActivityLogs);

/**
 * Lấy thống kê hoạt động admin
 */
router.get('/activity-logs/stats', getActivityStats);

/**
 * Lấy logs theo action type (SuperAdmin only)
 */
router.get('/activity-logs/by-action/:actionType', restrictTo('superadmin'), getLogsByAction);

/**
 * Lấy logs trong khoảng thời gian
 */
router.get('/activity-logs/by-date', getLogsByDateRange);

/**
 * Lấy lịch sử hoạt động của admin cụ thể
 * - Superadmin có thể xem tất cả
 * - Admin chỉ có thể xem lịch sử của mình
 */
router.get('/activity-logs/:adminId', getAdminActivityLogs);

// === Dashboard Route ===
router.get('/dashboard', adminDashboard);

export default router; 