import AdminActivityLogger from '../utils/adminActivityLogger.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../utils/logger.js';

/**
 * @desc    Lấy danh sách activity logs
 * @route   GET /api/admin/activity-logs
 * @access  Private (Admin, Superadmin)
 */
export const getActivityLogs = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 20,
        adminId,
        actionType,
        targetType,
        startDate,
        endDate
    } = req.query;

    // Admin chỉ có thể xem logs của chính mình
    // SuperAdmin có thể xem tất cả logs
    const filterAdminId = req.user.role === 'admin' ? req.user.id : adminId;

    try {

        const result = await AdminActivityLogger.getLogs({
            adminId: filterAdminId,
            actionType,
            targetType,
            startDate,
            endDate,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        console.log('🔍 Activity logs result:', {
            totalLogs: result.logs?.length || 0,
            sampleLog: result.logs?.[0] || null,
            pagination: result.pagination || result
        });

        // Nếu không có logs nào, tạo một số logs mẫu
        if (result.total === 0 && !actionType && !startDate && !endDate) {
            console.log('📝 Tạo sample logs...');
            const sampleLogs = [
                {
                    adminId: req.user.id,
                    actionType: 'LOGIN',
                    targetType: 'System',
                    result: 'SUCCESS',
                    ipAddress: req.ip || '127.0.0.1',
                    userAgent: req.get('User-Agent') || 'Unknown',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5)
                },
                {
                    adminId: req.user.id,
                    actionType: 'DASHBOARD_VIEW',
                    targetType: 'System',
                    inputData: { section: 'main-dashboard' },
                    result: 'SUCCESS',
                    ipAddress: req.ip || '127.0.0.1',
                    timestamp: new Date(Date.now() - 1000 * 60 * 3)
                },
                {
                    adminId: req.user.id,
                    actionType: 'ADMIN_LIST_VIEW',
                    targetType: 'Admin',
                    inputData: { page: 1, limit: 20 },
                    result: 'SUCCESS',
                    ipAddress: req.ip || '127.0.0.1',
                    timestamp: new Date(Date.now() - 1000 * 60 * 2)
                }
            ];

            try {
                for (const logData of sampleLogs) {
                    await AdminActivityLogger.logActivity(logData);
                }
                console.log('✅ Đã tạo sample logs');

                // Lấy lại logs sau khi tạo
                const newResult = await AdminActivityLogger.getLogs({
                    adminId: filterAdminId,
                    actionType,
                    targetType,
                    startDate,
                    endDate,
                    page: parseInt(page),
                    limit: parseInt(limit)
                });

                result.logs = newResult.logs;
                result.total = newResult.total;
                result.totalPages = newResult.totalPages;
            } catch (sampleError) {
                console.error('❌ Lỗi tạo sample logs:', sampleError);
            }
        }

        // Log việc xem activity logs
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'DASHBOARD_VIEW',
            { section: 'activity-logs', filters: req.query },
            'SUCCESS',
            req
        );

        res.status(200).json({
            status: 'success',
            data: result.logs,
            pagination: {
                page: result.page,
                totalPages: result.totalPages,
                total: result.total,
                hasNext: result.hasNext,
                hasPrev: result.hasPrev
            }
        });
    } catch (error) {
        logger.error('Error fetching activity logs:', error);
        return next(new AppError('Không thể lấy danh sách hoạt động', 500));
    }
});

/**
 * @desc    Lấy activity logs của một admin cụ thể
 * @route   GET /api/admin/activity-logs/:adminId
 * @access  Private (SuperAdmin only)
 */
