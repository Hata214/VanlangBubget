import mongoose from 'mongoose';

/**
 * Schema lưu trữ lịch sử hoạt động của admin
 */
const activityLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'ID admin là bắt buộc']
        },
        action: {
            type: String,
            required: [true, 'Hành động là bắt buộc'],
            enum: [
                // Các hành động quản lý admin
                'VIEW_ADMIN_LIST',
                'CREATE_ADMIN',
                'UPDATE_ADMIN',
                'DELETE_ADMIN',
                'ACTIVATE_ADMIN',
                'DEACTIVATE_ADMIN',

                // Các hành động quản lý nội dung
                'VIEW_SITE_CONTENT',
                'UPDATE_SITE_CONTENT',
                'APPROVE_CONTENT',
                'REJECT_CONTENT',
                'RESTORE_CONTENT_VERSION',

                // Các hành động quản lý người dùng
                'VIEW_USER_LIST',
                'UPDATE_USER',
                'DELETE_USER',
                'RESET_USER_PASSWORD',
                'ACTIVATE_USER',
                'DEACTIVATE_USER',

                // Các hành động khác
                'LOGIN',
                'LOGOUT',
                'FAILED_LOGIN',
                'SYSTEM_CONFIG',
                'OTHER'
            ]
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        result: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        ipAddress: {
            type: String,
            default: null
        },
        userAgent: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Index để tối ưu truy vấn
activityLogSchema.index({ adminId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

/**
 * Phương thức tĩnh để thêm bản ghi hoạt động
 */
activityLogSchema.statics.addLog = async function (adminId, action, targetId = null, details = {}, result = {}, extraInfo = {}) {
    return this.create({
        adminId,
        action,
        targetId,
        details,
        result,
        ipAddress: extraInfo.ipAddress || null,
        userAgent: extraInfo.userAgent || null,
        timestamp: new Date()
    });
};

/**
 * Phương thức tĩnh để lấy lịch sử hoạt động của một admin
 */
activityLogSchema.statics.getAdminLogs = async function (adminId, options = {}) {
    const { page = 1, limit = 20, sort = { timestamp: -1 } } = options;
    const skip = (page - 1) * limit;

    return this.find({ adminId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'firstName lastName email')
        .populate('targetId', 'firstName lastName email');
};

/**
 * Phương thức tĩnh để lấy tất cả lịch sử hoạt động
 */
activityLogSchema.statics.getAllLogs = async function (options = {}) {
    const { page = 1, limit = 20, sort = { timestamp: -1 }, filter = {} } = options;
    const skip = (page - 1) * limit;

    return this.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'firstName lastName email')
        .populate('targetId', 'firstName lastName email');
};

/**
 * Phương thức tĩnh để xóa lịch sử cũ theo thời gian
 */
activityLogSchema.statics.deleteOldLogs = async function (ageInDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageInDays);

    return this.deleteMany({
        timestamp: { $lt: cutoffDate }
    });
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog; 