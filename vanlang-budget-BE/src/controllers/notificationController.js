import Notification, { AdminNotification } from '../models/Notification.js';
import User from '../models/userModel.js';
import { emailService } from '../services/emailService.js';
import socketManager from '../utils/socketManager.js';
import logger from '../utils/logger.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import Income from '../models/incomeModel.js';
import Expense from '../models/expenseModel.js';

/**
 * @desc    Lấy tất cả thông báo của người dùng
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            status: 'success',
            results: notifications.length,
            data: notifications,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy số lượng thông báo chưa đọc
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await Notification.countDocuments({
            user: userId,
            read: false
        });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        logger.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy số lượng thông báo chưa đọc'
        });
    }
};

/**
 * @desc    Đánh dấu một thông báo là đã đọc
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return next(new AppError('Không tìm thấy thông báo', 404));
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({
            status: 'success',
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Đánh dấu tất cả thông báo là đã đọc
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Tất cả thông báo đã được đánh dấu là đã đọc',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xóa một thông báo
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return next(new AppError('Không tìm thấy thông báo', 404));
        }

        if (notification.user.toString() !== req.user._id.toString()) {
            return next(new AppError('Bạn không có quyền xóa thông báo này', 403));
        }

        await Notification.deleteOne({ _id: notification._id });

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Xóa tất cả thông báo đã đọc
 * @route   DELETE /api/notifications/read
 * @access  Private
 */
export const deleteReadNotifications = async (req, res, next) => {
    try {
        await Notification.deleteMany({
            user: req.user._id,
            read: true,
        });

        res.status(204).json({
            status: 'success',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Tạo thông báo mới (chỉ sử dụng nội bộ)
 * @access  Private
 */
export const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, link, emailNotification } = req.body;

        // Kiểm tra user có tồn tại không
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Lấy ngôn ngữ của người dùng
        const userLanguage = user.language || 'vi';

        // Tạo thông báo mới
        const notification = new Notification({
            user: userId,
            title,
            message,
            type,
            link,
            read: false
        });

        await notification.save();

        // Gửi thông báo realtime qua socket
        socketManager.to(userId).emit('notification', notification);

        // Kiểm tra cài đặt thông báo của người dùng
        const shouldSendEmail = emailNotification &&
            user.settings?.emailNotifications &&
            user.settings?.notificationTypes?.[type.toLowerCase()];

        // Gửi email thông báo nếu được yêu cầu và user đã bật thông báo email
        if (shouldSendEmail) {
            await emailService.sendNotificationEmail({
                email: user.email,
                name: user.fullName || user.firstName,
                title,
                message,
                actionUrl: link ? `${process.env.FRONTEND_URL}${link}` : null,
                actionText: userLanguage === 'vi' ? 'Xem chi tiết' : 'View details',
                language: userLanguage
            });
        }

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        logger.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thông báo'
        });
    }
};

/**
 * @desc    Cập nhật cài đặt thông báo của người dùng
 * @route   PATCH /api/notifications/settings
 * @access  Private
 */
export const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        logger.info('Updating notification settings for user:', userId);
        logger.info('Received settings:', req.body);

        const {
            emailNotifications,
            pushNotifications,
            inAppNotifications,
            emailFrequency,
            notificationTypes
        } = req.body;

        // Cập nhật cài đặt người dùng
        const updateData = {};

        if (emailNotifications !== undefined) {
            updateData['settings.emailNotifications'] = emailNotifications;
        }

        if (pushNotifications !== undefined) {
            updateData['settings.pushNotifications'] = pushNotifications;
        }

        if (inAppNotifications !== undefined) {
            updateData['settings.inAppNotifications'] = inAppNotifications;
        }

        if (emailFrequency) {
            updateData['settings.emailFrequency'] = emailFrequency;
        }

        if (notificationTypes) {
            if (notificationTypes.expense !== undefined) {
                updateData['settings.notificationTypes.expense'] = notificationTypes.expense;
            }
            if (notificationTypes.income !== undefined) {
                updateData['settings.notificationTypes.income'] = notificationTypes.income;
            }
            if (notificationTypes.budget !== undefined) {
                updateData['settings.notificationTypes.budget'] = notificationTypes.budget;
            }
            if (notificationTypes.system !== undefined) {
                updateData['settings.notificationTypes.system'] = notificationTypes.system;
            }
        }

        logger.info('Update data:', updateData);

        // Đảm bảo có field cần cập nhật
        if (Object.keys(updateData).length === 0) {
            logger.info('No fields to update');
            return res.status(400).json({
                success: false,
                message: 'Không có trường nào được cập nhật'
            });
        }

        // Tìm và cập nhật user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            logger.info('User not found');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        logger.info('Settings updated successfully:', updatedUser.settings);

        // Trả về cài đặt thông báo đã cập nhật
        res.status(200).json({
            success: true,
            data: updatedUser.settings || {}
        });
    } catch (error) {
        logger.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cài đặt thông báo'
        });
    }
};

/**
 * @desc    Gửi thông báo đến nhiều người dùng
 * @route   POST /api/notifications/bulk
 * @access  Private
 */
