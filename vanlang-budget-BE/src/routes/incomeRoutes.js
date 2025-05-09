import express from 'express';
import {
    getIncomes,
    getIncome,
    createIncome,
    updateIncome,
    deleteIncome,
    getMonthlyTotal,
    getTotalByCategory
} from '../controllers/incomeController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware.js';
import {
    createIncomeSchema,
    updateIncomeSchema,
    getIncomesQuerySchema,
    monthlyQuerySchema,
    idParamSchema
} from '../validations/incomeValidation.js';
import Income from '../models/incomeModel.js';

const router = express.Router();

// Áp dụng middleware protect cho tất cả các routes
router.use(protect);

/**
 * @swagger
 * /api/incomes/categories:
 *   get:
 *     summary: Lấy danh sách danh mục thu nhập
 *     tags: [Incomes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục thu nhập
 */
router.get('/categories', async (req, res, next) => {
    try {
        // Lấy danh sách các danh mục duy nhất từ collection incomes
        const categories = await Income.distinct('category', { userId: req.user._id });
        console.log('Income categories:', categories);

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error getting income categories:', error);
        next(error);
    }
});

/**
 * @swagger
 * /api/incomes/summary/monthly:
 *   get:
 *     summary: Lấy tổng thu nhập theo tháng
 *     tags: [Incomes]
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
 *         description: Tổng thu nhập theo tháng
 */
router.get('/summary/monthly', validateQuery(monthlyQuerySchema), getMonthlyTotal);

/**
 * @swagger
 * /api/incomes/summary/by-category:
 *   get:
 *     summary: Lấy tổng thu nhập theo danh mục
 *     tags: [Incomes]
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
 *         description: Tổng thu nhập theo danh mục
 */
router.get('/summary/by-category', validateQuery(monthlyQuerySchema), getTotalByCategory);

/**
 * @swagger
 * /api/incomes:
 *   get:
 *     summary: Lấy danh sách thu nhập
 *     tags: [Incomes]
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
 *         description: Danh sách thu nhập
 */
router.get('/', validateQuery(getIncomesQuerySchema), getIncomes);

/**
 * @swagger
 * /api/incomes:
 *   post:
 *     summary: Tạo thu nhập mới
 *     tags: [Incomes]
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
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo thu nhập thành công
 */
router.post('/', validateBody(createIncomeSchema), createIncome);

/**
 * @swagger
 * /api/incomes/{id}:
 *   get:
 *     summary: Lấy thông tin thu nhập theo ID
 *     tags: [Incomes]
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
 *         description: Thông tin thu nhập
 */
router.get('/:id', validateParams(idParamSchema), getIncome);

/**
 * @swagger
 * /api/incomes/{id}:
 *   put:
 *     summary: Cập nhật thu nhập
 *     tags: [Incomes]
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
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật thu nhập thành công
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateIncomeSchema), updateIncome);

/**
 * @swagger
 * /api/incomes/{id}:
 *   delete:
 *     summary: Xóa thu nhập
 *     tags: [Incomes]
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
 *         description: Xóa thu nhập thành công
 */
router.delete('/:id', validateParams(idParamSchema), deleteIncome);

export default router; 