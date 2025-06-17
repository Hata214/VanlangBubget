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
        result: resultFilter,
        search,
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
            result: resultFilter,
            search,
            startDate,
            endDate,
            page: parseInt(page),
            limit: parseInt(limit)
        });



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
    const { days = 30, adminId: requestedAdminId } = req.query;

    // Admin chỉ có thể xem stats của chính mình
    // SuperAdmin có thể xem stats của admin cụ thể hoặc tất cả
    let filterAdminId = null;
    if (req.user.role === 'admin') {
        filterAdminId = req.user.id;
    } else if (req.user.role === 'superadmin' && requestedAdminId && requestedAdminId !== 'all') {
        filterAdminId = requestedAdminId;
    }

    try {
        const stats = await AdminActivityLogger.getActivityStats(filterAdminId, parseInt(days));

        res.status(200).json({
            status: 'success',
            data: {
                stats,
                period: `${days} ngày qua`,
                adminId: filterAdminId || 'all'
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
 * @desc    Xuất activity logs ra file CSV
 * @route   GET /api/admin/activity-logs/export
 * @access  Private (Admin, Superadmin)
 */
export const exportActivityLogs = catchAsync(async (req, res, next) => {
    const {
        adminId,
        actionType,
        result,
        startDate,
        endDate
    } = req.query;

    // Admin chỉ có thể xuất logs của chính mình
    const filterAdminId = req.user.role === 'admin' ? req.user.id : adminId;

    try {
        // Lấy tất cả logs không phân trang để export
        const result_data = await AdminActivityLogger.getLogs({
            adminId: filterAdminId,
            actionType,
            result,
            startDate,
            endDate,
            page: 1,
            limit: 10000 // Lấy nhiều records để export
        });

        // Tạo CSV content
        const csvHeaders = [
            'Thời gian',
            'Admin',
            'Email Admin',
            'Hành động',
            'Kết quả',
            'Đối tượng',
            'Email đối tượng',
            'Địa chỉ IP',
            'User Agent',
            'Chi tiết'
        ];

        const csvRows = result_data.logs.map(log => [
            new Date(log.timestamp).toLocaleString('vi-VN'),
            log.adminId ? `${log.adminId.firstName} ${log.adminId.lastName}` : 'N/A',
            log.adminId ? log.adminId.email : 'N/A',
            log.action || 'N/A',
            log.result || 'N/A',
            log.targetId ? `${log.targetId.firstName} ${log.targetId.lastName}` : 'N/A',
            log.targetId ? log.targetId.email : 'N/A',
            log.ipAddress || 'N/A',
            log.userAgent || 'N/A',
            log.details ? JSON.stringify(log.details).replace(/"/g, '""') : 'N/A'
        ]);

        // Tạo CSV string
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        // Log việc export
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'EXPORT_DATA',
            {
                type: 'activity-logs',
                filters: req.query,
                recordCount: result_data.logs.length
            },
            'SUCCESS',
            req
        );

        // Set headers để download file
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="activity-logs-${new Date().toISOString().slice(0, 10)}.csv"`);

        // Thêm BOM để Excel hiển thị đúng tiếng Việt
        res.write('\uFEFF');
        res.end(csvContent);

    } catch (error) {
        logger.error('Error exporting activity logs:', error);
        return next(new AppError('Không thể xuất dữ liệu', 500));
    }
});