export const sendBulkNotifications = async (req, res) => {
    try {
        const { userIds, title, message, type, link, emailNotification } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người dùng không hợp lệ'
            });
        }

        const users = await User.find({ _id: { $in: userIds } });

        const notifications = [];
        const emailPromises = [];

        // Tạo và lưu thông báo cho mỗi người dùng
        for (const user of users) {
            const notification = new Notification({
                user: user._id,
                title,
                message,
                type,
                link,
                read: false
            });

            await notification.save();
            notifications.push(notification);

            // Gửi thông báo qua socket
            socketManager.to(user._id.toString()).emit('notification', notification);

            // Lấy ngôn ngữ của người dùng
            const userLanguage = user.language || 'vi';

            // Kiểm tra cài đặt thông báo của người dùng
            const shouldSendEmail = emailNotification &&
                user.settings?.emailNotifications &&
                user.settings?.notificationTypes?.[type.toLowerCase()];

            // Nếu cần gửi email và user đã bật thông báo email
            if (shouldSendEmail) {
                emailPromises.push(
                    emailService.sendNotificationEmail({
                        email: user.email,
                        name: user.fullName || user.firstName,
                        title,
                        message,
                        actionUrl: link ? `${process.env.FRONTEND_URL}${link}` : null,
                        actionText: userLanguage === 'vi' ? 'Xem chi tiết' : 'View details',
                        language: userLanguage
                    })
                );
            }
        }

        // Gửi email nếu có
        if (emailPromises.length > 0) {
            await Promise.allSettled(emailPromises);
        }

        res.status(201).json({
            success: true,
            data: {
                count: notifications.length,
                message: `Đã gửi ${notifications.length} thông báo thành công`
            }
        });
    } catch (error) {
        logger.error('Error sending bulk notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi thông báo hàng loạt'
        });
    }
};

/**
 * @desc    Lấy cài đặt thông báo của người dùng
 * @route   GET /api/notifications/settings
 * @access  Private
 */
export const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        logger.info("Fetching notification settings for user:", userId);

        const user = await User.findById(userId).select('settings');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        logger.info("User settings found:", user.settings);

        // Trả về thông tin cài đặt thông báo của user
        res.status(200).json({
            success: true,
            data: user.settings || {}
        });
    } catch (error) {
        logger.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cài đặt thông báo'
        });
    }
};

/**
 * @desc    Kiểm tra số dư âm và gửi thông báo
 * @route   POST /api/notifications/check-balance
 * @access  Private
 */
