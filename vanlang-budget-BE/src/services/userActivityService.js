import mongoose from 'mongoose';
import User from '../models/userModel.js';
import logger from '../utils/logger.js';

/**
 * Tạo bản ghi theo dõi đăng nhập hàng ngày
 * @returns {Promise<void>}
 */
export const createDailyLoginTracking = async () => {
    try {
        logger.info('Running daily user activity tracking');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Lấy danh sách người dùng đã đăng nhập trong ngày
        const activeUsers = await User.find({
            lastLogin: {
                $gte: today
            },
            active: true
        });

        logger.info(`Found ${activeUsers.length} active users today`);

        // Cập nhật thống kê hoạt động
        for (const user of activeUsers) {
            // Cập nhật số ngày đăng nhập liên tiếp nếu cần
            if (!user.stats) {
                user.stats = {
                    loginStreak: 1,
                    lastLoginDate: today,
                    totalLogins: 1
                };
            } else {
                // Kiểm tra ngày đăng nhập cuối cùng
                const lastLoginDate = user.stats.lastLoginDate || new Date(0);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                // Nếu đăng nhập ngày hôm qua, tăng chuỗi đăng nhập
                if (lastLoginDate.toDateString() === yesterday.toDateString()) {
                    user.stats.loginStreak = (user.stats.loginStreak || 0) + 1;
                }
                // Nếu không phải ngày hôm qua, reset chuỗi đăng nhập
                else if (lastLoginDate.toDateString() !== today.toDateString()) {
                    user.stats.loginStreak = 1;
                }

                user.stats.lastLoginDate = today;
                user.stats.totalLogins = (user.stats.totalLogins || 0) + 1;
            }

            await user.save();
            logger.info(`Updated user ${user._id} with login streak: ${user.stats.loginStreak}`);
        }

        logger.info('Completed daily user activity tracking');
    } catch (error) {
        logger.error('Error in daily user activity tracking:', error);
    }
};

export default {
    createDailyLoginTracking
}; 