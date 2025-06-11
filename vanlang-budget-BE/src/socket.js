import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/userModel.js';
import socketManager from './utils/socketManager.js';
import logger from './utils/logger.js';

let io;

export const getSocketIO = () => {
    return io;
};

/**
 * Khởi tạo Socket.IO server
 * @param {Object} server - HTTP server instance
 */
export const initializeSocket = (server) => {
    // Lấy danh sách origin từ biến môi trường hoặc sử dụng mặc định
    const productionOriginsFromEnv = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
    const defaultProductionOrigins = ['https://vanlang-budget-fe.vercel.app']; // Giữ lại một giá trị mặc định an toàn

    const socketAllowedOrigins = process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'] // Thêm 127.0.0.1 cho dev
        : productionOriginsFromEnv
            ? productionOriginsFromEnv.split(',').map(o => o.trim())
            : defaultProductionOrigins;

    logger.info('Socket.IO Allowed Origins on Startup:', socketAllowedOrigins);

    io = new Server(server, {
        cors: {
            origin: function (origin, callback) {
                // Cho phép kết nối không có origin (ví dụ: từ mobile, Postman)
                // Hoặc nếu origin nằm trong danh sách socketAllowedOrigins
                if (!origin || socketAllowedOrigins.includes(origin)) {
                    logger.debug(`Socket connection from origin ${origin} allowed.`);
                    return callback(null, true);
                }

                logger.error(`Socket connection from unauthorized origin: ${origin}. Allowed: ${socketAllowedOrigins.join(', ')}`);
                return callback(new Error('Socket.IO: Not allowed by CORS'), false);
            },
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Authorization', 'Content-Type']
        },
        transports: ['websocket', 'polling'],
        allowUpgrades: true,
        pingTimeout: 30000,
        pingInterval: 25000
    });

    // Xác thực middleware
    io.use(async (socket, next) => {
        try {
            // Lấy token từ headers hoặc auth object
            let token = socket.handshake.auth.token;

            // Fallback đến headers nếu không có trong auth
            if (!token && socket.handshake.headers.authorization) {
                token = socket.handshake.headers.authorization.split(' ')[1];
            }

            // Log để debug
            logger.debug('Socket auth - Raw token:', token ? `${token.substring(0, 15)}...` : 'No token');

            if (!token) {
                logger.error('Socket authentication failed: No token provided');
                return next(new Error('Not authorized'));
            }

            // Xử lý token không chuẩn trước khi verify
            try {
                // Kiểm tra nếu token là chuỗi JSON
                if (typeof token === 'string' && token.startsWith('{') && token.includes('accessToken')) {
                    const parsedToken = JSON.parse(token);
                    if (parsedToken.accessToken) {
                        token = parsedToken.accessToken;
                        logger.debug('Socket auth - Using parsed access token');
                    }
                }

                // Loại bỏ dấu ngoặc kép nếu có
                if (typeof token === 'string' && token.startsWith('"') && token.endsWith('"')) {
                    token = token.substring(1, token.length - 1);
                    logger.debug('Socket auth - Removed quotes from token');
                }
            } catch (parseError) {
                logger.error('Socket auth - Error parsing token:', parseError);
                // Tiếp tục với token nguyên bản
            }

            // Xác thực token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            logger.debug('Socket auth - Token verified for user ID:', decoded.id);

            // Kiểm tra user có tồn tại không
            const user = await User.findById(decoded.id);
            if (!user) {
                logger.error('Socket auth - User not found:', decoded.id);
                return next(new Error('User not found'));
            }

            // Kiểm tra user có active không
            if (user.active === false) {
                logger.error('Socket auth - User account inactive:', decoded.id);
                return next(new Error('User account inactive'));
            }

            // Lưu thông tin user vào socket
            socket.user = {
                id: user._id.toString(),
                name: user.fullName || `${user.firstName} ${user.lastName}`,
                email: user.email
            };

            logger.info('Socket auth - Successful authentication for user:', socket.user.id);
            next();
        } catch (error) {
            logger.error('Socket authentication error:', error.message);
            next(new Error('Authentication error'));
        }
    });

    // Khởi tạo socketManager với io instance
    socketManager.init(io);

    // Xử lý kết nối WebSocket
    io.on('connection', (socket) => {
        // Đăng ký nhận thông báo biến động giá cho một số loại tiền điện tử
        socket.on('subscribe-price-alerts', (symbols) => {
            if (Array.isArray(symbols)) {
                symbols.forEach(symbol => {
                    socket.join(symbol);
                });
                logger.info(`Client ${socket.id} subscribed to price alerts for: ${symbols.join(', ')}`);
            }
        });
    });

    logger.info('Socket.IO server initialized');
    return io;
};

// Tạo alias cho hàm initializeSocket để file server.js có thể import
export const initSocket = initializeSocket;

/**
 * Gửi thông báo đến một người dùng cụ thể
 * @param {string} userId - ID của người dùng nhận thông báo
 * @param {string} event - Tên sự kiện
 * @param {Object} data - Dữ liệu gửi đi
 */
export const sendToUser = (userId, event, data) => {
    if (io) {
        io.to(userId).emit(event, data);
    }
};

/**
 * Gửi thông báo đến tất cả người dùng
 * @param {string} event - Tên sự kiện
 * @param {Object} data - Dữ liệu gửi đi
 */
export const sendToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

/**
 * Gửi thông báo đến một nhóm người dùng
 * @param {Array<string>} userIds - Danh sách ID của người dùng nhận thông báo
 * @param {string} event - Tên sự kiện
 * @param {Object} data - Dữ liệu gửi đi
 */
export const sendToUsers = (userIds, event, data) => {
    if (io && Array.isArray(userIds)) {
        userIds.forEach(userId => {
            io.to(userId).emit(event, data);
        });
    }
};

/**
 * Gửi thông báo qua socket
 * @param {string} userId - ID của người dùng nhận thông báo
 * @param {string} event - Tên sự kiện
 * @param {Object} data - Dữ liệu gửi đi
 */
export const emit = (userId, event, data) => {
    try {
        if (socketManager.io) {
            socketManager.io.to(userId).emit(event, data);
            logger.debug(`Emitted ${event} to user ${userId}`);
        } else {
            logger.error('Socket.IO not initialized');
        }
    } catch (error) {
        logger.error(`Error emitting ${event}:`, error);
    }
};

// Theo dõi giá tiền điện tử để gửi thông báo khi có biến động lớn
let lastCryptoPrices = null;

export const checkPriceFluctuation = (io, prices) => {
    if (!lastCryptoPrices) {
        lastCryptoPrices = prices;
        return;
    }

    for (const current of prices) {
        const last = lastCryptoPrices.find(p => p.symbol === current.symbol);
        if (!last) continue;

        const changePercent = Math.abs(current.usd - last.usd) / last.usd * 100;

        if (changePercent >= 5) {
            // Gửi thông báo cho tất cả người dùng đăng ký nhận thông báo cho symbol này
            io.to(current.symbol).emit('price-alert', {
                symbol: current.symbol,
                name: current.name,
                changePercent: changePercent.toFixed(2),
                oldPrice: last.usd,
                newPrice: current.usd,
                timestamp: new Date()
            });

            logger.info(`Crypto alert: ${current.name} changed by ${changePercent.toFixed(2)}%`);
        }
    }

    // Cập nhật giá cũ
    lastCryptoPrices = prices;
};

export { socketManager };
