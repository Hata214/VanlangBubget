import socketManager from '../utils/socketManager.js';
import logger from '../utils/logger.js';
import { verifyToken, isTokenBlacklisted } from '../utils/jwtUtils.js';
import User from '../models/userModel.js';

/**
 * Middleware gắn socketManager vào request object
 */
export const socketMiddleware = (req, res, next) => {
    req.socketManager = socketManager;
    next();
};

/**
 * Middleware xác thực Socket.IO
 * Đảm bảo chỉ người dùng đã đăng nhập mới có thể kết nối
 */
export const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token ||
            socket.handshake.headers.authorization?.split(' ')[1] ||
            socket.handshake.query.token;

        // Cho phép kết nối nếu không có token 
        // và đặt user là null để tránh vòng lặp
        if (!token) {
            socket.user = null;
            return next();
        }

        // Giới hạn số lần thử kết nối
        if (socket.handshake._reconnectionAttempts > 3) {
            return next(new Error('Đã vượt quá số lần thử kết nối lại. Vui lòng tải lại trang.'));
        }

        try {
            // Xác minh token
            const decoded = await verifyToken(token, process.env.JWT_SECRET);

            // Tìm người dùng
            const user = await User.findById(decoded.id).select('+active');

            if (!user || user.active === false) {
                socket.user = null;
                return next();
            }

            // Lưu thông tin người dùng vào socket
            socket.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            };

            // Gắn socket vào phòng dựa trên userId và department
            socket.join(`user:${user._id}`);

            if (user.department) {
                socket.join(`department:${user.department}`);
            }

            if (user.role === 'admin') {
                socket.join('admins');
            }

            next();
        } catch (error) {
            socket.user = null;
            next();
        }
    } catch (error) {
        socket.user = null;
        next();
    }
};

/**
 * Middleware giới hạn kết nối Socket.IO
 * Đảm bảo không có quá nhiều kết nối từ một địa chỉ IP
 */
export const socketRateLimiter = (maxConnections = 10, timeWindow = 60000) => {
    const connections = new Map();

    const cleanup = () => {
        const now = Date.now();
        for (const [ip, data] of connections.entries()) {
            if (now - data.lastConnection > timeWindow) {
                connections.delete(ip);
            }
        }
    };

    // Chạy cleanup mỗi phút
    setInterval(cleanup, timeWindow);

    return (socket, next) => {
        const ip = socket.handshake.address;

        if (!connections.has(ip)) {
            connections.set(ip, {
                count: 1,
                lastConnection: Date.now()
            });
            return next();
        }

        const ipData = connections.get(ip);
        const now = Date.now();

        // Reset nếu đã quá thời gian cửa sổ
        if (now - ipData.lastConnection > timeWindow) {
            ipData.count = 1;
            ipData.lastConnection = now;
            return next();
        }

        // Kiểm tra giới hạn kết nối
        if (ipData.count >= maxConnections) {
            return next(new Error('Quá nhiều kết nối. Vui lòng thử lại sau.'));
        }

        // Tăng số lượng kết nối
        ipData.count += 1;
        ipData.lastConnection = now;
        next();
    };
};