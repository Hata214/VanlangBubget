import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';
import AdminActivityLogger from '../utils/adminActivityLogger.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import ActivityLog from '../models/activityLogModel.js';

/**
 * Tạo bản ghi hoạt động admin
 * @private
 */
const logAdminActivity = async (adminId, action, targetId, details, result) => {
    try {
        await ActivityLog.create({
            adminId,
            action,
            targetId,
            details,
            result,
            timestamp: new Date()
        });
        logger.info(`Admin activity logged: ${action} by ${adminId} on ${targetId}`);
    } catch (error) {
        logger.error(`Failed to log admin activity: ${error.message}`);
    }
};

/**
 * Lấy danh sách admin
 */
export const getAdminList = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    logger.info(`Đang lấy danh sách admin - trang ${page}, tìm kiếm: ${search}`);

    // Tìm kiếm admin theo tiêu chí
    const searchCriteria = {
        role: { $in: ['admin', 'superadmin'] },
    };

    // Thêm điều kiện tìm kiếm nếu có
    if (search) {
        searchCriteria.$or = [
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } }
        ];
    }

    // Đếm tổng số admin
    const total = await User.countDocuments(searchCriteria);
    const totalPages = Math.ceil(total / limit);

    // Lấy danh sách admin theo phân trang
    const admins = await User.find(searchCriteria)
        .select('+active')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Ghi log hoạt động
    await logAdminActivity(
        req.user.id,
        'VIEW_ADMIN_LIST',
        null,
        { page, limit, search },
        { total, admins: admins.length }
    );

    // Trả về kết quả
    res.status(200).json({
        success: true,
        total,
        totalPages,
        currentPage: page,
        limit,
        data: admins,
    });
});

/**
 * Tạo mới admin
 */
export const createAdmin = catchAsync(async (req, res, next) => {
    const { email, firstName, lastName, password } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!email || !firstName || !lastName || !password) {
        return next(new AppError('Vui lòng cung cấp đầy đủ thông tin', 400));
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email đã được sử dụng', 400));
    }

    // Kiểm tra số lượng admin hiện tại
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount >= 3) {
        return next(new AppError('Đã đạt giới hạn tối đa số lượng admin (3)', 400));
    }

    // Tạo admin mới
    const newAdmin = await User.create({
        email,
        firstName,
        lastName,
        password,
        role: 'admin',
        isEmailVerified: true, // Admin được tạo tự động xác thực email
    });

    // Loại bỏ trường password trước khi trả về
    newAdmin.password = undefined;

    logger.info(`Đã tạo tài khoản admin mới: ${newAdmin.email}`);

    // Ghi log hoạt động
    await logAdminActivity(
        req.user.id,
        'CREATE_ADMIN',
        newAdmin._id,
        { email, firstName, lastName },
        { success: true, adminId: newAdmin._id }
    );

    res.status(201).json({
        success: true,
        message: 'Tạo tài khoản admin thành công',
        data: newAdmin,
    });
});

/**
 * Cập nhật thông tin admin
 */
export const updateAdmin = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { firstName, lastName, role } = req.body;

    // Tìm admin cần cập nhật
    const admin = await User.findById(id);
    if (!admin) {
        return next(new AppError('Không tìm thấy admin', 404));
    }

    // Kiểm tra vai trò
    if (role && !['admin', 'user'].includes(role)) {
        return next(new AppError('Vai trò không hợp lệ', 400));
    }

    // Không cho phép thay đổi superadmin
    if (admin.role === 'superadmin') {
        return next(new AppError('Không thể sửa đổi tài khoản SuperAdmin', 403));
    }

    // Lưu thông tin cũ để ghi log
    const oldData = {
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
    };

    // Cập nhật thông tin
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (role) admin.role = role;

    await admin.save();

    logger.info(`Đã cập nhật thông tin admin: ${admin.email}`);

    // Ghi log hoạt động
    await logAdminActivity(
        req.user.id,
        'UPDATE_ADMIN',
        admin._id,
        { oldData, newData: { firstName, lastName, role } },
        { success: true }
    );

    res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin admin thành công',
        data: admin,
    });
});

/**
 * Xóa admin
 */
