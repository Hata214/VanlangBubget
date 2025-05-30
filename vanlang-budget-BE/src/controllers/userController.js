import User from '../models/userModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Loan from '../models/loanModel.js';
import LoanPayment from '../models/loanPaymentModel.js';
import Budget from '../models/budgetModel.js';
import Notification from '../models/Notification.js';
import catchAsync from '../utils/catchAsync.js';
import logger from '../utils/logger.js';
import AdminActivityLogger from '../utils/adminActivityLogger.js';
import mongoose from 'mongoose';

/**
 * @desc    Lấy thông tin người dùng hiện tại
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
                language: user.language
            }
        }
    });
});

/**
 * @desc    Cập nhật thông tin người dùng
 * @route   PATCH /api/users/me
 * @access  Private
 */
export const updateMe = catchAsync(async (req, res, next) => {
    // 1) Lọc ra các trường không được phép cập nhật
    const { password, email, role, isEmailVerified, ...updateData } = req.body;

    if (password) {
        return next(new AppError('Không thể cập nhật mật khẩu qua API này. Vui lòng sử dụng /api/auth/update-password', 400));
    }

    if (email) {
        return next(new AppError('Không thể thay đổi email qua API này', 400));
    }

    // 2) Cập nhật thông tin
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                phoneNumber: updatedUser.phoneNumber,
                role: updatedUser.role,
                isEmailVerified: updatedUser.isEmailVerified,
                language: updatedUser.language
            }
        }
    });
});

/**
 * @desc    Xóa tài khoản người dùng (chỉ đánh dấu là không hoạt động)
 * @route   DELETE /api/users/me
 * @access  Private
 */
export const deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * @desc    Xóa toàn bộ dữ liệu của người dùng (thu nhập, chi tiêu, khoản vay)
 * @route   POST /api/users/reset-data
 * @access  Private
 */
export const resetUserData = async (req, res, next) => {
    try {
        const { confirmationText } = req.body;

        console.log('resetUserData được gọi với confirmationText:', confirmationText);
        console.log('User ID:', req.user._id);

        // Kiểm tra xác nhận
        if (confirmationText !== 'resetdata') {
            return res.status(400).json({
                success: false,
                message: 'Văn bản xác nhận không đúng. Vui lòng nhập "resetdata" để xác nhận xóa dữ liệu.'
            });
        }

        const userId = req.user._id;

        console.log(`Bắt đầu xóa dữ liệu cho user: ${userId}`);

        // Xóa tất cả thu nhập
        const deleteIncomes = await Income.deleteMany({ userId });
        console.log(`Đã xóa ${deleteIncomes.deletedCount} thu nhập`);

        // Xóa tất cả chi tiêu
        const deleteExpenses = await Expense.deleteMany({ userId });
        console.log(`Đã xóa ${deleteExpenses.deletedCount} chi tiêu`);

        // Xóa tất cả thanh toán khoản vay
        const deleteLoanPayments = await LoanPayment.deleteMany({ userId });
        console.log(`Đã xóa ${deleteLoanPayments.deletedCount} thanh toán khoản vay`);

        // Xóa tất cả khoản vay
        const deleteLoans = await Loan.deleteMany({ userId });
        console.log(`Đã xóa ${deleteLoans.deletedCount} khoản vay`);

        // Xóa tất cả ngân sách
        const deleteBudgets = await Budget.deleteMany({ userId });
        console.log(`Đã xóa ${deleteBudgets.deletedCount} ngân sách`);

        // Xóa tất cả thông báo - đã xác minh trường là userId
        const deleteNotifications = await Notification.deleteMany({ userId });
        console.log(`Đã xóa ${deleteNotifications.deletedCount} thông báo`);

        // Ghi log
        logger.info(`User ${userId} đã reset toàn bộ dữ liệu: 
            - Thu nhập: ${deleteIncomes.deletedCount}
            - Chi tiêu: ${deleteExpenses.deletedCount}
            - Thanh toán khoản vay: ${deleteLoanPayments.deletedCount}
            - Khoản vay: ${deleteLoans.deletedCount}
            - Ngân sách: ${deleteBudgets.deletedCount}
            - Thông báo: ${deleteNotifications.deletedCount}
        `);

        // Trả về kết quả
        res.status(200).json({
            success: true,
            message: 'Đã xóa toàn bộ dữ liệu người dùng thành công',
            stats: {
                incomes: deleteIncomes.deletedCount,
                expenses: deleteExpenses.deletedCount,
                loanPayments: deleteLoanPayments.deletedCount,
                loans: deleteLoans.deletedCount,
                budgets: deleteBudgets.deletedCount,
                notifications: deleteNotifications.deletedCount
            }
        });
    } catch (error) {
        console.error(`Lỗi khi reset dữ liệu: ${error.message}`);
        logger.error(`Lỗi khi reset dữ liệu của người dùng ${req.user?._id}:`, error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa dữ liệu. Vui lòng thử lại sau.'
        });
    }
};

