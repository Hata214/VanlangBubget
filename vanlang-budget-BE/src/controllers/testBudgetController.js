import budgetService from '../services/budget.service.js';

/**
 * Controller đơn giản cho budget chỉ để test
 */
const testBudgetController = {
    // Tham chiếu đến service để dễ dàng mock khi test
    budgetService,

    /**
     * Lấy tất cả ngân sách
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async getBudgets(req, res, next) {
        try {
            const budgets = await budgetService.getBudgets();
            res.status(200).json({
                success: true,
                count: budgets.length,
                data: budgets
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Lấy ngân sách theo ID
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async getBudgetById(req, res, next) {
        try {
            const budget = await budgetService.getBudgetById(req.params.id);
            if (!budget) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy ngân sách'
                });
            }

            res.status(200).json({
                success: true,
                data: budget
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Tạo ngân sách mới
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async createBudget(req, res, next) {
        try {
            // Gán user ID từ req.user (được đặt bởi auth middleware)
            const budgetData = {
                ...req.body,
                user: req.user.id
            };

            const budget = await budgetService.createBudget(budgetData);

            res.status(201).json({
                success: true,
                data: budget
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Cập nhật ngân sách
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async updateBudget(req, res, next) {
        try {
            const budget = await budgetService.updateBudget(req.params.id, req.body);
            if (!budget) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy ngân sách'
                });
            }

            res.status(200).json({
                success: true,
                data: budget
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Xóa ngân sách
     * @param {Object} req - Express Request object
     * @param {Object} res - Express Response object
     * @param {Function} next - Express Next function
     */
    async deleteBudget(req, res, next) {
        try {
            await budgetService.deleteBudget(req.params.id);

            res.status(200).json({
                success: true,
                data: {}
            });
        } catch (error) {
            next(error);
        }
    }
};

export default testBudgetController; 