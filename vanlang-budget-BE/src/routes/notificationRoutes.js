import express from 'express';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    updateNotificationSettings,
    sendBulkNotifications,
    getNotificationSettings,
    checkNegativeBalance,
    deleteReadNotifications
} from '../controllers/notificationController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validateParams, validateQuery } from '../middlewares/validationMiddleware.js';
import {
    getNotificationsQuerySchema,
    idParamSchema,
    emptySchema
} from '../validations/notificationValidation.js';

const router = express.Router();

// Tất cả routes đều cần xác thực
router.use(protect);

// Routes cho người dùng thông thường
router.get('/', validateQuery(getNotificationsQuerySchema), getNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/settings', getNotificationSettings);
router.patch('/read-all', markAllAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/settings', updateNotificationSettings);
router.delete('/read', validateParams(emptySchema), deleteReadNotifications);
router.patch('/:id/read', validateParams(idParamSchema), markAsRead);
router.delete('/:id', validateParams(idParamSchema), deleteNotification);
router.post('/check-balance', checkNegativeBalance);

// Routes chỉ dành cho admin - đặt cuối cùng để tránh ảnh hưởng đến các route khác
router.post('/', restrictTo('admin'), createNotification);
router.post('/bulk', restrictTo('admin'), sendBulkNotifications);

export default router; 