export const checkNegativeBalance = async (req, res, next) => {
    try {
        // Tính tổng thu nhập của người dùng
        const incomeResult = await Income.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;

        // Tính tổng chi tiêu của người dùng
        const expenseResult = await Expense.aggregate([
            { $match: { userId: req.user._id } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;

        // Tính số dư
        const balance = totalIncome - totalExpense;

        let notification = null;

        // Nếu số dư âm, tạo thông báo
        if (balance < 0) {
            notification = await Notification.createNegativeBalanceAlert(req.user._id, balance);

            // Gửi thông báo qua socket nếu có
            if (req.socketManager) {
                req.socketManager.sendToUser(req.user._id, 'notification', {
                    message: 'Cảnh báo số dư âm',
                    notification
                });
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                balance,
                isNegative: balance < 0,
                notification
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Lấy tất cả thông báo của tất cả người dùng (Admin only)
 * @route   GET /api/admin/notifications
 * @access  Private (Admin)
 */
export const getAdminNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Tạo query filter
        let matchQuery = {};

        if (search) {
            matchQuery = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { message: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Lấy admin notifications từ collection adminnotifications
        const notifications = await AdminNotification.find(matchQuery)
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        // Đếm tổng số admin notifications
        const totalNotifications = await AdminNotification.countDocuments(matchQuery);
        const totalPages = Math.ceil(totalNotifications / limitNum);

        res.status(200).json({
            status: 'success',
            results: notifications.length,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalNotifications,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            data: {
                notifications,
                totalPages
            }
        });
    } catch (error) {
        logger.error('Error fetching admin notifications:', error);
        next(error);
    }
};

/**
 * @desc    Tạo thông báo mới từ admin
 * @route   POST /api/admin/notifications
 * @access  Private (Admin)
 */
export const createAdminNotification = async (req, res, next) => {
    try {
        const { title, message, type = 'info', sentTo } = req.body;

        // Validation
        if (!title || !message) {
            logger.error('Missing title or message:', { title, message });
            return res.status(400).json({
                status: 'error',
                message: 'Tiêu đề và nội dung thông báo là bắt buộc'
            });
        }

        logger.info('Creating admin notification:', { title, message, type, sentTo });

        let targetUsers = [];

        // Xử lý người nhận
        if (sentTo === 'all') {
            // Gửi đến tất cả người dùng (bỏ điều kiện status vì có thể không có field này)
            targetUsers = await User.find({}).select('_id');
            logger.info('Found users for "all":', targetUsers.length);
        } else if (sentTo === 'admin') {
            // Gửi đến tất cả admin
            targetUsers = await User.find({
                role: { $in: ['admin', 'superadmin'] }
            }).select('_id');
            logger.info('Found admins:', targetUsers.length);
        } else if (Array.isArray(sentTo)) {
            // Gửi đến danh sách email cụ thể
            targetUsers = await User.find({
                email: { $in: sentTo }
            }).select('_id');
            logger.info('Found users by email:', targetUsers.length);
        } else {
            logger.error('Invalid sentTo value:', sentTo);
            return res.status(400).json({
                status: 'error',
                message: 'Người nhận không hợp lệ'
            });
        }

        if (targetUsers.length === 0) {
            logger.error('No users found for notification');
            return res.status(400).json({
                status: 'error',
                message: 'Không tìm thấy người dùng nào để gửi thông báo'
            });
        }

        // Chuẩn bị danh sách recipients
        const recipients = targetUsers.map(user => ({
            userId: user._id,
            email: user.email,
            delivered: false
        }));

        // Tạo admin notification
        const adminNotification = new AdminNotification({
            title,
            message,
            type,
            sentTo,
            sentCount: targetUsers.length,
            createdBy: req.user.id,
            recipients
        });

        await adminNotification.save();
        logger.info('Admin notification saved to adminnotifications collection:', adminNotification._id);

        // Tạo thông báo cho từng người dùng trong collection notifications
        const notifications = [];

        for (const user of targetUsers) {
            const notification = new Notification({
                user: user._id,
                title,
                message,
                type,
                read: false,
                createdBy: req.user.id // Lưu thông tin admin tạo thông báo
            });

            await notification.save();
            notifications.push(notification);

            // Gửi thông báo realtime qua socket nếu có
            if (req.socketManager) {
                req.socketManager.to(user._id.toString()).emit('notification', notification);
            }
        }

        res.status(201).json({
            status: 'success',
            data: {
                message: `Đã tạo và gửi ${notifications.length} thông báo thành công`,
                count: notifications.length,
                sentTo: sentTo
            }
        });
    } catch (error) {
        logger.error('Error creating admin notification:', error);
        next(error);
    }
};

/**
 * @desc    Xóa một thông báo cụ thể (Admin only)
 * @route   DELETE /api/admin/notifications/:id
 * @access  Private (Admin)
 */
export const deleteAdminNotification = async (req, res, next) => {
    try {
        const notificationId = req.params.id;

        // Tìm thông báo
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({
                status: 'error',
                message: 'Không tìm thấy thông báo'
            });
        }

        // Xóa thông báo
        await Notification.deleteOne({ _id: notificationId });

        logger.info(`Admin ${req.user.id} deleted notification ${notificationId}`);

        res.status(200).json({
            status: 'success',
            message: 'Đã xóa thông báo thành công'
        });
    } catch (error) {
        logger.error('Error deleting admin notification:', error);
        next(error);
    }
};

/**
 * @desc    Xóa nhiều thông báo cùng lúc (Admin only)
 * @route   DELETE /api/admin/notifications/bulk
 * @access  Private (Admin)
 */
export const deleteAdminNotificationsBulk = async (req, res, next) => {
    try {
        const { notificationIds } = req.body;

        // Validate input
        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Danh sách ID thông báo không hợp lệ'
            });
        }

        // Kiểm tra các thông báo có tồn tại không
        const existingNotifications = await Notification.find({
            _id: { $in: notificationIds }
        });

        if (existingNotifications.length !== notificationIds.length) {
            return res.status(404).json({
                status: 'error',
                message: 'Một số thông báo không tồn tại'
            });
        }

        // Xóa các thông báo
        const deleteResult = await Notification.deleteMany({
            _id: { $in: notificationIds }
        });

        logger.info(`Admin ${req.user.id} deleted ${deleteResult.deletedCount} notifications`);

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${deleteResult.deletedCount} thông báo thành công`,
            deletedCount: deleteResult.deletedCount
        });
    } catch (error) {
        logger.error('Error deleting admin notifications bulk:', error);
        next(error);
    }
};

/**
 * @desc    Xóa tất cả thông báo (Admin only)
 * @route   DELETE /api/admin/notifications/all
 * @access  Private (Admin)
 */
export const deleteAllAdminNotifications = async (req, res, next) => {
    try {
        // Đếm số lượng thông báo trước khi xóa
        const totalCount = await Notification.countDocuments();

        if (totalCount === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'Không có thông báo nào để xóa',
                deletedCount: 0
            });
        }

        // Xóa tất cả thông báo
        const deleteResult = await Notification.deleteMany({});

        logger.info(`Admin ${req.user.id} deleted all ${deleteResult.deletedCount} notifications`);

        res.status(200).json({
            status: 'success',
            message: `Đã xóa tất cả ${deleteResult.deletedCount} thông báo thành công`,
            deletedCount: deleteResult.deletedCount
        });
    } catch (error) {
        logger.error('Error deleting all admin notifications:', error);
        next(error);
    }
};