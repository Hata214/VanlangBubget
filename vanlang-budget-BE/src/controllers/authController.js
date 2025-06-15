import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import ExpenseCategory from '../models/expenseCategoryModel.js';
import IncomeCategory from '../models/incomeCategoryModel.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import { createTokenPair, blacklistToken, verifyToken } from '../utils/jwtUtils.js';
import { sendOTPVerificationEmail, sendPasswordResetEmail, renderResetPasswordToken } from '../utils/emailUtils.js';
import { registerSchema } from '../validations/authValidation.js';
import mongoose from 'mongoose';

/**
 * Gửi JWT token, refresh token và thông tin người dùng
 */
const createSendToken = (user, statusCode, req, res) => {
    try {
        console.log('Creating tokens for user:', user ? user._id : 'unknown user');

        if (!user || !user._id) {
            console.error('Invalid user object passed to createSendToken');
            throw new Error('Invalid user object');
        }

        // Tạo cặp token: access token và refresh token
        const { accessToken, refreshToken } = createTokenPair(user._id);

        console.log('Created tokens - Access token:', accessToken ? `${accessToken.substring(0, 15)}...` : 'invalid');
        console.log('Created tokens - Refresh token:', refreshToken ? `${refreshToken.substring(0, 15)}...` : 'invalid');

        if (!accessToken || !refreshToken) {
            console.error('Failed to create valid tokens');
            throw new Error('Token creation failed');
        }

        // Cấu hình cookie cho refresh token
        const cookieOptions = {
            expires: new Date(
                Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 || 7 * 24 * 60 * 60 * 1000
            ),
            httpOnly: true, // Cookie không thể truy cập bởi JavaScript
            secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Chỉ gửi qua HTTPS
            sameSite: 'lax' // Bảo vệ CSRF
        };

        // Đặt cookie refresh token
        res.cookie('jwt', refreshToken, cookieOptions);

        // Tạo một bản sao của user để xử lý
        const userResponse = { ...user.toObject() };

        // Loại bỏ các trường nhạy cảm
        delete userResponse.password;
        delete userResponse.active;
        delete userResponse.passwordChangedAt;
        delete userResponse.passwordResetToken;
        delete userResponse.passwordResetExpires;
        delete userResponse.emailVerificationToken;
        delete userResponse.emailVerificationExpires;

        // Gửi access token không bao gồm tiền tố "Bearer "
        res.status(statusCode).json({
            status: 'success',
            token: accessToken,  // Frontend sẽ thêm 'Bearer ' khi cần
            refreshToken,
            user: userResponse,
        });
    } catch (error) {
        console.error('Error in createSendToken:', error);
        // Không throw thêm lỗi để tránh unhandled promise rejection
        res.status(500).json({
            status: 'error',
            message: 'Có lỗi xảy ra khi tạo token đăng nhập'
        });
    }
};

