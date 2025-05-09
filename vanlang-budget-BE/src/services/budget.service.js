import Budget from '../models/Budget.js';

/**
 * Service cho quản lý ngân sách
 */
const budgetService = {
    /**
     * Lấy tất cả ngân sách
     * @returns {Promise<Array>} Danh sách ngân sách
     */
    async getBudgets() {
        return await Budget.find().lean();
    },

    /**
     * Lấy ngân sách theo ID
     * @param {string} id - ID của ngân sách
     * @returns {Promise<Object>} Thông tin ngân sách
     */
    async getBudgetById(id) {
        return await Budget.findById(id).lean();
    },

    /**
     * Tạo ngân sách mới
     * @param {Object} budgetData - Dữ liệu ngân sách
     * @returns {Promise<Object>} Ngân sách đã tạo
     */
    async createBudget(budgetData) {
        return await Budget.create(budgetData);
    },

    /**
     * Cập nhật ngân sách
     * @param {string} id - ID của ngân sách
     * @param {Object} budgetData - Dữ liệu cập nhật
     * @returns {Promise<Object>} Ngân sách đã cập nhật
     */
    async updateBudget(id, budgetData) {
        return await Budget.findByIdAndUpdate(id, budgetData, { new: true }).lean();
    },

    /**
     * Xóa ngân sách
     * @param {string} id - ID của ngân sách
     * @returns {Promise<boolean>} True nếu xóa thành công
     */
    async deleteBudget(id) {
        await Budget.findByIdAndDelete(id);
        return true;
    }
};

export default budgetService; 