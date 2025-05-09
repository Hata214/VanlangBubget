import socketManager from '../utils/socketManager.js';
import Notification from '../models/Notification.js';
import User from '../models/userModel.js';
import { emailService } from '../services/emailService.js';
import logger from './logger.js';

/**
 * Tạo và gửi thông báo cho một user
 * @param {Object} options - Các tùy chọn thông báo
 * @param {string} options.userId - ID người nhận thông báo
 * @param {string} options.title - Tiêu đề thông báo
 * @param {string} options.message - Nội dung thông báo
 * @param {string} options.type - Loại thông báo
 * @param {string} options.link - Link liên kết (tùy chọn)
 * @param {Object} options.data - Dữ liệu bổ sung (tùy chọn)
 * @param {boolean} options.email - Có gửi email hay không
 * @returns {Promise<Object>} Thông báo đã tạo
 */
export const notifyUser = async ({ userId, title, message, type = 'info', link = null, data = {}, email = false }) => {
    try {
        // Tìm user để lấy thông tin email và cài đặt
        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User with ID ${userId} not found`);
            return null;
        }

        // Tạo thông báo mới
        const notification = new Notification({
            user: userId,
            title,
            message,
            type,
            link,
            data,
            read: false
        });

        // Lưu thông báo vào database
        await notification.save();

        // Gửi thông báo qua socket nếu user đã bật tính năng thông báo trong ứng dụng
        if (user.settings?.inAppNotifications !== false) {
            if (socketManager && socketManager.to) {
                socketManager.to(userId).emit('notification', notification);
            }
        }

        // Gửi email nếu được yêu cầu và user đã bật thông báo qua email
        if (email && user.settings?.emailNotifications) {
            await emailService.sendNotificationEmail({
                email: user.email,
                name: user.name,
                title,
                message,
                actionUrl: link ? `${process.env.FRONTEND_URL}${link}` : null,
                actionText: 'Xem chi tiết'
            });
        }

        return notification;
    } catch (error) {
        logger.error('Error sending notification:', error);
        return null;
    }
};

/**
 * Gửi thông báo đến nhiều user
 * @param {Object} options - Các tùy chọn thông báo
 * @param {Array<string>} options.userIds - Danh sách ID người nhận thông báo
 * @param {string} options.title - Tiêu đề thông báo
 * @param {string} options.message - Nội dung thông báo
 * @param {string} options.type - Loại thông báo
 * @param {string} options.link - Link liên kết (tùy chọn)
 * @param {Object} options.data - Dữ liệu bổ sung (tùy chọn)
 * @param {boolean} options.email - Có gửi email hay không
 * @returns {Promise<Array>} Danh sách thông báo đã tạo
 */
export const notifyUsers = async ({ userIds, title, message, type = 'info', link = null, data = {}, email = false }) => {
    try {
        if (!Array.isArray(userIds) || userIds.length === 0) {
            logger.error('Invalid user IDs array');
            return [];
        }

        const notifications = [];
        const emailPromises = [];

        // Tìm tất cả users có trong danh sách
        const users = await User.find({ _id: { $in: userIds } });

        // Map userIds to user objects for easy lookup
        const userMap = new Map();
        users.forEach(user => userMap.set(user._id.toString(), user));

        // Tạo và gửi thông báo cho từng user
        for (const userId of userIds) {
            const user = userMap.get(userId);

            if (!user) {
                logger.error(`User with ID ${userId} not found`);
                continue;
            }

            // Tạo thông báo mới
            const notification = new Notification({
                user: userId,
                title,
                message,
                type,
                link,
                data,
                read: false
            });

            // Lưu thông báo
            await notification.save();
            notifications.push(notification);

            // Gửi thông báo qua socket nếu user đã bật tính năng thông báo trong ứng dụng
            if (user.settings?.inAppNotifications !== false) {
                if (socketManager && socketManager.to) {
                    socketManager.to(userId).emit('notification', notification);
                }
            }

            // Chuẩn bị gửi email nếu được yêu cầu và user đã bật thông báo qua email
            if (email && user.settings?.emailNotifications) {
                emailPromises.push(
                    emailService.sendNotificationEmail({
                        email: user.email,
                        name: user.name,
                        title,
                        message,
                        actionUrl: link ? `${process.env.FRONTEND_URL}${link}` : null,
                        actionText: 'Xem chi tiết'
                    })
                );
            }
        }

        // Gửi tất cả email (nếu có)
        if (emailPromises.length > 0) {
            await Promise.allSettled(emailPromises);
        }

        return notifications;
    } catch (error) {
        logger.error('Error sending notifications to multiple users:', error);
        return [];
    }
};

/**
 * Gửi thông báo đến tất cả users (với các bộ lọc tùy chọn)
 * @param {Object} options - Các tùy chọn thông báo
 * @param {Object} options.filter - Bộ lọc MongoDB cho users (tùy chọn)
 * @param {string} options.title - Tiêu đề thông báo
 * @param {string} options.message - Nội dung thông báo
 * @param {string} options.type - Loại thông báo
 * @param {string} options.link - Link liên kết (tùy chọn)
 * @param {Object} options.data - Dữ liệu bổ sung (tùy chọn)
 * @param {boolean} options.email - Có gửi email hay không
 * @returns {Promise<number>} Số lượng thông báo đã gửi
 */
export const notifyAllUsers = async ({ filter = {}, title, message, type = 'info', link = null, data = {}, email = false }) => {
    try {
        // Tìm tất cả users thỏa mãn điều kiện lọc
        const users = await User.find(filter);

        if (!users || users.length === 0) {
            logger.info('No users found with the specified filter');
            return 0;
        }

        const userIds = users.map(user => user._id.toString());

        // Sử dụng hàm notifyUsers đã có
        const notifications = await notifyUsers({
            userIds,
            title,
            message,
            type,
            link,
            data,
            email
        });

        return notifications.length;
    } catch (error) {
        logger.error('Error sending notifications to all users:', error);
        return 0;
    }
};

/**
 * Gửi thông báo cảnh báo ngân sách cho user
 * @param {Object} options - Các tùy chọn thông báo
 * @param {string} options.userId - ID người nhận thông báo
 * @param {string} options.budgetName - Tên ngân sách
 * @param {number} options.currentSpent - Số tiền đã chi tiêu
 * @param {number} options.threshold - Ngưỡng cảnh báo (phần trăm)
 * @param {number} options.budgetAmount - Tổng số tiền ngân sách
 * @returns {Promise<Object>} Thông báo đã gửi
 */
export const sendBudgetAlert = async ({ userId, budgetName, currentSpent, threshold, budgetAmount }) => {
    const percentSpent = Math.round((currentSpent / budgetAmount) * 100);

    return notifyUser({
        userId,
        title: `Cảnh báo ngân sách: ${budgetName}`,
        message: `Bạn đã chi tiêu ${percentSpent}% ngân sách "${budgetName}" (${currentSpent.toLocaleString('vi-VN')} / ${budgetAmount.toLocaleString('vi-VN')} VND).`,
        type: 'budget-alert',
        link: '/dashboard/budgets',
        data: {
            budgetName,
            percentSpent,
            threshold,
            currentSpent,
            budgetAmount
        },
        email: true
    });
};

/**
 * Gửi thông báo hoàn thành mục tiêu tài chính
 * @param {Object} options - Các tùy chọn thông báo
 * @param {string} options.userId - ID người nhận thông báo
 * @param {string} options.goalName - Tên mục tiêu tài chính
 * @param {number} options.goalAmount - Số tiền mục tiêu
 * @returns {Promise<Object>} Thông báo đã gửi
 */
export const sendGoalReachedNotification = async ({ userId, goalName, goalAmount }) => {
    return notifyUser({
        userId,
        title: 'Chúc mừng! Mục tiêu tài chính đã hoàn thành',
        message: `Bạn đã đạt mục tiêu tài chính "${goalName}" với số tiền ${goalAmount.toLocaleString('vi-VN')} VND.`,
        type: 'goal-reached',
        link: '/dashboard/goals',
        data: {
            goalName,
            goalAmount
        },
        email: true
    });
}; 