import express from 'express';
import {
    getCategories,
    getExpenseCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    resetDefaultCategories
} from '../controllers/expenseCategoryController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware.js';
import {
    createCategorySchema,
    updateCategorySchema,
    getCategoriesQuerySchema,
    idParamSchema
} from '../validations/categoryValidation.js';

const router = express.Router();

// Áp dụng middleware protect cho tất cả các routes
router.use(protect);

/**
 * @swagger
 * /api/expense-categories:
 *   get:
 *     summary: Lấy danh sách danh mục chi tiêu
 *     tags: [Expense Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách danh mục chi tiêu
 */
router.get('/', validateQuery(getCategoriesQuerySchema), getCategories);

/**
 * @swagger
 * /api/expense-categories/grouped:
 *   get:
 *     summary: Lấy danh sách danh mục chi tiêu theo nhóm
 *     tags: [Expense Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách danh mục chi tiêu theo nhóm
 */
router.get('/grouped', validateQuery(getCategoriesQuerySchema), getExpenseCategories);

/**
 * @swagger
 * /api/expense-categories:
 *   post:
 *     summary: Tạo danh mục chi tiêu mới
 *     tags: [Expense Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo danh mục chi tiêu thành công
 */
router.post('/', validateBody(createCategorySchema), createCategory);

/**
 * @swagger
 * /api/expense-categories/reset-defaults:
 *   post:
 *     summary: Khôi phục danh mục chi tiêu mặc định
 *     tags: [Expense Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Khôi phục danh mục mặc định thành công
 */
router.post('/reset-defaults', resetDefaultCategories);

/**
 * @swagger
 * /api/expense-categories/{id}:
 *   get:
 *     summary: Lấy thông tin danh mục chi tiêu theo ID
 *     tags: [Expense Categories]
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
 *         description: Thông tin danh mục chi tiêu
 */
router.get('/:id', validateParams(idParamSchema), getCategory);

/**
 * @swagger
 * /api/expense-categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục chi tiêu
 *     tags: [Expense Categories]
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
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật danh mục chi tiêu thành công
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateCategorySchema), updateCategory);

/**
 * @swagger
 * /api/expense-categories/{id}:
 *   delete:
 *     summary: Xóa danh mục chi tiêu
 *     tags: [Expense Categories]
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
 *         description: Xóa danh mục chi tiêu thành công
 */
router.delete('/:id', validateParams(idParamSchema), deleteCategory);

export default router; 