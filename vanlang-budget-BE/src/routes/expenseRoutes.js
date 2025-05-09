import express from 'express';
import {
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    getMonthlyTotal,
    getTotalByCategory
} from '../controllers/expenseController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware.js';
import {
    createExpenseSchema,
    updateExpenseSchema,
    getExpensesQuerySchema,
    monthlyQuerySchema,
    idParamSchema
} from '../validations/expenseValidation.js';
import Expense from '../models/expenseModel.js';

const router = express.Router();

// Áp dụng middleware protect cho tất cả các routes
router.use(protect);

/**
 * @swagger
 * /api/expenses/categories:
 *   get:
 *     summary: Lấy danh sách danh mục chi tiêu
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục chi tiêu
 */
router.get('/categories', async (req, res, next) => {
    try {
        // Lấy danh sách các danh mục duy nhất từ collection expenses
        const categories = await Expense.distinct('category', { userId: req.user._id });
        console.log('Expense categories:', categories);

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error getting expense categories:', error);
        next(error);
    }
});

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Lấy danh sách chi tiêu
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Danh sách chi tiêu
 */
router.get('/', validateQuery(getExpensesQuerySchema), getExpenses);

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Tạo chi tiêu mới
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - description
 *               - category
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *                   address:
 *                     type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo chi tiêu thành công
 */
router.post('/', validateBody(createExpenseSchema), createExpense);

/**
 * @swagger
 * /api/expenses/summary/monthly:
 *   get:
 *     summary: Lấy tổng chi tiêu theo tháng
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *     responses:
 *       200:
 *         description: Tổng chi tiêu theo tháng
 */
router.get('/summary/monthly', validateQuery(monthlyQuerySchema), getMonthlyTotal);

/**
 * @swagger
 * /api/expenses/summary/by-category:
 *   get:
 *     summary: Lấy tổng chi tiêu theo danh mục
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 2000
 *     responses:
 *       200:
 *         description: Tổng chi tiêu theo danh mục
 */
router.get('/summary/by-category', validateQuery(monthlyQuerySchema), getTotalByCategory);

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiêu theo ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin chi tiêu
 */
router.get('/:id', validateParams(idParamSchema), getExpense);

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Cập nhật chi tiêu
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *                   address:
 *                     type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật chi tiêu thành công
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateExpenseSchema), updateExpense);

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Xóa chi tiêu
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Xóa chi tiêu thành công
 */
router.delete('/:id', validateParams(idParamSchema), deleteExpense);

export default router; 