/**
 * @desc    Đăng ký người dùng mới
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
    try {
        // Validate dữ liệu đầu vào
        const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const validationErrors = {};
            error.details.forEach(detail => {
                const field = detail.path[0];
                validationErrors[field] = detail.message;
            });

            return res.status(400).json({
                status: 'error',
                message: 'Dữ liệu không hợp lệ',
                errors: validationErrors
            });
        }

        // Lấy thông tin từ request body đã được validate
        const { email, password, name, phoneNumber, locale } = value;

        // Phân tách name thành firstName và lastName
        let firstName = '', lastName = '';
        if (name) {
            const nameParts = name.trim().split(' ');
            if (nameParts.length > 1) {
                lastName = nameParts.pop(); // Lấy phần tử cuối cùng làm lastName
                firstName = nameParts.join(' '); // Ghép các phần còn lại làm firstName
            } else {
                firstName = name; // Nếu chỉ có một từ, gán cho firstName
            }
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('Email đã được sử dụng', 400));
        }

        // Tạo người dùng mới
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            role: 'user',
            isEmailVerified: false,
        });

        // Tạo các danh mục mặc định cho người dùng mới
        await Promise.all([
            ExpenseCategory.createDefaultCategories(user._id),
            IncomeCategory.createDefaultCategories(user._id),
        ]);

        // Tạo và gửi mã OTP qua email
        try {
            const otp = await sendOTPVerificationEmail(
                email,
                `${firstName} ${lastName}`,
                locale || 'vi' // Sử dụng locale nếu có, mặc định tiếng Việt
            );

            // Mã hóa OTP trước khi lưu vào cơ sở dữ liệu
            const hashedOTP = await bcrypt.hash(otp, 12);

            // Lưu thông tin OTP vào user
            user.emailVerificationToken = hashedOTP;
            user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 phút
            await user.save({ validateBeforeSave: false });
        } catch (error) {
            console.error('Không thể gửi email OTP:', error);
            // Không fail request nếu không gửi được email, vẫn cho phép đăng ký
        }

        // Tạo và gửi token
        createSendToken(user, 201, req, res);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đăng nhập người dùng
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
    try {
        // Thêm debug log chi tiết
        console.log('====== LOGIN ATTEMPT DEBUG ======');
        console.log('Request body:', JSON.stringify(req.body));
        console.log('Content-Type:', req.headers['content-type']);
        console.log('User-Agent:', req.headers['user-agent']);
        console.log('================================');

        const { email, password } = req.body;

        // Kiểm tra nếu dữ liệu không đúng định dạng
        if (typeof email !== 'string' || typeof password !== 'string') {
            console.error('Invalid data types:', {
                emailType: typeof email,
                passwordType: typeof password,
                email: email,
                passwordProvided: !!password
            });
            return next(new AppError('Dữ liệu không hợp lệ. Email và mật khẩu phải là chuỗi.', 400));
        }

        // Kiểm tra email và password có tồn tại không
        if (!email || !password) {
            console.log('Login error: Missing email or password');
            return next(new AppError('Vui lòng cung cấp email và mật khẩu', 400));
        }

        // Thêm log email trước khi tìm kiếm
        console.log(`Attempting to find user with email: ${email}`);
        console.log('MONGODB_URI:', process.env.MONGODB_URI);

        // Thử truy vấn trực tiếp từ collection users
        try {
            const rawUsers = await mongoose.connection.db.collection('users').find({ email }).toArray();
            console.log('Raw MongoDB query result:', JSON.stringify(rawUsers));
        } catch (dbError) {
            console.error('Error querying raw MongoDB:', dbError);
        }

        // Chuyển email về lowercase để tránh case sensitivity
        const normalizedEmail = email.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail }).select('+password +active');

        // Log kết quả tìm kiếm
        console.log('User search result:', user ? `Found (ID: ${user._id})` : 'Not found');

        // Xử lý đặc biệt cho tài khoản superadmin
        const isSuperAdmin = normalizedEmail === 'superadmin@control.vn';
        if (isSuperAdmin) {
            console.log('SUPERADMIN login attempt detected');
        }

        console.log('User search result:', user ? {
            id: user._id,
            email: user.email,
            role: user.role,
            active: user.active,
            passwordExists: !!user.password,
            passwordLength: user.password?.length
        } : 'No user found');

        // Kiểm tra người dùng và mật khẩu
        if (!user) {
            console.log('Login error: User not found with email:', email);
            return next(new AppError('Email hoặc mật khẩu không đúng', 401));
        }

        // Kiểm tra password
        console.log('Checking password...');
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        console.log('Password check result:', isPasswordCorrect ? 'Correct' : 'Incorrect');

        if (!isPasswordCorrect) {
            // // Thử với tài khoản superadmin trong môi trường phát triển
            // if (isSuperAdmin && process.env.NODE_ENV !== 'production' &&
            //     (password === 'Admin123!' || password === 'Superadmin123')) {
            //     console.log('Using emergency superadmin credential bypass');
            //     // Tiếp tục xử lý đăng nhập dưới đây
            // } else {
            //     console.log('Login error: Password incorrect for user:', email);
            //     return next(new AppError('Email hoặc mật khẩu không đúng', 401));
            // }
            console.log('Login error: Password incorrect for user:', email);
            return next(new AppError('Email hoặc mật khẩu không đúng', 401));
        }

        // Kiểm tra tài khoản có active không
        console.log('User active status check:', {
            active: user.active,
            activeType: typeof user.active,
            isActive: user.active === true
        });

        if (user.active === false) {
            // // Đặc biệt: Kích hoạt tài khoản superadmin nếu bị vô hiệu hóa
            // if (isSuperAdmin && process.env.NODE_ENV !== 'production') {
            //     console.log('Auto-activating superadmin account');
            //     user.active = true;
            //     await user.save({ validateBeforeSave: false });
            // } else {
            //     console.log('Login error: User account inactive');
            //     return next(new AppError('Tài khoản này đã bị vô hiệu hóa', 401));
            // }
            console.log('Login error: User account inactive');
            return next(new AppError('Tài khoản này đã bị vô hiệu hóa', 401));
        }

        // Tạo và gửi token
        console.log('Login successful, creating token for user:', user._id);
        console.log('====== END LOGIN ATTEMPT ======');
        createSendToken(user, 200, req, res);
    } catch (error) {
        console.error('Unexpected login error:', error);
        next(error);
    }
};

/**
 * @desc    Đăng xuất người dùng
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = (req, res, next) => {
    try {
        // Thêm token hiện tại vào blacklist
        if (req.token) {
            blacklistToken(req.token);
        }

        // Xóa cookie
        res.cookie('jwt', 'logged-out', {
            expires: new Date(Date.now() + 10 * 1000), // 10 giây
            httpOnly: true,
        });

        res.status(200).json({ status: 'success', message: 'Đăng xuất thành công' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Refresh token - Tạo token mới từ refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public (với refresh token)
 */
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return next(new AppError('Vui lòng cung cấp refresh token', 400));
        }

        try {
            // Xác minh refresh token
            const decoded = await verifyToken(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
            );

            // Lấy user từ token
            const user = await User.findById(decoded.id);
            if (!user) {
                return next(new AppError('Người dùng không còn tồn tại', 401));
            }

            // Thêm token cũ vào blacklist
            blacklistToken(refreshToken);

            // Tạo token mới
            createSendToken(user, 200, req, res);
        } catch (error) {
            return next(new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401));
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy thông tin người dùng hiện tại
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
    try {
        // req.user đã được set từ authMiddleware
        const user = await User.findById(req.user.id);

        if (!user) {
            return next(new AppError('Không tìm thấy người dùng', 404));
        }

        res.status(200).json({
            status: 'success',
            user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cập nhật thông tin người dùng
 * @route   PATCH /api/auth/update-me
 * @access  Private
 */
export const updateMe = async (req, res, next) => {
    try {
        // Không cho phép cập nhật mật khẩu qua route này
        if (req.body.password) {
            return next(
                new AppError(
                    'Route này không dùng để cập nhật mật khẩu. Vui lòng sử dụng /update-password',
                    400
                )
            );
        }

        // Lọc các trường không được phép cập nhật
        const filteredBody = {};
        const allowedFields = ['firstName', 'lastName', 'phoneNumber'];

        Object.keys(req.body).forEach(field => {
            if (allowedFields.includes(field)) {
                filteredBody[field] = req.body[field];
            }
        });

        // Cập nhật người dùng
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            filteredBody,
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            status: 'success',
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cập nhật mật khẩu
 * @route   PATCH /api/auth/update-password
 * @access  Private
 */
export const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!currentPassword || !newPassword) {
            return next(
                new AppError('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới', 400)
            );
        }

        // Lấy người dùng với password
        const user = await User.findById(req.user.id).select('+password');

        // Kiểm tra mật khẩu hiện tại
        if (!(await user.correctPassword(currentPassword, user.password))) {
            return next(new AppError('Mật khẩu hiện tại không đúng', 401));
        }

        // Thêm token hiện tại vào blacklist
        if (req.token) {
            blacklistToken(req.token);
        }

        // Cập nhật mật khẩu
        user.password = newPassword;
        await user.save();

        // Đăng nhập lại (gửi token mới)
        createSendToken(user, 200, req, res);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Quên mật khẩu - yêu cầu token đặt lại
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
    try {
        const { email, locale } = req.body;

        if (!email) {
            return next(new AppError('Vui lòng cung cấp email', 400));
        }

        // Tìm người dùng bằng email
        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError('Không tìm thấy người dùng với email này', 404));
        }

        // Xác định domain email của người dùng để xử lý phù hợp
        const domain = email.split('@')[1]?.toLowerCase();

        // Tạo token ngẫu nhiên - tăng độ dài lên 8-12 ký tự để bảo mật hơn
        const resetToken = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4);

        // Lưu token đã được mã hóa vào database
        user.passwordResetToken = await bcrypt.hash(resetToken, 12);
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 phút
        await user.save({ validateBeforeSave: false });

        // Tạo URL đặt lại mật khẩu với query parameter
        const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        // Biến môi trường để bỏ qua việc gửi email (thường dùng khi test)
        const skipEmailSending = process.env.SKIP_EMAIL_SENDING === 'true';

        if (skipEmailSending && process.env.NODE_ENV === 'development') {
            console.log('⚠️ Chế độ bỏ qua gửi email đang bật (SKIP_EMAIL_SENDING=true)');

            // Vẫn hiển thị token trong console
            renderResetPasswordToken(user.email, resetToken, resetURL);

            return res.status(200).json({
                status: 'success',
                message: 'Token đặt lại mật khẩu đã được tạo. Kiểm tra console server để lấy token.',
                devInfo: {
                    resetToken,
                    resetURL,
                    expires: '10 phút'
                }
            });
        }

        try {
            // Sử dụng hàm gửi email đặt lại mật khẩu
            await sendPasswordResetEmail(
                user.email,
                `${user.firstName} ${user.lastName}`,
                resetURL,
                locale || 'vi'
            );

            // Trả về thông báo thành công tùy theo domain
            let message = 'Đã gửi link đặt lại mật khẩu đến email của bạn';

            if (domain === 'gmail.com') {
                message = 'Đã gửi link đặt lại mật khẩu đến Gmail của bạn. Vui lòng kiểm tra cả hộp thư chính và thư mục Spam.';
            } else if (domain === 'yahoo.com') {
                message = 'Đã gửi link đặt lại mật khẩu đến Yahoo Mail của bạn. Vui lòng kiểm tra cả hộp thư chính và thư mục Spam.';
            } else if (domain === 'hotmail.com' || domain === 'outlook.com') {
                message = 'Đã gửi link đặt lại mật khẩu đến Outlook/Hotmail của bạn. Vui lòng kiểm tra cả hộp thư chính và thư mục Spam.';
            }

            res.status(200).json({
                status: 'success',
                message,
                ...(process.env.NODE_ENV === 'development' && {
                    devInfo: 'Kiểm tra console server để xem token và link xem trước email'
                })
            });
        } catch (emailError) {
            console.error('Lỗi khi gửi email đặt lại mật khẩu:', emailError);

            // Hiển thị token trong console và trả về token
            renderResetPasswordToken(user.email, resetToken, resetURL);

            return res.status(200).json({
                status: 'warning',
                message: 'Không thể gửi email, nhưng token đặt lại mật khẩu đã được tạo.',
                devInfo: {
                    note: 'Sử dụng thông tin trong console để đặt lại mật khẩu',
                    resetToken,
                    resetURL,
                    expires: '10 phút'
                }
            });
        }
    } catch (error) {
        console.error('Lỗi trong quá trình xử lý quên mật khẩu:', error);
        next(error);
    }
};

