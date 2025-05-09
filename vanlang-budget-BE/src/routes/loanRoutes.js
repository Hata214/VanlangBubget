import express from 'express';
import {
    getLoans,
    getLoan,
    createLoan,
    updateLoan,
    deleteLoan,
    getLoanPayments,
    addLoanPayment
} from '../controllers/loanController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware.js';
import {
    createLoanSchema,
    updateLoanSchema,
    loanPaymentSchema,
    getLoansQuerySchema,
    idParamSchema
} from '../validations/loanValidation.js';
import Loan from '../models/loanModel.js';

const router = express.Router();

// Áp dụng middleware protect cho tất cả các routes
router.use(protect);

/**
 * @swagger
 * /api/loans/lenders:
 *   get:
 *     summary: Lấy danh sách người cho vay/mượn
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người cho vay/mượn
 */
router.get('/lenders', async (req, res, next) => {
    try {
        // Lấy danh sách người cho vay/mượn duy nhất từ collection loans
        const lenders = await Loan.distinct('lender', { userId: req.user._id });
        console.log('Loan lenders:', lenders);

        res.status(200).json(lenders);
    } catch (error) {
        console.error('Error getting loan lenders:', error);
        next(error);
    }
});

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Lấy danh sách khoản vay
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, PAID, OVERDUE]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Danh sách khoản vay
 */
router.get('/', validateQuery(getLoansQuerySchema), getLoans);

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Tạo khoản vay mới
 *     tags: [Loans]
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
 *               - dueDate
 *               - lender
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *               lender:
 *                 type: string
 *               interestRate:
 *                 type: number
 *                 minimum: 0
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PAID, OVERDUE]
 *                 default: ACTIVE
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo khoản vay thành công
 */
router.post('/', validateBody(createLoanSchema), createLoan);

/**
 * @swagger
 * /api/loans/{id}:
 *   get:
 *     summary: Lấy thông tin khoản vay theo ID
 *     tags: [Loans]
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
 *         description: Thông tin khoản vay
 */
router.get('/:id', validateParams(idParamSchema), getLoan);

/**
 * @swagger
 * /api/loans/{id}:
 *   put:
 *     summary: Cập nhật khoản vay
 *     tags: [Loans]
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
 *               lender:
 *                 type: string
 *               interestRate:
 *                 type: number
 *                 minimum: 0
 *               startDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, PAID, OVERDUE]
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật khoản vay thành công
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateLoanSchema), updateLoan);

/**
 * @swagger
 * /api/loans/{id}:
 *   delete:
 *     summary: Xóa khoản vay
 *     tags: [Loans]
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
 *         description: Xóa khoản vay thành công
 */
router.delete('/:id', validateParams(idParamSchema), deleteLoan);

/**
 * @swagger
 * /api/loans/{id}/payments:
 *   get:
 *     summary: Lấy danh sách thanh toán của một khoản vay
 *     tags: [Loans]
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
 *         description: Danh sách thanh toán
 */
router.get('/:id/payments', validateParams(idParamSchema), getLoanPayments);

/**
 * @swagger
 * /api/loans/{id}/payments:
 *   post:
 *     summary: Thêm thanh toán cho khoản vay
 *     tags: [Loans]
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
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               date:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Thêm thanh toán thành công
 */
router.post('/:id/payments', validateParams(idParamSchema), validateBody(loanPaymentSchema), addLoanPayment);

export default router; 