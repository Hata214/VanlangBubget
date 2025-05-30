import { AppError } from './errorMiddleware.js';
import User from '../models/userModel.js';
import { verifyToken, isTokenBlacklisted } from '../utils/jwtUtils.js';
import logger from '../utils/logger.js';

/**
 * Helper để làm sạch token
 */
const cleanToken = (token) => {
    if (!token) return null;

    // Log token đầu vào (chỉ một phần để bảo mật)
    logger.debug('Token cleaning - Input token:', token.substring(0, 15) + '...');

    let cleanedToken = token;

    try {
        // Kiểm tra nếu token là JSON
        if (typeof token === 'string' && token.startsWith('{') && token.includes('accessToken')) {
            const parsedToken = JSON.parse(token);
            if (parsedToken.accessToken) {
                cleanedToken = parsedToken.accessToken;
                logger.debug('Token cleaning - Extracted access token from JSON');
            }
        }

        // Loại bỏ dấu ngoặc kép nếu có
        if (typeof cleanedToken === 'string' && cleanedToken.startsWith('"') && cleanedToken.endsWith('"')) {
            cleanedToken = cleanedToken.substring(1, cleanedToken.length - 1);
            logger.debug('Token cleaning - Removed quotes from token');
        }

        // Loại bỏ prefix Bearer nếu có
        if (typeof cleanedToken === 'string' && cleanedToken.startsWith('Bearer ')) {
            cleanedToken = cleanedToken.substring(7);
            logger.debug('Token cleaning - Removed Bearer prefix');
        }
    } catch (error) {
        logger.error('Token cleaning - Error processing token:', error.message);
        // Trả về token ban đầu nếu có lỗi xử lý
    }

    // Log token đầu ra (chỉ một phần để bảo mật)
    logger.debug('Token cleaning - Cleaned token:', cleanedToken.substring(0, 15) + '...');
    return cleanedToken;
};

