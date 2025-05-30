import User from '../models/userModel.js';
import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';
import Loan from '../models/loanModel.js';
import Budget from '../models/budgetModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import AdminActivityLogger from '../utils/adminActivityLogger.js';
import logger from '../utils/logger.js';

/**
 * @desc    Lấy thông tin tổng quan cho dashboard admin
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin/Superadmin)
 */
export const adminDashboard = async (req, res, next) => {
    try {
        // Đếm tổng số người dùng
        const totalUsers = await User.countDocuments();

        // Đếm số người dùng mới trong 30 ngày qua
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newUsers = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Đếm số người dùng active (sửa field name)
        const activeUsers = await User.countDocuments({ active: true });

        // Đếm số admin và superadmin
        const adminCount = await User.countDocuments({
            role: { $in: ['admin', 'superadmin'] }
        });

        // Thống kê dữ liệu tài chính
        const totalIncomes = await Income.countDocuments();
        const totalExpenses = await Expense.countDocuments();
        const totalLoans = await Loan.countDocuments();
        const totalBudgets = await Budget.countDocuments();

        // Thống kê hoạt động admin trong 7 ngày qua
        const recentActivityStats = await AdminActivityLogger.getActivityStats(
            req.user.role === 'admin' ? req.user.id : null,
            7
        );

        // Thống kê người dùng theo vai trò
        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        logger.info(`Admin ${req.user.id} đã truy cập dashboard`);

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'DASHBOARD_VIEW',
            { section: 'main-dashboard' },
            'SUCCESS',
            req
        );

        // Trả về dữ liệu tổng quan
        res.status(200).json({
            status: 'success',
            data: {
                // User statistics
                users: {
                    total: totalUsers,
                    new: newUsers,
                    active: activeUsers,
                    admin: adminCount,
                    byRole: usersByRole
                },

                // Financial data statistics
                financialData: {
                    incomes: totalIncomes,
                    expenses: totalExpenses,
                    loans: totalLoans,
                    budgets: totalBudgets
                },

                // Admin activity statistics
                adminActivity: {
                    recent: recentActivityStats,
                    period: '7 ngày qua'
                }
            }
        });
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu dashboard admin:', error);
        next(new AppError('Không thể lấy dữ liệu dashboard', 500));
    }
};
