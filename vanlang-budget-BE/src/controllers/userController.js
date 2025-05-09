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