export const deleteAdmin = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Tìm admin cần xóa
    const admin = await User.findById(id);
    if (!admin) {
        return next(new AppError('Không tìm thấy admin', 404));
    }

    // Không cho phép xóa superadmin
    if (admin.role === 'superadmin') {
        return next(new AppError('Không thể xóa tài khoản SuperAdmin', 403));
    }

    // Lưu thông tin admin trước khi xóa để ghi log
    const adminInfo = {
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
    };

    // Xóa admin
    await User.findByIdAndDelete(id);

    logger.info(`Đã xóa tài khoản admin: ${admin.email}`);

    // Ghi log hoạt động
    await logAdminActivity(
        req.user.id,
        'DELETE_ADMIN',
        admin._id,
        adminInfo,
        { success: true }
    );

    res.status(200).json({
        success: true,
        message: 'Xóa tài khoản admin thành công',
    });
});

/**
 * Bật/tắt trạng thái admin
 */
export const toggleAdminStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Tìm admin cần thay đổi trạng thái
    const admin = await User.findById(id).select('+active');
    if (!admin) {
        return next(new AppError('Không tìm thấy admin', 404));
    }

    // Không cho phép vô hiệu hóa superadmin
    if (admin.role === 'superadmin') {
        return next(new AppError('Không thể vô hiệu hóa tài khoản SuperAdmin', 403));
    }

    // Lưu trạng thái cũ để ghi log
    const oldStatus = admin.active;

    // Đảo trạng thái
    admin.active = !admin.active;
    await admin.save({ validateBeforeSave: false });

    logger.info(`Đã ${admin.active ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản admin: ${admin.email}`);

    // Ghi log hoạt động
    await logAdminActivity(
        req.user.id,
        admin.active ? 'ACTIVATE_ADMIN' : 'DEACTIVATE_ADMIN',
        admin._id,
        { email: admin.email, previousStatus: oldStatus },
        { success: true, newStatus: admin.active }
    );

    res.status(200).json({
        success: true,
        message: `Đã ${admin.active ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản admin thành công`,
        data: {
            id: admin._id,
            email: admin.email,
            active: admin.active,
        },
    });
});

/**
 * Lấy lịch sử hoạt động của admin
 */
export const getAdminActivityLogs = catchAsync(async (req, res, next) => {
    const { adminId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Tìm kiếm tiêu chí
    const searchCriteria = {};
    if (adminId !== 'all') {
        // Kiểm tra quyền truy cập nếu không phải superadmin và không phải xem log của chính mình
        if (req.user.role !== 'superadmin' && req.user.id !== adminId) {
            return next(new AppError('Bạn không có quyền xem lịch sử hoạt động của admin khác', 403));
        }
        searchCriteria.adminId = adminId;
    } else if (req.user.role !== 'superadmin') {
        // Chỉ superadmin có thể xem tất cả log
        return next(new AppError('Bạn không có quyền xem lịch sử hoạt động của tất cả admin', 403));
    }

    // Đếm tổng số bản ghi
    const total = await ActivityLog.countDocuments(searchCriteria);
    const totalPages = Math.ceil(total / limit);

    // Lấy danh sách log theo phân trang
    const logs = await ActivityLog.find(searchCriteria)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'firstName lastName email');

    res.status(200).json({
        success: true,
        total,
        totalPages,
        currentPage: page,
        limit,
        data: logs,
    });
});

/**
 * Lấy danh sách tất cả admin users (SuperAdmin only) - New function
 */
export const getAllAdmins = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền SuperAdmin
    if (req.user.role !== 'superadmin') {
        return next(new AppError('Chỉ SuperAdmin mới có quyền truy cập', 403));
    }

    const {
        page = 1,
        limit = 10,
        search,
        role,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    let filter = {
        role: { $in: ['admin', 'superadmin'] }
    };

    if (search) {
        filter.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    if (role && role !== 'all') {
        filter.role = role;
    }

    if (status && status !== 'all') {
        const statusMap = {
            active: { active: true, suspended: { $ne: true } },
            inactive: { active: false },
            suspended: { suspended: true }
        };
        filter = { ...filter, ...statusMap[status] };
    }

    // Get admins with pagination
    const admins = await User
        .find(filter)
        .select('-password -passwordResetToken -passwordResetExpires')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const totalAdmins = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalAdmins / limitNum);

    // Calculate stats
    const stats = {
        totalAdmins: await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } }),
        activeAdmins: await User.countDocuments({
            role: { $in: ['admin', 'superadmin'] },
            active: true,
            suspended: { $ne: true }
        }),
        superAdmins: await User.countDocuments({ role: 'superadmin' }),
        recentLogins: await User.countDocuments({
            role: { $in: ['admin', 'superadmin'] },
            lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
    };

    // Format admin data
    const formattedAdmins = admins.map(admin => ({
        id: admin._id.toString(),
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        status: admin.suspended ? 'suspended' : (admin.active ? 'active' : 'inactive'),
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        loginCount: admin.loginCount || 0,
        permissions: admin.permissions || []
    }));

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'ADMIN_LIST_VIEW',
        {
            filters: { search, role, status },
            page: pageNum,
            limit: limitNum
        },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            admins: formattedAdmins,
            stats
        },
        pagination: {
            page: pageNum,
            totalPages,
            total: totalAdmins,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        }
    });
});

