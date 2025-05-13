import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
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
        
        // Đếm số người dùng active
        const activeUsers = await User.countDocuments({ isActive: true });
        
        // Đếm số admin
        const adminUsers = await User.countDocuments({ role: 'admin' });
        
        // Trả về dữ liệu tổng quan
        res.status(200).json({
            status: 'success',
            data: {
                totalUsers,
                newUsers,
                activeUsers,
                adminUsers
            }
        });
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu dashboard admin:', error);
        next(new AppError('Không thể lấy dữ liệu dashboard', 500));
    }
};
