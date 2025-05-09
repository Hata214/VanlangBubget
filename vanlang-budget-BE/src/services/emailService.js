import nodemailer from 'nodemailer';
import { generateEmailTemplate } from '../utils/emailTemplates.js';
import { getTranslation } from '../config/languageConfig.js';

// Khởi tạo transporter với cấu hình từ biến môi trường
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Service gửi email
 */
export const emailService = {
    /**
     * Gửi email xác minh đăng ký
     * @param {string} to Email người nhận
     * @param {string} name Tên người nhận
     * @param {string} token Token xác minh
     * @param {string} language Ngôn ngữ của người dùng
     */
    async sendVerificationEmail(to, name, token, language = 'en') {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

        const subject = getTranslation(language, 'notifications.emailSubjects.verifyEmail');
        const title = getTranslation(language, 'notifications.emailTemplates.verifyEmail.title');
        const message = getTranslation(language, 'notifications.emailTemplates.verifyEmail.message');
        const buttonText = getTranslation(language, 'notifications.emailTemplates.verifyEmail.button');
        const expiry = getTranslation(language, 'notifications.emailTemplates.verifyEmail.expiry');
        const greeting = getTranslation(language, 'notifications.emailTemplates.greeting', { name });
        const footer = getTranslation(language, 'notifications.emailTemplates.footer');

        const html = generateEmailTemplate('verification', {
            name,
            verificationUrl,
            title,
            message,
            buttonText,
            expiry,
            greeting,
            footer,
            language
        });

        const mailOptions = {
            from: `"VangLang Budget" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Verification email sent to ${to} in ${language}`);
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    },

    /**
     * Gửi email đặt lại mật khẩu
     * @param {string} to Email người nhận
     * @param {string} name Tên người nhận
     * @param {string} token Token đặt lại mật khẩu
     * @param {string} language Ngôn ngữ của người dùng
     */
    async sendPasswordResetEmail(to, name, token, language = 'en') {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        const subject = getTranslation(language, 'notifications.emailSubjects.resetPassword');
        const title = getTranslation(language, 'notifications.emailTemplates.resetPassword.title');
        const message = getTranslation(language, 'notifications.emailTemplates.resetPassword.message');
        const buttonText = getTranslation(language, 'notifications.emailTemplates.resetPassword.button');
        const expiry = getTranslation(language, 'notifications.emailTemplates.resetPassword.expiry');
        const ignore = getTranslation(language, 'notifications.emailTemplates.resetPassword.ignore');
        const greeting = getTranslation(language, 'notifications.emailTemplates.greeting', { name });
        const footer = getTranslation(language, 'notifications.emailTemplates.footer');

        const html = generateEmailTemplate('passwordReset', {
            name,
            resetUrl,
            title,
            message,
            buttonText,
            expiry,
            ignore,
            greeting,
            footer,
            language
        });

        const mailOptions = {
            from: `"VangLang Budget" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Password reset email sent to ${to} in ${language}`);
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    },

    /**
     * Gửi thông báo về chi tiêu mới
     * @param {Object} options Tùy chọn
     * @param {string} options.email Email người nhận
     * @param {string} options.name Tên người nhận
     * @param {string} options.amount Số tiền chi tiêu
     * @param {string} options.category Danh mục chi tiêu
     * @param {string} options.language Ngôn ngữ người dùng
     */
    async sendExpenseAddedNotification(options) {
        const { email, name, amount, category, language = 'en' } = options;

        const subject = getTranslation(language, 'notifications.emailSubjects.newExpense');
        const message = getTranslation(language, 'notifications.emailTemplates.expense.added', { amount, category });
        const greeting = getTranslation(language, 'notifications.emailTemplates.greeting', { name });
        const footer = getTranslation(language, 'notifications.emailTemplates.footer');

        const actionUrl = `${process.env.FRONTEND_URL}/expenses`;
        const actionText = 'View Expenses';

        const html = generateEmailTemplate('notification', {
            name,
            title: subject,
            message,
            actionUrl,
            actionText,
            greeting,
            footer,
            language
        });

        const mailOptions = {
            from: `"VangLang Budget" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject,
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Expense notification email sent to ${email} in ${language}`);
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    },

    /**
     * Gửi thông báo về thu nhập mới
     * @param {Object} options Tùy chọn
     * @param {string} options.email Email người nhận
     * @param {string} options.name Tên người nhận
     * @param {string} options.amount Số tiền thu nhập
     * @param {string} options.category Danh mục thu nhập
     * @param {string} options.language Ngôn ngữ người dùng
     */
    async sendIncomeAddedNotification(options) {
        const { email, name, amount, category, language = 'en' } = options;

        const subject = getTranslation(language, 'notifications.emailSubjects.newIncome');
        const message = getTranslation(language, 'notifications.emailTemplates.income.added', { amount, category });
        const greeting = getTranslation(language, 'notifications.emailTemplates.greeting', { name });
        const footer = getTranslation(language, 'notifications.emailTemplates.footer');

        const actionUrl = `${process.env.FRONTEND_URL}/incomes`;
        const actionText = 'View Incomes';

        const html = generateEmailTemplate('notification', {
            name,
            title: subject,
            message,
            actionUrl,
            actionText,
            greeting,
            footer,
            language
        });

        const mailOptions = {
            from: `"VangLang Budget" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject,
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Income notification email sent to ${email} in ${language}`);
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    },

    /**
     * Gửi thông báo đạt giới hạn ngân sách
     * @param {Object} options Tùy chọn
     * @param {string} options.email Email người nhận
     * @param {string} options.name Tên người nhận
     * @param {string} options.category Danh mục ngân sách
     * @param {number} options.percentage Phần trăm đã sử dụng
     * @param {string} options.spent Số tiền đã chi
     * @param {string} options.total Tổng ngân sách
     * @param {string} options.language Ngôn ngữ người dùng
     */
    async sendBudgetLimitNotification(options) {
        const { email, name, category, percentage, spent, total, language = 'en' } = options;

        const subject = getTranslation(language, 'notifications.emailSubjects.budgetLimit');
        const message = getTranslation(language, 'notifications.emailTemplates.budget.limit', {
            category, percentage, spent, total
        });
        const greeting = getTranslation(language, 'notifications.emailTemplates.greeting', { name });
        const footer = getTranslation(language, 'notifications.emailTemplates.footer');

        const actionUrl = `${process.env.FRONTEND_URL}/budgets`;
        const actionText = 'View Budgets';

        const html = generateEmailTemplate('notification', {
            name,
            title: subject,
            message,
            actionUrl,
            actionText,
            greeting,
            footer,
            language
        });

        const mailOptions = {
            from: `"VangLang Budget" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject,
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Budget limit notification email sent to ${email} in ${language}`);
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    },

    /**
     * Gửi thông báo qua email
     * @param {Object} options Tùy chọn email
     * @param {string} options.email Email người nhận
     * @param {string} options.name Tên người nhận
     * @param {string} options.title Tiêu đề thông báo
     * @param {string} options.message Nội dung thông báo
     * @param {string} options.actionUrl URL hành động (tùy chọn)
     * @param {string} options.actionText Văn bản nút hành động (tùy chọn)
     * @param {string} options.language Ngôn ngữ người dùng
     */
    async sendNotificationEmail(options) {
        const { email, name, title, message, actionUrl, actionText, language = 'en' } = options;

        const greeting = getTranslation(language, 'notifications.emailTemplates.greeting', { name });
        const footer = getTranslation(language, 'notifications.emailTemplates.footer');

        const html = generateEmailTemplate('notification', {
            name,
            title,
            message,
            actionUrl,
            actionText,
            greeting,
            footer,
            language
        });

        const mailOptions = {
            from: `"VangLang Budget" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: title || getTranslation(language, 'notifications.emailSubjects.accountUpdate'),
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Notification email sent to ${email} in ${language}`);
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    },

    /**
     * Gửi báo cáo tài chính định kỳ
     * @param {string} to Email người nhận
     * @param {string} name Tên người nhận
     * @param {Object} reportData Dữ liệu báo cáo
     * @param {string} reportType Loại báo cáo (daily, weekly, monthly)
     * @param {string} language Ngôn ngữ người dùng
     */
    async sendFinancialReportEmail(to, name, reportData, reportType, language = 'en') {
        let subject;
        switch (reportType) {
            case 'daily':
                subject = getTranslation(language, 'financialReport.daily.subject', {
                    appName: 'VangLang Budget'
                });
                break;
            case 'weekly':
                subject = getTranslation(language, 'financialReport.weekly.subject', {
                    appName: 'VangLang Budget'
                });
                break;
            case 'monthly':
                subject = getTranslation(language, 'financialReport.monthly.subject', {
                    appName: 'VangLang Budget'
                });
                break;
            default:
                subject = getTranslation(language, 'financialReport.general.subject', {
                    appName: 'VangLang Budget'
                });
        }

        const greeting = getTranslation(language, 'notifications.emailTemplates.greeting', { name });
        const footer = getTranslation(language, 'notifications.emailTemplates.footer');

        const html = generateEmailTemplate('financialReport', {
            name,
            reportType,
            reportData,
            greeting,
            footer,
            language
        });

        const mailOptions = {
            from: `"VangLang Budget" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Financial report email sent to ${to} in ${language}`);
            return true;
        } catch (error) {
            console.error('Email sending error:', error);
            throw error;
        }
    }
}; 