/**
 * @desc    Cập nhật vai trò người dùng (chỉ Superadmin)
 * @route   PATCH /api/users/:id/role
 * @access  Private (Superadmin)
 */
export const updateUserRole = catchAsync(async (req, res, next) => {
    const { newRole } = req.body;
    const targetUserId = req.params.id;
    const adminUserId = req.user.id;

    // Chỉ cho phép thay đổi thành 'user' hoặc 'admin'
    if (!['user', 'admin'].includes(newRole)) {
        return next(new AppError('Vai trò mới không hợp lệ.', 400));
    }

    // Không cho phép Superadmin tự thay đổi vai trò của chính mình
    if (targetUserId === adminUserId) {
        return next(new AppError('Không thể thay đổi vai trò của chính bạn.', 400));
    }

    const userToUpdate = await User.findById(targetUserId);

    if (!userToUpdate) {
        return next(new AppError('Không tìm thấy người dùng để cập nhật.', 404));
    }

    // Không cho phép thay đổi vai trò của Superadmin khác (nếu có)
    if (userToUpdate.role === 'superadmin') {
        return next(new AppError('Không thể thay đổi vai trò của Superadmin.', 403));
    }

    userToUpdate.role = newRole;
    await userToUpdate.save({ validateBeforeSave: false }); // Bỏ qua validation nếu cần

    logger.info(`Superadmin ${adminUserId} đã thay đổi vai trò của user ${targetUserId} thành ${newRole}`);

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: userToUpdate._id,
                email: userToUpdate.email,
                firstName: userToUpdate.firstName,
                lastName: userToUpdate.lastName,
                role: userToUpdate.role
            }
        }
    });
});

/**
 * @desc    Lấy danh sách tất cả người dùng
 * @route   GET /api/users
 * @access  Private (Superadmin)
 */
export const getAllUsers = catchAsync(async (req, res, next) => {
    // Lấy tất cả người dùng, không bao gồm password
    const users = await User.find().select('-password');

    // Log thao tác
    logger.info(`Superadmin ${req.user.id} đã truy cập danh sách người dùng`);

    res.status(200).json(users);
});

/**
 * @desc    Lấy danh sách tất cả người dùng với các tùy chọn lọc và phân trang
 * @route   GET /api/admin/users
 * @access  Private (Admin, Superadmin)
 */
