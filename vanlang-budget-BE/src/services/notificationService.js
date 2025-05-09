import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

/**
 * Tìm thông báo theo ID
 * @param {string} notificationId - ID của thông báo cần tìm
 * @returns {Promise<Object>} Thông báo tìm thấy
 */
export const findByID = async (notificationId) => {
    try {
        const notification = await Notification.findById(notificationId);
        return notification;
    } catch (error) {
        logger.error(`Lỗi khi tìm thông báo theo ID ${notificationId}:`, error);
        throw error;
    }
};

/**
 * Đánh dấu thông báo đã đọc
 * @param {string} notificationId - ID của thông báo cần đánh dấu
 * @returns {Promise<Object>} Thông báo đã được cập nhật
 */
export const markAsRead = async (notificationId) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );
        return notification;
    } catch (error) {
        logger.error(`Lỗi khi đánh dấu thông báo đã đọc ${notificationId}:`, error);
        throw error;
    }
};

export default {
    findByID,
    markAsRead
}; 