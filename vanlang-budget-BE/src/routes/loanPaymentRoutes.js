import express from 'express';
import { deleteLoanPayment } from '../controllers/loanController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Áp dụng middleware protect cho tất cả các routes
router.use(protect);

/**
 * @swagger
 * /api/loan-payments/{id}:
 *   delete:
 *     summary: Xóa thanh toán khoản vay
 *     tags: [Loan Payments]
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
 *         description: Xóa thanh toán khoản vay thành công
 */
router.delete('/:id', deleteLoanPayment);

export default router; 