/**
 * Middleware bảo vệ route yêu cầu đăng nhập
 * Kiểm tra JWT từ Authorization header
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        logger.debug('AUTH DEBUG - Headers:', Object.keys(req.headers).join(', '));

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
            logger.debug('AUTH DEBUG - Token extracted from Authorization header:', token ? `${token.substring(0, 15)}...` : 'invalid');
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
            logger.debug('AUTH DEBUG - Token extracted from cookie:', token ? `${token.substring(0, 15)}...` : 'invalid');
        }

        if (!token) {
            logger.warn('AUTH FAILURE - No token provided');
            return next(
                new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.', 401)
            );
        }

        // Làm sạch token
        const cleanedToken = cleanToken(token);

        if (!cleanedToken) {
            logger.warn('AUTH FAILURE - Token cleaning failed');
            return next(
                new AppError('Token không hợp lệ. Vui lòng đăng nhập lại.', 401)
            );
        }

        // Kiểm tra token blacklist
        const isBlacklisted = await isTokenBlacklisted(cleanedToken);
        if (isBlacklisted) {
            logger.warn('AUTH FAILURE - Token blacklisted');
            return next(
                new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401)
            );
        }

        try {
            let decoded;

            // Development mode: Handle mock tokens
            if (process.env.NODE_ENV === 'development' && cleanedToken.startsWith('mock_')) {
                logger.info('Development mode: Processing mock token');

                // Extract user ID from mock token (format: mock_userId_timestamp)
                const parts = cleanedToken.split('_');
                if (parts.length >= 2) {
                    const userId = parts[1];
                    decoded = { id: userId };
                    logger.info('Mock token decoded for user:', userId);
                } else {
                    throw new Error('Invalid mock token format');
                }
            } else {
                // Production mode: Verify JWT token
                decoded = await verifyToken(cleanedToken, process.env.JWT_SECRET);
                logger.info('Token verified successfully for user:', decoded.id);
            }

            // Tìm người dùng - THÊM +active +loginAttempts +lastLoginAttempt +blockedUntil vào select
            const currentUser = await User.findById(decoded.id).select('+active +loginAttempts +lastLoginAttempt +blockedUntil');

            if (!currentUser) {
                logger.warn('AUTH FAILURE - User not found with ID:', decoded.id);
                return next(
                    new AppError('Người dùng với token này không còn tồn tại.', 401)
                );
            }

            // Kiểm tra tài khoản bị khóa tạm thời
            if (currentUser.blockedUntil && new Date(currentUser.blockedUntil) > new Date()) {
                const remainingTime = Math.ceil((new Date(currentUser.blockedUntil) - new Date()) / 1000 / 60);
                logger.warn('AUTH FAILURE - Account temporarily blocked:', currentUser._id);
                return next(
                    new AppError(`Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${remainingTime} phút.`, 403)
                );
            }

            // Kiểm tra xem người dùng có thay đổi mật khẩu sau khi token được cấp không
            if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
                logger.warn('AUTH FAILURE - Password changed after token issued');
                return next(
                    new AppError('Người dùng đã thay đổi mật khẩu! Vui lòng đăng nhập lại.', 401)
                );
            }

            // Kiểm tra xem tài khoản có active không
            if (currentUser.active === false) {
                logger.warn('AUTH FAILURE - Account is not active');
                return next(
                    new AppError('Tài khoản này đã bị vô hiệu hóa.', 401)
                );
            }

            // Reset login attempts
            if (currentUser.loginAttempts > 0) {
                currentUser.loginAttempts = 0;
                await currentUser.save({ validateBeforeSave: false });
            }

            // Lưu thông tin người dùng vào request
            logger.info('AUTH SUCCESS - User authenticated:', currentUser._id);
            req.user = currentUser;
            // Lưu token vào request để có thể sử dụng trong logout
            req.token = cleanedToken;
            next();
        } catch (error) {
            logger.error('AUTH FAILURE - Token verification error:', error);
            return next(
                new AppError('Xác thực không thành công. Vui lòng đăng nhập lại.', 401)
            );
        }
    } catch (error) {
        logger.error('AUTH FAILURE - Unexpected error:', error);
        next(error);
    }
};

/**
 * Middleware giới hạn quyền truy cập
 * Chỉ cho phép vai trò cụ thể truy cập route
 */
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(
                new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.', 401)
            );
        }

        if (!roles.includes(req.user.role)) {
            logger.warn(`Access denied: User ${req.user._id} (${req.user.role}) attempted to access restricted route`);
            return next(
                new AppError('Bạn không có quyền thực hiện hành động này.', 403)
            );
        }

        logger.debug(`Access granted: User ${req.user._id} (${req.user.role}) accessed restricted route`);
        next();
    };
};

/**
 * Middleware kiểm tra owner của resource
 * Đảm bảo người dùng chỉ có thể truy cập dữ liệu của chính họ
 */
export const checkOwnership = (model, paramField = 'id', allowedRoles = ['admin']) => {
    return async (req, res, next) => {
        try {
            // Nếu người dùng có vai trò được phép, bỏ qua kiểm tra ownership
            if (req.user && allowedRoles.includes(req.user.role)) {
                logger.debug(`Ownership check bypassed for user ${req.user._id} with role ${req.user.role}`);
                return next();
            }

            // Lấy ID từ param
            const resourceId = req.params[paramField];

            // Lấy resource từ database
            const resource = await model.findById(resourceId);

            // Kiểm tra xem resource có tồn tại không
            if (!resource) {
                return next(new AppError('Không tìm thấy dữ liệu với ID này.', 404));
            }

            // Kiểm tra quyền sở hữu
            const hasOwnership = resource.userId && req.user &&
                resource.userId.toString() === req.user.id;

            if (!hasOwnership) {
                logger.warn(`Ownership denied: User ${req.user?._id} attempted to access resource ${resourceId}`);
                return next(
                    new AppError('Bạn không có quyền truy cập dữ liệu này.', 403)
                );
            }

            // Lưu resource vào request để sử dụng ở controller
            req.resource = resource;
            logger.debug(`Ownership granted: User ${req.user._id} accessed resource ${resourceId}`);
            next();
        } catch (error) {
            logger.error('Ownership check error:', error);
            next(error);
        }
    };
};

