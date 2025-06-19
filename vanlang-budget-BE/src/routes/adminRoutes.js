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
    getAdminActivityLogs,
    getAllAdmins,
    getAllUsers,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    toggleAdminStatus,
    resetAdminPassword,
    updateUserRole
} from '../controllers/adminManagementController.js';
import {
    getActivityLogs,
    getActivityStats,
    getLogsByAction,
    getLogsByDateRange,
    deleteAllActivityLogs
} from '../controllers/activityLogController.js';
import {
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    exportTransactions
} from '../controllers/adminTransactionController.js';
import {
    getSystemSettings,
    updateSystemSettings,
    testEmailConfig,
    createBackup,
    restoreFromBackup
} from '../controllers/systemSettingsController.js';
import {
    getAdminNotifications,
    createAdminNotification,
    deleteAdminNotification,
    deleteAdminNotificationsBulk
} from '../controllers/notificationController.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
            cb(null, true);
        } else {
            cb(new Error('Only JSON files are allowed'), false);
        }
    }
});

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
 * Xóa tất cả activity logs (SuperAdmin only)
 */
router.delete('/activity-logs/delete-all', restrictTo('superadmin'), deleteAllActivityLogs);

/**
 * Lấy lịch sử hoạt động của admin cụ thể
 * - Superadmin có thể xem tất cả
 * - Admin chỉ có thể xem lịch sử của mình
 */
router.get('/activity-logs/:adminId', getAdminActivityLogs);

// === Dashboard Route ===
router.get('/dashboard', adminDashboard);

// === Transaction Management Routes ===
/**
 * Lấy danh sách tất cả giao dịch với phân trang và filter
 */
router.get('/transactions', getAllTransactions);

/**
 * Xuất dữ liệu giao dịch ra CSV
 */
router.get('/transactions/export', exportTransactions);

/**
 * Lấy chi tiết một giao dịch
 */
router.get('/transactions/:id', getTransactionById);

/**
 * Cập nhật giao dịch
 */
router.put('/transactions/:id', updateTransaction);

/**
 * Xóa giao dịch
 */
router.delete('/transactions/:id', deleteTransaction);

// === Admin Management Routes (SuperAdmin only) ===
/**
 * Lấy danh sách tất cả admin users
 */
router.get('/manage/admins', getAllAdmins);

/**
 * Tạo admin mới
 */
router.post('/manage/admins', createAdmin);

/**
 * Cập nhật thông tin admin
 */
router.put('/manage/admins/:id', updateAdmin);

/**
 * Xóa admin
 */
router.delete('/manage/admins/:id', deleteAdmin);

/**
 * Toggle trạng thái admin
 */
router.patch('/manage/admins/:id/toggle-status', toggleAdminStatus);

/**
 * Reset mật khẩu admin
 */
router.post('/manage/admins/:id/reset-password', resetAdminPassword);

// === User Management Routes (SuperAdmin only) ===
/**
 * Lấy danh sách tất cả người dùng (user, admin, superadmin)
 */
router.get('/manage/users', getAllUsers);

/**
 * Cập nhật role của user
 */
router.put('/manage/users/:id', updateUserRole);

// === System Settings Routes ===
/**
 * Lấy cài đặt hệ thống
 */
router.get('/settings', getSystemSettings);

/**
 * Cập nhật cài đặt hệ thống
 */
router.put('/settings', updateSystemSettings);

/**
 * Kiểm tra cấu hình email
 */
router.post('/settings/test-email', testEmailConfig);

/**
 * Tạo backup hệ thống
 */
router.post('/settings/backup', createBackup);

/**
 * Khôi phục từ backup
 */
router.post('/settings/restore', upload.single('backup'), restoreFromBackup);

// === Notification Management Routes ===
/**
 * Lấy tất cả thông báo của tất cả người dùng (Admin only)
 */
router.get('/notifications', getAdminNotifications);

/**
 * Tạo thông báo mới từ admin
 */
router.post('/notifications', createAdminNotification);

/**
 * Xóa một thông báo cụ thể (Admin only)
 */
router.delete('/notifications/:id', deleteAdminNotification);

/**
 * Xóa nhiều thông báo cùng lúc (Admin only)
 */
router.delete('/notifications/bulk', deleteAdminNotificationsBulk);

// === Test Route ===
router.get('/test-logs', async (req, res) => {
    try {
        const AdminActivityLog = (await import('../models/adminActivityLogModel.js')).default;
        const User = (await import('../models/userModel.js')).default;

        // Kiểm tra số lượng logs hiện tại
        const count = await AdminActivityLog.countDocuments();
        console.log(`📊 Current logs count: ${count}`);

        // Nếu chưa có logs, tạo một số logs mẫu
        if (count === 0) {
            console.log('🔄 Creating sample logs...');

            // Lấy admin users
            const adminUsers = await User.find({ role: { $in: ['admin', 'superadmin'] } });
            console.log(`👥 Found ${adminUsers.length} admin users`);

            if (adminUsers.length > 0) {
                const sampleLogs = [];
                const actionTypes = ['LOGIN', 'DASHBOARD_VIEW', 'USER_VIEW', 'EXPORT_DATA'];

                for (let i = 0; i < 10; i++) {
                    const randomAdmin = adminUsers[Math.floor(Math.random() * adminUsers.length)];
                    const randomAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];

                    sampleLogs.push({
                        adminId: randomAdmin._id,
                        actionType: randomAction,
                        targetType: 'System',
                        result: 'SUCCESS',
                        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random trong 7 ngày qua
                        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
                        userAgent: 'Mozilla/5.0 (Test Browser)',
                        metadata: { source: 'test-endpoint' }
                    });
                }

                await AdminActivityLog.insertMany(sampleLogs);
            }
        }

        // Lấy logs để hiển thị
        const logs = await AdminActivityLog.find()
            .populate('adminId', 'firstName lastName email role')
            .sort({ timestamp: -1 })
            .limit(5);

        const finalCount = await AdminActivityLog.countDocuments();

        res.json({
            success: true,
            totalLogs: finalCount,
            sampleLogs: logs
        });
    } catch (error) {
        logger.error('Test logs error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;