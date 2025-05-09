import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware.js';

// Import các hàm controller
import {
    createInvestment,
    getInvestments,
    getInvestmentById,
    updateInvestment,
    deleteInvestment,
    addTransaction,
    deleteTransaction,
    getInvestmentSummary,
    getInvestmentsByType,
    batchUpdatePrice,
    addStockTransactionBySymbol,
    getInvestmentBySymbol
} from '../controllers/investmentController.js';

// Import các schema validation
import {
    createInvestmentSchema,
    updateInvestmentSchema,
    addTransactionSchema,
    idParamSchema,
    investmentTransactionParamsSchema,
    idQuerySchema,
    typeParamSchema,
    batchUpdatePriceSchema,
    stockSymbolParamSchema
} from '../validations/investmentValidation.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Investments
 *   description: API quản lý các khoản đầu tư
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Investment:
 *       type: object
 *       properties:
 *         id: 
 *           type: string
 *           description: ID của khoản đầu tư
 *         userId:
 *           type: string
 *           description: ID của người dùng sở hữu
 *         name:
 *           type: string
 *           description: Tên khoản đầu tư
 *         type:
 *           type: string
 *           enum: [stock, crypto, gold, savings, fund, realestate, other]
 *           description: Loại đầu tư
 *         symbol:
 *           type: string
 *           description: Mã ký hiệu (nếu có)
 *         category:
 *           type: string
 *           description: Danh mục tùy chỉnh
 *         initialInvestment:
 *           type: number
 *           description: Tổng vốn đầu tư ban đầu (được tính toán)
 *         currentValue:
 *           type: number
 *           description: Giá trị hiện tại (được tính toán)
 *         totalQuantity:
 *           type: number
 *           description: Tổng số lượng nắm giữ
 *         currentPrice:
 *           type: number
 *           description: Giá thị trường hiện tại của một đơn vị
 *         startDate:
 *           type: string
 *           format: date
 *           description: Ngày bắt đầu đầu tư
 *         notes:
 *           type: string
 *           description: Ghi chú
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         profitLoss:
 *           type: number
 *           description: Lãi/lỗ (được tính toán)
 *         roi:
 *           type: number
 *           description: Tỷ suất lợi nhuận (%) (được tính toán)
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [buy, sell, deposit, withdraw, dividend, interest]
 *         amount:
 *           type: number
 *         price:
 *           type: number
 *         quantity:
 *           type: number
 *         fee:
 *           type: number
 *         date:
 *           type: string
 *           format: date
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     InvestmentInput:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [stock, crypto, gold, savings, fund, realestate, other]
 *         symbol:
 *           type: string
 *         category:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *         notes:
 *           type: string
 *         initialInvestment:
 *           type: number
 *           description: Vốn đầu tư ban đầu (nếu có, sẽ tạo giao dịch tương ứng)
 *         currentPrice:
 *           type: number
 *           description: Giá hiện tại ban đầu (nếu có)
 *     InvestmentUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         notes:
 *           type: string
 *         currentPrice:
 *           type: number
 *     TransactionInput:
 *       type: object
 *       required:
 *         - type
 *         - date
 *       properties:
 *         type:
 *           type: string
 *           enum: [buy, sell, deposit, withdraw, dividend, interest]
 *         amount:
 *           type: number
 *           description: Bắt buộc nếu type là deposit, withdraw, dividend, interest
 *         price:
 *           type: number
 *           description: Bắt buộc nếu type là buy, sell
 *         quantity:
 *           type: number
 *           description: Bắt buộc nếu type là buy, sell
 *         fee:
 *           type: number
 *         date:
 *           type: string
 *           format: date
 *         notes:
 *           type: string
 *     BatchPriceUpdateInput:
 *       type: object
 *       required:
 *         - updates
 *       properties:
 *         updates:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - id
 *               - currentPrice
 *             properties:
 *               id:
 *                 type: string
 *                 format: ObjectId
 *                 description: ID của khoản đầu tư cần cập nhật
 *               currentPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Giá mới
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * security:
 *   - bearerAuth: []
 */

// Áp dụng middleware `protect` cho tất cả các route trong file này
router.use(protect);

/**
 * @swagger
 * /api/investments:
 *   post:
 *     summary: Tạo khoản đầu tư mới
 *     tags: [Investments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvestmentInput'
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *   get:
 *     summary: Lấy danh sách tất cả khoản đầu tư của người dùng
 *     tags: [Investments]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Investment'
 *       401:
 *         description: Chưa xác thực
 *   delete:
 *     summary: Xóa một khoản đầu tư
 *     tags: [Investments]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: ID của khoản đầu tư cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy khoản đầu tư
 */
