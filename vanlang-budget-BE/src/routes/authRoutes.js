import express from 'express';
import {
    register,
    login,
    logout,
    getMe,
    updateMe,
    updatePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    refreshToken,
    resendOTP,
    verifyOTP
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validationMiddleware.js';
import {
    registerSchema,
    loginSchema,
    updateUserSchema,
    updatePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema,
    emailSchema,
    verifyOTPSchema,
    resendOTPSchema,
    resendVerificationSchema
} from '../validations/authValidation.js';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API quản lý xác thực và người dùng
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     description: Tạo một tài khoản người dùng mới và gửi email xác thực
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email của người dùng (phải là email hợp lệ và chưa được sử dụng)
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu (tối thiểu 8 ký tự, bao gồm ký tự thường, ký tự hoa, số và ký tự đặc biệt)
 *                 example: Password123!
 *               name:
 *                 type: string
 *                 description: Họ và tên của người dùng
 *                 example: Nguyễn Văn A
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại (không bắt buộc)
 *                 example: "0901234567"
 *     responses:
 *       201:
 *         description: Đăng ký thành công, email xác thực đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác thực tài khoản.
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Email này đã được đăng ký. Vui lòng sử dụng email khác.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     description: Xác thực người dùng và cấp token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               status: success
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 _id: 60d0fe4f5311236168a109ca
 *                 email: user@example.com
 *                 firstName: Nguyễn
 *                 lastName: Văn A
 *                 phoneNumber: "0901234567"
 *                 role: user
 *                 isEmailVerified: true
 *                 fullName: Nguyễn Văn A
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Đăng nhập không thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Email hoặc mật khẩu không chính xác.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất khỏi hệ thống
 *     description: Đưa token hiện tại vào blacklist và đăng xuất người dùng
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Đăng xuất thành công.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /api/auth/verify-token:
 *   get:
 *     summary: Xác thực token và lấy thông tin người dùng
 *     description: Kiểm tra xem token có hợp lệ không và trả về thông tin người dùng từ token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token hợp lệ, trả về thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: Nguyễn
 *                     lastName:
 *                       type: string
 *                       example: Văn A
 *                     role:
 *                       type: string
 *                       example: admin
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/verify-token', protect, (req, res) => {
    try {
        // req.user được thiết lập bởi middleware protect
        console.log('Token verification successful for user:', req.user._id);
        console.log('User role:', req.user.role);

        return res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Error in verify-token endpoint:', error);
        return res.status(500).json({
            success: false,
            error: 'Lỗi xác thực token'
        });
    }
});

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Làm mới token JWT
 *     description: Tạo một access token mới bằng refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token nhận được khi đăng nhập
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token mới đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                   description: JWT access token mới
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token mới (nếu cần)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Refresh token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Refresh token không hợp lệ hoặc đã hết hạn.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/refresh-token', validateBody(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     description: Trả về thông tin chi tiết của người dùng hiện tại dựa trên token JWT
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Không tìm thấy người dùng.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/updateme:
 *   patch:
 *     summary: Cập nhật thông tin người dùng
 *     description: Cập nhật thông tin cá nhân của người dùng hiện tại
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Tên của người dùng
 *                 example: Nguyễn
 *               lastName:
 *                 type: string
 *                 description: Họ của người dùng
 *                 example: Văn A
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại
 *                 example: "0901234567"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Không tìm thấy người dùng.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/updateme', protect, validateBody(updateUserSchema), updateMe);