export const getAdminUserList = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        search,
        role,
        status,
        sortBy = 'createdAt',
        sortDirection = 'desc'
    } = req.query;

    // Xây dựng bộ lọc
    const filter = {};

    // Tìm kiếm theo email, tên
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
            { email: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex },
            { phoneNumber: searchRegex }
        ];
    }

    // Lọc theo vai trò
    if (role && ['user', 'admin', 'superadmin'].includes(role)) {
        filter.role = role;
    }

    // Lọc theo trạng thái
    if (status === 'active') {
        filter.active = true;
    } else if (status === 'inactive') {
        filter.active = false;
    }

    // Đếm tổng số bản ghi theo bộ lọc
    const total = await User.countDocuments(filter);

    // Xây dựng bộ sắp xếp
    const sort = {};
    sort[sortBy] = sortDirection === 'asc' ? 1 : -1;

    // Tính toán phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy danh sách người dùng
    const users = await User.find(filter)
        .select('-password -refreshToken')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

    // Ghi log
    logger.info(`Admin ${req.user.id} đã truy cập danh sách người dùng với bộ lọc: ${JSON.stringify(req.query)}`);

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'USER_VIEW',
        { filters: req.query, resultCount: users.length },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        results: users.length,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        total,
        data: users
    });
});

/**
 * @desc    Lấy thông tin chi tiết người dùng
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin, Superadmin)
 */
export const getAdminUserDetail = catchAsync(async (req, res, next) => {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('ID người dùng không hợp lệ', 400));
    }

    const user = await User.findById(userId).select('-password -refreshToken');

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Lấy thống kê về dữ liệu người dùng
    const stats = {
        incomes: await Income.countDocuments({ userId }),
        expenses: await Expense.countDocuments({ userId }),
        loans: await Loan.countDocuments({ userId }),
        budgets: await Budget.countDocuments({ userId })
    };

    // Ghi log
    logger.info(`Admin ${req.user.id} đã xem chi tiết người dùng ${userId}`);

    res.status(200).json({
        status: 'success',
        data: {
            user,
            stats
        }
    });
});

/**
 * @desc    Tạo người dùng mới (dành cho admin)
 * @route   POST /api/admin/users
 * @access  Private (Admin, Superadmin)
 */
export const createAdminUser = catchAsync(async (req, res, next) => {
    const { email, password, firstName, lastName, phoneNumber, role } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Email đã được sử dụng', 400));
    }

    // Kiểm tra nếu không phải superadmin thì không thể tạo admin
    if (req.user.role !== 'superadmin' && role === 'admin') {
        return next(new AppError('Bạn không có quyền tạo tài khoản admin', 403));
    }

    // Không cho phép tạo superadmin
    if (role === 'superadmin') {
        return next(new AppError('Không thể tạo tài khoản superadmin', 403));
    }

    // Kiểm tra số lượng admin hiện tại
    if (role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount >= 3) {
            return next(new AppError('Đã đạt giới hạn tối đa số lượng admin (3)', 400));
        }
    }

    // Tạo người dùng mới
    const newUser = await User.create({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role: role || 'user',
        isEmailVerified: true, // Mặc định đánh dấu là đã xác minh
        active: true
    });

    // Không trả về password
    newUser.password = undefined;

    // Ghi log
    logger.info(`Admin ${req.user.id} đã tạo người dùng mới: ${newUser._id} (${newUser.email})`);

    // Log admin activity
    await AdminActivityLogger.logUserAction(
        req.user.id,
        'USER_CREATE',
        newUser._id,
        { email, firstName, lastName, role },
        'SUCCESS',
        req
    );

    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
});

/**
 * @desc    Cập nhật thông tin người dùng
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin, Superadmin)
 */
export const updateAdminUser = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { firstName, lastName, phoneNumber, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('ID người dùng không hợp lệ', 400));
    }

    // Kiểm tra email mới đã tồn tại chưa (nếu có thay đổi)
    if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return next(new AppError('Email đã được sử dụng bởi người dùng khác', 400));
        }
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Không cho phép sửa thông tin superadmin trừ khi người sửa cũng là superadmin
    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
        return next(new AppError('Không có quyền sửa thông tin superadmin', 403));
    }

    // Cập nhật thông tin
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.email = email || user.email;

    await user.save({ validateBeforeSave: false });

    // Ghi log
    logger.info(`Admin ${req.user.id} đã cập nhật thông tin người dùng ${userId}`);

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc    Xóa người dùng
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin, Superadmin)
 */
