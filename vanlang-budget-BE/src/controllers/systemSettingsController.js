import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';
import AdminActivityLogger from '../utils/adminActivityLogger.js';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

// In-memory settings storage (in production, use database)
let systemSettings = {
    general: {
        siteName: 'VanLang Budget',
        siteDescription: 'Ứng dụng quản lý tài chính cá nhân thông minh',
        maintenanceMode: false,
        registrationEnabled: true,
        defaultLanguage: 'vi',
        timezone: 'Asia/Ho_Chi_Minh'
    },
    security: {
        rateLimitWindow: 900000, // 15 minutes
        rateLimitMax: 100,
        sessionTimeout: 3600000, // 1 hour
        passwordMinLength: 8,
        requireEmailVerification: true,
        enableTwoFactor: false
    },
    email: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        user: '',
        password: '',
        from: '',
        fromName: 'VanLang Budget'
    },
    notifications: {
        enableEmailNotifications: true,
        enablePushNotifications: false,
        notificationRetentionDays: 30,
        emailTemplates: {
            welcome: 'Chào mừng bạn đến với VanLang Budget!',
            passwordReset: 'Yêu cầu đặt lại mật khẩu',
            emailVerification: 'Xác thực email của bạn'
        }
    },
    backup: {
        autoBackupEnabled: true,
        backupFrequency: 'daily',
        backupRetentionDays: 30,
        lastBackupDate: new Date().toISOString()
    }
};

/**
 * Lấy cài đặt hệ thống
 */
export const getSystemSettings = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền admin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return next(new AppError('Không có quyền truy cập', 403));
    }

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'SETTINGS_VIEW',
        {},
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            settings: systemSettings
        }
    });
});

/**
 * Cập nhật cài đặt hệ thống
 */
export const updateSystemSettings = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền admin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return next(new AppError('Không có quyền truy cập', 403));
    }

    const { settings } = req.body;

    if (!settings) {
        return next(new AppError('Vui lòng cung cấp cài đặt', 400));
    }

    // Validate and merge settings
    const updatedSettings = {
        ...systemSettings,
        ...settings
    };

    // Validate specific settings
    if (settings.security) {
        if (settings.security.passwordMinLength < 6 || settings.security.passwordMinLength > 20) {
            return next(new AppError('Độ dài mật khẩu phải từ 6-20 ký tự', 400));
        }
        if (settings.security.rateLimitMax < 10 || settings.security.rateLimitMax > 1000) {
            return next(new AppError('Giới hạn request phải từ 10-1000', 400));
        }
    }

    if (settings.notifications) {
        if (settings.notifications.notificationRetentionDays < 1 || settings.notifications.notificationRetentionDays > 365) {
            return next(new AppError('Thời gian lưu thông báo phải từ 1-365 ngày', 400));
        }
    }

    if (settings.backup) {
        if (settings.backup.backupRetentionDays < 1 || settings.backup.backupRetentionDays > 365) {
            return next(new AppError('Thời gian lưu backup phải từ 1-365 ngày', 400));
        }
    }

    // Update settings
    systemSettings = updatedSettings;

    // In production, save to database
    // await SystemSettings.findOneAndUpdate({}, systemSettings, { upsert: true });

    // Log admin activity
    await AdminActivityLogger.logSystemAction(
        req.user.id,
        'SETTINGS_UPDATE',
        {
            updatedSections: Object.keys(settings)
        },
        'SUCCESS',
        req
    );

    res.status(200).json({
        status: 'success',
        data: {
            settings: systemSettings
        }
    });
});

/**
 * Kiểm tra cấu hình email
 */
export const testEmailConfig = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền admin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return next(new AppError('Không có quyền truy cập', 403));
    }

    const { emailConfig } = req.body;

    if (!emailConfig) {
        return next(new AppError('Vui lòng cung cấp cấu hình email', 400));
    }

    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.user,
                pass: emailConfig.password
            }
        });

        // Verify connection
        await transporter.verify();

        // Send test email
        await transporter.sendMail({
            from: `${emailConfig.fromName} <${emailConfig.from}>`,
            to: req.user.email,
            subject: 'Test Email Configuration',
            text: 'Cấu hình email hoạt động tốt!',
            html: '<p>Cấu hình email hoạt động tốt!</p>'
        });

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'EMAIL_CONFIG_TEST',
            {
                emailHost: emailConfig.host,
                emailPort: emailConfig.port
            },
            'SUCCESS',
            req
        );

        res.status(200).json({
            status: 'success',
            message: 'Cấu hình email hoạt động tốt'
        });
    } catch (error) {
        logger.error('Email config test failed:', error);

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'EMAIL_CONFIG_TEST',
            {
                emailHost: emailConfig.host,
                emailPort: emailConfig.port,
                error: error.message
            },
            'FAILED',
            req
        );

        return next(new AppError('Cấu hình email không hợp lệ: ' + error.message, 400));
    }
});

/**
 * Tạo backup hệ thống
 */
export const createBackup = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền admin
    if (!['admin', 'superadmin'].includes(req.user.role)) {
        return next(new AppError('Không có quyền truy cập', 403));
    }

    try {
        // Create backup data
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            settings: systemSettings,
            // In production, include database data
            // users: await User.find({}).lean(),
            // transactions: await getAllTransactionsData(),
            metadata: {
                createdBy: req.user.id,
                createdByEmail: req.user.email
            }
        };

        // Update last backup date
        systemSettings.backup.lastBackupDate = backupData.timestamp;

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'BACKUP_CREATE',
            {
                backupSize: JSON.stringify(backupData).length
            },
            'SUCCESS',
            req
        );

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);

        res.status(200).json(backupData);
    } catch (error) {
        logger.error('Backup creation failed:', error);
        return next(new AppError('Không thể tạo backup: ' + error.message, 500));
    }
});

/**
 * Khôi phục từ backup
 */
export const restoreFromBackup = catchAsync(async (req, res, next) => {
    // Kiểm tra quyền SuperAdmin
    if (req.user.role !== 'superadmin') {
        return next(new AppError('Chỉ SuperAdmin mới có quyền khôi phục backup', 403));
    }

    try {
        if (!req.file) {
            return next(new AppError('Vui lòng upload file backup', 400));
        }

        // Parse backup file
        const backupContent = req.file.buffer.toString('utf8');
        const backupData = JSON.parse(backupContent);

        // Validate backup structure
        if (!backupData.timestamp || !backupData.settings) {
            return next(new AppError('File backup không hợp lệ', 400));
        }

        // Restore settings
        if (backupData.settings) {
            systemSettings = {
                ...systemSettings,
                ...backupData.settings
            };
        }

        // In production, restore database data
        // if (backupData.users) {
        //     await User.deleteMany({});
        //     await User.insertMany(backupData.users);
        // }

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'BACKUP_RESTORE',
            {
                backupTimestamp: backupData.timestamp,
                backupCreatedBy: backupData.metadata?.createdByEmail
            },
            'SUCCESS',
            req
        );

        res.status(200).json({
            status: 'success',
            message: 'Khôi phục backup thành công',
            data: {
                backupTimestamp: backupData.timestamp
            }
        });
    } catch (error) {
        logger.error('Backup restore failed:', error);

        // Log admin activity
        await AdminActivityLogger.logSystemAction(
            req.user.id,
            'BACKUP_RESTORE',
            {
                error: error.message
            },
            'FAILED',
            req
        );

        return next(new AppError('Không thể khôi phục backup: ' + error.message, 500));
    }
});