/**
 * Middleware tùy chọn kiểm tra authentication
 * Nếu có token, xác minh và đính kèm user vào request
 * Nếu không có token, vẫn tiếp tục với req.user = null
 */
export const optionalAuth = async (req, res, next) => {
    try {
        // Lấy token từ header hoặc cookie
        let token;

        // Giảm thiểu log để tránh vòng lặp vô hạn
        // console.log('Optional Auth - Authorization header:', req.headers.authorization);

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
            // Giảm thiểu log
            // console.log('Optional Auth - Token extracted from header:', token ? `${token.substring(0, 15)}...` : 'invalid');
        } else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
            // Giảm thiểu log
            // console.log('Optional Auth - Token extracted from cookie:', token ? `${token.substring(0, 15)}...` : 'invalid');
        }

        // Nếu không có token, tiếp tục và đặt req.user = null
        if (!token) {
            // console.log('Optional Auth - No token provided, continuing as guest');
            req.user = null;
            return next();
        }

        // Đặt xác thực tối thiểu cho API để tránh vòng lặp vô hạn
        if (req.path.includes('/investments') || req.path.startsWith('/api/')) {
            // Đánh dấu request này là guest mà không xử lý token để tránh vòng lặp
            req.user = null;
            req.isGuestRequest = true;
            return next();
        }

        // Làm sạch token
        const cleanedToken = cleanToken(token);
        if (!cleanedToken) {
            // console.log('Optional Auth - Token cleaning failed, continuing as guest');
            req.user = null;
            return next();
        }

        try {
            // Xác minh token
            const decoded = await verifyToken(cleanedToken, process.env.JWT_SECRET);
            // console.log('Optional Auth - Token verified successfully for user:', decoded.id);

            // Kiểm tra xem người dùng có tồn tại hay không - THÊM +active vào query
            const currentUser = await User.findById(decoded.id).select('+active');

            // Giảm thiểu log
            // console.log('Optional Auth - User found:', currentUser ? {
            //     id: currentUser._id,
            //     active: currentUser.active,
            //     isActive: currentUser.active === true
            // } : 'User not found');

            if (!currentUser) {
                // console.log('Optional Auth - User not found');
                req.user = null;
                return next();
            }

            // Kiểm tra trạng thái active
            if (currentUser.active === false) {
                // console.log('Optional Auth - User account inactive');
                req.user = null;
                return next();
            }

            // Kiểm tra xem người dùng có thay đổi mật khẩu sau khi token được cấp không
            if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
                // console.log('Optional Auth - Password changed after token issued');
                req.user = null;
                return next();
            }

            // Đặt user vào request
            req.user = currentUser;
            req.token = cleanedToken;
            // console.log('Optional Auth - User attached to request:', currentUser._id);
            return next();
        } catch (error) {
            // Nếu có lỗi với token, tiếp tục với req.user = null
            // console.error('Optional Auth - Token verification error:', error.message);
            req.user = null;
            return next();
        }
    } catch (error) {
        // console.error('Optional Auth - Unexpected error:', error);
        req.user = null;
        next(error);
    }
};

/**
 * Middleware xác thực 2 yếu tố
 * Kiểm tra xem người dùng đã kích hoạt và xác minh 2FA hay chưa
 */
export const require2FA = async (req, res, next) => {
    try {
        // Đảm bảo người dùng đã đăng nhập
        if (!req.user) {
            return next(
                new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.', 401)
            );
        }

        // Kiểm tra xem người dùng đã bật 2FA và đã xác minh trong phiên này chưa
        if (req.user.twoFactorEnabled && !req.user.twoFactorVerified) {
            logger.warn('2FA required but not verified for user:', req.user._id);
            return next(
                new AppError('Yêu cầu xác thực hai yếu tố. Vui lòng hoàn tất xác thực.', 403, {
                    requires2FA: true
                })
            );
        }

        logger.debug('2FA check passed for user:', req.user._id);
        next();
    } catch (error) {
        logger.error('2FA check error:', error);
        next(error);
    }
}; 