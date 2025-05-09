import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { AppError } from '../middlewares/errorMiddleware.js';

// Lưu trữ các token đã bị vô hiệu hóa (blacklist)
const tokenBlacklist = new Set();

/**
 * Tạo JWT token
 * @param {Object} payload - Dữ liệu cần mã hóa trong token
 * @param {string} secret - Secret key để ký token
 * @param {string} expiresIn - Thời gian hết hạn của token
 * @returns {string} - JWT token
 */
export const signToken = (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Xác minh JWT token
 * @param {string} token - JWT token cần xác minh
 * @param {string} secret - Secret key để xác minh chữ ký
 * @returns {Promise<object>} - Dữ liệu được giải mã từ token
 */
export const verifyToken = async (token, secret) => {
    try {
        // Kiểm tra token trong blacklist
        if (tokenBlacklist.has(token)) {
            throw new AppError('Token đã bị vô hiệu hóa hoặc đã đăng xuất', 401);
        }

        // Xác minh token
        const decoded = await promisify(jwt.verify)(token, secret);
        return decoded;
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new AppError('Token không hợp lệ. Vui lòng đăng nhập lại', 401);
        }
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token đã hết hạn. Vui lòng đăng nhập lại', 401);
        }
        throw error;
    }
};

/**
 * Tạo cặp access token và refresh token
 * @param {string} userId - ID của người dùng
 * @returns {Object} - Đối tượng chứa access token và refresh token
 */
export const createTokenPair = (userId) => {
    try {
        // Kiểm tra userId
        if (!userId) {
            console.error('createTokenPair called with invalid userId:', userId);
            throw new Error('User ID is required to create tokens');
        }

        // Kiểm tra JWT secrets
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET environment variable is not defined');
            throw new Error('JWT configuration error');
        }

        // Debug environment variables
        console.log('JWT config check:', {
            secretDefined: !!process.env.JWT_SECRET,
            refreshSecretDefined: !!process.env.JWT_REFRESH_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        });

        // Access token có thời hạn ngắn
        const accessToken = signToken(
            { id: userId },
            process.env.JWT_SECRET,
            process.env.JWT_EXPIRES_IN || '24h'
        );

        // Refresh token có thời hạn dài hơn
        const refreshToken = signToken(
            { id: userId },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        );

        if (!accessToken || !refreshToken) {
            console.error('Failed to create tokens');
            throw new Error('Token creation failed');
        }

        return {
            accessToken,
            refreshToken
        };
    } catch (error) {
        console.error('Error in createTokenPair:', error);
        // Throw the error để caller có thể xử lý
        throw new Error(`Token creation failed: ${error.message}`);
    }
};

/**
 * Thêm token vào blacklist khi đăng xuất hoặc làm mới token
 * @param {string} token - Token cần thêm vào blacklist
 */
export const blacklistToken = (token) => {
    tokenBlacklist.add(token);

    // Định kỳ xóa các token khỏi blacklist (chức năng này lẽ ra nên dùng Redis trong môi trường production)
    // Đây chỉ là giải pháp tạm thời để tránh rò rỉ bộ nhớ
    setTimeout(() => {
        tokenBlacklist.delete(token);
    }, 24 * 60 * 60 * 1000); // Xóa sau 24 giờ
};

/**
 * Kiểm tra xem token có trong blacklist không
 * @param {string} token - Token cần kiểm tra
 * @returns {boolean} - true nếu token có trong blacklist
 */
export const isTokenBlacklisted = (token) => {
    return tokenBlacklist.has(token);
}; 