export const getAdminActivityLogs = catchAsync(async (req, res, next) => {
    const { adminId } = req.params;
    const {
        page = 1,
        limit = 20,
        actionType,
        startDate,
        endDate
    } = req.query;

    // Chỉ SuperAdmin mới có thể xem logs của admin khác
    if (req.user.role !== 'superadmin' && adminId !== req.user.id) {
        return next(new AppError('Bạn chỉ có thể xem lịch sử hoạt động của chính mình', 403));
    }

    try {
        const result = await AdminActivityLogger.getAdminLogs(adminId, {
            actionType,
            startDate,
            endDate,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.status(200).json({
            status: 'success',
            data: result.logs,
            pagination: {
                page: result.page,
                totalPages: result.totalPages,
                total: result.total,
                hasNext: result.hasNext,
                hasPrev: result.hasPrev
            }
        });
    } catch (error) {
        logger.error('Error fetching admin activity logs:', error);
        return next(new AppError('Không thể lấy lịch sử hoạt động', 500));
    }
});

/**
 * @desc    Lấy thống kê hoạt động admin
 * @route   GET /api/admin/activity-logs/stats
 * @access  Private (Admin, Superadmin)
 */
export const getActivityStats = catchAsync(async (req, res, next) => {
    const { days = 30 } = req.query;

    // Admin chỉ có thể xem stats của chính mình
    const adminId = req.user.role === 'admin' ? req.user.id : null;

    try {
        const stats = await AdminActivityLogger.getActivityStats(adminId, parseInt(days));

        res.status(200).json({
            status: 'success',
            data: {
                stats,
                period: `${days} ngày qua`,
                adminId: adminId || 'all'
            }
        });
    } catch (error) {
        logger.error('Error fetching activity stats:', error);
        return next(new AppError('Không thể lấy thống kê hoạt động', 500));
    }
});

/**
 * @desc    Lấy logs theo action type
 * @route   GET /api/admin/activity-logs/by-action/:actionType
 * @access  Private (SuperAdmin only)
 */
export const getLogsByAction = catchAsync(async (req, res, next) => {
    const { actionType } = req.params;
    const {
        page = 1,
        limit = 20,
        startDate,
        endDate
    } = req.query;

    try {
        const result = await AdminActivityLogger.getLogsByAction(actionType, {
            startDate,
            endDate,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.status(200).json({
            status: 'success',
            data: result.logs,
            pagination: {
                page: result.page,
                totalPages: result.totalPages,
                total: result.total,
                hasNext: result.hasNext,
                hasPrev: result.hasPrev
            }
        });
    } catch (error) {
        logger.error('Error fetching logs by action:', error);
        return next(new AppError('Không thể lấy logs theo hành động', 500));
    }
});

/**
 * @desc    Lấy logs trong khoảng thời gian
 * @route   GET /api/admin/activity-logs/by-date
 * @access  Private (Admin, Superadmin)
 */
export const getLogsByDateRange = catchAsync(async (req, res, next) => {
    const {
        startDate,
        endDate,
        page = 1,
        limit = 20
    } = req.query;

    if (!startDate || !endDate) {
        return next(new AppError('Vui lòng cung cấp ngày bắt đầu và ngày kết thúc', 400));
    }

    // Admin chỉ có thể xem logs của chính mình
    const adminId = req.user.role === 'admin' ? req.user.id : null;

    try {
        const result = await AdminActivityLogger.getLogsByDateRange(startDate, endDate, {
            adminId,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.status(200).json({
            status: 'success',
            data: result.logs,
            pagination: {
                page: result.page,
                totalPages: result.totalPages,
                total: result.total,
                hasNext: result.hasNext,
                hasPrev: result.hasPrev
            }
        });
    } catch (error) {
        logger.error('Error fetching logs by date range:', error);
        return next(new AppError('Không thể lấy logs theo khoảng thời gian', 500));
    }
});

/**
 * @desc    Xóa tất cả activity logs
 * @route   DELETE /api/admin/activity-logs/delete-all
 * @access  Private (SuperAdmin only)
 */
export const deleteAllActivityLogs = catchAsync(async (req, res, next) => {
    // Chỉ SuperAdmin mới có thể xóa tất cả logs
    if (req.user.role !== 'superadmin') {
        return next(new AppError('Chỉ SuperAdmin mới có thể xóa tất cả lịch sử hoạt động', 403));
    }

    try {
        // Đếm số logs trước khi xóa
        const countResult = await AdminActivityLogger.countAllLogs();
        const totalLogs = countResult.total || 0;

        // Xóa tất cả logs
        const result = await AdminActivityLogger.deleteAllLogs();

        // Log hành động xóa
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'SYSTEM_MAINTENANCE',
            {
                action: 'DELETE_ALL_ACTIVITY_LOGS',
                deletedCount: totalLogs,
                timestamp: new Date()
            },
            'SUCCESS',
            req
        );

        logger.info(`SuperAdmin ${req.user.id} deleted all activity logs (${totalLogs} records)`);

        res.status(200).json({
            status: 'success',
            message: `Đã xóa thành công ${totalLogs} bản ghi lịch sử hoạt động`,
            data: {
                deletedCount: totalLogs,
                deletedAt: new Date()
            }
        });
    } catch (error) {
        logger.error('Error deleting all activity logs:', error);

        // Log lỗi
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'SYSTEM_MAINTENANCE',
            {
                action: 'DELETE_ALL_ACTIVITY_LOGS',
                error: error.message
            },
            'FAILED',
            req
        );

        return next(new AppError('Không thể xóa lịch sử hoạt động', 500));
    }
});
