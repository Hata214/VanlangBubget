import AdminActivityLog from '../models/adminActivityLogModel.js';
import logger from './logger.js';
import mongoose from 'mongoose';

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

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const matchStage = {
                timestamp: { $gte: startDate }
            };

            const todayMatchStage = {
                timestamp: { $gte: today }
            };

            if (adminId) {
                matchStage.adminId = new mongoose.Types.ObjectId(adminId);
                todayMatchStage.adminId = new mongoose.Types.ObjectId(adminId);
            }

            // Thống kê tổng quan
            const [totalStats, todayStats, topActions, activeAdmins] = await Promise.all([
                // Tổng hoạt động và tỷ lệ thành công
                AdminActivityLog.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            _id: null,
                            totalActivities: { $sum: 1 },
                            successCount: {
                                $sum: { $cond: [{ $eq: ['$result', 'SUCCESS'] }, 1, 0] }
                            }
                        }
                    }
                ]),

                // Hoạt động hôm nay
                AdminActivityLog.aggregate([
                    { $match: todayMatchStage },
                    {
                        $group: {
                            _id: null,
                            todayActivities: { $sum: 1 }
                        }
                    }
                ]),

                // Top actions
                AdminActivityLog.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            _id: '$actionType',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 5 }
                ]),

                // Số admin hoạt động
                AdminActivityLog.aggregate([
                    { $match: matchStage },
                    {
                        $group: {
                            _id: '$adminId'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            activeAdmins: { $sum: 1 }
                        }
                    }
                ])
            ]);

            const totalActivities = totalStats[0]?.totalActivities || 0;
            const successCount = totalStats[0]?.successCount || 0;
            const successRate = totalActivities > 0 ? (successCount / totalActivities) * 100 : 0;

            return {
                totalActivities,
                todayActivities: todayStats[0]?.todayActivities || 0,
                successRate,
                topActions: topActions.map(item => ({
                    action: item._id,
                    count: item.count
                })),
                activeAdmins: activeAdmins[0]?.activeAdmins || 0
            };
        } catch (error) {
            logger.error('Failed to get activity stats:', error);
            throw error;
        }
    }
}

export default AdminActivityLogger;
