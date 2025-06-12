import express from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import {
    getAllPaymentTransactions,
    getPaymentTransactionById,
    updateTransactionStatus,
    getPaymentTransactionStats,
    createSampleTransactions
} from '../controllers/paymentTransactionController.js';

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(protect);

// Tất cả routes đều yêu cầu quyền admin hoặc superadmin
router.use(restrictTo('admin', 'superadmin'));

/**
 * @desc    Lấy thống kê giao dịch thanh toán
 * @route   GET /api/admin/transactions/stats
 * @access  Private (Admin/SuperAdmin)
 */
router.get('/stats', getPaymentTransactionStats);

/**
 * @desc    Tạo giao dịch mẫu (chỉ dành cho development/testing)
 * @route   POST /api/admin/transactions/create-sample
 * @access  Private (SuperAdmin only)
 */
router.post('/create-sample', restrictTo('superadmin'), createSampleTransactions);

/**
 * @desc    Lấy danh sách tất cả giao dịch thanh toán
 * @route   GET /api/admin/transactions
 * @access  Private (Admin/SuperAdmin)
 */
router.get('/', getAllPaymentTransactions);

/**
 * @desc    Lấy chi tiết một giao dịch thanh toán
 * @route   GET /api/admin/transactions/:id
 * @access  Private (Admin/SuperAdmin)
 */
router.get('/:id', getPaymentTransactionById);

/**
 * @desc    Cập nhật trạng thái giao dịch
 * @route   PATCH /api/admin/transactions/:id/status
 * @access  Private (Admin/SuperAdmin)
 */
router.patch('/:id/status', updateTransactionStatus);

export default router;