router.route('/')
    .post(validateBody(createInvestmentSchema), createInvestment)
    .get(getInvestments)
    .delete(validateQuery(idQuerySchema), deleteInvestment);

/**
 * @swagger
 * /api/investments/summary:
 *   get:
 *     summary: Lấy tổng hợp thông tin đầu tư
 *     tags: [Investments]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalInitialInvestment:
 *                   type: number
 *                 totalCurrentValue:
 *                   type: number
 *                 totalProfitLoss:
 *                   type: number
 *                 overallROI:
 *                   type: number
 *                 count:
 *                   type: integer
 *                 byType:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                       initialInvestment:
 *                         type: number
 *                       currentValue:
 *                         type: number
 *                       profitLoss:
 *                         type: number
 *                       roi:
 *                         type: number
 *       401:
 *         description: Chưa xác thực
 */
router.get('/summary', getInvestmentSummary);

/**
 * @swagger
 * /api/investments/by-type/{type}:
 *   get:
 *     summary: Lấy danh sách đầu tư theo loại
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stock, crypto, gold, savings, fund, realestate, other]
 *         description: Loại đầu tư cần lọc
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Loại đầu tư không hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.get('/by-type/:type', validateParams(typeParamSchema), getInvestmentsByType);

/**
 * @swagger
 * /api/investments/batch-update-price:
 *   post:
 *     summary: Cập nhật giá hiện tại cho nhiều khoản đầu tư
 *     tags: [Investments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchPriceUpdateInput'
 *     responses:
 *       200:
 *         description: Cập nhật thành công (có thể có lỗi cho từng mục)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: array
 *                   items:
 *                      type: object
 *                      properties:
 *                          id: 
 *                              type: string
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.post('/batch-update-price', validateBody(batchUpdatePriceSchema), batchUpdatePrice);

/**
 * @swagger
 * /api/investments/stocks/{stockSymbol}/transactions:
 *   post:
 *     summary: Thêm giao dịch cho một mã cổ phiếu cụ thể
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: stockSymbol
 *         required: true
 *         schema:
 *           type: string
 *         description: "Mã cổ phiếu (VD: FPT, BID, CMG)"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       200:
 *         description: Thêm giao dịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc mã cổ phiếu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy khoản đầu tư cổ phiếu với mã này
 */
router.post(
    '/stocks/:stockSymbol/transactions',
    validateParams(stockSymbolParamSchema),
    validateBody(addTransactionSchema),
    addStockTransactionBySymbol
);

/**
 * @swagger
 * /api/investments/stocks/{symbol}:
 *   get:
 *     summary: Lấy thông tin đầu tư theo mã cổ phiếu
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: "Mã cổ phiếu/tài sản (VD. VNM, BTC, SJC)"
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       404:
 *         description: Không tìm thấy khoản đầu tư với mã này
 *       400:
 *         description: Mã cổ phiếu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.get('/stocks/:symbol', getInvestmentBySymbol);

/**
 * @swagger
 * /api/investments/{id}:
 *   get:
 *     summary: Lấy chi tiết một khoản đầu tư
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: ID của khoản đầu tư
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy khoản đầu tư
 *   put:
 *     summary: Cập nhật thông tin một khoản đầu tư
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: ID của khoản đầu tư
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvestmentUpdateInput'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment'
 *       400:
 *         description: Dữ liệu hoặc ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy khoản đầu tư
 */
router.route('/:id')
    .get(validateParams(idParamSchema), getInvestmentById)
    .put(validateParams(idParamSchema), validateBody(updateInvestmentSchema), updateInvestment);

/**
 * @swagger
 * /api/investments/{id}/transactions:
 *   post:
 *     summary: Thêm một giao dịch mới cho khoản đầu tư
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: ID của khoản đầu tư
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       200:
 *         description: Thêm giao dịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment' # Trả về investment đã cập nhật
 *       400:
 *         description: Dữ liệu hoặc ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy khoản đầu tư
 */
router.route('/:id/transactions')
    .post(validateParams(idParamSchema), validateBody(addTransactionSchema), addTransaction);

/**
 * @swagger
 * /api/investments/{id}/transactions/{transactionId}:
 *   delete:
 *     summary: Xóa một giao dịch khỏi khoản đầu tư
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: ID của khoản đầu tư
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *           format: ObjectId
 *         required: true
 *         description: ID của giao dịch cần xóa
 *     responses:
 *       200:
 *         description: Xóa giao dịch thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Investment' # Trả về investment đã cập nhật
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy khoản đầu tư hoặc giao dịch
 */
router.route('/:id/transactions/:transactionId')
    .delete(validateParams(investmentTransactionParamsSchema), deleteTransaction);

export default router; 