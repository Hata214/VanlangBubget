import AdminActivityLog from '../models/adminActivityLogModel.js';
import logger from './logger.js';

/**
 * Utility để ghi log hoạt động của admin
 */
class AdminActivityLogger {
    /**
     * Ghi log hoạt động admin
     * @param {Object} options - Tùy chọn log
     * @param {string} options.adminId - ID của admin thực hiện hành động
     * @param {string} options.actionType - Loại hành động
     * @param {string} options.targetId - ID của đối tượng bị tác động (optional)
     * @param {string} options.targetType - Loại đối tượng bị tác động (optional)
     * @param {Object} options.inputData - Dữ liệu đầu vào (optional)
     * @param {string} options.result - Kết quả: SUCCESS, FAILED, PARTIAL
     * @param {string} options.resultDetails - Chi tiết kết quả (optional)
     * @param {string} options.ipAddress - Địa chỉ IP (optional)
     * @param {string} options.userAgent - User Agent (optional)
     * @param {Object} options.metadata - Metadata bổ sung (optional)
     */
    static async logActivity({
        adminId,
        actionType,
        targetId = null,
        targetType = null,
        inputData = null,
        result = 'SUCCESS',
        resultDetails = null,
        ipAddress = null,
        userAgent = null,
        metadata = null
    }) {
        try {
            const logData = {
                adminId,
                actionType,
                targetId,
                targetType,
                inputData,
                result,
                resultDetails,
                ipAddress,
                userAgent,
                metadata,
                timestamp: new Date()
            };

            // Loại bỏ các field null/undefined
            Object.keys(logData).forEach(key => {
                if (logData[key] === null || logData[key] === undefined) {
                    delete logData[key];
                }
            });

            const activityLog = await AdminActivityLog.createLog(logData);

            logger.info(`Admin activity logged: ${actionType} by ${adminId}`, {
                logId: activityLog._id,
                actionType,
                adminId,
                targetId,
                result
            });

            return activityLog;
        } catch (error) {
            logger.error('Failed to log admin activity:', error);
            // Không throw error để không ảnh hưởng đến luồng chính
        }
    }

    /**
     * Log user management actions
     */
    static async logUserAction(adminId, actionType, targetUserId, inputData, result = 'SUCCESS', req = null) {
        return this.logActivity({
            adminId,
            actionType,
            targetId: targetUserId,
            targetType: 'User',
            inputData,
            result,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('User-Agent')
        });
    }

    /**
     * Log content management actions
     */
    static async logContentAction(adminId, actionType, targetContentId, inputData, result = 'SUCCESS', req = null) {
        return this.logActivity({
            adminId,
            actionType,
            targetId: targetContentId,
            targetType: 'SiteContent',
            inputData,
            result,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('User-Agent')
        });
    }

    /**
     * Log admin management actions
     */
    static async logAdminAction(adminId, actionType, targetAdminId, inputData, result = 'SUCCESS', req = null) {
        return this.logActivity({
            adminId,
            actionType,
            targetId: targetAdminId,
            targetType: 'Admin',
            inputData,
            result,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('User-Agent')
        });
    }

    /**
     * Log system actions
     */
    static async logSystemAction(adminId, actionType, inputData, result = 'SUCCESS', req = null) {
        return this.logActivity({
            adminId,
            actionType,
            targetType: 'System',
            inputData,
            result,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('User-Agent')
        });
    }

    /**
     * Lấy logs với pagination và filtering
     */
    static async getLogs(options = {}) {
        try {
            return await AdminActivityLog.getLogsPaginated(options);
        } catch (error) {
            logger.error('Failed to get admin activity logs:', error);
            throw error;
        }
    }

    /**
     * Lấy logs của một admin cụ thể
     */
    static async getAdminLogs(adminId, options = {}) {
        return this.getLogs({
            ...options,
            adminId
        });
    }

    /**
     * Lấy logs theo action type
     */
    static async getLogsByAction(actionType, options = {}) {
        return this.getLogs({
            ...options,
            actionType
        });
    }

    /**
     * Lấy logs trong khoảng thời gian
     */
    static async getLogsByDateRange(startDate, endDate, options = {}) {
        return this.getLogs({
            ...options,
            startDate,
            endDate
        });
    }

    /**
     * Thống kê hoạt động admin
     */
    static async getActivityStats(adminId = null, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const matchStage = {
                timestamp: { $gte: startDate }
            };

            if (adminId) {
                matchStage.adminId = adminId;
            }

            const stats = await AdminActivityLog.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            actionType: '$actionType',
                            result: '$result'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: '$_id.actionType',
                        total: { $sum: '$count' },
                        success: {
                            $sum: {
                                $cond: [{ $eq: ['$_id.result', 'SUCCESS'] }, '$count', 0]
                            }
                        },
                        failed: {
                            $sum: {
                                $cond: [{ $eq: ['$_id.result', 'FAILED'] }, '$count', 0]
                            }
                        }
                    }
                },
                { $sort: { total: -1 } }
            ]);

            return stats;
        } catch (error) {
            logger.error('Failed to get activity stats:', error);
            throw error;
        }
    }

    /**
     * Đếm tổng số logs
     */
    static async countAllLogs() {
        try {
            const total = await AdminActivityLog.countDocuments();
            return { total };
        } catch (error) {
            logger.error('Failed to count activity logs:', error);
            throw error;
        }
    }

    /**
     * Xóa tất cả logs
     */
    static async deleteAllLogs() {
        try {
            const result = await AdminActivityLog.deleteMany({});
            logger.info(`Deleted ${result.deletedCount} activity logs`);
            return {
                success: true,
                deletedCount: result.deletedCount
            };
        } catch (error) {
            logger.error('Failed to delete all activity logs:', error);
            throw error;
        }
    }
}

export default AdminActivityLogger;