export const deleteAdminUser = catchAsync(async (req, res, next) => {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('ID người dùng không hợp lệ', 400));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Không cho phép xóa superadmin
    if (user.role === 'superadmin') {
        return next(new AppError('Không thể xóa tài khoản superadmin', 403));
    }

    // Không cho phép xóa admin trừ khi người xóa là superadmin
    if (user.role === 'admin' && req.user.role !== 'superadmin') {
        return next(new AppError('Không có quyền xóa tài khoản admin', 403));
    }

    // Xử lý xóa mềm (đánh dấu không hoạt động)
    user.active = false;
    await user.save({ validateBeforeSave: false });

    // Ghi log
    logger.info(`Admin ${req.user.id} đã vô hiệu hóa tài khoản người dùng ${userId}`);

    res.status(200).json({
        status: 'success',
        message: 'Đã vô hiệu hóa tài khoản người dùng'
    });
});

/**
 * @desc    Thăng cấp người dùng lên Admin
 * @route   POST /api/admin/users/:id/promote
 * @access  Private (SuperAdmin only)
 */
export const promoteToAdmin = catchAsync(async (req, res, next) => {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('ID người dùng không hợp lệ', 400));
    }

    // Chỉ superadmin mới có quyền thăng cấp
    if (req.user.role !== 'superadmin') {
        return next(new AppError('Chỉ SuperAdmin mới có quyền thăng cấp người dùng', 403));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Đã là admin rồi thì không cần thăng cấp nữa
    if (user.role === 'admin') {
        return next(new AppError('Người dùng này đã có quyền Admin', 400));
    }

    // Không thể thăng cấp superadmin
    if (user.role === 'superadmin') {
        return next(new AppError('Không thể thay đổi quyền của SuperAdmin', 400));
    }

    // Kiểm tra số lượng admin hiện tại
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount >= 3) {
        return next(new AppError('Đã đạt giới hạn tối đa số lượng admin (3)', 400));
    }

    // Thăng cấp người dùng
    user.role = 'admin';
    await user.save({ validateBeforeSave: false });

    // Ghi log
    logger.info(`SuperAdmin ${req.user.id} đã thăng cấp người dùng ${userId} lên Admin`);

    // Log admin activity
    await AdminActivityLogger.logUserAction(
        req.user.id,
        'USER_PROMOTE',
        userId,
        { fromRole: 'user', toRole: 'admin' },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc    Hạ cấp Admin xuống người dùng thường
 * @route   POST /api/admin/users/:id/demote
 * @access  Private (SuperAdmin only)
 */
export const demoteFromAdmin = catchAsync(async (req, res, next) => {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('ID người dùng không hợp lệ', 400));
    }

    // Chỉ superadmin mới có quyền hạ cấp
    if (req.user.role !== 'superadmin') {
        return next(new AppError('Chỉ SuperAdmin mới có quyền hạ cấp Admin', 403));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Chỉ hạ cấp admin
    if (user.role !== 'admin') {
        return next(new AppError('Người dùng này không phải Admin', 400));
    }

    // Hạ cấp admin xuống người dùng thường
    user.role = 'user';
    await user.save({ validateBeforeSave: false });

    // Ghi log
    logger.info(`SuperAdmin ${req.user.id} đã hạ cấp Admin ${userId} xuống User`);

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc    Kích hoạt tài khoản người dùng
 * @route   POST /api/admin/users/:id/activate
 * @access  Private (Admin, Superadmin)
 */
export const activateUser = catchAsync(async (req, res, next) => {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('ID người dùng không hợp lệ', 400));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Admin không thể kích hoạt tài khoản admin/superadmin
    if (req.user.role === 'admin' && (user.role === 'admin' || user.role === 'superadmin')) {
        return next(new AppError('Không có quyền kích hoạt tài khoản admin/superadmin', 403));
    }

    if (user.active) {
        return next(new AppError('Tài khoản đã được kích hoạt', 400));
    }

    // Kích hoạt tài khoản
    user.active = true;
    await user.save({ validateBeforeSave: false });

    // Ghi log
    logger.info(`Admin ${req.user.id} đã kích hoạt tài khoản người dùng ${userId}`);

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc    Vô hiệu hóa tài khoản người dùng
 * @route   POST /api/admin/users/:id/deactivate
 * @access  Private (Admin, Superadmin)
 */
export const deactivateUser = catchAsync(async (req, res, next) => {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('ID người dùng không hợp lệ', 400));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Admin không thể vô hiệu hóa tài khoản admin/superadmin
    if (req.user.role === 'admin' && (user.role === 'admin' || user.role === 'superadmin')) {
        return next(new AppError('Không có quyền vô hiệu hóa tài khoản admin/superadmin', 403));
    }

    // Không cho phép vô hiệu hóa superadmin
    if (user.role === 'superadmin') {
        return next(new AppError('Không thể vô hiệu hóa tài khoản superadmin', 403));
    }

    if (!user.active) {
        return next(new AppError('Tài khoản đã bị vô hiệu hóa', 400));
    }

    // Vô hiệu hóa tài khoản
    user.active = false;
    await user.save({ validateBeforeSave: false });

    // Ghi log
    logger.info(`Admin ${req.user.id} đã vô hiệu hóa tài khoản người dùng ${userId}`);

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

/**
 * @desc    Đặt lại mật khẩu cho người dùng
 * @route   POST /api/admin/users/:id/reset-password
 * @access  Private (Admin, Superadmin)
 */
export const resetUserPassword = catchAsync(async (req, res, next) => {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError('ID người dùng không hợp lệ', 400));
    }

    if (!newPassword || newPassword.length < 8) {
        return next(new AppError('Mật khẩu mới phải có ít nhất 8 ký tự', 400));
    }

    const user = await User.findById(userId);

    if (!user) {
        return next(new AppError('Không tìm thấy người dùng', 404));
    }

    // Admin không thể đặt lại mật khẩu của admin/superadmin
    if (req.user.role === 'admin' && (user.role === 'admin' || user.role === 'superadmin')) {
        return next(new AppError('Không có quyền đặt lại mật khẩu của admin/superadmin', 403));
    }

    // Superadmin không thể đặt lại mật khẩu của superadmin khác
    if (req.user.role === 'superadmin' && user.role === 'superadmin' && user._id.toString() !== req.user.id) {
        return next(new AppError('Không thể đặt lại mật khẩu của Superadmin khác', 403));
    }

    // Đặt lại mật khẩu
    user.password = newPassword;
    await user.save();

    // Ghi log
    logger.info(`Admin ${req.user.id} đã đặt lại mật khẩu cho người dùng ${userId}`);

    res.status(200).json({
        status: 'success',
        message: 'Đã đặt lại mật khẩu thành công'
    });
});

/**
 * @desc    Lấy thống kê về người dùng
 * @route   GET /api/admin/users/stats
 * @access  Private (Admin, Superadmin)
 */
export const getUserStats = catchAsync(async (req, res, next) => {
    // Tổng số người dùng
    const totalUsers = await User.countDocuments();

    // Số lượng người dùng theo vai trò
    const usersByRole = await User.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }
    ]);

    // Số lượng người dùng đã xác minh email
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

    // Số lượng người dùng hoạt động
    const activeUsers = await User.countDocuments({ active: true });

    // Người dùng mới trong 7 ngày qua
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const newUsers = await User.countDocuments({
        createdAt: { $gte: lastWeek }
    });

    // Tạo đối tượng kết quả từ usersByRole
    const roleStats = usersByRole.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    res.status(200).json({
        status: 'success',
        data: {
            total: totalUsers,
            active: activeUsers,
            verified: verifiedUsers,
            newLastWeek: newUsers,
            byRole: roleStats
        }
    });
});