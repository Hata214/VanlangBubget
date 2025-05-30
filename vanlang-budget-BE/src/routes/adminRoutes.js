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
                console.log(`✅ Created ${sampleLogs.length} sample logs`);
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
        console.error('❌ Test logs error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;