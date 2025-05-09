import User from '../models/userModel.js';
import logger from '../utils/logger.js';

/**
 * Lấy thông tin chi tiết của người dùng theo ID
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Object>} Thông tin người dùng
 */
export const getUserDetailsByID = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error(`Không tìm thấy người dùng với ID: ${userId}`);
        }
        return user;
    } catch (error) {
        logger.error(`Lỗi khi lấy thông tin người dùng với ID ${userId}:`, error);
        throw error;
    }
};

/**
 * Cập nhật thông tin người dùng
 * @param {string} userId - ID của người dùng cần cập nhật
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<Object>} Thông tin người dùng sau khi cập nhật
 */
export const updateUser = async (userId, updateData) => {
    try {
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (!user) {
            throw new Error(`Không tìm thấy người dùng với ID: ${userId}`);
        }
        return user;
    } catch (error) {
        logger.error(`Lỗi khi cập nhật người dùng với ID ${userId}:`, error);
        throw error;
    }
};

export default {
    getUserDetailsByID,
    updateUser
}; 