import mongoose from 'mongoose';

/**
 * Schema cho lưu trữ lịch sử hoạt động của admin
 */
const adminActivityLogSchema = new mongoose.Schema({
    // Admin thực hiện hành động
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Admin ID là bắt buộc']
    },
    
    // Loại hành động
    actionType: {
        type: String,
        required: [true, 'Loại hành động là bắt buộc'],
        enum: [
            // User Management Actions
            'USER_CREATE',
            'USER_UPDATE', 
            'USER_DELETE',
            'USER_ACTIVATE',
            'USER_DEACTIVATE',
            'USER_PROMOTE',
            'USER_DEMOTE',
            'USER_RESET_PASSWORD',
            'USER_VIEW',
            
            // Content Management Actions
            'CONTENT_CREATE',
            'CONTENT_UPDATE',
            'CONTENT_DELETE',
            'CONTENT_APPROVE',
            'CONTENT_REJECT',
            'CONTENT_PUBLISH',
            'CONTENT_RESTORE',
            
            // Admin Management Actions
            'ADMIN_CREATE',
            'ADMIN_UPDATE',
            'ADMIN_DELETE',
            'ADMIN_TOGGLE_STATUS',
            
            // System Actions
            'LOGIN',
            'LOGOUT',
            'DASHBOARD_VIEW',
            'EXPORT_DATA',
            'IMPORT_DATA'
        ]
    },
    
    // ID của đối tượng bị tác động (user, content, etc.)
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false // Một số actions không có target cụ thể
    },
    
    // Loại đối tượng bị tác động
    targetType: {
        type: String,
        enum: ['User', 'SiteContent', 'Admin', 'System'],
        required: false
    },
    
    // Dữ liệu đầu vào của hành động
    inputData: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    
    // Kết quả của hành động
    result: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
        required: [true, 'Kết quả hành động là bắt buộc']
    },
    
    // Thông tin chi tiết về kết quả
    resultDetails: {
        type: String,
        required: false
    },
    
    // Địa chỉ IP của admin
    ipAddress: {
        type: String,
        required: false
    },
    
    // User Agent
    userAgent: {
        type: String,
        required: false
    },
    
    // Thời gian thực hiện
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    
    // Metadata bổ sung
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    }
}, {
    timestamps: true,
    collection: 'admin_activity_logs'
});

// Indexes để tối ưu hóa truy vấn
adminActivityLogSchema.index({ adminId: 1, timestamp: -1 });
adminActivityLogSchema.index({ actionType: 1, timestamp: -1 });
adminActivityLogSchema.index({ targetId: 1, timestamp: -1 });
adminActivityLogSchema.index({ timestamp: -1 });

// Virtual để populate admin info
adminActivityLogSchema.virtual('admin', {
    ref: 'User',
    localField: 'adminId',
    foreignField: '_id',
    justOne: true
});

// Virtual để populate target info
adminActivityLogSchema.virtual('target', {
    ref: function() {
        return this.targetType;
    },
    localField: 'targetId',
    foreignField: '_id',
    justOne: true
});

// Ensure virtual fields are serialized
adminActivityLogSchema.set('toJSON', { virtuals: true });
adminActivityLogSchema.set('toObject', { virtuals: true });

// Static method để tạo log mới
adminActivityLogSchema.statics.createLog = async function(logData) {
    try {
        const log = new this(logData);
        await log.save();
        return log;
    } catch (error) {
        console.error('Error creating admin activity log:', error);
        throw error;
    }
};

// Static method để lấy logs với pagination
adminActivityLogSchema.statics.getLogsPaginated = async function(options = {}) {
    const {
        adminId,
        actionType,
        targetType,
        page = 1,
        limit = 20,
        startDate,
        endDate
    } = options;
    
    const filter = {};
    
    if (adminId) filter.adminId = adminId;
    if (actionType) filter.actionType = actionType;
    if (targetType) filter.targetType = targetType;
    
    if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
        this.find(filter)
            .populate('admin', 'firstName lastName email role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit),
        this.countDocuments(filter)
    ]);
    
    return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
    };
};

const AdminActivityLog = mongoose.model('AdminActivityLog', adminActivityLogSchema);

export default AdminActivityLog;