/**
 * @swagger
 * /api/auth/updatepassword:
 *   patch:
 *     summary: Cập nhật mật khẩu
 *     description: Cập nhật mật khẩu của người dùng hiện tại sau khi xác thực mật khẩu hiện tại
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - passwordConfirm
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu hiện tại
 *                 example: OldPassword123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới (tối thiểu 8 ký tự, có ký tự hoa, ký tự thường, số và ký tự đặc biệt)
 *                 example: NewPassword123!
 *               passwordConfirm:
 *                 type: string
 *                 format: password
 *                 description: Xác nhận mật khẩu mới (phải trùng với mật khẩu mới)
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Cập nhật mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Cập nhật mật khẩu thành công.
 *                 token:
 *                   type: string
 *                   description: JWT token mới
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh token mới
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Mật khẩu hiện tại không chính xác
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Mật khẩu hiện tại không chính xác.
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Không tìm thấy người dùng.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/updatepassword', protect, validateBody(updatePasswordSchema), updatePassword);

/**
 * @swagger
 * /api/auth/forgotpassword:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu
 *     description: Gửi email chứa liên kết đặt lại mật khẩu đến email của người dùng
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email đặt lại mật khẩu đã được gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Không tìm thấy người dùng với email đã cung cấp
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Không tìm thấy người dùng với email này.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/forgotpassword', validateBody(forgotPasswordSchema), forgotPassword);

/**
 * @swagger
 * /api/auth/resetpassword/:tokenId:
 *   patch:
 *     summary: Đặt lại mật khẩu
 *     description: Đặt lại mật khẩu bằng token được gửi qua email
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: Token đặt lại mật khẩu nhận được qua email
 *         example: 7c6d9c5f7e8a5b6a4d3c2e1f
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - passwordConfirm
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới (tối thiểu 8 ký tự, có ký tự hoa, ký tự thường, số và ký tự đặc biệt)
 *                 example: NewPassword123!
 *               passwordConfirm:
 *                 type: string
 *                 format: password
 *                 description: Xác nhận mật khẩu mới (phải trùng với mật khẩu mới)
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/resetpassword/:tokenId', validateBody(resetPasswordSchema), resetPassword);

/**
 * @swagger
 * /api/auth/verifyemail/:tokenId:
 *   get:
 *     summary: Xác thực email
 *     description: Xác thực email của người dùng bằng token được gửi qua email
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: Token xác thực email nhận được qua email
 *         example: 7c6d9c5f7e8a5b6a4d3c2e1f
 *     responses:
 *       200:
 *         description: Email được xác thực thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Email của bạn đã được xác thực thành công.
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Token xác thực email không hợp lệ hoặc đã hết hạn.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/verifyemail/:tokenId', verifyEmail);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Gửi lại mã OTP
 *     description: Gửi lại mã OTP mới qua email để xác thực tài khoản
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký
 *                 example: user@example.com
 *               locale:
 *                 type: string
 *                 description: Ngôn ngữ cho email (vi hoặc en)
 *                 enum: [vi, en]
 *                 example: vi
 *     responses:
 *       200:
 *         description: Mã OTP mới đã được gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Mã OTP mới đã được gửi đến email của bạn
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Không tìm thấy người dùng với email đã cung cấp
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Không tìm thấy người dùng với email này.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/resend-otp', validateBody(resendOTPSchema), resendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Xác thực tài khoản bằng mã OTP
 *     description: Xác thực tài khoản người dùng bằng mã OTP được gửi qua email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 description: Mã OTP nhận được qua email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Xác thực thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Mã OTP không chính xác
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Mã OTP không chính xác.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/verify-otp', validateBody(verifyOTPSchema), verifyOTP);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Gửi lại email xác thực
 *     description: Gửi lại email xác thực tài khoản
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký
 *                 example: user@example.com
 *               locale:
 *                 type: string
 *                 description: Ngôn ngữ cho email (vi hoặc en)
 *                 enum: [vi, en]
 *                 example: vi
 *     responses:
 *       200:
 *         description: Email xác thực đã được gửi lại thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Email xác thực đã được gửi lại thành công
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: Không tìm thấy người dùng với email đã cung cấp
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Không tìm thấy người dùng với email này.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/resend-verification', validateBody(resendVerificationSchema), resendOTP);

// Thêm route đặc biệt để reset mật khẩu admin (chỉ sử dụng trong môi trường dev)
// Thêm vào sau các routes khác (trước khi export router)
// Chỉ sử dụng trong môi trường development
if (process.env.NODE_ENV !== 'production') {
    router.get('/emergency-reset-admin', async (req, res) => {
        try {
            console.log('EMERGENCY: Resetting superadmin password');
            const hashedPassword = await bcrypt.hash('Admin123!', 12);

            const result = await User.findOneAndUpdate(
                { email: 'superadmin@control.vn' },
                {
                    password: hashedPassword,
                    role: 'superadmin',
                    active: true,
                    isEmailVerified: true
                },
                { new: true }
            );

            console.log('Password reset result:', result ? 'Success' : 'Failed');

            res.json({
                success: !!result,
                message: result
                    ? 'Đã reset mật khẩu superadmin thành công. Mật khẩu mới: Admin123!'
                    : 'Không tìm thấy tài khoản superadmin'
            });
        } catch (error) {
            console.error('Error resetting superadmin password:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Lỗi khi reset mật khẩu'
            });
        }
    });

    // Route để tạo mới tài khoản superadmin nếu chưa tồn tại
    router.get('/emergency-create-admin', async (req, res) => {
        try {
            console.log('EMERGENCY: Creating superadmin account');

            // Kiểm tra đã tồn tại chưa
            const existingAdmin = await User.findOne({ email: 'superadmin@control.vn' });

            if (existingAdmin) {
                return res.json({
                    success: false,
                    message: 'Tài khoản superadmin đã tồn tại'
                });
            }

            // Tạo tài khoản mới
            const hashedPassword = await bcrypt.hash('Admin123!', 12);
            const newAdmin = await User.create({
                email: 'superadmin@control.vn',
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                role: 'superadmin',
                active: true,
                isEmailVerified: true
            });

            res.json({
                success: true,
                message: 'Đã tạo tài khoản superadmin thành công. Email: superadmin@control.vn, Mật khẩu: Admin123!',
                user: {
                    id: newAdmin._id,
                    email: newAdmin.email,
                    role: newAdmin.role
                }
            });
        } catch (error) {
            console.error('Error creating superadmin account:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Lỗi khi tạo tài khoản superadmin'
            });
        }
    });
}

export default router; 