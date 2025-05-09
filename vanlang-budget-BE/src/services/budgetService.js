/**
 * Service xử lý các thao tác CRUD cho Budget
 */
import Budget from '../models/budgetModel.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

/**
 * Lấy danh sách ngân sách của người dùng
 * @param {string} userId - ID của người dùng
 * @param {Object} filters - Điều kiện lọc (startDate, endDate)
 * @returns {Promise<Array>} Danh sách ngân sách
 */
export const getBudgets = async (userId, filters = {}) => {
    const query = { userId };

    // Thêm các điều kiện filter
    if (filters.startDate && filters.endDate) {
        const startMonth = new Date(filters.startDate).getMonth() + 1;
        const startYear = new Date(filters.startDate).getFullYear();

        const endMonth = new Date(filters.endDate).getMonth() + 1;
        const endYear = new Date(filters.endDate).getFullYear();

        if (startYear === endYear) {
            query.month = { $gte: startMonth, $lte: endMonth };
            query.year = startYear;
        } else {
            query.$or = [
                { year: startYear, month: { $gte: startMonth } },
                { year: endYear, month: { $lte: endMonth } },
                { year: { $gt: startYear, $lt: endYear } }
            ];
        }
    }

    return Budget.find(query).sort({ year: -1, month: -1 });
};

/**
 * Lấy thông tin một ngân sách theo ID
 * @param {string} budgetId - ID của ngân sách
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Object>} Thông tin ngân sách
 * @throws {Error} Nếu không tìm thấy ngân sách
 */
export const getBudgetById = async (budgetId, userId) => {
    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
        throw new Error('Không tìm thấy ngân sách');
    }
    return budget;
};

/**
 * Tạo ngân sách mới
 * @param {Object} budgetData - Dữ liệu ngân sách
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Object>} Ngân sách đã tạo
 */
export const createBudget = async (budgetData, userId) => {
    const budget = await Budget.create({
        ...budgetData,
        userId
    });
    return budget;
};

/**
 * Cập nhật thông tin ngân sách
 * @param {string} budgetId - ID của ngân sách
 * @param {Object} updateData - Dữ liệu cập nhật
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Object>} Ngân sách đã cập nhật
 * @throws {Error} Nếu không tìm thấy ngân sách
 */
export const updateBudget = async (budgetId, updateData, userId) => {
    const budget = await Budget.findOneAndUpdate(
        { _id: budgetId, userId },
        updateData,
        { new: true, runValidators: true }
    );

    if (!budget) {
        throw new Error('Không tìm thấy ngân sách');
    }

    return budget;
};

/**
 * Xóa ngân sách
 * @param {string} budgetId - ID của ngân sách
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Object>} Kết quả xóa
 * @throws {Error} Nếu không tìm thấy ngân sách
 */
export const deleteBudget = async (budgetId, userId) => {
    const budget = await Budget.findOneAndDelete({ _id: budgetId, userId });

    if (!budget) {
        throw new Error('Không tìm thấy ngân sách');
    }

    return { success: true };
};

/**
 * Kiểm tra và thông báo các ngân sách sắp hết hạn
 * @returns {Promise<number>} Số lượng thông báo đã tạo
 */
export const notifyDueBudgets = async () => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Tìm các ngân sách có thể sẽ vượt quá ngưỡng
        const budgets = await Budget.find({
            month: currentMonth,
            year: currentYear,
            notifiedThreshold: { $lt: 100 }  // Chỉ thông báo những ngân sách chưa thông báo đạt 100%
        }).populate('userId', 'name email settings');

        let notificationCount = 0;

        for (const budget of budgets) {
            // Nếu đã tiêu thụ hơn 80% ngân sách và chưa được thông báo
            if (budget.percentUsed >= 80 && budget.notifiedThreshold < 80) {
                // Tạo thông báo cho ngưỡng 80%
                await Notification.create({
                    user: budget.userId,
                    title: 'Cảnh báo ngân sách',
                    message: `Ngân sách "${budget.category}" đã sử dụng ${budget.percentUsed.toFixed(0)}% (${budget.amount.toLocaleString()}đ)`,
                    type: 'budget_alert',
                    refId: budget._id,
                    data: {
                        budgetId: budget._id,
                        percentUsed: budget.percentUsed,
                        threshold: 80
                    }
                });

                // Cập nhật ngưỡng đã thông báo
                budget.notifiedThreshold = 80;
                await budget.save();

                notificationCount++;
                logger.info(`Đã tạo thông báo ngưỡng 80% cho ngân sách ${budget._id}`);
            }
            // Nếu đã tiêu thụ hơn 100% ngân sách và chưa được thông báo
            else if (budget.percentUsed >= 100 && budget.notifiedThreshold < 100) {
                // Tạo thông báo cho ngưỡng 100%
                await Notification.create({
                    user: budget.userId,
                    title: 'Vượt ngân sách',
                    message: `Ngân sách "${budget.category}" đã bị vượt quá! Đã sử dụng ${budget.percentUsed.toFixed(0)}% (${budget.amount.toLocaleString()}đ)`,
                    type: 'budget_exceeded',
                    refId: budget._id,
                    data: {
                        budgetId: budget._id,
                        percentUsed: budget.percentUsed,
                        threshold: 100
                    }
                });

                // Cập nhật ngưỡng đã thông báo
                budget.notifiedThreshold = 100;
                await budget.save();

                notificationCount++;
                logger.info(`Đã tạo thông báo vượt ngân sách cho ${budget._id}`);
            }
        }

        logger.info(`Đã tạo ${notificationCount} thông báo cho ngân sách`);
        return notificationCount;
    } catch (error) {
        logger.error('Lỗi khi thông báo ngân sách sắp hết hạn:', error);
        throw error;
    }
}; 