/**
 * Reset mật khẩu admin (SuperAdmin only) - New function
 */
export const resetAdminPassword = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền SuperAdmin
    if (req.user.role !== 'superadmin') {
        return next(new AppError('Chỉ SuperAdmin mới có quyền reset mật khẩu admin', 403));
    }

    const { id } = req.params;

    const admin = await User.findById(id);
    if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
        return next(new AppError('Không tìm thấy admin', 404));
    }

    // Generate new password
    const newPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    admin.password = hashedPassword;
    admin.passwordChangedAt = new Date();
    await admin.save();

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'ADMIN_PASSWORD_RESET',
        {
            targetAdminId: id,
            targetAdminEmail: admin.email
        },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            newPassword
        }
    });
});

/**
 * Lấy danh sách tất cả người dùng (SuperAdmin only) - New function
 */
export const getAllUsers = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền SuperAdmin
    if (req.user.role !== 'superadmin') {
        return next(new AppError('Chỉ SuperAdmin mới có quyền truy cập', 403));
    }

    const {
        page = 1,
        limit = 10,
        search,
        role,
        dateRange,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter - Lấy tất cả users (user, admin, superadmin)
    let filter = {};

    if (search) {
        filter.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    if (role && role !== 'all') {
        filter.role = role;
    }

    // Add date range filter
    if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate;

        switch (dateRange) {
            case '7days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90days':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = null;
        }

        if (startDate) {
            filter.createdAt = { $gte: startDate };
        }
    }

    // Get users with pagination
    const users = await User
        .find(filter)
        .select('-password -passwordResetToken -passwordResetExpires')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limitNum);

    // Calculate stats
    const stats = {
        totalUsers: await User.countDocuments({}),
        activeUsers: await User.countDocuments({ active: true, suspended: { $ne: true } }),
        admins: await User.countDocuments({ role: 'admin' }),
        superAdmins: await User.countDocuments({ role: 'superadmin' }),
        regularUsers: await User.countDocuments({ role: 'user' })
    };

    // Format user data
    const formattedUsers = users.map(user => ({
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        active: user.active !== false, // Default to true if not set
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        loginCount: user.loginCount || 0
    }));

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'USER_LIST_VIEW',
        {
            filters: { search, role, dateRange },
            page: pageNum,
            limit: limitNum,
            totalResults: totalUsers
        },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            users: formattedUsers,
            stats
        },
        pagination: {
            page: pageNum,
            totalPages,
            total: totalUsers,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
        }
    });
});

/**
 * Cập nhật role của user (SuperAdmin only) - New function
 */
export const updateUserRole = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền SuperAdmin
    if (req.user.role !== 'superadmin') {
        return next(new AppError('Chỉ SuperAdmin mới có quyền thay đổi role', 403));
    }

    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['user', 'admin', 'superadmin'].includes(role)) {
        return next(new AppError('Role không hợp lệ', 400));
    }

    // Tìm user cần cập nhật
    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Không cho phép thay đổi role của SuperAdmin
    if (user.role === 'superadmin') {
        return next(new AppError('Không thể thay đổi role của SuperAdmin', 403));
    }

    // Kiểm tra giới hạn admin nếu thăng cấp lên admin
    if (role === 'admin' && user.role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount >= 3) {
            return next(new AppError('Đã đạt giới hạn tối đa 3 admin trong hệ thống', 400));
        }
    }

    // Lưu thông tin cũ để ghi log
    const oldRole = user.role;

    // Cập nhật role
    user.role = role;
    await user.save();

    logger.info(`Đã cập nhật role của user ${user.email} từ ${oldRole} thành ${role}`);

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'USER_ROLE_UPDATE',
        {
            targetUserId: id,
            targetUserEmail: user.email,
            oldRole,
            newRole: role
        },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        message: `Đã cập nhật role thành công từ ${oldRole} thành ${role}`,
        data: {
            id: user._id,
            email: user.email,
            role: user.role
        }
    });
});