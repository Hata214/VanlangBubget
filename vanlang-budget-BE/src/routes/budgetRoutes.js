import express from 'express';
import {
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetsByCategory,
    getBudgetStatistics,
    getMonthlyBudgets
} from '../controllers/budgetController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware.js';
import {
    createBudgetSchema,
    updateBudgetSchema,
    idParamSchema,
    getBudgetsQuerySchema,
    budgetStatsQuerySchema
} from '../validations/budgetValidation.js';

const router = express.Router();

// Áp dụng middleware protect cho tất cả các routes
router.use(protect);

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Lấy danh sách ngân sách
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Tháng (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm (VD. 2023)
 *     responses:
 *       200:
 *         description: Danh sách ngân sách
 */
router.get('/', validateQuery(getBudgetsQuerySchema), getBudgets);

/**
 * @swagger
 * /api/budgets/monthly:
 *   get:
 *     summary: Lấy danh sách ngân sách theo tháng
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tháng (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Năm (VD. 2023)
 *     responses:
 *       200:
 *         description: Danh sách ngân sách theo tháng
 */
router.get('/monthly', validateQuery(getBudgetsQuerySchema), getMonthlyBudgets);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Tạo ngân sách mới
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Budget'
 *     responses:
 *       201:
 *         description: Ngân sách được tạo thành công
 */
router.post('/', validateBody(createBudgetSchema), createBudget);

/**
 * @swagger
 * /api/budgets/category-item/{category}:
 *   get:
 *     summary: Lấy ngân sách theo danh mục
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Danh sách ngân sách theo danh mục
 */
router.get('/category-item/:category', validateQuery(getBudgetsQuerySchema), getBudgetsByCategory);

/**
 * @swagger
 * /api/budgets/statistics:
 *   get:
 *     summary: Lấy thống kê ngân sách
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Tháng (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm (VD. 2023)
 *     responses:
 *       200:
 *         description: Thống kê ngân sách
 */
router.get('/statistics', validateQuery(budgetStatsQuerySchema), getBudgetStatistics);

/**
 * @swagger
 * /api/budgets/{id}:
 *   get:
 *     summary: Lấy thông tin ngân sách theo ID
 *     tags: [Budgets]
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
 *         description: Thông tin ngân sách
 */
router.get('/:id', validateParams(idParamSchema), getBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Cập nhật ngân sách
 *     tags: [Budgets]
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
 *             $ref: '#/components/schemas/Budget'
 *     responses:
 *       200:
 *         description: Ngân sách được cập nhật thành công
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateBudgetSchema), updateBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Xóa ngân sách
 *     tags: [Budgets]
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
 *         description: Ngân sách được xóa thành công
 */
router.delete('/:id', validateParams(idParamSchema), deleteBudget);

export default router; 