/**
 * @desc    Đặt lại mật khẩu với token
 * @route   POST /api/auth/resetpassword/:tokenId
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
    try {
        const { password, passwordConfirm } = req.body;
        const { tokenId } = req.params;

        if (!tokenId || !password) {
            return next(new AppError('Vui lòng cung cấp token và mật khẩu mới', 400));
        }

        if (!passwordConfirm) {
            return next(new AppError('Vui lòng xác nhận mật khẩu mới', 400));
        }

        if (password !== passwordConfirm) {
            return next(new AppError('Mật khẩu xác nhận không khớp', 400));
        }

        // Tìm người dùng với token chưa hết hạn và có passwordResetToken
        const users = await User.find({
            passwordResetExpires: { $gt: Date.now() },
            passwordResetToken: { $exists: true }
        });

        if (!users || users.length === 0) {
            return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 400));
        }

        // Tìm user có token khớp
        let matchedUser = null;
        for (const user of users) {
            const tokenMatches = await bcrypt.compare(tokenId, user.passwordResetToken);
            if (tokenMatches) {
                matchedUser = user;
                break;
            }
        }

        if (!matchedUser) {
            return next(new AppError('Token không hợp lệ', 400));
        }

        // Cập nhật mật khẩu và xóa token
        matchedUser.password = password;
        matchedUser.passwordResetToken = undefined;
        matchedUser.passwordResetExpires = undefined;
        await matchedUser.save();

        // Đăng nhập người dùng
        createSendToken(matchedUser, 200, req, res);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xác minh email
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
    try {
        const { tokenId } = req.params;

        if (!tokenId) {
            return next(new AppError('Vui lòng cung cấp token xác minh email', 400));
        }

        // Tìm người dùng với token chưa hết hạn
        const user = await User.findOne({
            emailVerificationExpires: { $gt: Date.now() },
        });

        if (!user) {
            return next(new AppError('Token không hợp lệ hoặc đã hết hạn', 400));
        }

        // Kiểm tra token hợp lệ
        const tokenMatches = await bcrypt.compare(tokenId, user.emailVerificationToken);
        if (!tokenMatches) {
            return next(new AppError('Token không hợp lệ', 400));
        }

        // Cập nhật trạng thái xác minh email và xóa token
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'Email đã được xác minh thành công',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Gửi lại mã OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res, next) => {
    try {
        const { email, locale } = req.body;

        if (!email) {
            return next(new AppError('Vui lòng cung cấp email', 400));
        }

        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError('Không tìm thấy người dùng với email này', 404));
        }

        if (user.isEmailVerified) {
            return next(new AppError('Email của bạn đã được xác thực', 400));
        }

        let otp;
        try {
            // Tạo và gửi OTP mới
            otp = await sendOTPVerificationEmail(
                email,
                `${user.firstName} ${user.lastName}`,
                locale || 'vi' // Sử dụng locale nếu có, mặc định tiếng Việt
            );
        } catch (emailError) {
            console.error('Lỗi khi gửi email OTP:', emailError);
            // Trả về lỗi cụ thể cho người dùng thay vì 500 chung chung
            return next(new AppError('Không thể gửi email OTP. Vui lòng thử lại sau hoặc kiểm tra lại cấu hình email.', 500));
        }

        // Mã hóa OTP mới
        const hashedOTP = await bcrypt.hash(otp, 12);

        // Cập nhật token xác thực
        user.emailVerificationToken = hashedOTP;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 phút

        try {
            await user.save({ validateBeforeSave: false });
        } catch (dbError) {
            console.error('Lỗi khi lưu OTP vào DB:', dbError);
            return next(new AppError('Có lỗi xảy ra khi lưu thông tin xác thực. Vui lòng thử lại.', 500));
        }

        // Luôn trả về thông báo thành công chuẩn
        res.status(200).json({
            status: 'success',
            message: 'Mã OTP mới đã được gửi đến email của bạn'
        });
    } catch (error) {
        // Bắt các lỗi không mong muốn khác
        console.error('Lỗi không xác định trong resendOTP:', error);
        next(error);
    }
};

/**
 * @desc    Xác thực OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return next(new AppError('Vui lòng cung cấp email và mã OTP', 400));
        }

        // Tìm người dùng với email
        const user = await User.findOne({
            email,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return next(new AppError('Email không tồn tại hoặc mã OTP đã hết hạn', 400));
        }

        // Kiểm tra OTP
        const isValidOTP = await bcrypt.compare(otp, user.emailVerificationToken);
        if (!isValidOTP) {
            return next(new AppError('Mã OTP không chính xác', 400));
        }

        // Cập nhật trạng thái xác minh email và xóa token
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        // Tạo và gửi token mới (đã xác thực)
        createSendToken(user, 200, req, res);
    } catch (error) {
        next(error);
    }
};
