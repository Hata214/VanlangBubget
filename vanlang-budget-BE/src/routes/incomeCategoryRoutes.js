import express from 'express';
import {
    getCategories,
    getIncomeCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    resetDefaultCategories
} from '../controllers/incomeCategoryController.js';
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
 * /api/income-categories:
 *   get:
 *     summary: Lấy danh sách danh mục thu nhập
 *     tags: [Income Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách danh mục thu nhập
 */
router.get('/', validateQuery(getCategoriesQuerySchema), getCategories);

/**
 * @swagger
 * /api/income-categories/grouped:
 *   get:
 *     summary: Lấy danh sách danh mục thu nhập theo nhóm
 *     tags: [Income Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Danh sách danh mục thu nhập theo nhóm
 */
router.get('/grouped', validateQuery(getCategoriesQuerySchema), getIncomeCategories);

/**
 * @swagger
 * /api/income-categories:
 *   post:
 *     summary: Tạo danh mục thu nhập mới
 *     tags: [Income Categories]
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
 *         description: Tạo danh mục thu nhập thành công
 */
router.post('/', validateBody(createCategorySchema), createCategory);

/**
 * @swagger
 * /api/income-categories/reset-defaults:
 *   post:
 *     summary: Khôi phục danh mục thu nhập mặc định
 *     tags: [Income Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Khôi phục danh mục mặc định thành công
 */
router.post('/reset-defaults', resetDefaultCategories);

/**
 * @swagger
 * /api/income-categories/{id}:
 *   get:
 *     summary: Lấy thông tin danh mục thu nhập theo ID
 *     tags: [Income Categories]
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
 *         description: Thông tin danh mục thu nhập
 */
router.get('/:id', validateParams(idParamSchema), getCategory);

/**
 * @swagger
 * /api/income-categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục thu nhập
 *     tags: [Income Categories]
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
 *         description: Cập nhật danh mục thu nhập thành công
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateCategorySchema), updateCategory);

/**
 * @swagger
 * /api/income-categories/{id}:
 *   delete:
 *     summary: Xóa danh mục thu nhập
 *     tags: [Income Categories]
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
 *         description: Xóa danh mục thu nhập thành công
 */
router.delete('/:id', validateParams(idParamSchema), deleteCategory);

export default router; 